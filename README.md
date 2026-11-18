# PITHY Chatbot - Enterprise SaaS & WhatsApp Business Platform

> Plataforma profesional de automatización de atención y reservas por WhatsApp Business con gestión de catálogo multi-rubro.

**Autor y Creador Oficial:** Pierre Arturo Benites Solier (Devlmer) · [zgamersa.com](https://zgamersa.com)

---

## 🚀 Descripción del Proyecto

**PITHY Chatbot** es un sistema SaaS diseñado para integrarse con WhatsApp Cloud API (Meta) y ofrecer atención automatizada, gestión de inventario en tiempo real y toma de pedidos/reservas para diversos sectores de negocio (Hardware, Gastronomía, Tiendas de Ropa, Farmacias, Servicios, entre otros).

El sistema cuenta con un panel de administración completo donde el propietario del negocio puede configurar la identidad comercial, horarios, políticas, categorías y productos, manteniendo la sincronización directa con las respuestas inteligentes del bot.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Framework Web & API** | Next.js 16 (App Router) + React 19 |
| **Lenguaje** | TypeScript |
| **Base de Datos & ORM** | SQLite + Prisma ORM |
| **Motor de Inteligencia** | Modelos de Lenguaje para Procesamiento de Respuestas |
| **Mensajería Oficial** | WhatsApp Business Cloud API (Graph API v21.0) |
| **Autenticación** | NextAuth.js + Cifrado Bcrypt |
| **Validación & Seguridad** | Zod, HMAC SHA-256 Webhook Verification, Winston Logger |

---

## 📦 Características Principales

- **Conexión Directa con Meta**: Recepción y despacho de mensajes a través de WhatsApp Cloud API oficial.
- **Panel Administrativo Multi-Rubro**:
  - Configuración de perfil de empresa (nombre, rubro, dirección, moneda, horarios, políticas).
  - Gestión integral de catálogo: creación, edición y control de stock de productos y categorías.
  - Registro y seguimiento de pedidos y reservas generadas automáticamente.
- **Gestión Automatizada de Reservas**:
  - Deducción de stock en tiempo real en la base de datos al confirmar pedidos.
  - Generación de código único de confirmación (`ORD-XXXX`).
- **Seguridad y Privacidad**:
  - Sanitización y redacción de datos sensibles y tokens en logs estructurados.
  - Verificación estricta de firma HMAC en cada evento entrante de webhook.
  - Sesiones cifradas vía JWT.

---

## ⚙️ Configuración y Puesta en Marcha

### 1. Requisitos Previos
- Node.js v20+ y npm
- Cuenta en Meta for Developers con App de WhatsApp configurada

### 2. Instalación de Dependencias
```bash
npm install
```

### 3. Configuración de Variables de Entorno
Crea un archivo `.env.local` basado en la plantilla de configuración:

```env
PORT=7847
DATABASE_URL="file:./prisma/dev.db"

# WhatsApp Cloud API (Meta)
WHATSAPP_TOKEN="tu_token_meta"
WHATSAPP_PHONE_NUMBER_ID="tu_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="tu_waba_id"
WHATSAPP_WEBHOOK_TOKEN="tu_webhook_verify_token"
WHATSAPP_APP_SECRET="tu_app_secret"

# Autenticación Admin
NEXTAUTH_SECRET="tu_secreto_seguro"
NEXTAUTH_URL="http://localhost:7847"
```

### 4. Base de Datos
```bash
npx prisma db push
```

### 5. Ejecución en Desarrollo y Producción
```bash
# Desarrollo
npm run dev

# Compilación y Producción
npm run build
npm start
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia Propietaria y Comercial de **Pierre Arturo Benites Solier (Devlmer)**. Todos los derechos reservados.
