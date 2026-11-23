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

---

### [2026-11-22] 💎 Auditoría Integral del Sistema: Multidivisa, Transcripción de Audio WhatsApp, Paletas de Marca y Roles
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Reparación de Notas de Voz en WhatsApp:** El bot dejó de responder audios porque en el VPS el script `whisper-transcribe-enhanced.py` fallaba al no contar con `faster_whisper` ni `ffmpeg`. Se implementó transcripción multimodal nativa directa con Gemini (`gemini-2.5-flash` / `inlineData` base64 de audio Ogg Opus) en `GeminiService.transcribeAudio` y `AIService.transcribeAudio`, además de instalar `ffmpeg` en el VPS.
  - **Botón "Inicio" / Dashboard en Navegación:** Añadido el botón de acceso directo a `/admin` en la barra horizontal superior de `AdminHeader` y en `AdminSidebar`, y el logo ahora enlaza a la raíz del panel administrativo `/admin`. El título del logo se volvió dinámico según el nombre del negocio configurado en la base de datos.
  - **Eliminación del Icono Inoperativo de Videollamada:** Se removió el botón `<Video />` sin función en `/admin/inbox`, conservando únicamente las acciones de llamada telefónica y enlace directo a WhatsApp.
  - **Paletas de Marca Disponibles para Arriendo (Multi-Tenant):** Se conectaron las tarjetas de temas en `/admin/settings` con persistencia en tiempo real en la base de datos (`AdminProfile.accentColor`), `localStorage` e inyección de variables CSS (`--brand-primary`) con indicador visual interactivo `✓ Activa`.
  - **Control de Roles & Permisos:** Se erradicaron datos falsos mockeados (`Pierre Arturo`, `cocina@churus.com`) en la pestaña de Roles de Configuración. Ahora muestra la sesión real del administrador autenticado desde `AdminProfile` junto a los perfiles operativos del local (Estación Cocina KDS, Repartidor Delivery y Operador de Inbox).
  - **Monedas y Precios Reales (Perú, Chile, Argentina):** Se validó que al cambiar el país en `/admin/business` el catálogo completo de 41 platos sincronice con los precios de mercado reales (PEN, CLP, ARS), evitando que se muestren precios de soles como dólares o miles de soles por desajuste de denominación.
  - **Despliegue Certificado en Producción:** Compilado exitosamente en VPS `64.176.21.229` y reiniciado en PM2 (PID `3910658`). 100% operativo en `https://chatbot.zgamersa.com`.

---

### [2026-11-22] 📱 Optimización Integral de UI/UX Mobile (Frontend Architect & Design Visionary)
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Eliminación Total del Desbordamiento Horizontal (Overflow-X Leak):** Se solucionó la franja blanca lateral en pantallas móviles pequeñas (320px - 390px). Se aseguraron reglas estrictas de `overflow-x: hidden; max-width: 100vw;` en `html`, `body`, `app/admin/layout.tsx` y `AdminHeader`.
  - **Header Móvil Ergonómico y Compacto:** Ajustado el tamaño del logo, padding responsive (`px-2.5 sm:px-6`), truncado seguro del nombre del negocio, y ocultación del icono de chevron en móvil para garantizar que el avatar de usuario y botones de acción nunca se corten en el borde derecho.
  - **Barra de Navegación Inferior Móvil (`MobileBottomNav`):** Rediseñada con tipografía de alta fidelidad, padding adaptado y texto de longitud controlada para que la pestaña `Mi Local` y el resto de accesos nunca se corten ni salten de línea. Se unificó el estado activo con el color de marca (naranja cálido) y se añadió soporte de `safe-area-inset-bottom`.
  - **Tipografía Nítida & Font-Smoothing:** Se incorporaron propiedades de optimización de legibilidad y suavizado antialiasing en `app/globals.css`, eliminando el efecto pixelado/pesado que se observaba en emuladores o pantallas táctiles.
  - **Dashboard y Catálogo 100% Dinámicos:** Se eliminaron los textos residuales hardcodeados (`Churu's Comida Rápida`, `en S/.`) en `/admin` y `/admin/products`, reemplazándolos con los datos reales del negocio (`business.name`, `business.currencySymbol`).
  - **Banner de Horarios y Filtros Táctiles:** En `/admin/orders`, el banner de cocina cerrada se compactó para móviles con botones accesibles, y los filtros de estado cuentan con desplazamiento táctil horizontal fluido.
  - **Despliegue Certificado en Producción:** Compilado con 0 errores en las 51 rutas y reiniciado en PM2 (PID `273823`) en VPS `64.176.21.229`. Sincronizado en `https://chatbot.zgamersa.com`.

