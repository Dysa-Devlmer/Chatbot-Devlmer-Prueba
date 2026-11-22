# 📡 Feed de Actividades - PITHY Chatbot

Todas las acciones, pruebas y avances realizados se registran cronológicamente aquí.

---

### [2026-11-16] 🚀 Inicialización y Diagnóstico Completo
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Análisis de arquitectura Next.js 16 + React 19 + Prisma + SQLite.
  - Ejecución de pruebas unitarias: `npm test` -> 50/50 pruebas pasadas exitosamente.
  - Ejecución de build: `npm run build` -> 39 rutas generadas correctamente.
  - Comprobación del servidor en vivo en puerto 7847: `/api/health` OK (Servidor 21ms, DB 8ms).
  - Inicialización del **Segundo Cerebro en Obsidian** en `E:\prueba` y registro en `obsidian.json`.
  - Creación de [[META_OFICIAL|🎯 Meta Oficial y Roadmap]].
- **Siguiente Hito:** Paso 1 - Definición y carga segura de credenciales de Meta WhatsApp Cloud API.

---

### [2026-11-16] ✅ Paso 1 Completado: Credenciales Meta Verificadas al 100%
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Token de usuario de sistema (`Dysa Bot`) y Secreto de App vinculados en `.env.local`.
  - Prueba en vivo con Meta Graph API v21.0 exitosa:
    - Entidad: `Dysa Bot` (ID: `122094721323145856`)
    - Cuenta WABA: `779998311756531` (`Devlmer Apps`)
    - Número verificado: `+56 9 6541 9765` (Phone Number ID: `905984725929536`)
    - Permisos confirmados: `whatsapp_business_management`, `whatsapp_business_messaging`, `whatsapp_business_manage_events` (todos activos).
- **Siguiente Hito:** Paso 2 - Conexión del Webhook en Vivo (Túnel Cloudflare + Verificación en Meta for Developers).

---

### [2026-11-16] 🟢 Paso 2 Verificado: Túnel HTTPS y Webhook en Vivo
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Servidor Next.js activo en puerto 7847.
  - Túnel Cloudflare HTTPS activo en `https://bringing-keys-formation-version.trycloudflare.com`.
  - Endpoint `/api/whatsapp/webhook` responde al challenge de Meta con `HTTP 200`.
  - Suscripción activada para el evento `messages`.
- **Hallazgo:** La clave de Perplexity en `.env.local` reporta 401; se requiere clave válida o proveedor local (Ollama) para las respuestas de IA.
- **Siguiente Hito:** Paso 3 - Prueba de recepción de mensaje real enviado a `+56 9 6541 9765` y validación HMAC.

---

