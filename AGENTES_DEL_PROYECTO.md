# 👥 AGENTES DEL PROYECTO - QUIÉN HACE QUÉ

**Para**: CEO (Estructura de equipo)
**Fecha**: 16 de Enero de 2026
**Asunto**: Roles de agentes y responsabilidades

---

## 🎯 LOS 4 AGENTES DEL EQUIPO

El proyecto PITHY Chatbot está siendo desarrollado por un equipo especializado de 4 agentes:

### 1️⃣ **CLAUDE** - Architect Principal
```
Especialidad: Arquitectura general, refactorización, decisiones técnicas
Responsabilidades:
  ✅ Diseño arquitectónico general
  ✅ Definir patrones de código
  ✅ Refactorización y limpieza de código
  ✅ Decisiones de tecnología
  ✅ Coordinación entre componentes
  ✅ Code review y validación
  ✅ Documentación técnica
  ✅ Gestión de dependencias

Lo que VE:
  ✓ Estructura completa del proyecto
  ✓ Backend (API routes, servicios, repositorios)
  ✓ Base de datos (Prisma schema)
  ✓ Infraestructura (middleware, seguridad)
  ✓ Integración general

Lo que NO ve (delegado a otros):
  ✗ Detalles específicos del Frontend UI
  ✗ CSS y estilos
  ✗ Componentes React detallados
  ✗ Testing específico

ROL EN ESTE PROYECTO:
  • Responsable de la arquitectura backend
  • Coordinador general
  • Validador de calidad
  • Escritor de documentación

---

### 2️⃣ **QWEN** - Frontend Developer (UI/UX)
```
Especialidad: React, componentes, estilos, interfaz de usuario
Responsabilidades:
  ✅ Desarrollo de componentes React
  ✅ CSS y Tailwind styling
  ✅ Diseño de interfaz (UI/UX)
  ✅ Interactividad con el usuario
  ✅ Responsive design
  ✅ Components y layouts
  ✅ State management (React Hooks)
  ✅ Validación del lado cliente

Lo que VE:
  ✓ Componentes React (.tsx)
  ✓ Estilos CSS y Tailwind
  ✓ Interfaces del usuario
  ✓ Inputs y formularios
  ✓ Visualización de datos
  ✓ Diseño responsivo
  ✓ User experience

Lo que NO ve (delegado a otros):
  ✗ API endpoints
  ✗ Base de datos
  ✗ Lógica de negocio
  ✗ Seguridad
  ✗ Autenticación

ROL EN ESTE PROYECTO:
  • Desarrollador del Frontend
  • Responsable de la interfaz visual
  • Encargado de CSS y componentes
  • **← DEBE ARREGLAR EL PROBLEMA DE COLORES EN /admin/ai**

---

### 3️⃣ **CODEX** - Backend Developer (Logic & APIs)
```
Especialidad: API routes, servicios, lógica de negocio, integración
Responsabilidades:
  ✅ Desarrollo de API routes
  ✅ Servicios y lógica de negocio
  ✅ Integración con bases de datos
  ✅ Integración con servicios externos (IA)
  ✅ Webhooks (WhatsApp)
  ✅ Autenticación y autorización
  ✅ Validación de datos
  ✅ Error handling

Lo que VE:
  ✓ API endpoints (/api/*)
  ✓ Servicios (Perplexity, MessageProcessor, WhatsApp)
  ✓ Lógica de negocio
  ✓ Integración con IA
  ✓ Validaciones Zod
  ✓ Base de datos (Prisma)
  ✓ Webhooks

Lo que NO ve (delegado a otros):
  ✗ Frontend (componentes React)
  ✗ CSS y estilos
  ✗ Interfaz de usuario
  ✗ Diseño visual

ROL EN ESTE PROYECTO:
  • Desarrollador del Backend
  • Responsable de API routes y servicios
  • Encargado de integración con IA
  • Responsable del webhook de WhatsApp

---

### 4️⃣ **GEMINI** - QA & Testing (Validación)
```
Especialidad: Testing, validación, calidad, E2E testing
Responsabilidades:
  ✅ E2E testing (72 test cases)
  ✅ Validación de funcionalidades
  ✅ Pruebas de integración
  ✅ Reporte de bugs
  ✅ Validación de requerimientos
  ✅ Testing de seguridad
  ✅ Documentación de tests
  ✅ Verificación post-merge

