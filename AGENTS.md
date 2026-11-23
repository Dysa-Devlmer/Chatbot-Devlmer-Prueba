# 🛡️ PITHY CHATBOT — REGLAS MAESTRAS DE SEGURIDAD & CENTINELA ACTIVO (YOU SHOULD KNOW)

Este archivo rige el comportamiento de todos los agentes y desarrolladores que operan sobre este proyecto.
Define las directrices de seguridad, estabilidad técnica y control de riesgos en tiempo real.

---

## 1. Principio "You Should Know" (Advertencias Activas de Riesgo)
- Antes de ejecutar cualquier cambio estructural, modificación de base de datos o llamada a APIs externas con impacto en costos o permisos, el agente debe evaluar y alertar proactivamente al usuario sobre:
  - Riesgos de regresión en código o interfaces móviles.
  - Excedentes potenciales de cuotas o rate-limits (Meta Cloud API, Gemini API).
  - Casos de borde no cubiertos (ej. clientes llamando fuera de horario, datos nulos en SQLite).

---

## 2. Protección Estricta de Secretos & Credenciales
- **Prohibición Total de Exposición:** Ningún token de acceso (`WHATSAPP_TOKEN`), API Keys (`GEMINI_API_KEY`), secretos de aplicación ni credenciales SSH/VPS deben ser incluidos en componentes del cliente frontend (`'use client'`), respuestas públicas de endpoints o repositorios.
- Todas las variables sensibles deben residir exclusivamente en archivos `.env` del servidor y ser consumidas en Server Actions o Route Handlers (`app/api/*`).
- No exponer contraseñas ni hashes de usuarios administradores en logs ni respuestas JSON.

---

## 3. Enforzamiento de Puertos & Entorno de Red
- **Puerto Local Obligatorio:** El servidor de desarrollo Next.js DEBE ejecutarse única y exclusivamente en el **puerto 7847** (`npm run dev -- -p 7847` o script preconfigurado).
- **Prohibido el Puerto 3000:** Nunca matar ni reasignar procesos locales al puerto 3000.
- **Producción VPS:** El servidor de producción opera en `64.176.21.229` bajo el proceso PM2 `chatbot`, protegido por Nginx reverse proxy con certificado SSL en `https://chatbot.zgamersa.com`.

---

## 4. Aislamiento de Datos & Multi-Tenancy (Seguridad de Clientes)
- Toda consulta que maneje pedidos, productos, conversaciones o configuraciones de empresa debe validar explícitamente el contexto del negocio (`businessId` / `tenantId`).
- Si se aprovisionan subdominios o nuevas empresas arrendatarias, las bases de datos deben mantenerse aisladas e independientes para garantizar la total privacidad de cada cliente comercial.

---

## 5. Control de Calidad Pre-Despliegue
- Todo cambio en el código TypeScript debe verificarse localmente con `npx tsc --noEmit` antes de desplegarse en producción.
- No se permiten despliegues a producción si existen errores de tipo o rutas rotas.
- Tras cada despliegue al VPS, verificar que PM2 se reinicie limpiamente y que la aplicación esté respondiendo en `online`.

---

## 6. Monitoreo & Segundo Cerebro (Obsidian)
- Toda sesión de cambios arquitectónicos, adición de endpoints o decisiones estratégicas debe registrarse en el 2do Cerebro de Obsidian en `docs/brain/` para mantener la sincronización y memoria persistente del equipo.
