# Requisitos del Sistema — MyAsesorIA Hub

---

## 1. Requisitos funcionales

### 1.1 Autenticación
- **RF-01** Registro de usuario con nombre, correo, negocio, país y contraseña
- **RF-02** Validación de dominio de correo (solo Gmail, Yahoo, Outlook, Hotmail, iCloud, ProtonMail, AOL, Mail.com)
- **RF-03** Indicador de fortaleza de contraseña con 4 niveles
- **RF-04** Inicio de sesión con correo y contraseña
- **RF-05** Cierre de sesión desde el panel de configuración
- **RF-06** Persistencia de sesión en localStorage
- **RF-07** Datos aislados por usuario (cada cuenta ve solo sus datos)

### 1.2 Dashboard (Resumen Neural)
- **RF-08** Visualización de KPIs principales (ingresos, gastos, producto estrella)
- **RF-09** Carrusel de alertas inteligentes con rotación automática
- **RF-10** Tarjetas de acceso directo a los 4 módulos
- **RF-11** Panel de telemetría con métricas en tiempo real
- **RF-12** Sección de protocolos rápidos para acciones frecuentes
- **RF-13** Modal de estrategia IA con acciones sugeridas

### 1.3 Módulo Legal (Abogado Amigo)
- **RF-14** Chat interactivo con IA especializada en legislación colombiana
- **RF-15** Referencias legales con citas a códigos y decretos
- **RF-16** Sugerencias de preguntas predefinidas
- **RF-17** Subida y escaneo de documentos oficiales (PDF, imágenes)
- **RF-18** Análisis automático de documentos con IA (entidad, fecha, prioridad, resumen)
- **RF-19** Archivo digital con historial de documentos escaneados
- **RF-20** Marcación de prioridad (Urgente, Medio, Informativo)

### 1.4 Módulo Financiero (Contador de Bolsillo)
- **RF-21** Registro de transacciones (ventas y gastos)
- **RF-22** Categorización de transacciones
- **RF-23** Dictado por voz simulado
- **RF-24** Cálculo de ingresos totales, gastos totales y utilidad neta
- **RF-25** Visualización de flujo de caja semanal
- **RF-26** Tabla de transacciones recientes con filtros
- **RF-27** Eliminación de transacciones
- **RF-28** Exportación de reportes CSV/PDF

### 1.5 Módulo de Inventario (Almacén Smart)
- **RF-29** Catálogo de productos con SKU, nombre, stock, costo y precio
- **RF-30** Búsqueda por SKU o nombre de producto
- **RF-31** Filtros: Todos, Stock Bajo, Agotados
- **RF-32** Indicadores: valor de inventario, stock bajo, margen promedio, rotación
- **RF-33** Ajuste rápido de existencias (+/-)
- **RF-34** Alta de nuevos productos con formulario completo
- **RF-35** Cálculo automático de estado de stock (Óptimo, Medio, Crítico)
- **RF-36** Exportación de inventario a Excel

### 1.6 Módulo de Marketing (Marketing Fácil)
- **RF-37** Generación de copias publicitarias con IA (Facebook, Instagram, WhatsApp)
- **RF-38** Copia al portapapeles de cada texto generado
- **RF-39** Planificador de campañas con fechas y selección de productos
- **RF-40** Lista de campañas activas con estado (Live/Draft)
- **RF-41** Calculadora de margen con descuento dinámico
- **RF-42** Indicador de rentabilidad saludable
- **RF-43** Proyección de ventas con gráfico de barras

### 1.7 Tema
- **RF-44** Alternancia entre modo claro y oscuro
- **RF-45** Persistencia de preferencia de tema

### 1.8 Control por Voz (Jarvis)
- **RF-46** Activación por palabra clave "Hola Jarvis" usando Web Speech API
- **RF-47** Activación por **2 aplausos consecutivos** usando Web Audio API
- **RF-48** Saludo contextual según la hora del día (buen día / buena tarde / buena noche)
- **RF-49** Navegación entre módulos por comando de voz ("Ve a finanzas", "Abre legal")
- **RF-50** Resumen hablado de ventas, gastos y stock
- **RF-51** Escritura de mensajes en el chat legal por voz ("Escribe [mensaje] y envía")
- **RF-52** Lectura en voz alta de respuestas legales ("Lee leyes")
- **RF-53** Panel de configuración del asistente (voz, idioma, velocidad, tono, proveedor IA)
- **RF-54** Persistencia de configuración del asistente por usuario en localStorage
- **RF-55** Botón flotante con 4 estados visuales (idle, escuchando, detectado, hablando)
- **RF-56** Resaltado visual del texto durante la lectura en voz alta
- **RF-57** Comando de ayuda para listar comandos disponibles ("¿Qué puedes hacer?")

---

## 2. Requisitos no funcionales

