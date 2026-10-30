import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { Ollama } from "ollama";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { body, validationResult } from "express-validator";
import cookieParser from "cookie-parser";
import session from "express-session";
import bcrypt from "bcryptjs";
import csurf from "csurf";
import xss from "xss-clean";
import multer from "multer";

dotenv.config({ path: '.env.local' });
dotenv.config(); // fallback a .env si .env.local no existe

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI Provider abstraction
type AIProvider = 'ollama' | 'hf';

interface AIClient {
  chat(messages: Array<{role: string, content: string}>, options?: {systemPrompt?: string, jsonMode?: boolean}): Promise<string>;
}

class OllamaClient implements AIClient {
  private ollama: Ollama;
  private model: string;
  constructor(host: string, model: string) {
    this.ollama = new Ollama({ host });
    this.model = model;
  }

  async chat(messages: Array<{role: string, content: string}>, options?: {systemPrompt?: string, jsonMode?: boolean}): Promise<string> {
    const ollamaMessages = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content
    }));

    if (options?.systemPrompt) {
      ollamaMessages.unshift({ role: 'system', content: options.systemPrompt });
    }

    const response = await this.ollama.chat({
      model: this.model,
      messages: ollamaMessages,
      format: options?.jsonMode ? 'json' : undefined,
      options: { temperature: 0.7 }
    });

    return response.message.content;
  }
}

