# PITHY Chatbot

**"Asistente IA profesional. Respuestas precisas. Disponibilidad total."**

Sistema de chatbot inteligente para WhatsApp Business con soporte para múltiples proveedores de IA (Ollama local o Perplexity en la nube).

Desarrollado por **Pierre Arturo Benites Solier (Devlmer)** | [zgamersa.com](https://zgamersa.com)

## 🚀 Características

- **Múltiples Proveedores de IA**: Utiliza Ollama (local y gratuito) o Perplexity (en la nube con modelos avanzados)
- **WhatsApp Business Integration**: Conexión directa con Meta Business API
- **Panel de Administración**: Interfaz web para gestionar conversaciones
- **Modo Automático/Manual**: Alterna entre respuestas automáticas y manuales
- **Base de Datos**: SQLite con Prisma ORM
- **Tiempo Real**: Actualización en vivo de conversaciones

## 🔧 Puertos del Sistema

| Servicio | Puerto | Acceso |
|----------|--------|--------|
| Next.js Server | **7847** | http://localhost:7847 |
| Panel Admin | **7847** | http://localhost:7847/admin |
| ngrok Dashboard | **4847** | http://localhost:4847 |
| Ollama API | **11434** | http://localhost:11434 |

## 🧠 Proveedores de IA

El sistema soporta múltiples proveedores de inteligencia artificial:

### Ollama (Local)
- **Ventajas**: Gratuito, privacidad completa, sin costos de API
- **Configuración**: Requiere instalación local de Ollama
- **Modelos populares**: Llama 3.2, Mistral, Phi-3, Gemma 2

### Perplexity AI (Nube)
- **Ventajas**: Modelos de vanguardia, conocimientos recientes, menor latencia
- **Configuración**: Requiere API key de Perplexity
- **Modelos disponibles**: Llama 3.1 Sonar, Mixtral, y otros modelos avanzados
- **Documentación**: [PERPLEXITY-INTEGRATION.md](PERPLEXITY-INTEGRATION.md)

Puede cambiar entre proveedores desde el panel de administración en la pestaña "IA".

## 📦 Requisitos

- Node.js 18+
- Ollama instalado
- ngrok configurado
- Cuenta de WhatsApp Business

## ⚡ Inicio Rápido

### 1. Instalación

```bash
cd E:\prueba
npm install
```

### 2. Configuración

Copia el archivo `.env.example` a `.env.local` y configura tus credenciales:

```env
WHATSAPP_TOKEN=tu_token_de_whatsapp
WHATSAPP_PHONE_NUMBER_ID=tu_id_de_telefono
WHATSAPP_WEBHOOK_TOKEN=tu_token_secreto
```

### 3. Iniciar Sistema

**Opción 1 - Inicio Simple (Recomendado):**
```
Doble clic en INICIO-SIMPLE.bat
```

**Opción 2 - Manual:**
```powershell
# Terminal 1: Iniciar Ollama
ollama serve

# Terminal 2: Iniciar Next.js
npm run dev

# Terminal 3: Iniciar ngrok
.\ngrok.exe http 7847
```

**Opción 3 - Servicios de Windows:**
```powershell
Start-Service PITHY-Ollama
Start-Service PITHY-Server
Start-Service PITHY-Ngrok
```

### 4. Acceder al Sistema

- **Panel de Administración**: http://localhost:7847/admin
- **ngrok Dashboard**: http://localhost:4847
- **API Health Check**: http://localhost:7847/api/health

## 🌐 Configuración de Webhook

1. Inicia ngrok y obtén la URL pública
2. Ve a [Meta for Developers](https://developers.facebook.com/apps)
3. Configura el webhook:
   - **URL**: `https://tu-url-de-ngrok.app/api/whatsapp/webhook`
   - **Token de verificación**: El valor de `WHATSAPP_WEBHOOK_TOKEN`

## 📁 Estructura del Proyecto

```
E:\prueba\
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   │   └── whatsapp/     # WhatsApp webhook
│   ├── admin/            # Panel de administración
│   └── components/       # Componentes React
├── prisma/               # Database schema
├── src/                  # Source code
│   └── lib/             # Utilidades y servicios
├── logs/                # Logs del sistema
└── scripts/             # Scripts de PowerShell
```

## 🛠️ Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo (puerto 7847) |
| `npm run build` | Construye la aplicación para producción |
| `npm start` | Inicia el servidor en modo producción (puerto 7847) |

## 📊 Panel de Administración

El panel de administración permite:

- Ver todas las conversaciones activas
- Responder manualmente a mensajes
- Alternar entre modo automático/manual por conversación
- Ver estadísticas en tiempo real
- Historial completo de mensajes

## 🔒 Seguridad

- Los tokens y credenciales están en `.env.local` (no incluido en Git)
- Validación de tokens en cada webhook request
- Base de datos local SQLite

## 🐛 Troubleshooting

### El servidor no inicia en puerto 7847
```powershell
# Verificar qué proceso está usando el puerto
netstat -ano | findstr :7847

# Detener proceso si es necesario
Stop-Process -Id <PID> -Force
```

### ngrok no se conecta
```powershell
# Verificar configuración
.\ngrok.exe config check

# Ver logs
Get-Content logs\ngrok.log
```

### Ollama no responde
```powershell
# Verificar que Ollama está corriendo
Get-Process ollama

# Reiniciar Ollama
ollama serve
```

## 📝 Desarrollo

### Agregar un nuevo modelo de IA

```bash
ollama pull <nombre-del-modelo>
```

### Actualizar la base de datos

```bash
npx prisma migrate dev
npx prisma generate
```

## 🤝 Contribuir

Este es un proyecto privado y propietario.
No se aceptan contribuciones externas sin autorización previa.

## 👤 Autor

**Pierre Arturo Benites Solier (Devlmer)**
- **RUT:** 25.484.075-0
- **Rol:** CEO & Fundador
- **Email:** bpier@zgamersa.com
- **LinkedIn:** [linkedin.com/in/ulmersolier](https://linkedin.com/in/ulmersolier)
- **Sitio Web:** [zgamersa.com](https://zgamersa.com)
- **WhatsApp:** +56 9 6541 9765

## 📞 Contacto

- **Email General:** info@zgamersa.com
- **Email CEO:** bpier@zgamersa.com
- **WhatsApp:** +56 9 6541 9765
- **Chatbot:** [chatbot.zgamersa.com](https://chatbot.zgamersa.com)

## 📄 Licencia

Copyright © 2024 Pierre Arturo Benites Solier (Devlmer)
Licencia Propietaria - Todos los derechos reservados

Ver LICENSE.txt para más detalles.

---

**Última actualización**: Diciembre 2024
**Versión**: 0.1.0
**Puerto Next.js**: 7847
**Cloudflare Tunnel**: https://chatbot.zgamersa.com

---

💼 **Creado y desarrollado por Pierre Arturo Benites Solier (Devlmer)**
🌐 **zgamersa.com** | 📧 **bpier@zgamersa.com** | 📱 **+56 9 6541 9765**
