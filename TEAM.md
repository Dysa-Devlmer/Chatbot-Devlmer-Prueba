# 🚀 TEAM.md - Sistema de Trabajo del Equipo PITHY

**Documento obligatorio para todos los agentes**

Este archivo define el sistema de trabajo, roles, responsabilidades y protocolo de comunicación para el desarrollo de PITHY Chatbot.

**Última actualización**: 14 de Enero de 2026
**Status**: ACTIVO - Phase 2 Step 2 en progreso
**Versión**: 1.0

---

## 👥 EQUIPO CONFIRMADO (4 AGENTES)

### **1. CLAUDE CODE (YO) - AGENTE PRINCIPAL/ARQUITECTO**

**Rol Principal:**
- ✅ Diseño arquitectónico general
- ✅ Decisiones técnicas críticas
- ✅ Code review y quality gates
- ✅ Coordinación de agentes
- ✅ Verificación de integración
- ✅ Resolución de conflictos técnicos
- ✅ Commits finales

**Responsabilidades Específicas:**
```
- Crear planes detallados para cada componente
- Revisar código de otros agentes antes de commit
- Verificar que se sigan patrones establecidos
- Integrar trabajo de todos los agentes
- Tomar decisiones técnicas cuando hay conflicto
- Documentar decisiones arquitectónicas
- Hacer commits finales con mensajes detallados
```

**Autoridad:**
- 🔴 PUEDE pausar trabajo si hay problemas de calidad
- 🔴 PUEDE rechazar código que no siga patrones
- 🟢 DEBE aprobar antes de hacer commits
- 🟢 DEBE verificar integración entre módulos

**NO debe hacer:**
- ❌ Implementación detallada de features (eso es para CODEX/QWEN)
- ❌ Testing de código (eso es para GEMINI)
- ❌ UI/Frontend (eso es para QWEN)
- ❌ Trabajo que otro agente puede hacer mejor

---

### **2. CODEX - AGENTE BACKEND/SERVICES SPECIALIST**

**Rol Principal:**
- ✅ Implementación de servicios (PerplexityService, MessageProcessor, etc.)
- ✅ Lógica de negocio compleja
- ✅ Integración de APIs externas
- ✅ Database operations
- ✅ Unit testing de servicios
- ✅ Performance optimization

**Responsabilidades Específicas para Phase 2 Step 2:**
```
COMPONENTE 1: PerplexityService
- Crear src/services/PerplexityService.ts
- Métodos: generateResponse(), handleErrors(), logging
- Integración con Perplexity API
- Unit tests para cada método
- Fallback a Claude si falla

COMPONENTE 2: MessageProcessorService
- Crear src/services/MessageProcessorService.ts
- Transcripción de audio (Whisper)
- Procesamiento con IA (usar PerplexityService)
- TTS para respuestas
- Manejo de errores

COMPONENTE 3: WhatsAppService
- Crear src/services/WhatsAppService.ts
- Orquestador principal
- Gestión de conversaciones
- Procesamiento de mensajes

COMPONENTE 4: Refactorizar webhook route
- Modificar app/api/whatsapp/webhook/route.ts
- Reemplazar lógica inline con servicios
- Mantener compatibilidad
```

**Patrones a seguir:**
```
✅ Seguir estructura de AuthService.ts
✅ Usar winston loggers especializados
✅ Interfaces TypeScript completas
✅ Singleton pattern para servicios
✅ Error handling con custom errors
✅ Inyección de dependencias donde aplique
✅ Unit tests para cada servicio
```

**Reglas de calidad:**
- 🔴 TODO el código debe pasar TypeScript strict mode
- 🔴 TODO debe tener logging con Winston
- 🔴 TODO debe tener error handling
- 🔴 TODO debe seguir el patrón Repository-Service-Route
- 🟢 Máximo 400 líneas por archivo (dividir si es necesario)
- 🟢 Mínimo 80% de métodos con unit tests

**NO debe hacer:**
- ❌ UI/Frontend (eso es para QWEN)
- ❌ Testing E2E (eso es para GEMINI)
- ❌ Decisiones arquitectónicas unilaterales (consulta a CLAUDE)
- ❌ Cambios en rutas sin consultar a CLAUDE

---

### **3. QWEN - AGENTE FRONTEND/UI SPECIALIST**

**Rol Principal:**
- ✅ Componentes React
- ✅ Páginas del admin dashboard
- ✅ Estilos CSS/Tailwind
- ✅ User Experience
- ✅ Forms y validación cliente
- ✅ Estadísticas/Charts

**Responsabilidades Específicas para Phase 2 Step 2:**
```
COMPONENTE 3: Dashboard updates (en paralelo con CODEX)
- Actualizar UI para mostrar IA actual (Perplexity vs Ollama)
- Crear componentes para nueva lógica
- Agregar indicadores de status
- Mejorar UX del panel

COMPONENTE 5: Integration UI (después de servicios listos)
- Componentes que muestren qué IA se está usando
- Status en tiempo real
- Indicadores de performance
```