class HFClient implements AIClient {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model;
  }

  async chat(messages: Array<{role: string, content: string}>, options?: {systemPrompt?: string, jsonMode?: boolean}): Promise<string> {
    const apiMessages: Array<{role: string, content: string}> = [];

    if (options?.systemPrompt) {
      apiMessages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const m of messages) {
      apiMessages.push({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      });
    }

    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        messages: apiMessages,
        max_tokens: 2048,
        temperature: 0.7,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`HF API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const choice = data.choices?.[0];
    // Handle reasoning models (Qwen3) that put content in reasoning_content
    const reply = choice?.message?.content || choice?.message?.reasoning_content?.split('\n').filter((l: string) => !l.startsWith('<') && l.trim()).pop()?.trim() || '';
    return reply;
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(xss());

  app.use(session({
    secret: process.env.SESSION_SECRET || 'dev_secret_change_me',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  const csrfProtection = csurf({ cookie: { httpOnly: true, sameSite: 'strict' } });
  app.use((req, res, next) => {
    if (['POST','PUT','PATCH','DELETE'].includes(req.method)) {
      return csrfProtection(req, res, next);
    }
    next();
  });
  app.get('/api/csrf-token', (req: any, res: any) => {
    res.json({ csrfToken: req.csrfToken() });
  });

  // Security middlewares
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
      useDefaults: true,
    } : false,
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://mydomain.com'] : ['http://localhost:3000','http://localhost:5173'],
    credentials: true,
  }));
  const globalLimiter = rateLimit({ windowMs: 15*60*1000, max: 100 });
  app.use('/api', globalLimiter);

  const aiLimiter = rateLimit({ windowMs: 15*60*1000, max: 5 });
  app.use('/api/test-ai', aiLimiter);
  app.use('/api/chat', aiLimiter);
  app.use('/api/generate-copy', aiLimiter);

  // Security headers
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=()');
    next();
  });

  // Disable debug in production
  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  // Block sensitive files
  app.use((req, res, next) => {
    const blocked = ['/.env', '/.env.local', '/server.ts', '/data', '/.git'];
    if (blocked.some(p => req.path.startsWith(p))) {
      return res.status(404).send('Not Found');
    }
    next();
  });

  // In-memory user store for demo
  const users = new Map<string, { id: string; name: string; email: string; passwordHash: string; country: string; business: string }>();
  const resetTokens = new Map<string, { email: string; expires: number }>();

  const requireAuth = (req: any, res: any, next: any) => {
    if (req.session?.userId) return next();
    res.status(401).json({ error: 'No autorizado' });
  };

  // Auth routes
  app.post('/api/auth/register',
    body('name').isString().trim().isLength({ min: 1 }),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('country').isString(),
    body('business').optional().isString(),
    async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validación fallida', details: errors.array() });
      const { name, email, password, country, business } = req.body;
      if (Array.from(users.values()).some(u => u.email === email)) {
        return res.status(409).json({ error: 'Email ya registrado' });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      const id = 'user_' + Date.now();
      users.set(id, { id, name, email, passwordHash, country, business: business || '' });
      req.session.userId = id;
      res.json({ ok: true, user: { id, name, email, country, business } });
    });

  app.post('/api/auth/login',
    body('email').isEmail(),
    body('password').isString(),
    async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validación fallida' });
      const { email, password } = req.body;
      const user = Array.from(users.values()).find(u => u.email === email);
      if (!user) return res.status(401).json({ error: 'Credenciales inválidas' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Credenciales inválidas' });
      req.session.userId = user.id;
      res.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, country: user.country, business: user.business } });
    });

  app.post('/api/auth/logout', (req: any, res: any) => {
    req.session.destroy(() => res.json({ ok: true }));
  });

  app.get('/api/auth/me', requireAuth, (req: any, res: any) => {
    const user = users.get(req.session.userId);
    if (!user) return res.status(401).json({ error: 'No autorizado' });
    res.json({ user: { id: user.id, name: user.name, email: user.email, country: user.country, business: user.business } });
  });

  // Password reset
  app.post('/api/auth/password-reset-request',
    body('email').isEmail(),
    async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Email inválido' });
      const { email } = req.body;
      const user = Array.from(users.values()).find(u => u.email === email);
      if (!user) return res.json({ ok: true }); // no leak
      const token = Buffer.from(Math.random().toString(36).slice(2) + Date.now().toString(36)).toString('base64url');
      resetTokens.set(token, { email, expires: Date.now() + 60*60*1000 });
      // In production send email with token
      console.log(`Password reset token for ${email}: ${token}`);
      res.json({ ok: true });
    });

  app.post('/api/auth/password-reset',
    body('token').isString(),
    body('password').isLength({ min: 8 }),
    async (req: any, res: any) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: 'Validación fallida' });
      const { token, password } = req.body;
      const entry = resetTokens.get(token);
      if (!entry || entry.expires < Date.now()) {
        return res.status(400).json({ error: 'Token inválido o expirado' });
      }
      const user = Array.from(users.values()).find(u => u.email === entry.email);
      if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
      user.passwordHash = await bcrypt.hash(password, 12);
      resetTokens.delete(token);
      res.json({ ok: true });
    });

  // File upload restrictions
  const upload = multer({
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
      const allowed = ['image/jpeg','image/png','image/webp','application/pdf'];
      if (allowed.includes(file.mimetype)) return cb(null, true);
      cb(new Error('Tipo de archivo no permitido'));
    }
  });
  app.post('/api/upload', requireAuth, upload.single('file'), (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' });
    res.json({ ok: true, filename: req.file.originalname, size: req.file.size });
  });

  // --- AI Provider initialization (supports runtime switching) ---
  let currentProvider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'ollama';
  let ai: AIClient | null = null;

  const initProvider = async (prov: AIProvider, hfModel?: string): Promise<boolean> => {
    if (prov === 'hf') {
      const hfKey = process.env.HF_API_KEY;
      if (hfKey) {
        const model = hfModel || 'Qwen/Qwen3-8B:fastest';
        ai = new HFClient(hfKey, model);
        currentProvider = 'hf';
        console.log(`✅ HuggingFace AI client initialized (${model}).`);
        return true;
      }
      console.warn("⚠️ HF_API_KEY not set.");
      return false;
    }

    if (prov === 'ollama') {
      const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
      const ollamaModel = process.env.OLLAMA_MODEL || 'gpt-oss:20b-cloud';
      try {
        ai = new OllamaClient(ollamaHost, ollamaModel);
        await ai.chat([{role: 'user', content: 'test'}]);
        currentProvider = 'ollama';
        console.log(`✅ Ollama AI client initialized (${ollamaModel}).`);
        return true;
      } catch (err) {
        console.warn(`⚠️ Ollama connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
        return false;
      }
    }

    return false;
  };

  // Try initial provider, then fallback chain
  let initialized = await initProvider(currentProvider);
  if (!initialized) {
    const fallbacks: AIProvider[] = ['ollama', 'hf'];
    for (const fb of fallbacks) {
      if (fb === currentProvider) continue;
      if (await initProvider(fb)) { initialized = true; break; }
    }
  }
  if (!ai) console.warn("⚠️ No AI provider available. Using simulated responses.");

  // --- API ROUTE: Test AI Provider Connection ---
  app.post("/api/test-ai", async (req, res) => {
    try {
      const { provider, model } = req.body;
      if (!provider) return res.status(400).json({ ok: false, error: "Proveedor requerido." });

      if (provider === 'hf') {
        const hfKey = process.env.HF_API_KEY;
        if (!hfKey) return res.json({ ok: false, error: "HF_API_KEY no configurada en el servidor." });

        const testModel = model || 'Qwen/Qwen3-8B:fastest';
        const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'Responde solo: OK conectado' }],
            max_tokens: 50,
            temperature: 0.1,
          }),
        });

        if (!response.ok) {
          const err = await response.text();
          return res.json({ ok: false, error: `Error ${response.status}: ${err.substring(0, 200)}` });
        }

        const data = await response.json();
        const choice = data.choices?.[0];
        // Handle reasoning models (Qwen3) that put content in reasoning_content
        const reply = choice?.message?.content || choice?.message?.reasoning_content?.split('\n').filter((l: string) => !l.startsWith('<') && l.trim()).pop()?.trim() || 'Conectado';
        return res.json({ ok: true, reply, model: testModel });
      }

      if (provider === 'ollama') {
        const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
        const mdl = model || process.env.OLLAMA_MODEL || 'gpt-oss:20b-cloud';
        try {
          const client = new OllamaClient(host, mdl);
          const reply = await client.chat([{ role: 'user', content: 'Responde solo: OK conectado' }]);
          return res.json({ ok: true, reply, model: mdl });
        } catch (err: any) {
          return res.json({ ok: false, error: err.message || 'Error de conexión' });
        }
      }

      res.status(400).json({ ok: false, error: `Proveedor desconocido: ${provider}` });
    } catch (err: any) {
      console.error("Test AI error:", err);
      res.status(500).json({ ok: false, error: err.message || 'Error interno' });
    }
  });

  // --- API ROUTE: Switch AI Provider ---
  app.post("/api/set-provider", async (req, res) => {
    try {
      const { provider, model } = req.body;
      if (!provider) return res.status(400).json({ error: "Proveedor requerido." });

      const success = await initProvider(provider, model);
      if (success) {
        res.json({ ok: true, provider: currentProvider });
      } else {
        res.status(500).json({ ok: false, error: `No se pudo inicializar ${provider}` });
      }
    } catch (err: any) {
      res.status(500).json({ ok: false, error: err.message });
    }
  });

  // --- API ROUTE: List available HF models (SLM: 2B-8B) - 5 modelos gratuitos verificados ---
  app.get("/api/hf-models", (_req, res) => {
    res.json([
      { id: 'Qwen/Qwen3-8B:fastest', name: 'Qwen3 8B', desc: 'Rápido, excelente español y razonamiento', size: '8B' },
      { id: 'meta-llama/Llama-3.1-8B-Instruct:fastest', name: 'Llama 3.1 8B', desc: 'Estándar confiable, buen seguimiento instrucciones', size: '8B' },
      { id: 'microsoft/Phi-3.5-mini-instruct:fastest', name: 'Phi-3.5 Mini', desc: 'Ultra-rápido 3.8B, calidad sorprendente', size: '3.8B' },
      { id: 'google/gemma-2-2b-it:fastest', name: 'Gemma 2 2B', desc: 'Más ligero 2B, veloz, buen español básico', size: '2B' },
      { id: 'HuggingFaceH4/zephyr-7b-beta:fastest', name: 'Zephyr 7B Beta', desc: 'Optimizado chat, conversacional natural', size: '7B' },
    ]);
  });

  // --- API ROUTE: AI Legal Chat ("Abogado Amigo") ---
  app.post("/api/chat",
    body('message').isString().trim().isLength({ min: 1, max: 2000 }),
    body('history').optional().isArray(),
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: 'Validación fallida', details: errors.array() });
    try {
      const { message, history } = req.body;

      if (!ai) {
        // Fallback simulated response
        return res.json({
          text: `[Soporte Local MyAsesorIA]\nNo hay proveedor IA configurado. Mostrando respuesta simulada para: "${message}"\n\nDe acuerdo con la legislación mercantil en Colombia (especialmente regida por el Código de Comercio colombiano):\n\n- **Renovación de Matrícula Mercantil:** Debes realizar la renovación de tu matrícula y la de tu establecimiento comercial dentro de los primeros tres (3) meses de cada año (Art. 33 del C.Co).\n- **Declaración de Renta:** Varía según los últimos dígitos del NIT. Consulta la DIAN.\n- **Cláusulas de Contrato:** Te sugerimos incluir siempre cláusulas de exclusividad, entrega, indemnidad y mecanismos de resolución de conflictos.\n\n_Para activar IA real, configura HF_API_KEY u OLLAMA_HOST/OLLAMA_MODEL en .env.local._`
        });
      }

      const systemPrompt = `Eres "Abogado Amigo", el asistente virtual jurídico de MyAsesorIA, especializado en la legislación y normativa de Colombia.
Tu propósito es orientar a emprendedores, tenderos y dueños de microempresas (Mipymes) sobre temas legales cotidianos como: Constitución de empresas, plazos de renovación de Cámara de Comercio, impuestos básicos (IVA, ICA, retefuente), contratos comerciales, uso de suelos y notificaciones del gobierno (DIAN, alcaldías, etc.).

Sigue estas pautas estrictamente:
1. Sé muy amigable, pedagógico y claro. Evita usar tecnicismos excesivos sin explicarlos primero.
2. Organiza tus respuestas con títulos limpios, viñetas detalladas y tablas de ser necesario.
3. Cita leyes o decretos colombianos si aplica (por ejemplo, Código de Comercio de Colombia, Decreto 1074 de 2015 o Estatuto Tributario).
4. No prestes asesoramiento de representación legal oficial ni vinculante. Suministra información didáctica útil y sugiere siempre confirmar detalles con expertos o autoridades locales.
5. El tono debe ser moderno, confiable y rápido. Mantente en español colombiano de negocios.`;

      const messages = [
        ...(history?.map((msg: any) => ({ role: msg.role, content: msg.text })) || []),
        { role: 'user', content: message }
      ];

      const response = await ai.chat(messages, { systemPrompt });
      res.json({ text: response });
    } catch (err: any) {
      console.error("Error in Legal Assistant Chat route:", err);
      res.status(500).json({ error: "Fallo al comunicar con la Inteligencia Artificial." });
    }
  });

  // --- API ROUTE: AI Advertising Copy Generator ("Marketing Fácil") ---
  app.post("/api/generate-copy", async (req, res) => {
    try {
      const { product } = req.body;
      if (!product) {
        return res.status(400).json({ error: "Debes especificar un producto o servicio de promoción." });
      }

      if (!ai) {
        // Fallback copywriting
        return res.json({
          facebook: `✨ ¡Impulsa el crecimiento de tu microempresa! Promociona "${product}" con estilo y profesionalismo. Calidad comprobada y atención garantizada. ¡Mándanos un mensaje directo para asegurar tu cupo hoy mismo! 🎯 #Emprendedor #VentasActivas`,
          instagram: `¡El outfit / servicio ideal está aquí! 🚀 Dale un giro radical a tu rutina con "${product}". Hecho con amor y la mejor tecnología. 💡 Link en Bio para comprar ahora con 20% OFF. #DiseñoNacional #MyAsesorIA #Estilo`,
          whatsapp: `*¡Hola!* Tengo un beneficio especial para ti hoy 🎁\n\n¿Quieres elevar tus resultados con *${product}*? Ya tenemos existencias limitadas listos para entrega inmediata.\n\nEscríbeme para enviarte el catálogo completo de inmediato. 📲`
        });
      }

      const prompt = `Genera copias publicitarias de alto impacto en español para redes sociales para promocionar el siguiente producto o campaña de la Mipyme:
"${product}"

Debes producir exactamente tres copias diferenciadas en formato JSON rígido. El objeto JSON de respuesta debe tener exactamente estas tres propiedades:
- "facebook": un texto amigable, persuasivo y estructurado, de 2 a 3 párrafos, usando emojis, destacando beneficios clave, posible descuento y un claro llamado a la acción.
- "instagram": un texto moderno, fresco, corto y emocionante, con hashtags de tendencia, emojis, e invitación a dar clic en el link de la bio.
- "whatsapp": un formato conversacional directo, muy limpio, idóneo para estados de WhatsApp o mensajes rápidos, ocupando formas de texto enriquecido (como *negritas* o _cursiva_) para captar la atención de modo instantáneo.

Norma de salida: Regresa únicamente las tres cadenas en un objeto JSON. No agregues bloques de código markdown como \`\`\`json ni texto introductorio o de cierre.`;

      const response = await ai.chat([{ role: 'user', content: prompt }], { jsonMode: true });

      let jsonText = response || "{}";
      // Sanitize JSON
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.substring(7);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.substring(0, jsonText.length - 3);
      }
      jsonText = jsonText.trim();

      try {
        const data = JSON.parse(jsonText);
        res.json(data);
      } catch (parseErr) {
        console.error("JSON parsing failed, raw answer:", jsonText);
        // Fallback parsed from markdown text in case format differs
        res.json({
          facebook: `🎉 ¡Llegó lo que estabas esperando! Disfruta de la mejor calidad con "${product}". ¡La opción perfecta para tu día a día! Contáctanos para más info.`,
          instagram: `Lo nuevo de "${product}" ya está aquí. Sparkle ✨ Link en Bio para pedir con envío express. #Emprendimiento`,
          whatsapp: `Estimado cliente, tenemos disponible *${product}* en precio promocional. ¡Escríbenos para enviarte el catálogo! 📲`
        });
      }
    } catch (err: any) {
      console.error("Error in AI Copywriter route:", err);
      res.status(500).json({ error: "Fallo al generar las copias publicitarias." });
    }
  });

  // --- API ROUTE: AI Document Analyzer ---
  app.post("/api/analyze-document", async (req, res) => {
    try {
      const { fileName, fileContent } = req.body;
      if (!fileName || !fileContent) {
        return res.status(400).json({ error: "Se necesita el nombre del archivo y el contenido codificado." });
      }

      if (!ai) {
        return res.json({
          entidad: "DIAN Colombia",
          fecha: "29 de Mayo del 2026",
          prioridad: "Alta",
          resumen: `Analizando simulated "${fileName}". Se identifica un reporte oficial que señala la obligatoriedad de la renovación del Registro Único Tributario (RUT). Se sugiere realizar la validación contable antes del vencimiento usual de tasas nacionales.`
        });
      }

      const prompt = `Analiza detalladamente la notificación nacional recibida por una microempresa con el nombre de archivo "${fileName}".
Los datos de contenido del documento (en base64 o texto representativo) son: "${fileContent.substring(0, 1000)}..."

Determina y responde con un objeto JSON estricto con las siguientes propiedades:
- "entidad": Entidad emisora probable (ej: DIAN, Alcaldía Mayor, Cámara de Comercio, etc.),
- "fecha": Fecha supuesta u obtenida en formato DD-MM-AAAA o DD de Mes,
- "prioridad": Diagnostica "Urgente", "Medios" o "Informativa",
- "resumen": Breve resumen de 1-2 frases de qué trata la notificación y la acción inmediata que debe tomar el empresario.

Regresa solo el objeto JSON, sin formato markdown de bloque de código \`\`\`json.`;

      const response = await ai.chat([{ role: 'user', content: prompt }], { jsonMode: true });

      let jsonText = response || "{}";
      if (jsonText.startsWith("```json")) jsonText = jsonText.substring(7);
      if (jsonText.endsWith("```")) jsonText = jsonText.substring(0, jsonText.length - 3);
      jsonText = jsonText.trim();

      const data = JSON.parse(jsonText);
      res.json(data);
    } catch (err: any) {
      console.error("Document analysis route error:", err);
      res.status(500).json({ error: "Ocurrió un error al analizar la notificación." });
    }
  });

  // --- API ROUTE: Speech-to-Text (Groq Whisper) ---
  app.post("/api/stt", async (req, res) => {
    try {
      const { audio, lang } = req.body;
      if (!audio) {
        return res.status(400).json({ error: "El audio es obligatorio." });
      }

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY no está configurada." });
      }

      // Convert base64 to buffer
      const audioBuffer = Buffer.from(audio, 'base64');

      // Build multipart form data manually
      const boundary = `----FormBoundary${Date.now()}`;
      const langCode = lang || 'es';
      const formDataParts: Buffer[] = [];

      // file field
      formDataParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="audio.webm"\r\nContent-Type: audio/webm\r\n\r\n`
        ),
        audioBuffer,
        Buffer.from('\r\n')
      );

      // model field
      formDataParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3\r\n`
        )
      );

      // language field
      formDataParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\n${langCode}\r\n`
        )
      );

      // response_format field
      formDataParts.push(
        Buffer.from(
          `--${boundary}\r\nContent-Disposition: form-data; name="response_format"\r\n\r\njson\r\n`
        )
      );

      formDataParts.push(Buffer.from(`--${boundary}--\r\n`));

      const formData = Buffer.concat(formDataParts);

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq STT error:", response.status, errorText);
        return res.status(502).json({ error: "Error al transcribir audio con Groq." });
      }

      const data = await response.json();
      res.json({ text: data.text || '' });
    } catch (err: any) {
      console.error("STT route error:", err);
      res.status(500).json({ error: "Error interno al procesar transcripción." });
    }
  });

  // --- API ROUTE: Text-to-Speech (Groq TTS) ---
  app.post("/api/tts", async (req, res) => {
    try {
      const { text, voice, speed } = req.body;
      if (!text) {
        return res.status(400).json({ error: "El texto es obligatorio." });
      }

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ error: "GROQ_API_KEY no está configurada." });
      }

      // Groq TTS uses the Orpheus model (playai-tts deprecated)
      const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'canopylabs/orpheus-v1-english',
          input: text,
          voice: voice || 'hannah',
          response_format: 'mp3',
          speed: speed || 1,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq TTS error:", response.status, errorText);
        return res.status(502).json({ error: "Error al generar audio con Groq." });
      }

      // Stream the audio back to the client
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-cache');

      const reader = response.body?.getReader();
      if (reader) {
        const pump = async (): Promise<void> => {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }
          res.write(value);
          return pump();
        };
        await pump();
      } else {
        const buffer = await response.arrayBuffer();
        res.send(Buffer.from(buffer));
      }
    } catch (err: any) {
      console.error("TTS route error:", err);
      res.status(500).json({ error: "Error interno al generar audio." });
    }
  });

  // --- API ROUTE: RSS Feed ---
  app.get('/rss.xml', (req, res) => {
    const siteUrl = 'http://localhost:3000';
    const items = [
      { title: 'MyAsesorIA Hub actualizado', link: siteUrl, date: new Date().toISOString() },
    ];
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>MyAsesorIA Hub</title>
<link>${siteUrl}</link>
<description>Suite integral de asesoría empresarial con IA</description>
${items.map(i => `<item><title>${i.title}</title><link>${i.link}</link><pubDate>${new Date(i.date).toUTCString()}</pubDate></item>`).join('')}
</channel>
</rss>`;
    res.set('Content-Type', 'application/rss+xml');
    res.send(rss);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully running and integrated at: http://localhost:${PORT}`);
  });
}

startServer();
