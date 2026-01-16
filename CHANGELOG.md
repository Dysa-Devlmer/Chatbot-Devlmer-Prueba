# Changelog

Todos los cambios notables en PITHY Chatbot serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

═══════════════════════════════════════════════════════════════

## [0.1.0] - 2024-12-19

### 🎉 Versión Inicial - Sistema Completo

**Creado por:** Pierre Arturo Benites Solier (Devlmer)
**RUT:** 25.484.075-0
**Email:** bpier@zgamersa.com

#### ✨ Agregado

**Core Features:**
- Sistema de chatbot IA completo para WhatsApp Business
- Integración con Meta WhatsApp Business API
- IA local con Ollama (modelo llama3.2:latest)
- Panel de administración web completo
- Sistema de autenticación con NextAuth
- Base de datos SQLite con Prisma ORM

**Panel de Administración:**
- Dashboard con métricas en tiempo real
- Bandeja de mensajes (Inbox) con filtros avanzados
- Sistema de IA Assistant con sugerencias automáticas
- Gestión de respuestas rápidas (Quick Replies)
- Sistema de etiquetas (Tags) para organización
- Configuraciones del sistema
- Analytics y estadísticas
- Búsqueda global en tiempo real
- Sistema de notificaciones

**IA y Aprendizaje:**
- Prompt profesional optimizado (40 palabras máximo)
- Reglas de precisión para fechas y horarios
- Sistema RAG (Retrieval-Augmented Generation) con ChromaDB
- Embeddings con Ollama para aprendizaje
- Análisis de sentimiento automático
- Detección de intención de mensajes
- Búsqueda semántica en conversaciones pasadas

**Audio y TTS:**
- Text-to-Speech con Edge-TTS v7.2.7
- Soporte para voz chilena (es-CL-CatalinaNeural)
- Whisper para transcripción de audio
- Sistema de caché para audio
- Compatibilidad con Python 3.13

**Infraestructura:**
- Cloudflare Tunnel (https://chatbot.zgamersa.com)
- PM2 para gestión de procesos
- Sistema de health checks
- Logs estructurados con timestamps
- Reinicio automático de servicios
- Puerto fijo 7847

**Respuestas Automáticas:**
- Modo automático/manual switcheable
- Límite de 40 palabras por respuesta
- 80 tokens (num_predict) para completitud
- Temperature 0.5 para precisión
- Context awareness (últimos 3 mensajes)

**Seguridad:**
- Autenticación con credenciales
- Variables de entorno protegidas
- Token de webhook verificado
- Sanitización de inputs
- Rate limiting en API

#### 🔧 Configuración

**Servicios Implementados:**
- Chatbots IA (atención 24/7, WhatsApp)
- Software a medida
- Automatización empresarial

**Tagline Oficial:**
> "Asistente IA profesional. Respuestas precisas. Disponibilidad total."

**Contacto Configurado:**
- WhatsApp: +56 9 6541 9765
- Email: info@zgamersa.com
- Email CEO: bpier@zgamersa.com
- Web: https://zgamersa.com
- Chatbot: https://chatbot.zgamersa.com

#### 📝 Commits Importantes

**Diciembre 18, 2024:**
- `aa194dd` - Reglas de precisión para fechas/horarios
- `81b0c56` - Edge-TTS v7.2.7 (Python 3.13 compatible)
- `f0fbc8e` - num_predict 80 tokens
- `bb9063c` - Puerto 7847 para Cloudflare
- `7586b16` - Optimización TTS (40 palabras)
- `4fcaeb9` - Restaurar prompt profesional

**Diciembre 19, 2024:**
- `89ad71ab` - Health check script completo
- Sistema de autoría y documentación oficial

#### 🛠️ Stack Tecnológico

**Frontend & Backend:**
- Next.js 16.0.3
- React 19.2.0
- TypeScript 5
- Tailwind CSS 4

**IA & ML:**
- Ollama 0.6.3 (llama3.2:latest)
- ChromaDB (embeddings)
- Edge-TTS 7.2.7
- Whisper (transcripción)

**Database:**
- Prisma ORM 6.19.0
- SQLite (local)

**Infrastructure:**
- PM2 (process manager)
- Cloudflare Tunnel
- WhatsApp Business API v21.0

**Dev Tools:**
- ESLint 9
- Babel React Compiler 1.0.0

#### 📄 Documentación Creada

- `AUTHORS.md` - Autoría oficial del proyecto
- `LICENSE.txt` - Licencia propietaria
- `README.md` - Documentación principal
- `CHANGELOG.md` - Este archivo
- `AUDITORIA-AUTORIA-SISTEMA.md` - Auditoría completa
- `RESUMEN_SESION_18_DIC_2024.md` - Resumen sesión
- Health check script (`health-check.ps1`)

#### 🔒 Licencia

Copyright © 2024 Pierre Arturo Benites Solier (Devlmer)
Licencia Propietaria - Todos los derechos reservados

═══════════════════════════════════════════════════════════════

## [Unreleased] - Próximas Características

### 🚀 Planificado para versión 0.2.0

- Multi-idioma (Inglés, Portugués)
- Programación de tareas automatizadas
- Integraciones con CRM
- Dashboard mejorado con gráficos avanzados
- Sistema de webhooks personalizados
- API pública documentada
- Modo dark/light en admin panel
- Exportación de conversaciones (CSV, JSON)
- Backup automático de base de datos

═══════════════════════════════════════════════════════════════

## Formato de Versiones

**MAJOR.MINOR.PATCH** (siguiendo SemVer)

- **MAJOR:** Cambios incompatibles en API
- **MINOR:** Nuevas funcionalidades compatibles
- **PATCH:** Correcciones de bugs

═══════════════════════════════════════════════════════════════

**Mantenido por:** Pierre Arturo Benites Solier (Devlmer)
**Email:** bpier@zgamersa.com
**Última actualización:** 19 de Diciembre de 2024