### 2.1 Tecnológicos
- **RNF-01** Aplicación web SPA construida con React 19 + TypeScript
- **RNF-02** Servidor Express.js con Vite como middleware de desarrollo
- **RNF-03** Estilos con Tailwind CSS v4
- **RNF-04** IA mediante Google Gemini API o Ollama (local/cloud)
- **RNF-05** Persistencia en localStorage del navegador

### 2.2 Rendimiento
- **RNF-06** Tiempo de carga inicial < 3 segundos
- **RNF-07** Las operaciones CRUD deben responder en < 500ms
- **RNF-08** Las respuestas de IA deben mostrarse en < 10 segundos (o mostrar estado de carga)

### 2.3 Seguridad
- **RNF-09** Las contraseñas se almacenan codificadas en base64 en localStorage
- **RNF-10** Validación de dominio de correo para evitar correos temporales/inventados
- **RNF-11** La API key de Gemini se configura en el servidor, no en el cliente

### 2.4 Usabilidad
- **RNF-12** Interfaz responsive (desktop, tablet y móvil)
- **RNF-13** Navegación mediante sidebar (desktop) y barra inferior (móvil)
- **RNF-14** Tablas con scroll horizontal en dispositivos móviles
- **RNF-15** Tema oscuro completo en todos los componentes y vistas
- **RNF-16** Botón de voz flotante que no interfiere con la navegación (z-index superior)

### 2.5 Compatibilidad
- **RNF-17** Navegadores recomendados: Chrome, Edge, Opera (soporte completo de Web Speech API y Web Audio API)
- **RNF-18** Soporte parcial en Safari y Firefox (sin funcionalidad de voz)
- **RNF-19** Sin dependencias externas para funcionalidad de voz (usa APIs nativas del navegador)
- **RNF-14** Retroalimentación visual para todas las acciones (loaders, alerts)
- **RNF-15** Indicador de fortaleza de contraseña en tiempo real

### 2.5 Mantenibilidad
- **RNF-16** Código tipado con TypeScript
- **RNF-17** Componentes modulares con props interfaces
- **RNF-18** Separación de contexto (auth, tema) y lógica de negocio

---

## 3. Stack tecnológico

| Componente | Tecnología | Versión |
|------------|-----------|---------|
| UI Framework | React | ^19.0.1 |
| Lenguaje | TypeScript | ~5.8.2 |
| Bundler | Vite | ^6.2.3 |
| CSS | Tailwind CSS | ^4.1.14 |
| Servidor | Express | ^4.21.2 |
| IA (Gemini) | @google/genai | ^2.4.0 |
| IA (Ollama) | ollama | npm latest |
| Íconos | Lucide React | ^0.546.0 |
| Animaciones | Motion | ^12.23.24 |
| Reconocimiento de voz | Web Speech API | Nativa |
| Detección de aplausos | Web Audio API | Nativa |
| Runtime dev | tsx | ^4.21.0 |
| Build server | esbuild | ^0.25.0 |

---

## 4. Estructura del proyecto

```
myasesoria-hub/
├── docs/
│   ├── GUIA_USUARIO.md
│   └── REQUISITOS.md
├── src/
│   ├── components/
│   │   ├── AuthPage.tsx
│   │   ├── CoreDashboard.tsx
│   │   ├── FinanceView.tsx
│   │   ├── Header.tsx
│   │   ├── LegalView.tsx
│   │   ├── LoginForm.tsx
│   │   ├── MarketingView.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── Sidebar.tsx
│   │   ├── SpeakHighlighter.tsx
│   │   ├── StockView.tsx
│   │   ├── VoiceButton.tsx
│   │   └── VoiceSettingsPanel.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   ├── ThemeContext.tsx
│   │   └── VoiceContext.tsx
│   ├── data/
│   │   └── initialData.ts
│   ├── hooks/
│   │   ├── useUserData.ts
│   │   └── useVoiceCommands.ts
│   ├── App.tsx
│   ├── index.css
│   ├── main.tsx
│   └── types.ts
├── docs/
│   ├── GUIA_USUARIO.md
│   └── REQUISITOS.md
├── server.ts
├── vite.config.ts
├── tsconfig.json
├── package.json
├── .env.example
├── .env.local
├── .nvmrc
├── .node-version
├── .gitignore
└── README.md
```

---

## 5. Configuración del entorno

Variables de entorno (`.env.local` — copiar desde `.env.example`):

```env
AI_PROVIDER="ollama"                  # "ollama" | "gemini"
OLLAMA_HOST="http://localhost:11434"  # Solo si AI_PROVIDER=ollama
OLLAMA_MODEL="llama3"                 # Modelo de Ollama a usar
GEMINI_API_KEY=""                     # Solo si AI_PROVIDER=gemini
APP_URL="http://localhost:3000"       # URL base de la app
```

Comandos:

```bash
npm install      # Instalar dependencias
npm run dev      # Iniciar servidor de desarrollo (localhost:3000)
npm run build    # Compilar para producción
npm run start    # Ejecutar build de producción
npm run lint     # Verificar tipos TypeScript
```
