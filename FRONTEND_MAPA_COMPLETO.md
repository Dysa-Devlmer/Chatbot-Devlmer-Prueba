# 🗺️ MAPA COMPLETO DEL FRONTEND

## 📍 PÁGINA 1: Chat Principal

### Información General
- **URL**: https://chatbot.zgamersa.com/
- **Acceso**: Público
- **Archivo**: app/page.tsx
- **Componente**: No hay componente específico, es una página estática de bienvenida

### Estructura Visual
```
Layout:
  ├─ Header
  │  ├─ Logo
  │  ├─ Título
  │  └─ Menu (si aplica)
  ├─ Main Content
  │  ├─ Bienvenida
  │  ├─ Descripción del servicio
  │  └─ Links de contacto
  └─ Footer (si aplica)
```

### Componentes React Utilizados
- No hay componentes específicos para chat en esta página

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/health | Verificar servidor está vivo | { status: "ok" } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/
2. F12 → Network
3. Verifica que la página carga correctamente
4. Verifica GET /api/health → 200

### Screenshots o Notas Adicionales
Página de bienvenida estática sin funcionalidad de chat activa.

---

## 📍 PÁGINA 2: Login

### Información General
- **URL**: https://chatbot.zgamersa.com/login
- **Acceso**: Público
- **Archivo**: app/login/page.tsx
- **Componente**: LoginForm

### Estructura Visual
```
Layout:
  ├─ Header
  │  ├─ Logo
  │  └─ Título
  ├─ Login Form
  │  ├─ Username/Email field
  │  ├─ Password field
  │  ├─ Submit button
  │  └─ Forgot password link
  └─ Footer
```

### Componentes React Utilizados
- LoginForm (en la misma página)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| POST | /api/auth/login | Autenticar usuario | { success, token, user } |
| GET | /api/auth/csrf | Obtener token CSRF | { csrfToken } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/login
2. F12 → Network
3. Intenta iniciar sesión
4. Verifica POST /api/auth/login → 200
5. Verifica que recibe token de autenticación

### Screenshots o Notas Adicionales
Formulario de inicio de sesión con validación de credenciales.

---

## 📍 PÁGINA 3: Admin Dashboard

### Información General
- **URL**: https://chatbot.zgamersa.com/admin
- **Acceso**: Autenticado
- **Archivo**: app/admin/page.tsx
- **Componente**: Dashboard

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  │  ├─ Logo
  │  ├─ Navigation
  │  ├─ Quick Actions
  │  └─ User Menu
  ├─ Main Content
  │  ├─ Welcome Card
  │  ├─ Metrics Cards
  │  │  ├─ Conversations
  │  │  ├─ Messages
  │  │  ├─ Active Users
  │  │  └─ Response Time
  │  └─ Recent Activity
  └─ Floating AI Assistant Button
```

### Componentes React Utilizados
- AdminHeader (app/admin/components/AdminHeader.tsx)
- MetricCard (componente reutilizable)
- ActivityFeed (componente reutilizable)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/stats | Métricas del dashboard | { conversations, messages, users, responseTime } |
| GET | /api/admin/profile | Info del perfil admin | { profile } |
| GET | /api/admin/notifications | Notificaciones | { notifications, unreadCount } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin
2. F12 → Network
3. Verifica que carga las métricas
4. Verifica GET /api/admin/stats → 200
5. Verifica que los datos se muestran en las cards

### Screenshots o Notas Adicionales
Dashboard con métricas clave y navegación a otras secciones del panel de administración.

---

## 📍 PÁGINA 4: Inbox (Conversaciones)

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/inbox
- **Acceso**: Autenticado
- **Archivo**: app/admin/inbox/page.tsx
- **Componente**: ConversationList

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Filters Bar
  │  ├─ Search
  │  ├─ Status Filter
  │  └─ Date Range
  ├─ Conversation List
  │  ├─ Individual Conversation Cards
  │  │  ├─ User Name
  │  │  ├─ Last Message
  │  │  ├─ Timestamp
  │  │  └─ Status Badge
  │  └─ Pagination
  └─ Floating AI Assistant Button
```

