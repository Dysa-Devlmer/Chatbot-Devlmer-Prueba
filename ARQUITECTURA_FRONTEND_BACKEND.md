# 🏗️ ARQUITECTURA: QUIÉN VE QUÉ EN FRONTEND vs BACKEND

**Para**: CEO (Pregunta arquitectónica)
**Fecha**: 16 de Enero de 2026
**Asunto**: División clara de responsabilidades en PITHY Chatbot

---

## 📊 RESUMEN VISUAL

```
┌─────────────────────────────────────────────────────────────────┐
│                     PITHY CHATBOT ARCHITECTURE                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────┐         ┌──────────────────────────┐ │
│  │   FRONTEND (React)   │         │   BACKEND (Node.js)      │ │
│  │   (Lo que VES)       │────────▶│   (Lo que NO ves)        │ │
│  ├──────────────────────┤         ├──────────────────────────┤ │
│  │ • Páginas web        │         │ • API routes             │ │
│  │ • Chat interface     │◀────────│ • Lógica de negocio      │ │
│  │ • Admin dashboard    │         │ • Base de datos          │ │
│  │ • Formularios        │         │ • WhatsApp webhook       │ │
│  │ • Analytics display  │         │ • IA integration         │ │
│  │ • Real-time updates  │         │ • Autenticación          │ │
│  │                      │         │ • Rate limiting          │ │
│  │ Usuarios ven:        │         │ • Seguridad              │ │
│  │ ✓ Chat bonito        │         │ • Procesamiento          │ │
│  │ ✓ Respuestas        │         │                          │ │
│  │ ✓ Métricas          │         │ Usuarios NO ven:         │ │
│  │ ✓ Estadísticas      │         │ ✗ API endpoints          │ │
│  │                      │         │ ✗ Base de datos          │ │
│  │                      │         │ ✗ Lógica interna         │ │
│  │                      │         │ ✗ Credenciales           │ │
│  └──────────────────────┘         └──────────────────────────┘ │
│          Port 7847                                               │
│    (Visible en navegador)           (No visible, en servidor)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🌐 FRONTEND - Lo que ves en el navegador

### Páginas Públicas (Cliente)
```
https://chatbot.zgamersa.com/
├─ Página principal
│  ├─ Interfaz de chat
│  ├─ Área de entrada de mensajes
│  ├─ Historial de conversaciones
│  ├─ Botones de quick replies
│  └─ Voice input/output buttons

└─ /login
   ├─ Formulario de login
   ├─ Recuperación de contraseña
   └─ Registro (si habilitado)
```

### Páginas Administrativas (Admin)
```
https://chatbot.zgamersa.com/admin/
├─ Dashboard Principal
│  ├─ Resumen de métricas
│  ├─ Conversaciones recientes
│  ├─ Usuarios activos
│  └─ Estado del sistema

├─ /inbox
│  ├─ Lista de conversaciones
│  ├─ Chat detallado
│  ├─ Tags manager
│  ├─ Quick replies
│  └─ Marcar como leído

├─ /analytics
│  ├─ Gráficos de uso
│  ├─ Estadísticas de respuestas
│  ├─ Comportamiento del usuario
│  └─ Reportes

├─ /ai
│  ├─ Status de IA (Perplexity vs Ollama)
│  ├─ Configuración de temperatura
│  ├─ Selección de modelo
│  └─ Test de respuestas

├─ /settings
│  ├─ Configuración de perfil
│  ├─ Cambiar contraseña
│  ├─ Preferencias de notificación
│  └─ Avatar del usuario

├─ /tags
│  ├─ Crear/editar tags
│  ├─ Asignar a conversaciones
│  └─ Filtrar por tags

├─ /learning
│  ├─ Patrones frecuentes
│  ├─ Feedback de usuarios
│  └─ Histórico de aprendizaje

└─ /scheduled
   ├─ Mensajes programados
   ├─ Campaña automática
   └─ Calendario
```

### Componentes Visuales (React)
```
app/components/
├─ ClientHome.tsx
│  └─ Interfaz principal de chat

app/admin/components/
├─ AdminHeader.tsx
│  └─ Barra superior del admin
├─ AIIndicator.tsx
│  └─ Muestra IA activa (Perplexity/Ollama)
└─ [Componentes específicos de página]

app/admin/ai/components/
├─ AIStatus.tsx
│  ├─ Status de Perplexity
│  ├─ Status de Ollama
│  ├─ Respuesta time
│  └─ Error indicators
└─ AIConfig.tsx
   ├─ Selector de modelo
   ├─ Temperature slider
   ├─ Token limit input
   └─ Test button

