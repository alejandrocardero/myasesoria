# Guía de Usuario — MyAsesorIA Hub

Panel de control integral para microempresas con inteligencia artificial.

---

## 1. Primeros pasos

### Registro
1. Abre `http://localhost:3000`
2. En la pantalla de bienvenida, haz clic en **Regístrate**
3. Completa los campos:
   - **Nombre completo** — tu nombre o el del representante legal
   - **Correo electrónico** — solo se aceptan proveedores verificados (Gmail, Yahoo, Outlook, Hotmail, iCloud, ProtonMail, AOL, Mail.com)
   - **Nombre del negocio** — razón social o nombre comercial
   - **País de residencia** — Colombia, Cuba o República Dominicana
   - **Contraseña** — mínimo 6 caracteres; el medidor de fortaleza te guía (mayúsculas, números y símbolos)
4. Haz clic en **Crear Cuenta**

### Inicio de sesión
1. Ingresa tu correo y contraseña
2. Haz clic en **Iniciar Sesión**

### Cierre de sesión
Haz clic en el engranaje ⚙ del header → **Cerrar Sesión**

---

## 2. Módulos del sistema

### 2.1 Resumen Neural (Dashboard)
Vista ejecutiva con:
- Carrusel de alertas inteligentes
- KPIs: ingresos, gastos, producto estrella
- Tarjetas de acceso directo a cada módulo
- Panel de **Telemetría del Negocio**
- Sección **Protocolos Rápidos**

### 2.2 Abogado Amigo (Legal)
Asistente jurídico con IA especializado en legislación colombiana.
- **Chat legal** — consulta sobre constitución de empresas, impuestos, contratos, Cámara de Comercio
- **Escáner de documentos** — sube PDFs o imágenes de notificaciones (DIAN, Alcaldía) para análisis automático
- **Archivo digital** — historial de documentos escaneados con prioridad y entidad emisora

### 2.3 Contador de Bolsillo (Finanzas)
Gestión contable:
- **Registro rápido** de ventas y gastos (con dictado por voz simulado)
- **Métricas**: ingresos totales, gastos totales, utilidad neta
- **Flujo de caja semanal** con gráfico de barras
- **Tabla de transacciones** con filtros y exportación CSV/PDF

### 2.4 Almacén Smart (Stock)
Control de inventario:
- **Catálogo** con búsqueda por SKU/nombre
- **Indicadores**: valor de inventario, stock bajo, margen promedio, rotación
- **Ajuste rápido** de existencias por producto
- **Predicciones IA** de rotación (productos más vendidos y baja rotación)
- **Alta de nuevos productos** con SKU, costo, precio y categoría

### 2.5 Marketing Fácil (Marketing)
Automatización de campañas:
- **Asistente de Copy con IA** — genera textos para Facebook, Instagram y WhatsApp
- **Planificador de campañas** — programa fechas y selecciona productos
- **Calculadora de márgenes** — ajusta descuento y calcula rentabilidad en tiempo real

---

## 3. Tema oscuro / claro

Haz clic en el ícono 🌙/☀ en el header (junto al engranaje) para alternar entre modo claro y oscuro. La preferencia se guarda automáticamente.

---

## 4. Configuración de perfil

Haz clic en el engranaje ⚙ del header para:
- Editar tu nombre
- Ver tu negocio y correo
- Cambiar el país
- Cerrar sesión

---

## 5. Persistencia de datos

Toda la información se guarda en el navegador (`localStorage`) asociada a tu cuenta. Cada usuario tiene sus propios datos independientes. No hay pérdida de información al recargar la página.

---

## 6. Control por Voz (Jarvis)

El asistente puede activarse de dos formas:

### Activación por voz
Di **"Hola Jarvis"** en el micrófono. El botón flotante en la esquina inferior izquierda cambiará a estado de escucha.

### Activación por aplausos
Da **2 aplausos consecutivos** (separados por menos de 1 segundo). El asistente responderá con un saludo según la hora del día:
- **6:00–11:59** → "¡Buen día! ¿En qué puedo ayudarle?"
- **12:00–18:59** → "¡Buena tarde! ¿En qué puedo ayudarle?"
- **19:00–5:59** → "¡Buena noche! ¿En qué puedo ayudarle?"

### Comandos disponibles
| Comando | Acción |
|---------|--------|
| `"Ve a finanzas"`, `"Abre legal"` | Cambiar de módulo |
| `"Resume ventas"`, `"Resume stock"` | Leer resumen de datos |
| `"Escribe [mensaje]"` | Rellenar el campo de chat |
| `"Escribe [mensaje] y envía"` | Escribir y enviar en el chat |
| `"Lee leyes"` | Leer la última respuesta legal |
| `"¿Qué puedes hacer?"` | Listar comandos disponibles |
| `"Silencio"` / `"Detente"` | Detener la escucha |

### Personalización
Haz clic en el engranaje junto al botón de micrófono para abrir el panel de configuración del asistente. Allí puedes cambiar:
- Palabra de activación
- Idioma y voz (elige una voz femenina marcada con ⭐)
- Velocidad y tono de la voz
- Proveedor de IA (Ollama / Gemini)

> ⚠️ La funcionalidad de voz requiere **Chrome, Edge u Opera**. Safari y Firefox tienen soporte parcial.

## 7. Solución de problemas

| Problema | Solución |
|----------|----------|
| No redirige tras registro | Limpiar `localStorage` (F12 > Application > Clear storage) y reintentar |
| El chat IA respuestas simuladas | Configurar `GEMINI_API_KEY` en `.env.local` o verificar que Ollama esté corriendo |
| Error de proveedor de correo | Usar Gmail, Yahoo, Outlook, Hotmail, iCloud, ProtonMail, AOL o Mail.com |
| Puerto 3000 ocupado | Cerrar otros procesos o cambiar el puerto en `server.ts` |
| El micrófono no funciona | Permitir acceso al micrófono en el navegador. Usar Chrome/Edge para mejor compatibilidad |
| Los aplausos no activan el asistente | Asegurar que sean 2 aplausos fuertes y seguidos (menos de 1 segundo entre ellos) |

---

## 8. Tecnologías

- **Frontend:** React 19 + TypeScript + Vite + Tailwind CSS 4
- **Backend:** Express.js + Vite middleware
- **IA:** Google Gemini / Ollama (local/cloud)
- **Voz:** Web Speech API + Web Audio API (nativas del navegador)
- **Íconos:** Lucide React
- **Persistencia:** localStorage por usuario
