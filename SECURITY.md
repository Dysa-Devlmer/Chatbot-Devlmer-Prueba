# 🛡️ Política de Seguridad & Divulgación Responsable (Vulnerability Disclosure)
**PITHY Chatbot — Enterprise Security Guidelines**

*Última actualización: 24 de Noviembre de 2026*  
*Equipo de Seguridad:* `seguridad@zgamersa.com`

---

## 1. Compromiso de Seguridad
La plataforma **PITHY Chatbot** está diseñada e implementada bajo las mejores prácticas de ciberseguridad industrial y directrices **OWASP (Open Web Application Security Project)**. Protegemos rigurosamente la integridad de las transacciones, la privacidad de los comensales y la disponibilidad de los servicios en producción.

---

## 2. Controles de Seguridad Activos

### A. Autenticación y Criptografía
* **Cifrado de Contraseñas:** Hashing robusto con `bcrypt` y salt dinámico para todas las cuentas de administración.
* **Protección de Sesiones:** Tokens JWT firmados con algoritmos criptográficos y cookies seguras con flags `HttpOnly`, `SameSite=Lax` y `Secure`.
* **Verificación Criptográfica de Webhooks:** Todo evento entrante desde la API de Meta se valida rigurosamente contra la firma de cabecera `X-Hub-Signature-256` utilizando `HMAC SHA-256` y el App Secret oficial.

### B. Seguridad de Red y Puertos
* **Aislamiento de Puertos Locales:** Los entornos de desarrollo y servicios internos operan obligatoriamente en el **puerto 7847**. Queda expresamente restringida la exposición de servicios en puertos no autorizados.
* **Hardening de Producción VPS (`64.176.21.229`):**
  - Servidor web Next.js gestionado con **PM2** en modo cluster/fork.
  - Proxy reverso **Nginx** con certificados SSL TLS 1.3 de grado bancario.
  - Ocultamiento de cabeceras de servidor (`server_tokens off;`).
  - Cabeceras de seguridad estrictas:
    - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
    - `X-Content-Type-Options: nosniff`
    - `X-Frame-Options: SAMEORIGIN`
    - `Referrer-Policy: strict-origin-when-cross-origin`
    - `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`

### C. Protección de Datos y Prevención de Abusos
* **Defensa contra Relay / Spam:** Endpoints de envío de mensajes (`/api/whatsapp/send`) protegidos con autenticación obligatoria y límites de tasa (Rate Limiting).
* **Integridad Financiera:** Cálculo de precios unitarios y subtotales realizado estrictamente en servidor para evitar cualquier manipulación maliciosa de precios desde el cliente web.
* **Validación de Carga de Archivos:** Verificación binaria de *Magic Bytes* en imágenes (JPEG/PNG) para prevenir ejecución de código remoto o polyglots maliciosos.

---

## 3. Divulgación Responsable de Vulnerabilidades
Agradecemos la colaboración de la comunidad de seguridad y de investigadores éticos. Si descubres una vulnerabilidad potencial de seguridad en nuestro sistema:

1. **Notificación Confidencial:** Envía un reporte detallado a **`seguridad@zgamersa.com`**. Por favor, incluye pasos de reproducción claros o prueba de concepto (PoC).
2. **Prohibición de Daño:** No explotes la vulnerabilidad más allá de lo necesario para verificar su existencia. No accedas a datos de clientes ni degrades el rendimiento del sistema.
3. **Plazo de Respuesta:** Nuestro equipo acusará recibo en un plazo no mayor a **24 horas** y trabajará en la mitigación inmediata.

Agradecemos su compromiso con la seguridad de nuestra comunidad.