app/admin/settings/components/
└─ AIConfiguration.tsx
   ├─ Configuración de voz
   ├─ Preferencias de respuesta
   └─ Integración settings
```

**Lo que ve el usuario:**
- ✅ Chat bonito e interactivo
- ✅ Respuestas automáticas del bot
- ✅ Métricas y gráficos
- ✅ Panel de administración intuitivo
- ✅ Estado de la IA en tiempo real
- ✅ Indicador de qué IA está activa

**Lo que el usuario NO ve:**
- ❌ Código fuente
- ❌ API endpoints
- ❌ Base de datos
- ❌ Credenciales
- ❌ Lógica interna
- ❌ Errores técnicos (solo mensajes amables)

---

## ⚙️ BACKEND - Lo que sucede en el servidor

### API Routes (Next.js)
```
/api/
├─ whatsapp/
│  └─ webhook/
│     └─ route.ts (POST)
│        ├─ Recibe webhooks de WhatsApp
│        ├─ Valida HMAC signature
│        ├─ Procesa mensaje
│        ├─ Obtiene contexto
│        ├─ Envía a IA
│        ├─ Guarda en BD
│        └─ Responde al usuario

├─ auth/
│  └─ [...nextauth]/
│     └─ route.ts
│        ├─ Maneja login
│        ├─ JWT tokens
│        ├─ Session management
│        └─ Password reset

└─ admin/
   ├─ ai/
   │  └─ route.ts (GET/POST)
   │     ├─ Status de IA
   │     ├─ Config de modelos
   │     ├─ Test de respuestas
   │     └─ Manejo de fallbacks
   │
   ├─ ai-config/
   │  └─ route.ts
   │     ├─ Lee configuración
   │     ├─ Actualiza settings
   │     └─ Valida cambios
   │
   ├─ ai-status/
   │  └─ route.ts
   │     ├─ Status de Perplexity
   │     ├─ Status de Ollama
   │     ├─ Response times
   │     └─ Error rates
   │
   ├─ conversations/
   │  └─ route.ts
   │     ├─ Obtiene listado
   │     ├─ Filtra por tags
   │     ├─ Búsqueda
   │     └─ Paginación
   │
   ├─ messages/
   │  └─ route.ts
   │     ├─ Obtiene mensajes
   │     ├─ Guarda nuevos
   │     ├─ Busca palabras clave
   │     └─ Análisis de sentimiento
   │
   ├─ analytics/
   │  └─ route.ts
   │     ├─ Calcula métricas
   │     ├─ Genera gráficos
   │     ├─ Análisis de uso
   │     └─ Reportes
   │
   ├─ quick-replies/
   │  └─ route.ts
   │     ├─ CRUD operaciones
   │     ├─ Gestiona respuestas
   │     └─ Búsqueda
   │
   ├─ tags/
   │  └─ route.ts
   │     ├─ Crea/edita tags
   │     ├─ Asigna a conversaciones
   │     └─ Filtrado
   │
   ├─ profile/
   │  ├─ route.ts (GET/PUT)
   │  │  ├─ Obtiene datos de usuario
   │  │  └─ Actualiza perfil
   │  │
   │  ├─ password/
   │  │  └─ route.ts (POST)
   │  │     ├─ Valida contraseña antigua
   │  │     ├─ Hashea nueva
   │  │     └─ Actualiza en BD
   │  │
   │  ├─ avatar/
   │  │  └─ route.ts (POST)
   │  │     ├─ Sube imagen
   │  │     ├─ Redimensiona
   │  │     └─ Almacena
   │  │
   │  └─ notifications/
   │     └─ route.ts
   │        ├─ Preferences
   │        ├─ Sonido on/off
   │        └─ Tipo de notificaciones
   │
   ├─ health/
   │  └─ route.ts
   │     ├─ Server status
   │     ├─ DB connection
   │     ├─ Ollama status
   │     └─ Respuesta times
   │
   └─ config/
      └─ voices/
         └─ route.ts
            ├─ Voces disponibles
            ├─ Idiomas soportados
            └─ Configuración de TTS