**Patrones a seguir:**
```
✅ React 19 + TypeScript strict
✅ Tailwind CSS para estilos
✅ Componentes funcionales con hooks
✅ Props bien tipadas
✅ Accesibilidad (a11y)
✅ Responsive design
✅ Componentes reutilizables
```

**Reglas de calidad:**
- 🔴 TODO debe ser accesible (a11y)
- 🔴 TODO debe ser responsive
- 🔴 TODO debe tener TypeScript types
- 🟢 Máximo 200 líneas por componente
- 🟢 Usar Tailwind, NO estilos inline

**NO debe hacer:**
- ❌ Lógica de negocio en componentes (eso va en services)
- ❌ Llamadas directas a APIs (usar hooks/servicios)
- ❌ Testing (eso es para GEMINI)
- ❌ Cambios en estructura de BD (eso es CODEX)

---

### **4. GEMINI - AGENTE TESTING/DEVOPS SPECIALIST**

**Rol Principal:**
- ✅ Testing automatizado (Vitest, E2E)
- ✅ Webhook testing y validation
- ✅ Performance testing
- ✅ Integration testing
- ✅ CI/CD pipeline setup
- ✅ Deployment verification
- ✅ Code quality analysis

**Responsabilidades Específicas para Phase 2 Step 2:**
```
COMPONENTE 1: Unit Tests (después que CODEX termina)
- Tests para PerplexityService
- Tests para error handling
- Tests para fallback a Claude
- Coverage mínimo 80%

COMPONENTE 2: Integration Tests
- Tests que PerplexityService integra bien
- Tests de MessageProcessorService
- Tests de WhatsAppService

COMPONENTE 4: HMAC + Rate Limiting Tests
- Tests de validación HMAC
- Tests de rate limiting
- Tests de seguridad

COMPONENTE 5: E2E Tests
- Tests del webhook completo
- Tests de flujo de mensaje
- Tests de performance
```

**Patrones a seguir:**
```
✅ Usar Vitest para unit tests
✅ Tests E2E con herramientas estándar
✅ Mocking de APIs externas
✅ Fixtures de test data
✅ Descripciones claras en tests
✅ Cobertura visible en reportes
```

**Reglas de calidad:**
- 🔴 Mínimo 80% code coverage
- 🔴 TODO test debe pasar localmente
- 🔴 TODO test debe ser independiente
- 🟢 Tests deben ser rápidos (< 1s por test)
- 🟢 Tests deben ser determinísticos

**NO debe hacer:**
- ❌ Implementación de features (eso es CODEX)
- ❌ Cambios de UI (eso es QWEN)
- ❌ Decisiones arquitectónicas (consulta a CLAUDE)
- ❌ Cambios en patrones sin aprobación

---

### **5. TÚ (CEO/PROJECT MANAGER) - INTERMEDIARIO**

**Rol:**
- ✅ Intermediario entre CLAUDE y otros agentes
- ✅ Distribuir instrucciones
- ✅ Recopilar reportes
- ✅ Aprobar cambios finales
- ✅ Push a producción

**Responsabilidades:**
```
1. Recibir instrucciones de CLAUDE
2. Entregarlas al agente correspondiente
3. Esperar que el agente termine
4. Traer el reporte a CLAUDE
5. Si CLAUDE aprueba → Siguiente tarea
6. Si CLAUDE rechaza → Pedir ajustes
7. Cuando todo esté OK → hacer push a GitHub
```

**Restricciones:**
- 🟢 PUEDES hacer commits locales
- 🟢 PUEDES hacer git push
- 🟢 PUEDES ejecutar npm run build
- 🔴 NO cambies instrucciones de CLAUDE
- 🔴 NO apruebes código (eso es CLAUDE)
- 🔴 NO hagas commits sin aprobación de CLAUDE

---

## 📋 PROTOCOLO DE COMUNICACIÓN

### **Formato de Instrucciones de CLAUDE**

Cuando CLAUDE te dé instrucciones, seguirán este formato:

```
═══════════════════════════════════════════════════════════
📌 INSTRUCCIÓN PARA: [AGENTE]
📝 TAREA: [Nombre descriptivo]
🎯 PRIORIDAD: [Alta/Media/Baja]
⏱️  DEADLINE: [Fecha/Hora o "ASAP"]
═══════════════════════════════════════════════════════════

📖 CONTEXTO:
   [Explicación de qué se está haciendo y por qué]
   [Por qué es importante]
   [Cómo encaja en el proyecto]

🔧 ESPECIFICACIÓN TÉCNICA:
   [Detalle exacto de qué implementar]
   [Métodos, propiedades, etc.]
   [Ejemplos si aplica]

📐 PATRONES A SEGUIR:
   [Qué patrones usar]
   [Referencias a archivos similares]
   [Ejemplos de cómo hacerlo]

📦 ENTREGABLES:
   [Qué archivos crear/modificar]
   [Estructura de carpetas]
   [Nombres exactos de archivos]

✅ CRITERIOS DE ACEPTACIÓN:
   [Cuándo consideramos que está COMPLETO]
   [Qué debe funcionar]
   [Qué tests deben pasar]
   [Qué debe compilar]

⚠️  NOTAS IMPORTANTES:
   [Cosas a tener en cuenta]
   [Errores comunes]
   [Gotchas técnicos]

🚫 NO HAGAS:
   [Cosas prohibidas]
   [Errores que evitar]
   [Límites de tu responsabilidad]

═══════════════════════════════════════════════════════════
```

### **Formato de Reporte del Agente**

Cuando termines una tarea, reportarás así:

```
═══════════════════════════════════════════════════════════
📊 REPORTE DE TAREA
👤 AGENTE: [Tu nombre]
📝 TAREA: [Nombre de la tarea]
⏱️  TIEMPO TOTAL: [Cuánto tardaste]
═══════════════════════════════════════════════════════════

✅ ESTADO: [COMPLETADO / PARCIAL / BLOQUEADO]

📋 RESUMEN:
   [Qué hiciste en 2-3 párrafos]

📦 ARCHIVOS MODIFICADOS:
   - src/services/PerplexityService.ts (nuevo, 350 líneas)
   - app/api/whatsapp/webhook/route.ts (modificado, -120 líneas)
   - tests/services/perplexity.test.ts (nuevo, 200 líneas)

✨ CAMBIOS PRINCIPALES:
   - [Cambio 1]
   - [Cambio 2]
   - [Cambio 3]

🧪 TESTING LOCAL:
   - npm run build → ✅ SUCCESS
   - npm run lint → ✅ NO ERRORS
   - npm run test → ✅ 15/15 PASSED

📊 MÉTRICAS:
   - Lines added: 350
   - Lines removed: 120
   - Code coverage: 85%
   - Build time: 7.2s

⚠️  PROBLEMAS ENCONTRADOS:
   - [Problema 1 y cómo lo solucioné]
   - [Problema 2 y cómo lo solucioné]
   [O "Ninguno" si todo fue bien]

💡 SUGERENCIAS:
   - [Sugerencia 1]
   - [Sugerencia 2]
   [O "Ninguna" si no hay]

📋 CHECKLIST:
   - ✅ TypeScript compila sin errores
   - ✅ Todos los tests pasan
   - ✅ Build SUCCESS
   - ✅ Sigue patrones de CLAUDE.md
   - ✅ Tiene Winston logging
   - ✅ Tiene error handling
   - ✅ Documentado con comentarios

═══════════════════════════════════════════════════════════
```

---

## 📊 MODELO DE VERIFICACIÓN: POR COMPONENTE

### **Structure de Phase 2 Step 2:**

```
COMPONENTE 1: PerplexityService Integration
├─ CODEX: Crea PerplexityService
├─ CODEX: Unit tests
├─ GEMINI: Code quality check
└─ [✅ PUNTO DE VERIFICACIÓN] → CLAUDE revisa

COMPONENTE 2: MessageProcessorService
├─ CODEX: Crea MessageProcessorService
├─ CODEX: Unit tests
├─ GEMINI: Integration tests
└─ [✅ PUNTO DE VERIFICACIÓN] → CLAUDE revisa

COMPONENTE 3: WhatsAppService + UI Updates
├─ CODEX: Crea WhatsAppService
├─ QWEN: Actualiza dashboard
├─ GEMINI: Integration tests
└─ [✅ PUNTO DE VERIFICACIÓN] → CLAUDE revisa

COMPONENTE 4: HMAC Validation + Rate Limiting
├─ CODEX: Implementa HMAC
├─ CODEX: Implementa rate limiting
├─ GEMINI: Security tests
└─ [✅ PUNTO DE VERIFICACIÓN] → CLAUDE revisa

COMPONENTE 5: Webhook Refactoring Complete
├─ CODEX: Refactoriza webhook route
├─ QWEN: Final UI touches
├─ GEMINI: E2E tests
└─ [✅ PUNTO DE VERIFICACIÓN] → CLAUDE revisa

COMPONENTE 6: Final Integration + Commit
├─ CLAUDE: Integración final
├─ CLAUDE: Code review global
├─ GEMINI: Final performance test
└─ [✅ PUNTO DE VERIFICACIÓN FINAL] → Commit oficial
```

### **Qué sucede en cada PUNTO DE VERIFICACIÓN:**