### Componentes React Utilizados
- ConversationCard (app/admin/inbox/components/ConversationCard.tsx)
- FilterBar (app/admin/inbox/components/FilterBar.tsx)
- MessagePreview (app/admin/inbox/components/MessagePreview.tsx)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/conversations | Lista de conversaciones | { conversations[], pagination } |
| GET | /api/admin/conversations/{id} | Detalles de conversación | { conversation, messages[] } |
| PUT | /api/admin/conversations/{id}/status | Cambiar estado | { success, updatedStatus } |
| GET | /api/admin/tags | Tags disponibles | { tags[] } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/inbox
2. F12 → Network
3. Verifica que carga la lista de conversaciones
4. Verifica GET /api/admin/conversations → 200
5. Verifica que los datos se muestran correctamente

### Screenshots o Notas Adicionales
Lista de conversaciones con posibilidad de filtrar y ver detalles de cada una.

---

## 📍 PÁGINA 5: Analytics (Gráficos y Métricas)

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/analytics
- **Acceso**: Autenticado
- **Archivo**: app/admin/analytics/page.tsx
- **Componente**: AnalyticsDashboard

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Time Filters
  │  ├─ 24 Hours
  │  ├─ 7 Days
  │  ├─ 30 Days
  │  └─ Custom Range
  ├─ Charts Area
  │  ├─ Line Chart (Messages over time)
  │  ├─ Bar Chart (Messages by hour)
  │  ├─ Pie Chart (Response times)
  │  └─ Stats Cards
  └─ Data Export Options
```

### Componentes React Utilizados
- TimeFilter (app/admin/analytics/components/TimeFilter.tsx)
- LineChart (reutilizable chart component)
- BarChart (reutilizable chart component)
- StatCard (reutilizable component)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/analytics | Datos para gráficos | { chartsData, stats } |
| GET | /api/admin/analytics/export | Exportar datos | CSV/JSON data |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/analytics
2. F12 → Network
3. Verifica que carga los datos para gráficos
4. Verifica GET /api/admin/analytics → 200
5. Verifica que los gráficos se renderizan correctamente

### Screenshots o Notas Adicionales
Dashboard de analytics con filtros temporales y visualizaciones de datos.

---

## 📍 PÁGINA 6: AI Status

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/ai
- **Acceso**: Autenticado
- **Archivo**: app/admin/ai/page.tsx
- **Componente**: AIManagement

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Tabs
  │  ├─ Estado (AIStatus)
  │  └─ Configuración (AIConfig)
  ├─ Content Area
  │  ├─ AI Provider Status
  │  ├─ Model Selection
  │  ├─ Configuration Options
  │  └─ Test Connection
  └─ Floating AI Assistant Button
```

### Componentes React Utilizados
- AIStatus (app/admin/ai/components/AIStatus.tsx)
- AIConfig (app/admin/ai/components/AIConfig.tsx)
- AIIndicator (app/admin/components/AIIndicator.tsx)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/ai-status | Estado actual de IA | { provider, status, model, responseTime } |
| POST | /api/admin/ai-config | Guardar configuración | { success, message } |
| GET | /api/admin/ai-config | Obtener configuración | { config } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/ai
2. F12 → Network
3. Verifica que carga el estado de IA
4. Verifica GET /api/admin/ai-status → 200
5. Verifica que los datos se muestran correctamente

### Screenshots o Notas Adicionales
Página para gestionar y monitorear los proveedores de IA (Ollama, Perplexity).

---

## 📍 PÁGINA 7: Settings

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/settings
- **Acceso**: Autenticado
- **Archivo**: app/admin/settings/page.tsx
- **Componente**: SettingsPage

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Sidebar Navigation
  │  ├─ Perfil
  │  ├─ Seguridad
  │  ├─ Notificaciones
  │  └─ Apariencia
  ├─ Content Area
  │  ├─ Profile Settings
  │  ├─ Security Options
  │  ├─ Notification Preferences
  │  └─ Appearance Settings
  └─ Floating AI Assistant Button
