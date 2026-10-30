<div align="center">
<img width="120" height="120" alt="Logo" src="https://ui-avatars.com/api/?name=MA&background=7c3aed&color=fff&size=120" />
</div>

# MyAsesorIA Hub

Suite de gestión integral para microempresas (MiPyMEs) con inteligencia artificial y control por voz. Panel de control con módulos de contabilidad, asesoría jurídica, inventario y marketing automatizado.

---

## Características

- **🤖 Abogado Amigo** — Chat legal con IA especializado en legislación colombiana (Hugging Face / Ollama)
- **💰 Contador de Bolsillo** — Gestión de transacciones, métricas financieras y flujo de caja
- **📦 Almacén Smart** — Control de inventario con alertas de stock crítico y predicciones IA
- **📢 Marketing Fácil** — Generación de copias publicitarias con IA y planificador de campañas
- **🎙️ Control por Voz** — Activa con "Hola Jarvis" o **2 aplausos**. Navega, consulta y escribe con comandos de voz
- **🧠 Motor de IA seleccionable** — Elige entre Hugging Face (cloud, gratis) u Ollama (local, privado)
- **🌙 Tema oscuro/claro** — Alternancia con persistencia de preferencia
- **🔐 Sistema de autenticación** — Registro con validación de correo y fortaleza de contraseña
- **💾 Datos por usuario** — Cada cuenta tiene sus propios datos almacenados en el navegador
- **📱 Diseño responsive** — Adaptado a móvil, tablet y desktop

## Requisitos

- **Node.js** 18+ (recomendado 20+)
- **Ollama** (opcional) para IA local, o **Hugging Face API Key** para IA cloud gratis
- **Groq API Key** para servicios de voz (STT/TTS)
- **Navegador**: Chrome, Edge u Opera (para funcionalidad de voz completa)

> ⚠️ **Compatibilidad de voz**: La activación por "Hola Jarvis" y 2 aplausos requiere Web Audio API. La transcripción y síntesis de voz usan Groq (funciona en todos los navegadores).

## Instalación

```bash
# 1. Clonar el repositorio
git clone <repo-url>
cd myasesoria-hub

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tu configuración

# 4. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Configuración de IA

Puedes cambiar el proveedor de IA desde el **Motor de IA** en el sidebar izquierdo, o configurarlo manualmente:

### Opción A: Hugging Face (cloud — gratis)
```env
AI_PROVIDER="hf"
HF_API_KEY="hf_tu_token"
```
Crear token en: https://huggingface.co/settings/tokens/new?ownUserPermissions=inference.serverless.write&tokenType=fineGrained

Modelos SLM disponibles (2B-8B parámetros):
- Qwen3 8B, 4B, 1.7B
- Llama 3.1 8B, Llama 3.2 3B
- Gemma 2 2B
- Phi-3 Mini (3.8B)
- Mistral 7B, Zephyr 7B, TinyLlama 1.1B

### Opción B: Ollama (local — privado)
```env
AI_PROVIDER="ollama"
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3"
```
Descargar e instalar Ollama desde [ollama.com/download](https://ollama.com/download), luego:
```bash
ollama pull llama3
```

### Servicios de Voz (STT/TTS)
```env
GROQ_API_KEY="gsk_tu_api_key"
```
Obtener en: https://console.groq.com/keys

## Uso por Voz

| Comando | Acción |
|---------|--------|
| `"Hola Jarvis"` o `👏👏` (2 aplausos) | Activar asistente |
| `"Ve a finanzas"`, `"Abre legal"` | Navegar entre módulos |
| `"Resume ventas"`, `"Resume stock"` | Leer resumen de datos |
| `"Escribe [mensaje] y envía"` | Escribir y enviar en chat |
| `"Lee leyes"` | Leer última respuesta legal |
| `"¿Qué puedes hacer?"` | Ver comandos disponibles |
| `"Silencio"` / `"Detente"` | Detener escucha |

Puedes personalizar la voz, idioma y palabra de activación desde el menú de configuración del asistente (icono de engranaje junto al micrófono).

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Iniciar servidor de desarrollo (localhost:3000) |
| `npm run build` | Compilar para producción |
| `npm run start` | Ejecutar build de producción |
| `npm run lint` | Verificar tipos TypeScript |

## Documentación

- [Guía de usuario](docs/GUIA_USUARIO.md)
- [Requisitos del sistema](docs/REQUISITOS.md)

## Stack

React 19 · TypeScript · Vite · Tailwind CSS 4 · Express · Hugging Face Inference · Ollama · Groq (STT/TTS) · Web Audio API · Lucide Icons

## Seguridad

Hardening aplicado en el módulo SaaS:

- **Autenticación server-side**: `express-session` con cookies `httpOnly`, `Secure` en prod, `SameSite=strict`, maxAge 24h. Passwords hasheadas con `bcryptjs` 12 rounds.
- **CSRF protection**: `csurf` con cookie httpOnly; endpoint `/api/csrf-token`; frontend envía header `csrf-token`.
- **Password reset seguro**: tokens aleatorios con expiración 1h, borrado tras uso.
- **Validación y sanitización**: `express-validator` en todas las rutas de auth y AI; `xss-clean` middleware global.
- **Headers y CORS**: `helmet`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`; CORS restringido a orígenes permitidos con credentials.
- **Rate limiting**: global 100/15min, AI routes 5/15min.
- **Upload seguro**: `multer` con límite 5 MB y whitelist MIME `image/jpeg/png/webp`, `application/pdf`.
- **Protección de archivos**: bloqueo de `/.env`, `/server.ts`, `/data`, `/.git`.
- **Dependencias**: `npm audit fix` aplicado; `.env.example` documentado, `.gitignore` protege secretos.
- **Sin exposición de keys**: `HF_API_KEY`, `OLLAMA_*`, `SESSION_SECRET` solo en servidor.

Variables requeridas: `SESSION_SECRET`, `HF_API_KEY`, `OLLAMA_HOST`, `OLLAMA_MODEL`, `NODE_ENV`.

Para producción usar HTTPS, rotar `SESSION_SECRET`, y revisar logs de actividad sospechosa.