---

### [2026-11-23] 📞 WhatsApp Calling API Nativa de Meta & Agente de Voz Autónomo
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Estudio & Adopción de la Calling API de Meta:** Implementado el canal oficial de llamadas VoIP de WhatsApp Cloud API, permitiendo a los clientes llamar directamente al presionar el icono de teléfono en el chat de WhatsApp.
  - **Desarrollo de `WhatsAppCallingService` ([WhatsAppCallingService.ts](file:///e:/prueba/src/services/WhatsAppCallingService.ts)):**
    - Intercepta eventos de llamada entrante en el webhook (`calls`).
    - Integra validación con `HorariosService`: Si llaman fuera de horario comercial, rechaza la llamada con elegancia y envía inmediatamente una respuesta interactiva al chat con el enlace a la carta digital `/menu`.
    - Si el local está abierto, negocia y acepta la sesión VoIP (`acceptCall`).
  - **Desarrollo de `VoiceAgentService` ([VoiceAgentService.ts](file:///e:/prueba/src/services/VoiceAgentService.ts)):**
    - Prompt conversacional adaptado para audio humano: respuestas breves (2-3 oraciones), sin markdown, pronunciación explícita de divisas en palabras y confirmación paso a paso.
    - Acceso a carta en tiempo real vía SQLite y function calling para crear órdenes reales con `ReservationService.createReservation()`.
    - Disparo automático de mensaje al chat de WhatsApp con el link de seguimiento `/tracking?order=ORD-XXXX` en cuanto se cierra el pedido por llamada.
  - **Ampliación de `GeminiService`:** Incorporado método de baja latencia `generateRawText` para turnos rápidos de diálogo oral.
  - **Actualización de Webhook:** [app/api/whatsapp/webhook/route.ts](file:///e:/prueba/app/api/whatsapp/webhook/route.ts) enruta automáticamente payloads de llamadas hacia `WhatsAppCallingService`.
  - **Pruebas Automatizadas:** Creado y ejecutado `scripts/test_whatsapp_calling.ts` validando detección de llamadas, formateo de catálogo oral y procesamiento conversacional.
  - **Documentación en Segundo Cerebro:** Creado documento maestro [[WHATSAPP_CALLING_API_VOICE_AGENT|📞 Arquitectura Técnica: WhatsApp Calling API & Agente de Voz en Tiempo Real]].
  - **Despliegue Certificado en Producción:** Compilado exitosamente en VPS `64.176.21.229` (52 rutas estáticas/dinámicas) y reiniciado en PM2 (PID `383974`). 100% operativo en `https://chatbot.zgamersa.com`.
  - **Sincronización Bidireccional de Perfil WhatsApp Business (Meta Graph API):** Conectado el endpoint `/api/admin/business` con `POST /v21.0/{PHONE_NUMBER_ID}/whatsapp_business_profile` para que al guardar cambios en el panel administrativo se actualicen de inmediato la descripción, dirección física, categoría comercial y enlaces a la carta digital directamente en el perfil oficial de WhatsApp que ven los clientes. Desplegado y verificado en VPS (PM2 PID `404055`).
  - **Gestión de Display Name en Meta & Carga Nativa de Foto de Perfil:**
    - Solicitado el cambio de Display Name a `Churu's Comida Rápida` en Meta WhatsApp Manager para la línea `+56 9 6541 9765` (quedando En revisión para certificación de Meta).
    - Creado el endpoint `POST /api/admin/business/profile-picture` con la API de Carga Reanudable de Meta (`/uploads` + binary stream + `whatsapp_business_profile`) e integrado el módulo de carga de foto con selector JPG/PNG y vista previa en `/admin/business` ("Mi Local"). Desplegado en VPS (PM2 PID `412723`).
  - **Reporte Ejecutivo SaaS para el CEO:** Redactado el protocolo maestro de arriendo y onboarding en 4 fases ([[REPORTE_CEO_ONBOARDING_NUEVA_EMPRESA_SAAS]]) para activar nuevos clientes en menos de 15 minutos sin tocar código.

---

### [2026-11-23] 🛡️ Resolución de Incidente 502 en Login, Refactorización de Chatbot y Optimización de Mi Perfil
- **Agente:** Antigravity (Google DeepMind)
- **Actividades:**
  - **Diagnóstico y Corrección de Error 502 Bad Gateway en Autenticación (`/api/auth/callback/credentials`):**
    - Se identificó en `/var/log/nginx/error.log` el fallo `upstream sent too big header`. NextAuth intentaba serializar la imagen en base64 del avatar del administrador en la cookie `__Secure-next-auth.session-token`, excediendo el límite de cabeceras HTTP de Nginx.
    - Se modificó [src/lib/auth.ts](file:///e:/prueba/src/lib/auth.ts) para evitar que los strings en base64 se almacenen en el JWT de sesión; la imagen se sirve exclusivamente vía base de datos / endpoint `/api/admin/profile`.
    - Se reforzó la configuración de Nginx en `/etc/nginx/sites-available/chatbot` con `proxy_buffer_size 128k; proxy_buffers 4 256k; proxy_busy_buffers_size 256k; client_max_body_size 30M;`.
    - Se verificó la prueba de login en producción obteniendo respuesta exitosa `HTTP/2 200 OK` con cookie compacta de ~400 bytes.
  - **Refactorización del Flujo de Pedidos en Gemini (`GeminiService.ts` & `orders/route.ts`):**
    - Erradicación de duplicidad y textos tipo spam: la IA ya no imprime dos veces la lista de platos en la toma del pedido.
    - Cumplimiento de regla de negocio para tracking: al confirmar el pedido ("Sí"), el bot envía un acuse de recibo limpio y educado sin enlaces de tracking prematuros.
    - El link oficial de seguimiento en vivo y boleta electrónica se despacha automáticamente cuando el personal de cocina presiona "Iniciar Preparación" (`confirmed`).
  - **Limpieza de Catálogo y Carta Digital:**
    - Desactivado el producto individual `"Adicional Salchibroaster"` de la tabla `Product` en SQLite (local y VPS) para eliminar relleno innecesario del menú.
    - La opción "+ S/. 5.00 conviértelo en Salchibroaster" se preservó exclusivamente como modificador interactivo para la categoría Broaster en el drawer táctil.
  - **Rediseño Profesional de "Mi Perfil & Seguridad" (`/admin/settings`):**
    - Depuración del menú de usuario en `AdminHeader.tsx`: conservados únicamente *Mi Perfil*, *Seguridad & Contraseña* y *Cerrar Sesión*.
    - Formulario con datos reales sincronizados en base de datos (`AdminProfile`).
    - Compresión client-side con Canvas HTML5 a 400x400 px en JPEG de alta resolución (~60 KB), eliminando bloqueos en "Subiendo..." y permitiendo subidas instantáneas desde cualquier smartphone o cámara 4K.
  - **Despliegue Certificado en Producción:** Compilado exitosamente en VPS `64.176.21.229` (53 rutas estáticas/dinámicas) y reiniciado en PM2 (PID `805090`). Operativo en `https://chatbot.zgamersa.com`.

---

### [2026-11-23] 🚀 Automatización del Aprovisionamiento SaaS de Nuevos Clientes (Multi-Tenant)
- **Agente:** Antigravity (Backend, Sistemas & Seguridad)
- **Actividades:**
  - **Diseño de Arquitectura Multi-Tenant:** Implementado el modelo *Single Codebase, Database-per-tenant* para alojar decenas de empresas aisladas en el VPS actual consumiendo solo ~55 MB por cliente.
  - **Script de Sembrado Dinámico ([scripts/seed-tenant.js](file:///e:/prueba/scripts/seed-tenant.js)):** Inicializa la base de datos exclusiva del cliente (`prisma/tenants/{tenant}.db`), genera el `AdminProfile` con contraseña segura encriptada, configura el `BusinessProfile` y precarga plantillas de catálogo completas según el rubro (`fast_food`, `pizzeria`, `retail`).
  - **Script Maestro de Aprovisionamiento en 1 Comando ([scripts/provision-new-tenant.sh](file:///e:/prueba/scripts/provision-new-tenant.sh)):** Automatiza en menos de 60 segundos la creación de base de datos, sembrado, configuración de Nginx con buffers 128k/256k, certificado SSL y proceso dedicado en PM2.
  - **Aprovisionador Remoto en Python ([scripts/provision-tenant-remote.py](file:///e:/prueba/scripts/provision-tenant-remote.py)):** Permite lanzar aprovisionamientos desde la consola local conectándose directamente al VPS.
  - **Guía Maestra en Segundo Cerebro:** Publicada la especificación completa en [[SAAS_TENANT_PROVISIONING_GUIDE]].
  - **Despliegue y Validación:** Scripts cargados y verificados en `/var/www/chatbot/` en el VPS `64.176.21.229`. Repo git actualizado.
