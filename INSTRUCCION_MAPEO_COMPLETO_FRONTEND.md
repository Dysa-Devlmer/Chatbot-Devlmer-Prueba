# 📋 INSTRUCCIÓN: MAPEO COMPLETO DEL FRONTEND

**Para**: QWEN (Frontend Developer)
**De**: CLAUDE (Technical Architect)
**Fecha**: 16 de Enero de 2026
**Asunto**: Documentar estructura completa del frontend

---

## 🎯 OBJETIVO

Crear un documento completo que muestre:
- ✅ Todas las páginas y rutas del frontend
- ✅ Estructura visual de cada página
- ✅ Botones, links, tabs, componentes
- ✅ Endpoints que cada página consume
- ✅ Cómo verificar que frontend ↔ backend están sincronizados

---

## 📋 QUÉ NECESITO QUE DOCUMENTES

### Por Cada Página, Incluir:

#### 1. **Información General**
```
Nombre: Chat Principal
URL: https://chatbot.zgamersa.com/
Acceso: Público (sin autenticación)
Descripción: Interfaz principal para usuarios finales
```

#### 2. **Estructura Visual**
```
Layout:
  ├─ Header
  │  ├─ Logo
  │  ├─ Título
  │  └─ Menu (si aplica)
  ├─ Main Content
  │  ├─ Chat messages area
  │  ├─ Input field
  │  └─ Send button
  └─ Footer (si aplica)
```

#### 3. **Componentes React**
```
Componentes usados:
  ├─ ClientHome.tsx (componente principal)
  ├─ ChatMessage.tsx (mensaje individual)
  ├─ MessageInput.tsx (input area)
  └─ [Otros componentes]

Ubicación: app/ o components/
```

#### 4. **Endpoints Consumidos**
```
API Calls:
  ├─ GET /api/health → Verificar servidor está vivo
  ├─ POST /api/messages → Enviar mensaje
  └─ GET /api/conversations/{id} → Obtener histórico
```

#### 5. **Estados/Data**
```
Datos utilizados:
  ├─ mensajes (array de Message)
  ├─ currentConversation (Conversation)
  └─ isLoading (boolean)
```

#### 6. **Verificación de Sincronización**
```
Cómo verificar que funciona:
  1. Abre https://chatbot.zgamersa.com/
  2. Abre DevTools (F12) → Network tab
  3. Escribe un mensaje
  4. Verifica que:
     - POST /api/messages → 200 OK
     - Respuesta tiene: { success: true, messageId: "..." }
     - Mensaje aparece en chat
  5. Si alguno de estos falla → hay desincronización
```

---

## 📑 LISTA DE PÁGINAS A DOCUMENTAR

### PÚBLICAS (Sin autenticación)

```
[ ] 1. Chat Principal
     URL: https://chatbot.zgamersa.com/
     Archivo: app/page.tsx (o app/components/ClientHome.tsx)

[ ] 2. Login
     URL: https://chatbot.zgamersa.com/login
     Archivo: app/login/page.tsx
```

### ADMIN (Con autenticación)

```
[ ] 3. Admin Dashboard
     URL: https://chatbot.zgamersa.com/admin
     Archivo: app/admin/page.tsx

[ ] 4. Inbox (Conversaciones)
     URL: https://chatbot.zgamersa.com/admin/inbox
     Archivo: app/admin/inbox/page.tsx

[ ] 5. Analytics (Gráficos y Métricas)
     URL: https://chatbot.zgamersa.com/admin/analytics
     Archivo: app/admin/analytics/page.tsx

[ ] 6. AI Status
     URL: https://chatbot.zgamersa.com/admin/ai
     Archivo: app/admin/ai/page.tsx

[ ] 7. Settings
     URL: https://chatbot.zgamersa.com/admin/settings
     Archivo: app/admin/settings/page.tsx

[ ] 8. Tags
     URL: https://chatbot.zgamersa.com/admin/tags
     Archivo: app/admin/tags/page.tsx

[ ] 9. Learning
     URL: https://chatbot.zgamersa.com/admin/learning
     Archivo: app/admin/learning/page.tsx

[ ] 10. Scheduled Messages
      URL: https://chatbot.zgamersa.com/admin/scheduled
      Archivo: app/admin/scheduled/page.tsx
```

---

## 🔧 FORMATO PARA CADA PÁGINA

Crea un archivo llamado: `FRONTEND_MAPA_COMPLETO.md`

Estructura:

```markdown
# 🗺️ MAPA COMPLETO DEL FRONTEND

## 📍 PÁGINA 1: Chat Principal

### Información General
- **URL**: https://chatbot.zgamersa.com/
- **Acceso**: Público
- **Archivo**: app/page.tsx
- **Componente**: ClientHome.tsx

### Estructura Visual
[DESCRIPCIÓN ASCII DE LAYOUT]

### Componentes React Utilizados
- ClientHome.tsx (línea X)
- ChatMessage.tsx (línea Y)
- MessageInput.tsx (línea Z)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| POST | /api/messages | Enviar mensaje | { success, messageId } |
| GET | /api/health | Verificar servidor | { status: "ok" } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/
2. F12 → Network
3. Escribe "Hola"
4. Verifica POST /api/messages → 200
5. Verifica que respuesta aparece en chat

### Screenshots o Notas Adicionales
[Describe lo que ves]
```

---

## 💻 HERRAMIENTAS QUE TE SERÁN ÚTILES

### Para Ver Estructura de Archivos
```bash
# Ver árbol de componentes
tree app/ --include="*.tsx" | head -50

# Ver componentes del admin
ls -la app/admin/*/
```

### Para Ver Endpoints en Network
1. Abre https://chatbot.zgamersa.com/
2. Presiona F12 (DevTools)
3. Ve a Network tab
4. Realiza una acción (enviar mensaje, etc.)
5. Verás qué endpoints se llamaron

### Para Encontrar Archivos
```bash
# Buscar archivos por nombre
find app/ -name "*Chat*.tsx"
find app/admin -name "page.tsx"

# Buscar imports de componentes
grep -r "import.*ClientHome" app/
```

---

## 📊 TABLA RESUMIDA

Cuando termines, debería verse algo así:

| # | Página | URL | Archivo | Componentes | Endpoints |
|---|--------|-----|---------|-------------|-----------|
| 1 | Chat | `/` | app/page.tsx | ClientHome, ChatMessage | POST /api/messages |
| 2 | Login | `/login` | app/login/page.tsx | LoginForm | POST /api/auth |
| 3 | Admin | `/admin` | app/admin/page.tsx | Dashboard | GET /api/admin/* |
| 4 | Inbox | `/admin/inbox` | app/admin/inbox/page.tsx | ConversationList, ChatBox | GET /api/admin/conversations |
| 5 | Analytics | `/admin/analytics` | app/admin/analytics/page.tsx | Charts, Stats | GET /api/admin/analytics |
| ... | ... | ... | ... | ... | ... |

---

## ✅ CHECKLIST

Cuando termines de documentar cada página, verifica:

- [ ] **Nombre de página** está claramente identificado
- [ ] **URL completa** está documentada
- [ ] **Archivo(s) fuente** están listados (pages.tsx, componentes, etc.)
- [ ] **Componentes React** están listados con números de línea (si es posible)
- [ ] **Estructura visual** está descrita (header, content, footer, etc.)
- [ ] **Todos los endpoints** que consume están listados
- [ ] **Método HTTP** está claro (GET, POST, PUT, DELETE)
- [ ] **Respuesta esperada** está documentada
- [ ] **Cómo verificar** está paso a paso
- [ ] **Al menos 1 screenshot mental** o descripción visual

---

## 🎯 POR QUE ESTO ES IMPORTANTE

Cuando esto esté documentado, CLAUDE (yo) podrá:

1. **Verificar sincronización** - Confirmar que todo endpoint tiene su componente React
2. **Encontrar bugs** - Si falta un endpoint, sabré dónde buscar
3. **Auditar seguridad** - Revisar que cada endpoint requiere autenticación si es necesario
4. **Optimizar** - Saber qué está siendo usado y qué no
5. **Mantener** - Cuando haya cambios, saber exactamente qué actualizar

---

## 📝 ENTREGABLE FINAL

Cuando termines, envía:

**Archivo**: `FRONTEND_MAPA_COMPLETO.md`

**Contiene**:
- ✅ Todas las páginas documentadas
- ✅ Estructura visual clara
- ✅ Componentes listados
- ✅ Endpoints documentados
- ✅ Cómo verificar cada uno
- ✅ Tabla resumida
- ✅ Screenshots (mentales o reales)

---

## ⏱️ ESTIMADO

- Documentación inicial: 2-3 horas
- Verificación de endpoints: 1-2 horas
- Total: **3-5 horas máximo**

---

## 📞 SI TIENES DUDAS

Preguntame:
- "¿Dónde encuentro el componente X?"
- "¿Qué endpoint usa la página Y?"
- "¿Cómo sé si un endpoint está siendo consumido?"

Estaré aquí para ayudarte.

---

**Instrucción creada por**: CLAUDE
**Responsable**: QWEN (Frontend Developer)
**Prioridad**: NORMAL (no bloquea funcionalidad)
**Estimado**: 3-5 horas
**Status**: Pendiente ejecución

---

*Esta documentación será invaluable para mantener el proyecto organizado y verificar que frontend y backend estén sincronizados.*