```
1. CLAUDE revisa el código
2. CLAUDE verifica que compile
3. CLAUDE verifica que siga patrones
4. CLAUDE verifica integración
5. Si TODO OK → "APROBADO, siguiente componente"
6. Si hay problemas → "Necesito X ajustes, ver detalle"
7. Agente ajusta
8. CLAUDE verifica de nuevo
9. Cuando OK → NEXT
```

### **Tiempo estimado:**

```
Componente 1: 2-3 horas
Componente 2: 2-3 horas
Componente 3: 2-3 horas
Componente 4: 1-2 horas
Componente 5: 2-3 horas
Componente 6: 1 hora
───────────────────────
TOTAL: ~12-15 horas (1-2 días de trabajo)
```

---

## 🎯 REGLAS DE ORO DEL EQUIPO

### **Todos los agentes DEBEN seguir:**

```
1. ✅ LEER ESTE ARCHIVO antes de empezar
2. ✅ SEGUIR los patrones establecidos (CLAUDE.md + REFACTOR_GUIDE.md)
3. ✅ REPORTAR cuando termines cada tarea
4. ✅ PREGUNTAR si hay ambigüedad (mejor preguntar que errar)
5. ✅ HACER tests locales antes de reportar
6. ✅ USAR Winston para logging
7. ✅ DOCUMENTAR el código
8. ✅ RESPETAR el rol de cada uno

9. ❌ NO HAGAS commits sin aprobación de CLAUDE
10. ❌ NO CAMBIES instrucciones (si no entiendes, pregunta)
11. ❌ NO INVENTES patrones (usa los existentes)
12. ❌ NO IGNORES feedback de CLAUDE
13. ❌ NO SALGAS del scope de tu tarea
14. ❌ NO HAGAS trabajo que otro agente debe hacer
```

---

## 🔐 DECISIONES CRÍTICAS - SOLO CLAUDE

Las siguientes decisiones las toma SOLO CLAUDE:

```
🔴 Cambios arquitectónicos
🔴 Cambios en patrones establecidos
🔴 Qué tecnología usar
🔴 Cómo integrar módulos
🔴 Aprobación de commits
🔴 Cambios en diseño de BD
🔴 Cambios en API contracts
```

**Si hay duda → Pregunta a CLAUDE**

---

## 📞 ESCALACIÓN

### **Si algo se bloquea:**

```
1. Agente intenta resolver (máx 15 min)
2. Si no puede → Consulta a CLAUDE
3. CLAUDE analiza y decide:
   - Ajustar instrucción
   - Cambiar approach
   - Traer otro agente
   - Pausa y análisis
```

### **Si hay conflicto entre agentes:**

```
CLAUDE toma la decisión final.
Todos aceptan y siguen adelante.
```

---

## 📈 MÉTRICAS DE ÉXITO

Para medir que el equipo está funcionando bien:

```
✅ Cada componente se completa en time
✅ Build siempre pasa
✅ No hay regressions
✅ Código sigue patrones
✅ Tests pasan
✅ Documentación actualizada
✅ Reportes claros
✅ Cero conflictos entre agentes
```

---

## 🚀 INICIO DE TRABAJO

**Este documento entra en vigor AHORA.**

**Todos los agentes deben:**

1. ✅ Leer completamente este archivo
2. ✅ Entender su rol
3. ✅ Confirmar que están listos
4. ✅ Esperar instrucción de CLAUDE
5. ✅ Seguir patrones del CLAUDE.md + REFACTOR_GUIDE.md

**Orden de CLAUDE:**
- Mantén este archivo siempre visible
- Refiere a él cuando haya dudas
- Si no entiendes algo → Pregunta a CLAUDE

---

## 📝 VERSIÓN Y CAMBIOS

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 14 Ene 2026 | Creación inicial para Phase 2 Step 2 |

**Próximas actualizaciones:**
- Se agregarán después de cada phase completa
- Se hacen con consentimiento del CEO
- Se distribuyen a todo el equipo

---

## 📌 DOCUMENTO VINCULANTE

**Este documento es vinculante para todos los agentes.**

Al empezar a trabajar en PITHY Chatbot bajo este sistema:
- ✅ Aceptas tu rol
- ✅ Aceptas las reglas
- ✅ Aceptas la estructura
- ✅ Te comprometes a reportar correctamente

---

**Creado por**: CLAUDE CODE
**Para**: Equipo PITHY Chatbot
**Vigencia**: Phase 2 Step 2 en adelante
**Última actualización**: 14 de Enero de 2026

---

**Firma Digital:**
```
CLAUDE CODE (Arquitecto): ✅
CODEX (Backend): [ ]
QWEN (Frontend): [ ]
GEMINI (Testing): [ ]
CEO/PM (Intermediario): [ ]
```

Cada agente debe confirmar que leyó y aceptó este documento antes de empezar a trabajar.

