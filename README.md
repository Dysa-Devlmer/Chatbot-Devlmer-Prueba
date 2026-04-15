# PITHY Chatbot

> Asistente IA profesional para WhatsApp Business. Respuestas precisas. Disponibilidad 24/7.

Desarrollado por **Pierre Arturo Benites Solier (Devlmer)** · [zgamersa.com](https://zgamersa.com)

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (Turbopack) + React 19 |
| Base de datos | SQLite + Prisma ORM |
| IA Local | Ollama (Llama, Mistral, Phi, Gemma) |
| IA Nube | Claude (Anthropic) / OpenAI (fallback) |
| Autenticación | NextAuth.js + bcrypt |
| Logging | Winston (structured JSON) |
| Validación | Zod |
| Mensajería | WhatsApp Business API (Meta) |
| Túnel | Cloudflare Tunnel |

---

## Características

- **WhatsApp Business**: Recibe y envía mensajes de texto y audio via Meta API
- **IA Multi-proveedor**: Ollama local (gratis) o Claude/OpenAI (nube)
- **Respuestas de Voz**: Transcripción con Whisper + síntesis con edge-tts
- **Panel de Administración**: Gestión de conversaciones en tiempo real
- **Modo Auto/Manual**: Alterna entre respuestas automáticas y manuales por conversación
- **Sistema RAG**: Aprendizaje contextual con ChromaDB y embeddings
- **Seguridad Enterprise**: HMAC validation, rate limiting, CORS, bcrypt, redacción de logs
- **Arquitectura en Capas**: Repository → Service → API Route

---

## Requisitos

- Node.js 18+
- Python 3.11+ (para Whisper y edge-tts)
- Ollama instalado y corriendo
- Cuenta de WhatsApp Business (Meta Developers)
- Cloudflare Tunnel configurado

---

## Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/Dysa-Devlmer/Chatbot-Devlmer-Prueba.git
cd Chatbot-Devlmer-Prueba

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales

# 4. Inicializar base de datos
npx prisma migrate dev
npx prisma generate

# 5. Instalar dependencias Python (TTS y Whisper)
pip install edge-tts openai-whisper
```

---

## Configuración

Crea `.env.local` con las siguientes variables:

```env
# WhatsApp Business
WHATSAPP_TOKEN=your_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_WEBHOOK_TOKEN=your_webhook_token
WHATSAPP_APP_SECRET=your_app_secret

# Autenticación
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
NEXTAUTH_URL=http://localhost:7847

# Base de datos
DATABASE_URL=file:./db.sqlite

# IA Local
OLLAMA_URL=http://localhost:11434

# IA Nube (opcionales)
CLAUDE_API_KEY=your_claude_key
OPENAI_API_KEY=your_openai_key
```

---

## Uso

```bash
# Terminal 1 — Servidor IA local
ollama serve

# Terminal 2 — Aplicación
npm run dev

# Terminal 3 — Túnel público
cloudflared tunnel run
```

Accesos:

| URL | Descripción |
|-----|-------------|
| `http://localhost:7847` | Aplicación principal |
| `http://localhost:7847/admin` | Panel de administración |
| `http://localhost:7847/api/health` | Estado del sistema |
| `https://chatbot.zgamersa.com` | Producción (Cloudflare Tunnel) |

---

## Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   ├── whatsapp/webhook/   # Webhook de WhatsApp
│   │   ├── admin/              # API del panel admin
│   │   └── auth/               # Autenticación
│   ├── admin/                  # Dashboard de administración
│   └── components/             # Componentes React
├── src/
│   ├── repositories/           # Capa de acceso a datos (6 repositorios)
│   ├── services/               # Lógica de negocio
│   ├── lib/                    # Utilidades core (logger, prisma, ai)
│   ├── middleware/             # Validación, rate limiting, seguridad
│   └── types/                  # Schemas Zod y tipos TypeScript
├── prisma/
│   └── schema.prisma           # Schema de base de datos (14 modelos)
└── embeddings-service/         # Servicio RAG con ChromaDB
```

---

## Comandos

```bash
npm run dev        # Desarrollo (puerto 7847)
npm run build      # Build de producción
npm start          # Producción
npm run lint       # Linter

npx prisma studio  # Interfaz visual de base de datos
npx prisma migrate dev --name descripcion  # Nueva migración
```

---

## Arquitectura

El sistema sigue una arquitectura en capas estricta:

```
API Route → Service → Repository → Prisma → SQLite
```

**Repositorios** (capa de datos):
- `AuthRepository` — Autenticación de administradores
- `WhatsAppRepository` — Comunicación con Meta API
- `UserRepository` — Usuarios de WhatsApp
- `ConversationRepository` — Ciclo de vida de conversaciones
- `MessageRepository` — Almacenamiento de mensajes
- `WebhookLogRepository` — Auditoría de webhooks

**Seguridad implementada**:
- Contraseñas con bcrypt (12 salt rounds)
- Validación HMAC de webhooks
- Rate limiting por IP
- Headers de seguridad (CSP, HSTS, CORS)
- Redacción automática de secretos en logs

---

## Autor

**Pierre Arturo Benites Solier (Devlmer)**

- **Rol**: CEO & Fundador — PITHY / zgamersa.com
- **Email**: bpier@zgamersa.com
- **Web**: [zgamersa.com](https://zgamersa.com)
- **WhatsApp**: +56 9 6541 9765

---

## Licencia

Copyright © 2025 Pierre Arturo Benites Solier (Devlmer)  
Licencia Propietaria — Todos los derechos reservados.  
No se aceptan contribuciones externas sin autorización previa.