```

### Componentes React Utilizados
- ProfileSettings (app/admin/settings/components/ProfileSettings.tsx)
- SecuritySettings (app/admin/settings/components/SecuritySettings.tsx)
- NotificationSettings (app/admin/settings/components/NotificationSettings.tsx)
- AppearanceSettings (app/admin/settings/components/AppearanceSettings.tsx)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/profile | Obtener perfil | { profile } |
| PUT | /api/admin/profile | Actualizar perfil | { success, updatedProfile } |
| PUT | /api/admin/profile/password | Cambiar contraseña | { success, message } |
| GET | /api/admin/profile/notifications | Obtener notificaciones | { preferences } |
| PUT | /api/admin/profile/notifications | Actualizar notificaciones | { success, message } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/settings
2. F12 → Network
3. Verifica que carga la información del perfil
4. Verifica GET /api/admin/profile → 200
5. Verifica que los cambios se guardan correctamente

### Screenshots o Notas Adicionales
Página de configuración con múltiples secciones para personalizar la experiencia del administrador.

---

## 📍 PÁGINA 8: Tags

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/tags
- **Acceso**: Autenticado
- **Archivo**: app/admin/tags/page.tsx
- **Componente**: TagsManager

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Action Bar
  │  ├─ Search
  │  └─ New Tag Button
  ├─ Tags Grid/List
  │  ├─ Individual Tag Cards
  │  │  ├─ Name
  │  │  ├─ Color
  │  │  ├─ Icon
  │  │  └─ Actions (Edit, Delete)
  │  └─ Pagination
  └─ New/Edit Tag Modal
```

### Componentes React Utilizados
- TagCard (app/admin/tags/components/TagCard.tsx)
- TagModal (app/admin/tags/components/TagModal.tsx)
- ColorPicker (reutilizable component)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/tags | Lista de tags | { tags[] } |
| POST | /api/admin/tags | Crear nuevo tag | { success, tag } |
| PUT | /api/admin/tags/{id} | Actualizar tag | { success, updatedTag } |
| DELETE | /api/admin/tags/{id} | Eliminar tag | { success, message } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/tags
2. F12 → Network
3. Verifica que carga la lista de tags
4. Verifica GET /api/admin/tags → 200
5. Verifica que las operaciones CRUD funcionan correctamente

### Screenshots o Notas Adicionales
Gestión de etiquetas para clasificar conversaciones y usuarios.

---

## 📍 PÁGINA 9: Learning

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/learning
- **Acceso**: Autenticado
- **Archivo**: app/admin/learning/page.tsx
- **Componente**: LearningManager

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Filters
  │  ├─ Date Range
  │  ├─ Category
  │  └─ Rating
  ├─ Learning Entries
  │  ├─ User Query
  │  ├─ Bot Response
  │  ├─ Rating/Feedback
  │  └─ Actions
  └─ Statistics Panel
```

### Componentes React Utilizados
- LearningEntry (app/admin/learning/components/LearningEntry.tsx)
- FeedbackRating (app/admin/learning/components/FeedbackRating.tsx)
- StatsPanel (app/admin/learning/components/StatsPanel.tsx)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/learning | Entradas de aprendizaje | { entries[], stats } |
| POST | /api/admin/learning/feedback | Enviar feedback | { success, message } |
| GET | /api/admin/learning/stats | Estadísticas | { stats } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/learning
2. F12 → Network
3. Verifica que carga las entradas de aprendizaje
4. Verifica GET /api/admin/learning → 200
5. Verifica que los datos se muestran correctamente

### Screenshots o Notas Adicionales
Panel para revisar y mejorar las respuestas del bot basadas en interacciones anteriores.

---

## 📍 PÁGINA 10: Scheduled Messages

### Información General
- **URL**: https://chatbot.zgamersa.com/admin/scheduled
- **Acceso**: Autenticado
- **Archivo**: app/admin/scheduled/page.tsx
- **Componente**: ScheduledMessages

### Estructura Visual
```
Layout:
  ├─ AdminHeader
  ├─ Action Bar
  │  ├─ Filters
  │  ├─ Search
  │  └─ New Scheduled Message Button
  ├─ Messages List
  │  ├─ Individual Scheduled Messages
  │  │  ├─ Recipient
  │  │  ├─ Message Content
  │  │  ├─ Scheduled Time
  │  │  ├─ Status
  │  │  └─ Actions (Edit, Cancel)
  │  └─ Pagination
  └─ Schedule Message Modal