Lo que VE:
  ✓ Test cases completos
  ✓ Cobertura del código
  ✓ Integración end-to-end
  ✓ Comportamiento del sistema completo
  ✓ Bugs y problemas
  ✓ Validación de requisitos

Lo que NO ve (delegado a otros):
  ✗ Implementación de features nuevas
  ✗ Modificación de código base
  ✗ Decisiones arquitectónicas

ROL EN ESTE PROYECTO:
  • QA Engineer
  • Validador de funcionalidades
  • Reportero de bugs
  • Responsable de E2E testing

---

## 📊 MATRIZ DE RESPONSABILIDADES

```
Área                    CLAUDE   QWEN   CODEX   GEMINI
─────────────────────────────────────────────────────────
Arquitectura             ✅       ✗       ✗       ✗
Backend/API              ✅       ✗       ✅       ✗
Frontend/React           ✗        ✅      ✗       ✗
Estilos/CSS             ✗        ✅      ✗       ✗
Base de Datos           ✅       ✗       ✅       ✗
Seguridad               ✅       ✗       ✅       ✗
Testing                 ✗        ✗       ✗       ✅
Integración IA          ✅       ✗       ✅       ✗
WhatsApp Webhook        ✅       ✗       ✅       ✗
Code Review             ✅       ✓       ✓       ✓
Documentación           ✅       ✓       ✓       ✓
─────────────────────────────────────────────────────────

✅ = Principal responsable
✓ = Colabora o revisa
✗ = No participa
```

---

## 🔴 PROBLEMA IDENTIFICADO: UI/Estilos oscuros en /admin/ai

### Qué está sucediendo:

**Ubicación**: `https://chatbot.zgamersa.com/admin/ai`

**Problema**: Texto negro sobre fondo azul marino → **ILEGIBLE**

**Causa raíz**: Conflicto de colores en el layout del admin

**Archivos afectados**:
```
app/admin/layout.tsx (línea 9)
  backgroundColor: '#0f172a' (Azul marino oscuro)

app/admin/ai/page.tsx (línea 11)
  bg-gray-50 (Gris claro)

Conflicto: El componente AIStatus y AIConfig esperan
un fondo blanco (bg-white) pero el layout padre tiene
fondo azul marino oscuro (#0f172a)
```

---

## 📋 INSTRUCCIÓN FORMAL PARA QWEN (Frontend Developer)

**Para**: QWEN (Frontend Developer)
**De**: CLAUDE (Architect)
**Priority**: 🔴 ALTA
**Status**: Necesita reparación inmediata

---

### INSTRUCCIÓN: Arreglar colores en página /admin/ai

#### PROBLEMA ESPECÍFICO
Página: https://chatbot.zgamersa.com/admin/ai
Síntoma: Texto negro ilegible sobre fondo azul marino
Severidad: 🔴 CRÍTICA (UI completamente ilegible)

#### ROOT CAUSE
```
Archivo: app/admin/layout.tsx (línea 9)
  backgroundColor: '#0f172a' (azul marino oscuro)

Causa: El fondo oscuro del layout padre genera contraste
       negativo con los componentes hijos que esperan
       fondos claros (bg-gray-50, bg-white)

Componentes afectados:
  • app/admin/ai/components/AIStatus.tsx (bg-white)
  • app/admin/ai/components/AIConfig.tsx (bg-white)
  • app/admin/ai/page.tsx (bg-gray-50)
```

#### SOLUCIÓN

**Opción A: Cambiar el fondo del layout (RECOMENDADO)**

Modificar: `app/admin/layout.tsx` (línea 9)

```typescript
// ANTES:
<div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>

// DESPUÉS:
<div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
```

**Ventajas**:
- ✅ Consistente con Tailwind (bg-gray-50)
- ✅ Mejor contraste
- ✅ Texto legible
- ✅ Compatible con todos los componentes

**Opción B: Cambiar el texto y bordes**