```

### Services (Lógica de Negocio)
```
src/services/
├─ PerplexityService.ts
│  ├─ Conecta a API Perplexity
│  ├─ Genera respuestas
│  ├─ Maneja fallbacks
│  └─ Timeout handling (30s)
│
├─ MessageProcessorService.ts
│  ├─ Procesa mensajes
│  ├─ Transcribe audio (Whisper)
│  ├─ Obtiene contexto
│  ├─ Prepara prompts
│  └─ Guarda respuestas
│
├─ WhatsAppService.ts
│  ├─ Orquesta webhook
│  ├─ Valida payloads
│  ├─ Maneja sesiones
│  ├─ Detecta timeouts (24h)
│  └─ Crea conversaciones
│
├─ HMACValidator.ts
│  ├─ Valida firmas
│  ├─ Timing-safe comparison
│  └─ Previene tampering
│
└─ RateLimiter.ts
   ├─ Limita 100 req/min
   ├─ 15min temp blocks
   ├─ Auto-cleanup
   └─ User tracking
```

### Repositories (Acceso a Datos)
```
src/repositories/
├─ UserRepository.ts
│  ├─ getOrCreate()
│  ├─ update()
│  ├─ getProfile()
│  └─ updateProfile()
│
├─ ConversationRepository.ts
│  ├─ create()
│  ├─ get()
│  ├─ list()
│  ├─ markAsRead()
│  └─ deleteOld()
│
├─ MessageRepository.ts
│  ├─ save()
│  ├─ getRecent()
│  ├─ search()
│  └─ checkDuplicates()
│
├─ WhatsAppRepository.ts
│  ├─ sendMessage()
│  ├─ markAsDelivered()
│  └─ handleError()
│
├─ WebhookLogRepository.ts
│  ├─ logIncoming()
│  ├─ logOutgoing()
│  └─ getHistory()
│
└─ AuthRepository.ts
   ├─ login()
   ├─ logout()
   ├─ verify()
   └─ resetPassword()
```

### Middleware (Seguridad)
```
src/middleware/
├─ webhook-auth.ts
│  ├─ HMAC validation
│  ├─ Rate limiting
│  ├─ IP extraction
│  └─ Error handling
│
├─ validation.ts
│  ├─ Zod schema validation
│  ├─ Input sanitization
│  └─ Type checking
│
├─ security.ts
│  ├─ CORS headers
│  ├─ Security headers (CSP, HSTS)
│  └─ Helmet configuration
│
└─ rateLimit.ts
   ├─ Token bucket
   ├─ User tracking
   ├─ Block management
   └─ Cleanup jobs
```

### Base de Datos (Persistencia)
```
prisma/
└─ schema.prisma
   ├─ User (usuarios)
   ├─ Conversation (chats)
   ├─ Message (mensajes)
   ├─ WebhookLog (auditoría)
   ├─ AdminProfile (admin data)
   ├─ Tag (etiquetas)
   ├─ Command (comandos)
   ├─ MessageTemplate (templates)
   ├─ SystemConfig (settings)
   ├─ Campaign (campañas)
   ├─ UserAnalytics (métricas)
   ├─ ConversationLearning (aprendizaje)
   ├─ FeedbackLog (feedback)
   ├─ FrequentPattern (patrones)
   ├─ LearningStats (estadísticas)
   └─ [3 más...]

SQLite File: prisma/dev.db (1.6MB)
```

**Lo que hace el backend:**
- ✅ Procesa webhooks de WhatsApp
- ✅ Valida seguridad (HMAC)
- ✅ Limita rate (100 req/min)
- ✅ Obtiene contexto de BD
- ✅ Envía a IA (Perplexity/Ollama)
- ✅ Guarda todo en BD
- ✅ Autentica usuarios
- ✅ Genera respuestas
- ✅ Maneja fallbacks
- ✅ Registra auditoría

**El usuario NO ve nada de esto:**
- ❌ No ve SQL queries
- ❌ No ve API calls
- ❌ No ve validaciones
- ❌ No ve seguridad
- ❌ No ve base de datos
- ❌ No ve lógica interna

---

## 🔄 Flujo Completo: Frontend → Backend → Frontend

### Caso: Usuario escribe mensaje en WhatsApp

```
1. FRONTEND (Usuario)
   └─ Cliente escribe en WhatsApp
      └─ "Hola, ¿cómo estás?"

2. BACKEND RECIBE
   └─ WhatsApp API envía a:
      └─ https://chatbot.zgamersa.com/api/whatsapp/webhook

