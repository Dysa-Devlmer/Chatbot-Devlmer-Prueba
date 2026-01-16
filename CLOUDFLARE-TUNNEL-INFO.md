# 🌐 Configuración de Cloudflare Tunnel

## 📋 Información del Túnel

**Nombre del túnel:** `pithy-chatbot`

**Tunnel ID:** `870732ff-8a9c-42f9-8e69-1e72fa28555f`

**Fecha de creación:** 2025-12-11T02:09:04Z

**Dominio configurado:** `chatbot.zgamersa.com`

---

## 📁 Archivos de Credenciales

**Ubicación de archivos (NO incluidos en el repositorio):**

```
C:\Users\zeNk0\.cloudflared\cert.pem
C:\Users\zeNk0\.cloudflared\870732ff-8a9c-42f9-8e69-1e72fa28555f.json
```

⚠️ **IMPORTANTE:** Estos archivos contienen credenciales privadas y NO deben compartirse públicamente.

---

## 🔧 Instalación realizada

**Cloudflared instalado vía winget:**
- Versión: `2025.8.1`
- Comando: `winget install Cloudflare.cloudflared`

---

## 🌍 DNS Configurado

**Registro CNAME creado automáticamente:**
- Subdominio: `chatbot.zgamersa.com`
- Apunta a: Túnel Cloudflare `pithy-chatbot`
- ID del túnel: `870732ff-8a9c-42f9-8e69-1e72fa28555f`

---

## 📝 Comandos Ejecutados

### 1. Login a Cloudflare
```bash
cloudflared tunnel login
```

### 2. Crear túnel
```bash
cloudflared tunnel create pithy-chatbot
```

### 3. Configurar DNS
```bash
cloudflared tunnel route dns pithy-chatbot chatbot.zgamersa.com
```

---

## 🚀 Próximos Pasos

1. ✅ Cloudflared instalado
2. ✅ Login exitoso
3. ✅ Túnel creado
4. ✅ DNS configurado
5. ⏳ Crear archivo de configuración (cloudflared-config.yml)
6. ⏳ Probar el túnel
7. ⏳ Integrar con PM2

---

## 🔍 Verificar Túnel

```bash
# Listar todos los túneles
cloudflared tunnel list

# Ver información del túnel
cloudflared tunnel info pithy-chatbot

# Ver rutas DNS configuradas
cloudflared tunnel route dns
```

---

## 📖 Documentación Oficial

- **Cloudflare Tunnel:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- **GitHub:** https://github.com/cloudflare/cloudflared
- **Releases:** https://github.com/cloudflare/cloudflared/releases

---

## 🆚 Comparación con ngrok

| Característica | Cloudflare Tunnel | ngrok |
|----------------|-------------------|-------|
| **Dominio personalizado** | ✅ Gratis | ❌ Pago |
| **Subdominio fijo** | ✅ chatbot.zgamersa.com | ❌ Aleatorio |
| **Detección antivirus** | ✅ Rara | ⚠️ Común |
| **Velocidad** | ✅ Red Cloudflare | ✅ Buena |
| **SSL/TLS** | ✅ Automático | ✅ Automático |
| **Uptime** | ✅ 99.9%+ | ✅ 99%+ |
| **Firewall/DDoS** | ✅ Incluido | ❌ No |
| **Dashboard web** | ✅ Cloudflare Dashboard | ✅ localhost:4040 |
| **Precio** | ✅ Gratis | ✅ Gratis (básico) |

---

**Ventajas de Cloudflare Tunnel:**
1. Dominio personalizado profesional
2. No genera alertas de antivirus
3. Incluye firewall y protección DDoS de Cloudflare
4. URL permanente (no cambia)
5. Más rápido (red global de Cloudflare)

---

_Configuración creada el 2025-12-11_
