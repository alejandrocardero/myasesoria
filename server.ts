import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { Ollama } from "ollama";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// AI Provider abstraction
type AIProvider = 'gemini' | 'ollama';

interface AIClient {
  chat(messages: Array<{role: string, content: string}>, options?: {systemPrompt?: string, jsonMode?: boolean}): Promise<string>;
}

class GeminiClient implements AIClient {
  private ai: GoogleGenAI;
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }

  async chat(messages: Array<{role: string, content: string}>, options?: {systemPrompt?: string, jsonMode?: boolean}): Promise<string> {
    const contents = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await this.ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents,
      config: {
        systemInstruction: options?.systemPrompt,
        responseMimeType: options?.jsonMode ? "application/json" : undefined
      }
    });
    return response.text || "";
  }
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Determine AI provider
  const provider: AIProvider = (process.env.AI_PROVIDER as AIProvider) || 'ollama';
  let ai: AIClient | null = null;

  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      ai = new GeminiClient(apiKey);
      console.log("✅ Gemini AI client initialized successfully.");
    } else {
      console.warn("⚠️ GEMINI_API_KEY not set, falling back to Ollama...");
    }
  }

  if (!ai && provider === 'ollama') {
    const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';
    const ollamaModel = process.env.OLLAMA_MODEL || 'gpt-oss:20b-cloud';
    try {
      ai = new OllamaClient(ollamaHost, ollamaModel);
      // Test connection
      await ai.chat([{role: 'user', content: 'test'}]);
      console.log(`✅ Ollama AI client initialized (${ollamaModel} @ ${ollamaHost}).`);
    } catch (err) {
      console.warn(`⚠️ Ollama connection failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
      console.warn("⚠️ Falling back to simulated responses.");
      ai = null;
    }
  }

  if (!ai) {
    console.warn("⚠️ No AI provider available. Using simulated responses.");
  }

  // --- API ROUTE: AI Legal Chat ("Abogado Amigo") ---
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history } = req.body;
      if (!message) {
        return res.status(400).json({ error: "El mensaje es obligatorio." });
      }

      if (!ai) {
        // Fallback simulated response
        return res.json({
          text: `[Soporte Local MyAsesorIA]\nNo hay proveedor IA configurado. Mostrando respuesta simulada para: "${message}"\n\nDe acuerdo con la legislación mercantil en Colombia (especialmente regida por el Código de Comercio colombiano):\n\n- **Renovación de Matrícula Mercantil:** Debes realizar la renovación de tu matrícula y la de tu establecimiento comercial dentro de los primeros tres (3) meses de cada año (Art. 33 del C.Co).\n- **Declaración de Renta:** Varía según los últimos dígitos del NIT. Consulta la DIAN.\n- **Cláusulas de Contrato:** Te sugerimos incluir siempre cláusulas de exclusividad, entrega, indemnidad y mecanismos de resolución de conflictos.\n\n_Para activar IA real, configura GEMINI_API_KEY u OLLAMA_HOST/OLLAMA_MODEL en .env.local._`
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

  // --- VITE INTERFACES SETUP ---
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