Si prefieres mantener el fondo oscuro (NO RECOMENDADO):

Modificar: `app/admin/ai/components/AIStatus.tsx`
```typescript
// Cambiar:
<div className="bg-white rounded-lg shadow p-6 mb-6">
// Por:
<div className="bg-gray-900 text-white rounded-lg shadow p-6 mb-6">
```

**Desventajas**:
- ❌ Requiere cambios en múltiples componentes
- ❌ Más mantenimiento
- ❌ Inconsistente con diseño general

#### PASOS A EJECUTAR

1. **Abre el archivo**:
   ```
   app/admin/layout.tsx
   ```

2. **Localiza la línea 9**:
   ```typescript
   <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
   ```

3. **Cambia el color**:
   ```typescript
   <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb' }}>
   ```

4. **Guarda el archivo**

5. **Compila**:
   ```bash
   npm run build
   ```

6. **Verifica**:
   - Abre: https://chatbot.zgamersa.com/admin/ai
   - Verifica que el texto sea legible
   - Comprueba todos los componentes
   - Verifica responsive design

#### VERIFICACIÓN POST-ARREGLO

- [ ] Texto de la página /admin/ai es legible
- [ ] El fondo es consistente
- [ ] Los componentes AIStatus y AIConfig se ven bien
- [ ] No hay conflictos de contraste
- [ ] El layout se ve profesional
- [ ] Responsive design funciona
- [ ] Build compila sin errores

#### ARCHIVOS A REVISAR (Opcional)

Estos archivos están OK pero pueden revisar si hay otros problemas de color:
- `app/admin/inbox/page.tsx`
- `app/admin/analytics/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/tags/page.tsx`
- `app/admin/components/AdminHeader.tsx`

---

## 👨‍💻 FLUJO DE TRABAJO DEL EQUIPO

```
1. CLAUDE (Yo)
   └─ Define arquitectura
   └─ Crea estructura base
   └─ Establece patrones

2. QWEN (Frontend)
   └─ Implementa componentes React
   └─ Aplica estilos CSS/Tailwind ← **DEBE ARREGLAR ESTO**
   └─ Crea interfaces
   └─ Testea en navegador

3. CODEX (Backend)
   └─ Implementa API routes
   └─ Crea servicios
   └─ Integra con IA
   └─ Maneja webhooks

4. GEMINI (QA)
   └─ Realiza E2E testing
   └─ Valida funcionalidades
   └─ Reporta bugs
   └─ Verifica calidad

5. CLAUDE (Yo)
   └─ Code review
   └─ Valida arquitectura
   └─ Aprueba o rechaza
   └─ Documenta

6. REPETIR ciclo para siguiente feature
```

---

## 🎯 RESUMEN

### Quién ve el FRONTEND:
- **QWEN** (Frontend Developer) - VE el código React, CSS, componentes
- **GEMINI** (QA) - PRUEBA la interfaz desde el navegador
- **CLAUDE** (Yo) - REVISO el código frontend

### Quién ve el BACKEND:
- **CODEX** (Backend Developer) - VE el código de API, servicios, BD
- **GEMINI** (QA) - PRUEBA los endpoints desde E2E tests
- **CLAUDE** (Yo) - REVISO el código backend

### El problema de colores en /admin/ai:
- **RESPONSABLE**: QWEN (Frontend Developer)
- **DEBE ARREGLAR**: El backgroundColor en app/admin/layout.tsx
- **TIENE INSTRUCCIONES ARRIBA** ↑

---

## 📧 PRÓXIMOS PASOS

1. ✅ CLAUDE da instrucción formal a QWEN (HECHO)
2. ⏳ QWEN arregla el problema de colores
3. ⏳ QWEN compila y verifica
4. ⏳ GEMINI valida en navegador
5. ⏳ CLAUDE revisa el cambio
6. ✅ Problema resuelto

---

**Documento creado por**: CLAUDE
**Responsable Frontend**: QWEN
**Responsable Backend**: CODEX
**Responsable QA**: GEMINI
**Coordinador**: CLAUDE

**Status**: Instrucción enviada a QWEN para reparación inmediata