```

### Componentes React Utilizados
- ScheduledMessageCard (app/admin/scheduled/components/ScheduledMessageCard.tsx)
- ScheduleModal (app/admin/scheduled/components/ScheduleModal.tsx)
- DateTimePicker (reutilizable component)

### Endpoints Consumidos
| Método | Endpoint | Propósito | Respuesta Esperada |
|--------|----------|-----------|-------------------|
| GET | /api/admin/scheduled | Mensajes programados | { messages[] } |
| POST | /api/admin/scheduled | Programar nuevo mensaje | { success, message } |
| PUT | /api/admin/scheduled/{id} | Actualizar mensaje | { success, updatedMessage } |
| DELETE | /api/admin/scheduled/{id} | Cancelar mensaje | { success, message } |

### Cómo Verificar Sincronización
1. Abre https://chatbot.zgamersa.com/admin/scheduled
2. F12 → Network
3. Verifica que carga la lista de mensajes programados
4. Verifica GET /api/admin/scheduled → 200
5. Verifica que las operaciones CRUD funcionan correctamente

### Screenshots o Notas Adicionales
Panel para gestionar mensajes programados a usuarios.

---

## 📊 TABLA RESUMIDA

| # | Página | URL | Archivo | Componentes | Endpoints |
|---|--------|-----|---------|-------------|-----------|
| 1 | Chat Principal | `/` | app/page.tsx | ClientHome | GET /api/health |
| 2 | Login | `/login` | app/login/page.tsx | LoginForm | POST /api/auth/login |
| 3 | Admin | `/admin` | app/admin/page.tsx | Dashboard | GET /api/admin/stats |
| 4 | Inbox | `/admin/inbox` | app/admin/inbox/page.tsx | ConversationList | GET /api/admin/conversations |
| 5 | Analytics | `/admin/analytics` | app/admin/analytics/page.tsx | AnalyticsDashboard | GET /api/admin/analytics |
| 6 | AI Config | `/admin/ai` | app/admin/ai/page.tsx | AIManagement | GET /api/admin/ai-status |
| 7 | Settings | `/admin/settings` | app/admin/settings/page.tsx | SettingsPage | GET /api/admin/profile |
| 8 | Tags | `/admin/tags` | app/admin/tags/page.tsx | TagsManager | GET /api/admin/tags |
| 9 | Learning | `/admin/learning` | app/admin/learning/page.tsx | LearningManager | GET /api/admin/learning |
| 10 | Scheduled | `/admin/scheduled` | app/admin/scheduled/page.tsx | ScheduledMessages | GET /api/admin/scheduled |

---

## 🔄 VERIFICACIÓN DE SINCRONIZACIÓN

### Componentes Frontend vs Backend Endpoints

1. **Autenticación**: Todas las páginas bajo `/admin` requieren autenticación
2. **Endpoints disponibles**: Cada página tiene endpoints correspondientes en `/api/admin/`
3. **Consistencia de datos**: Los tipos de datos entre frontend y backend son consistentes
4. **Manejo de errores**: Las páginas implementan manejo adecuado de errores de API

### Issues Identificados

1. **Dropdown no funcional**: El dropdown de "Modelo" en `/admin/ai` no se abre al hacer clic
2. **Inconsistencia en visualización de estado**: La página muestra "UNKNOWN" y "Verificando..." simultáneamente
3. **Feedback visual insuficiente**: Algunas acciones no muestran estado de carga

### Recomendaciones

1. Implementar manejo adecuado de eventos para el dropdown en `/admin/ai`
2. Revisar la lógica de estados en el componente de estado de IA
3. Añadir estados de carga y feedback visual para operaciones asíncronas
4. Mejorar accesibilidad con roles ARIA y etiquetas adecuadas