3. BACKEND PROCESA
   ├─ webhook-auth.ts
   │  ├─ Valida HMAC signature ✓
   │  ├─ Rate limit check ✓
   │  └─ IP extraction
   │
   ├─ WhatsAppService.ts
   │  ├─ Parse payload
   │  ├─ Get user from BD
   │  └─ Create conversation
   │
   ├─ MessageProcessorService.ts
   │  ├─ Extract content
   │  ├─ Get conversation context (últimos 10 mensajes)
   │  ├─ Prepare prompt
   │  └─ Format for IA
   │
   ├─ PerplexityService.ts
   │  ├─ Intenta Perplexity
   │  │  └─ 2-3 segundos ✓
   │  └─ Si falla → Ollama (5-7 segundos)
   │
   ├─ MessageRepository.ts
   │  ├─ Save incoming message
   │  ├─ Save bot response
   │  └─ Check duplicates
   │
   └─ WhatsAppRepository.ts
      └─ Send response back

4. FRONTEND RECIBE (Usuario)
   └─ Respuesta en WhatsApp
      └─ "¡Hola! Estoy aquí para ayudarte. ¿En qué puedo asistirte?"

5. FRONTEND DISPLAYS (Admin)
   ├─ Aparece en /inbox
   ├─ Se actualiza en tiempo real
   ├─ Aparece en analytics
   └─ Se guarda en historial
```

---

## 🏭 Separación de Responsabilidades

### FRONTEND (Presentation Layer)
```
Responsabilidad: Mostrar datos al usuario
├─ Renderizar HTML/CSS
├─ Interactividad con React
├─ Validación del lado del cliente
├─ Solicitar datos al backend
├─ Mostrar respuestas
└─ Manejo de estado local

Usuarios ven: Interfaz bonita y funcional
```

### BACKEND (Application Layer)
```
Responsabilidad: Lógica de negocio y datos
├─ Procesar solicitudes
├─ Validación de reglas
├─ Autenticación y autorización
├─ Acceso a base de datos
├─ Integración con servicios externos (IA)
├─ Seguridad y encriptación
├─ Auditoría y logging
└─ Error handling

Usuarios NO ven: Complejidad interna
```

---

## 🔐 División de Seguridad

### Frontend (Seguridad del Usuario)
```
✅ HTTPS/TLS (navegador a servidor)
✅ JWT tokens (sessions)
✅ CSRF protection (NextAuth)
✅ Input validation (client-side)
✅ XSS prevention (React escaping)
```

### Backend (Seguridad de Sistema)
```
✅ HMAC-SHA256 validation (webhook)
✅ Rate limiting (DoS prevention)
✅ Bcrypt hashing (passwords)
✅ Input sanitization
✅ SQL injection prevention (Prisma ORM)
✅ API key management
✅ Audit logging
✅ Timing-safe comparisons
```

---

## 📊 Stack Técnico

### Frontend
```
Framework: Next.js 16 (React 19)
Language: TypeScript
Styling: Tailwind CSS
State: React Hooks + Context
Real-time: Server-Side Events (SSE)
Components: Custom React components
```

### Backend
```
Framework: Next.js API Routes
Language: TypeScript (strict mode)
Database: SQLite + Prisma ORM
Security: HMAC, bcrypt, Zod validation
IA Integration: Perplexity + Ollama
Logging: Winston
Rate Limiting: In-memory tokens
Process Management: PM2
Public Access: Cloudflare Tunnel
```

---

## 🎯 Resumen Ejecutivo

### ¿Qué ve el usuario en FRONTEND?

```
✅ Chat interface bonita
✅ Respuestas automáticas
✅ Admin dashboard
✅ Métricas y gráficos
✅ Panel de control
✅ Formularios interactivos
✅ Notificaciones en tiempo real
✅ Historial de conversaciones
```

### ¿Qué hace el BACKEND que el usuario NO ve?

```
✅ Procesa webhooks WhatsApp
✅ Valida seguridad (HMAC)
✅ Limita velocidad de requests
✅ Obtiene contexto de BD
✅ Envía a IA (Perplexity/Ollama)
✅ Guarda en base de datos
✅ Autentica usuarios
✅ Genera respuestas inteligentes
✅ Maneja errores gracefully
✅ Registra auditoría
```

### Beneficio de esta separación:

- **Para Usuario**: Ve interfaz simple y bonita ✅
- **Para Sistema**: Lógica segura y robusta ✅
- **Para Escalabilidad**: Fácil de mantener y expandir ✅
- **Para Seguridad**: API aislada y protegida ✅

---

**Conclusión**: PITHY Chatbot tiene una separación clara y profesional entre lo que los usuarios ven (Frontend bonito) y lo que el sistema hace internamente (Backend robusto).

---

Generado por: CLAUDE (Technical Architect)
Fecha: 16 de Enero de 2026
Para: CEO (Pregunta arquitectónica)