### [2026-11-17] 🤖 Integración de Google Gemini con Cascada Automática y Seguridad Blindada
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Descartado Perplexity y reemplazado completamente por `GeminiService.ts` ([GeminiService.ts](file:///E:/prueba/src/services/GeminiService.ts)).
  - **Cascada de modelos gratuita y de bajo costo**:
    1. Primario: `gemini-3.5-flash` (modo gratuito / alto rendimiento).
    2. Fallback automático: `gemini-3.5-flash-lite` (en caso de agotar cuota o límite temporal).
  - **Blindaje de seguridad**: Redacción forzada de `GEMINI_API_KEY` en `src/lib/logger.ts` para prevenir fugas en logs.
  - Pruebas unitarias ejecutadas: 50/50 pasadas con éxito (`npm test`).
  - Compilación Next.js 16 exitosa (`npm run build`).
  - Servidor en vivo y túnel Cloudflare activo en `https://elderly-cakes-inquiry-spot.trycloudflare.com`.
- **Siguiente Hito:** Actualizar la URL del webhook en Meta for Developers y enviar mensaje real desde WhatsApp a `+56 9 6541 9765`.

---

### [2026-11-17] 🛡️ Diagnóstico de Conversación Real + Anti-503 con Reintentos Exponenciales
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Auditada la conversación real de WhatsApp en SQLite: 5 intercambios exitosos con excelente fluidez técnica de Gemini.
  - Detectada causa raíz del último mensaje: error `HTTP 503 (High Demand)` simultáneo en la capa gratuita de Google para Flash y Flash-Lite a las 18:49:24.
  - **Blindaje implementado en [GeminiService.ts](file:///E:/prueba/src/services/GeminiService.ts)**:
    - Reintento automático con backoff exponencial (1.2s, 2.4s) antes de dar por fallida la solicitud.
  - Pruebas unitarias: 50/50 pasadas con éxito.
- **Siguiente Hito:** Definición del Modelo de Negocio SaaS Multi-Rubro (Catálogo y Reservas) y Despliegue en VPS Vultr con IP Fija / Webhook Permanente.

---

### [2026-11-17] 📦 Paso 1 SaaS Completado y Comprobado: Catálogo y Perfil de Empresa
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Creados los modelos `BusinessProfile`, `Category`, `Product`, `Order`, `OrderItem` en [schema.prisma](file:///E:/prueba/prisma/schema.prisma).
  - Sincronizada la base de datos con `prisma db push` y regenerado el cliente Prisma.
  - Implementadas las APIs REST completas:
    - `/api/admin/products` y `/api/admin/products/[id]` (CRUD de productos).
    - `/api/admin/business` (Configuración de rubro, políticas e instrucciones de empresa).
    - `/api/admin/categories` (Categorías de productos).
  - Creadas las interfaces del Panel de Control en Next.js:
    - `/admin/products`: Vista de tabla de catálogo con modal para crear/editar productos, control de stock y botón de reserva.
    - `/admin/business`: Selector de rubro (tecnología, ropa, restaurantes, farmacias, etc.), moneda, políticas y prompt personalizado.
  - Compilación exitosa de 44 rutas estáticas y dinámicas (`npm run build`).
  - Pruebas HTTP automáticas verificadas: Creación, lectura y consulta de productos y perfil de empresa con respuesta `HTTP 200/201`.
- **Siguiente Hito:** Paso 2 SaaS - Conectar `GeminiService` con la tabla `Product` para que consulte el stock en vivo e iniciar el módulo de reservas automáticas por WhatsApp.

---

### [2026-11-17] 🛒 Paso 2 SaaS Completado y Comprobado: Gemini con Catálogo en Vivo y Creación de Reservas
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Implementado [ReservationService.ts](file:///E:/prueba/src/services/ReservationService.ts) para registrar pedidos con código correlativo (`ORD-1001`), cálculo de monto total y descuento de inventario.
  - Creada API REST `/api/admin/orders` para listar y actualizar estados de reservas (pendiente, confirmado, entregado, cancelado).
  - Modificado [GeminiService.ts](file:///E:/prueba/src/services/GeminiService.ts) con inyección dinámica del catálogo real y políticas de negocio en el system prompt.
  - Integrado reconocimiento de intenciones de compra: cuando el cliente pide reservar, Gemini coordina la creación de la reserva en SQLite y adjunta el código de orden al usuario.
  - **Prueba Real Ejecutada:**
    - Mensaje simulado: *"Por favor resérvame el procesador Ryzen 5 7600X que tienes en stock"*.
    - Resultado: Gemini consultó el catálogo real ($240.000), creó la orden **ORD-1001** en la base de datos, descontó el stock de 3 a 2 unidades y respondió con el código oficial de apartado.
  - Servidor Next.js 16 recompilado exitosamente (45 rutas) y en ejecución.
- **Siguiente Hito:** Paso 3 - Preparación y Despliegue en VPS Vultr (Configuración de IP Fija, SSL y Webhook Permanente).

---

### [2026-11-17] 🚀 Paso 3 Listo: Transición a Despliegue en VPS Vultr
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - Auditoría final pre-despliegue de suite de pruebas: 50/50 tests unitarios pasados (100%).
  - Verificados endpoints de salud (`/api/health`) y base de datos relacional SQLite con tablas de órdenes y productos.
  - Verificado cliente SSH local en Windows (`OpenSSH_for_Windows_9.5p1`).
  - Código fuente listo y empaquetado para subida a servidor de producción permanente.
- **Siguiente Hito:** Conexión SSH a VPS Vultr, aprovisionamiento de Node.js, Nginx, Let's Encrypt SSL y fijación de Webhook permanente en Meta.

---

### [2026-11-22] 💎 Fase Producción: Carta Digital Multi-Moneda, Refactor SaaS y Bot WhatsApp Sin Sábanas de Texto
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Erradicación de Mock Data en `/menu`:** Eliminado el array estático `MENU_ITEMS` (8 ítems) y conectado en vivo a la base de datos real (41 productos y 9 categorías) mediante el nuevo endpoint `/api/menu`.
  - **Multi-Moneda & Multi-País Automático:** Selector interactivo con banderas vectoriales SVG en `/admin/business` que configura automáticamente código ISO, prefijo y formato de precios (CLP, PEN, COP, MXN, USD, EUR, ARS).
  - **Bot WhatsApp (Gemini) Optimizado:** Erradicada la saturación por sábanas de texto cuando el cliente pide la carta. Ahora ofrece elegantemente el enlace interactivo oficial (`https://chatbot.zgamersa.com/menu`) y las categorías principales disponibles.
  - **Panel de Control Despejado y Profesional:** Erradicado el sidebar redundante y restaurado el header horizontal ergonómico con los 5 módulos esenciales (*Pedidos*, *Inbox*, *Menú*, *Mi Local*, *Analytics*).
  - **Despliegue Certificado en Producción:** Compilado con Next.js Turbopack y reiniciado en PM2 (PID `3852653`) en VPS `64.176.21.229`. 100% operativo en `https://chatbot.zgamersa.com`.
- **Siguiente Hito:** Pruebas de campo con comensales reales y monitoreo de tasa de conversión con el nuevo flujo interactivo.

---

### [2026-11-22] 🇨🇱 Migración Oficial de Precios a Escala Real Chilena y Checkout Adaptado
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Precios de Mercado Real en BD:** Migrados los 41 platos del catálogo en SQLite local y VPS a valores comerciales reales de Chile (Bebidas a `$ 1.500`, Alitas a `$ 5.900`, Hamburguesas a `$ 5.500 - $ 6.900`, Combos a `$ 7.500 - $ 8.900`), eliminando cualquier ambigüedad con USD.
  - **Pasarela de Pago Chilena en `/checkout`:** Adaptada la interfaz con métodos locales:
    1. Transferencia Electrónica Directa (**CuentaRUT / BancoEstado / Todos los bancos**).
    2. Tarjeta Débito / Crédito (**Redcompra / Transbank / POS Móvil**).
    3. Efectivo contraentrega con cálculo de vuelto sobre billetes chilenos reales ($10.000 / $20.000).
  - **Despliegue y Validación E2E en VPS Producción:** Desplegado en `https://chatbot.zgamersa.com/menu` y `https://chatbot.zgamersa.com/checkout` (PM2 PID `3861573`).
- **Siguiente Hito:** Pruebas de campo con comensales reales.


---

### [2026-11-22] ⏰ Horarios de Atención Semanal, Mensaje Automático Fuera de Horario y Estado Dinámico de Cocina
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Detección y Corrección de "Cocina Activa":** Se eliminó el texto estático `Cocina Activa` que figuraba siempre en verde en el encabezado de [app/admin/orders/page.tsx](file:///e:/prueba/app/admin/orders/page.tsx).
  - **Sincronización con `HorariosService`:** Se conectó el backend de pedidos (`/api/admin/orders`) con el motor de horarios. El encabezado de **Pedidos en Vivo** ahora refleja con exactitud el estado en tiempo real:
    - Cuando está abierto: `🟢 Cocina Abierta • [Horario]` con pulso verde.
    - Cuando está cerrado: `🔴 Cocina Cerrada (Fuera de Horario)` en rojo/ámbar, acompañado de un banner explicativo y botón directo a `/admin/business`.
  - **Motor de Horarios y Respuestas Automáticas:** Implementado en `config-horarios.json` y `HorariosService` con soporte de zona horaria local (`America/Lima`, `America/Santiago`, `America/Argentina/Buenos_Aires`).
  - **Despliegue Certificado:** Sincronizado en Git y desplegado en VPS `64.176.21.229` (PM2 PID `3890725`).
