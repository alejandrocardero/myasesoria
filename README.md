<div align="center">
<img width="120" height="120" alt="Logo" src="https://ui-avatars.com/api/?name=MA&background=7c3aed&color=fff&size=120" />
</div>

# MyAsesorIA Hub

Suite de gestión integral para microempresas (MiPyMEs) con inteligencia artificial y control por voz. Panel de control con módulos de contabilidad, asesoría jurídica, inventario y marketing automatizado.

---

## Características

- **🤖 Abogado Amigo** — Chat legal con IA especializado en legislación colombiana (Gemini / Ollama)
- **💰 Contador de Bolsillo** — Gestión de transacciones, métricas financieras y flujo de caja
- **📦 Almacén Smart** — Control de inventario con alertas de stock crítico y predicciones IA
- **📢 Marketing Fácil** — Generación de copias publicitarias con IA y planificador de campañas
- **🎙️ Control por Voz** — Activa con "Hola Jarvis" o **2 aplausos**. Navega, consulta y escribe con comandos de voz
- **🌙 Tema oscuro/claro** — Alternancia con persistencia de preferencia
- **🔐 Sistema de autenticación** — Registro con validación de correo y fortaleza de contraseña
- **💾 Datos por usuario** — Cada cuenta tiene sus propios datos almacenados en el navegador
- **📱 Diseño responsive** — Adaptado a móvil, tablet y desktop

## Requisitos

- **Node.js** 18+ (recomendado 20+)
- **Ollama** (recomendado) para IA local, o **Gemini API Key** para IA cloud
- **Navegador**: Chrome, Edge u Opera (para funcionalidad de voz completa)

> ⚠️ **Compatibilidad de voz**: La activación por "Hola Jarvis" y 2 aplausos requiere la Web Speech API y Web Audio API, disponibles en Chrome, Edge y Opera. Firefox y Safari tienen soporte parcial.

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

### Opción A: Ollama (local — recomendado)
```env
AI_PROVIDER="ollama"
OLLAMA_HOST="http://localhost:11434"
OLLAMA_MODEL="llama3"
```
Descargar e instalar Ollama desde [ollama.com/download](https://ollama.com/download), luego:
```bash
ollama pull llama3
```

### Opción B: Google Gemini
```env
AI_PROVIDER="gemini"
GEMINI_API_KEY="tu_api_key"
```

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

React 19 · TypeScript · Vite · Tailwind CSS 4 · Express · Google Gemini · Ollama · Web Speech API · Web Audio API · Lucide Icons
