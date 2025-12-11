# 🛡️ Cómo agregar ngrok a exclusiones de 360 Total Security

## 🎯 Problema identificado

**360 Total Security** está eliminando `ngrok.exe` porque lo detecta como amenaza potencial.

---

## ✅ SOLUCIÓN: Agregar exclusión permanente

### Método 1: Interfaz gráfica (RECOMENDADO)

1. **Abre 360 Total Security**
   - Doble click en el icono de la bandeja del sistema
   - O busca "360 Total Security" en el menú Inicio

2. **Ve a Configuración**
   - Click en el ícono de **engranaje** (⚙️) arriba a la derecha
   - O click en **"Ajustes"** / **"Settings"**

3. **Busca Exclusiones**
   - Ve a la pestaña **"Protección de virus"** o **"Virus Protection"**
   - Busca **"Lista de confianza"** o **"Trust List"** o **"Whitelist"**
   - Algunas versiones dicen **"Exclusiones"** o **"Exceptions"**

4. **Agregar archivo de confianza**
   - Click en **"Agregar"** o **"Add"**
   - Navega a: `E:\prueba\`
   - Selecciona: **`ngrok.exe`**
   - Click **"Abrir"** y luego **"Aceptar"**

5. **Agregar carpeta completa (opcional pero recomendado)**
   - En la misma sección de exclusiones
   - Click **"Agregar carpeta"** o **"Add Folder"**
   - Selecciona: `E:\prueba\`
   - Esto protege TODO tu proyecto

6. **Guardar cambios**
   - Click **"Aplicar"** o **"OK"**
   - Cierra 360 Total Security

---

### Método 2: Configuración avanzada

Si no encuentras la opción de exclusiones:

1. **Abre 360 Total Security**

2. **Haz click derecho** en el icono de la bandeja del sistema

3. **Busca opciones:**
   - **"Centro de seguridad"** → **"Configuración"**
   - **"Sandbox"** → **"Agregar programa de confianza"**
   - **"Configuración avanzada"** → **"Lista blanca"**

4. **Agrega:**
   ```
   Archivo: E:\prueba\ngrok.exe
   Carpeta: E:\prueba\
   ```

---

### Método 3: Restaurar desde cuarentena

Si 360 ya eliminó ngrok.exe:

1. **Abre 360 Total Security**

2. **Ve a "Cuarentena" o "Quarantine"**
   - Busca en el menú principal
   - O en **"Historial de amenazas"** / **"Threat History"**

3. **Busca ngrok.exe**
   - Debería aparecer en la lista de archivos eliminados
   - Fecha: Hoy o ayer

4. **Restaurar y confiar**
   - Selecciona `ngrok.exe`
   - Click **"Restaurar"** o **"Restore"**
   - Marca **"Agregar a lista de confianza"** o **"Trust this file"**

---

## 🔧 Configuración PM2 para evitar problemas

Mientras tanto, ya actualizamos `ecosystem.config.js` para que:

1. **Verifica si ngrok existe** antes de iniciar
2. **Reinicia automáticamente** si se cae
3. **Guarda logs** para debugging

---

## ⚙️ Alternativa: Desactivar temporalmente

Si no quieres agregar exclusiones ahora:

### Desactivar protección en tiempo real:

1. **Click derecho** en ícono de 360 (bandeja del sistema)
2. **"Desactivar protección"** o **"Pause Protection"**
3. Selecciona duración:
   - 15 minutos
   - 1 hora
   - 4 horas
   - Hasta reiniciar

⚠️ **NO OLVIDES RE-ACTIVARLO** después de trabajar

---

## 📋 Checklist para verificar

Después de agregar exclusiones:

- [ ] ngrok.exe está en la lista de confianza de 360
- [ ] La carpeta E:\prueba\ está excluida (opcional)
- [ ] PM2 puede iniciar ngrok sin problemas
- [ ] 360 no muestra alertas sobre ngrok
- [ ] El túnel ngrok funciona correctamente

### Prueba rápida:
```powershell
# Detener todo
pm2 delete all

# Reiniciar sistema completo
pm2 start ecosystem.config.js

# Esperar 10 segundos y verificar
pm2 list

# Obtener URL de ngrok
Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" | Select-Object -ExpandProperty tunnels | ForEach-Object { $_.public_url }
```

---

## 🆘 Si nada funciona

### Opción A: Cambiar de antivirus
- Windows Defender (gratis, incluido en Windows)
- Bitdefender Free
- Avast Free

### Opción B: Usar alternativa a ngrok
Lee el archivo `ALTERNATIVAS-NGROK.md` para opciones como:
- Cloudflare Tunnel
- LocalTunnel
- Serveo

### Opción C: Configurar 360 en "Modo Gaming"
Algunos antivirus tienen un "Modo Gaming" o "Silent Mode" que reduce las interrupciones:

1. Abre 360 Total Security
2. Busca **"Modo Gaming"** o **"Game Mode"**
3. Actívalo mientras trabajas

---

## 📞 Soporte 360 Total Security

Si necesitas ayuda específica de 360:

- **Web oficial:** https://www.360totalsecurity.com
- **Soporte:** https://www.360totalsecurity.com/en/support/
- **Foro:** https://forums.360totalsecurity.com

---

## ✅ Resumen ejecutivo

**Lo que tienes que hacer:**

1. Abre 360 Total Security
2. Ve a Configuración → Protección de virus → Lista de confianza
3. Agrega `E:\prueba\ngrok.exe`
4. Agrega carpeta `E:\prueba\`
5. Guarda y cierra
6. Reinicia PM2: `pm2 delete all && pm2 start ecosystem.config.js`
7. ¡Listo!

**Tiempo estimado:** 2-3 minutos

**¿Por qué es seguro?**
- Ngrok es una herramienta oficial de desarrollo
- Millones de desarrolladores la usan
- Está en TU proyecto, bajo TU control
- Es necesaria para recibir webhooks de WhatsApp

---

## 🎓 Información adicional

**¿Por qué 360 detecta ngrok como amenaza?**

360 Total Security usa múltiples motores antivirus:
- **360 Cloud Engine** (análisis en la nube)
- **360 QVMII AI Engine** (inteligencia artificial)
- **Bitdefender Engine** (antivirus alemán)
- **Avira Engine** (antivirus alemán)

Cualquiera de estos puede detectar ngrok como:
- **PUA** (Potentially Unwanted Application)
- **HackTool** (Herramienta de hacking)
- **RemoteAdmin** (Acceso remoto)

**Todos son falsos positivos.** Ngrok es 100% legítimo.

---

**¿Dudas?** Pregúntame lo que necesites. Estoy aquí para ayudarte.
