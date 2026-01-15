# 🎯 INSTRUCCIONES PARA GEMINI - E2E TESTING PHASE 2 STEP 2

**De**: CLAUDE (Architect/Review Specialist)
**Para**: GEMINI (QA/Testing Specialist)
**Fecha**: 15 de Enero de 2026
**Priority**: 🔴 CRÍTICA
**Status**: 🟢 LISTO PARA EJECUCIÓN

---

## ⚠️ LECTURA PREVIA OBLIGATORIA

**ANTES de comenzar cualquier E2E testing, DEBES leer estos documentos en orden:**

### 1️⃣ **PHASE_2_STEP_2_SUMMARY.md** (10 minutos)
```
📍 Ubicación: E:\prueba\PHASE_2_STEP_2_SUMMARY.md

Qué incluye:
├─ Resumen ejecutivo de Phase 2 Step 2
├─ 6 componentes implementados (descripción)
├─ Arquitectura completa documentada
├─ Seguridad implementada (HMAC, Rate Limiting)
├─ Testing strategy (Unit + Integration + E2E)
├─ Métricas finales (50+ tests, build success)
└─ Status: 100% LISTO PARA PRODUCCIÓN

Lectura rápida: 10 minutos
Importancia: CRÍTICA para entender contexto
```

**¿Por qué?**: Para que entiendas qué se implementó, cómo funciona, y por qué debes testear.

---

### 2️⃣ **GEMINI_E2E_INSTRUCTION.md** (30 minutos)
```
📍 Ubicación: E:\prueba\GEMINI_E2E_INSTRUCTION.md

Qué incluye:
├─ Especificación técnica completa
├─ 10 escenarios E2E detallados
├─ Fixtures y mocks documentados
├─ Helpers reutilizables
├─ Estructura de tests
├─ Patrones a seguir (código de ejemplo)
├─ Checklist de aceptación
├─ Template de reporte esperado
└─ Cómo ejecutar los tests

Lectura detallada: 30 minutos
Importancia: CRÍTICA para implementación
```

**¿Por qué?**: Este es tu "blueprint" completo para los E2E tests.

---

### 3️⃣ **TEAM.md** (5 minutos - Review rápido)
```
📍 Ubicación: E:\prueba\TEAM.md

Qué revisar:
├─ Tu rol como GEMINI (QA/Testing Specialist)
├─ Responsabilidades
├─ Formato de comunicación
└─ Escalation procedures

Lectura rápida: 5 minutos
Importancia: Para entender estructura de equipo
```

---

### 4️⃣ **Todos los COMPONENT_*.md** (Opcional pero recomendado)
```
📍 Ubicación: E:\prueba\COMPONENT_*_INSTRUCTION.md

Qué revisar:
├─ COMPONENT_1_INSTRUCTION.md (PerplexityService)
├─ COMPONENT_2_INSTRUCTION.md (MessageProcessorService)
├─ COMPONENT_3_INSTRUCTION.md (WhatsAppService + Dashboard)
├─ COMPONENT_4_INSTRUCTION.md (HMAC + Rate Limiting)
├─ COMPONENT_5_INSTRUCTION.md (Webhook Refactoring)
└─ COMPONENT_6_INSTRUCTION.md (Final Integration)

Lectura opcional: 45 minutos total
Importancia: Para entender detalles técnicos de cada componente
```

**¿Por qué?**: Para entender cómo funciona cada servicio internamente.

---

## 📋 CHECKLIST PRE-EJECUCIÓN

Confirma que has completado ANTES de comenzar:

```
LECTURA PREVIA:
├─ [ ] He leído PHASE_2_STEP_2_SUMMARY.md (10 min)
├─ [ ] He leído GEMINI_E2E_INSTRUCTION.md (30 min)
├─ [ ] He entendido los 10 escenarios E2E
├─ [ ] He entendido la arquitectura completa
├─ [ ] He revisado TEAM.md (estructura)
└─ [ ] He revisado COMPONENT_*.md (detalles técnicos)

PREPARACIÓN:
├─ [ ] Node.js >= 18 instalado
├─ [ ] npm dependencies actualizado (npm install)
├─ [ ] Variables de entorno configuradas (.env.test)
├─ [ ] Base de datos de test preparada
├─ [ ] Mock services entendidos
└─ [ ] Herramientas de testing disponibles

COMPRENSIÓN:
├─ [ ] Entiendo qué es E2E testing
├─ [ ] Entiendo diferencia con unit tests
├─ [ ] Entiendo los 10 escenarios
├─ [ ] Entiendo fixtures y mocks
├─ [ ] Entiendo el formato de reporte esperado
└─ [ ] Tengo preguntas? → Pregunta ahora (no después)
```

---

## 🎯 TU MISIÓN

**Validar que Phase 2 Step 2 funciona correctamente en un flujo End-to-End completo.**

```
Entrada (Input):
├─ 6 componentes implementados
├─ 50+ unit tests pasando
├─ Build SUCCESS
└─ Código en GitHub

Proceso (E2E Testing):
├─ 10 escenarios detallados
├─ 72 tests E2E totales
├─ Validación de seguridad
├─ Validación de integración
├─ Validación de performance
└─ Validación de error handling

Salida (Output):
├─ Reporte formal de E2E testing
├─ Documento de validación
├─ Go/No-Go para producción
└─ Issues encontrados (si aplica)
```

---

## 🚀 CÓMO PROCEDER

### **PASO 1: Leer Documentación (45 minutos)**

```bash
# Abre estos archivos en orden
1. PHASE_2_STEP_2_SUMMARY.md ..................... (10 min)
2. GEMINI_E2E_INSTRUCTION.md ..................... (30 min)
3. TEAM.md (revisar tu rol) ..................... (5 min)
```

**Usa este tiempo para:**
- Entender la arquitectura completa
- Identificar puntos críticos a testear
- Familiarizarte con los 10 escenarios
- Hacer notas de preguntas

---

### **PASO 2: Hacer Preguntas (10 minutos)**

Si algo no está claro, **PREGUNTA AHORA** antes de implementar.

**Preguntas típicas que podrías hacer:**
```
❓ "No entiendo cómo MockS WhatsApp API"
❓ "Qué database usar para tests?"
❓ "Cómo medir performance en tests?"
❓ "Cómo tesear timeout de IA?"
❓ "Es necesario tesear todas las rutas?"
```

**Responderé todas las preguntas ANTES de que comiences.**

---

### **PASO 3: Implementar E2E Tests (3-4 horas)**

Una vez claro, implementa los tests:

```bash
# 1. Crear estructura
mkdir -p e2e/{fixtures,scenarios,helpers}

# 2. Crear fixtures (10 min)
e2e/fixtures/
├─ valid-webhook-payload.json
├─ invalid-hmac-payload.json
├─ audio-message-payload.json
└─ rate-limit-payloads.json

# 3. Crear helpers (20 min)
e2e/helpers/
├─ webhook.ts ................. (HMAC generation, request creation)
├─ database.ts ................ (Query test data)
└─ logging.ts ................. (Log assertions)

# 4. Crear scenario tests (180 min)
e2e/scenarios/
├─ 01-valid-text-flow.e2e.ts .................. (30 min)
├─ 02-audio-flow.e2e.ts ....................... (30 min)
├─ 03-hmac-validation.e2e.ts .................. (20 min)
├─ 04-rate-limiting.e2e.ts .................... (25 min)
├─ 05-error-handling.e2e.ts ................... (25 min)
├─ 06-complete-integration.e2e.ts ............. (20 min)
├─ 07-payload-malformed.e2e.ts ............... (15 min)
├─ 08-dashboard-updates.e2e.ts ............... (15 min)
├─ 09-command-special.e2e.ts ................. (10 min)
└─ 10-manual-mode.e2e.ts ..................... (10 min)

# 5. Ejecutar tests (20 min)
npm run test:e2e

# 6. Recolectar métricas (10 min)
- Coverage
- Performance
- Security
- Issues encontrados
```

---

### **PASO 4: Generar Reporte (30 minutos)**

Crea reporte formal siguiendo el template en `GEMINI_E2E_INSTRUCTION.md`:

```markdown
# REPORTE E2E TESTING - GEMINI

## Status: ✅ COMPLETADO

### Escenarios Ejecutados
- ✅ Escenario 1: Flujo de texto (10 tests)
- ... (9 más)

### Resultados
- npm run test:e2e: ✅ ALL PASS
- Cobertura: XX%
- Performance: XXXms promedio
- Issues: 0 críticos

### Observaciones
[Detalles de lo encontrado]

### Conclusión
Phase 2 Step 2 está **VALIDADO** y **LISTO PARA PRODUCCIÓN**
```

---

### **PASO 5: Entregar Reporte (5 minutos)**

Envía reporte a CLAUDE con:
- Status COMPLETADO
- Archivo de reporte formal
- Go/No-Go para producción
- Issues encontrados (si aplica)

---

## 📊 TIMELINE ESTIMADO

```
Lectura de documentos:        45 minutos
Hacer preguntas:              10 minutos
Implementar E2E tests:        180 minutos (3 horas)
Recolectar métricas:          10 minutos
Generar reporte:              30 minutos
Entregar resultado:           5 minutos
────────────────────────────
TOTAL:                        280 minutos (4 horas 40 minutos)
```

**Distribución recomendada:**
- Hora 1: Lectura (45 min) + Preguntas (10 min) + Preparación (5 min)
- Hora 2-3: Fixtures + Helpers (30 min) + Primeros 4 scenarios (90 min)
- Hora 4: Últimos 6 scenarios (90 min)
- Hora 4+30m: Métricas + Reporte (45 min)

---

## 🔧 REQUISITOS TÉCNICOS

**Antes de comenzar, verifica que tienes:**

```bash
# Node.js >= 18
node --version

# npm instalado
npm --version

# Dependencias actualizadas
npm install

# Variables de entorno (.env.test o similar)
# Debe incluir:
WHATSAPP_WEBHOOK_SECRET=test-secret-key
WHATSAPP_TOKEN=test-token
WHATSAPP_PHONE_NUMBER_ID=test-phone-id
PERPLEXITY_API_KEY=test-key (o mock)
CLAUDE_API_KEY=test-key (o mock)

# Base de datos de test (SQLite recomendado para tests)
# CONFIG en .env.test:
DATABASE_URL=file:./test.db

# Script en package.json
npm run test:e2e  (debe estar configurado)
```

---

## 📚 RECURSOS DISPONIBLES

**En el repositorio:**
```
├─ src/services/                    (código a testear)
├─ src/middleware/                  (middleware a testear)
├─ src/types/schemas.ts             (tipos e interfaces)
├─ app/api/whatsapp/webhook/        (ruta a testear)
├─ app/admin/ai/                    (dashboard a testear)
└─ src/lib/logger.ts                (logging para tests)
```

**En GitHub:**
```
Rama: claude/reset-chatbot-devlmer-01Ri41mTnZb59LBAsfFGQkr8
Commits:
├─ eff85640: Phase 2 Step 2 completo
├─ 4941eb1f: Documentación formal
└─ ... (anteriores)
```

---

## ⚠️ PUNTOS CRÍTICOS A TESTEAR

**No olvides validar:**

```
SEGURIDAD:
├─ [ ] HMAC válido → Acepta (200)
├─ [ ] HMAC inválido → Rechaza (401)
├─ [ ] Rate limit < 100 → Acepta
├─ [ ] Rate limit = 101 → Rechaza (429)
├─ [ ] Bloqueo de 15 minutos funciona
└─ [ ] Auto-cleanup cada 5 minutos

FLUJOS:
├─ [ ] Mensaje texto completo
├─ [ ] Mensaje audio completo (transcribe → IA → TTS)
├─ [ ] Comando especial
├─ [ ] Modo manual
├─ [ ] Session timeout (24 horas)
└─ [ ] Business hours checking

ERRORES:
├─ [ ] PerplexityService falla → Fallback Claude
├─ [ ] Claude falla → Respuesta genérica
├─ [ ] Transcripción falla → Respuesta texto
├─ [ ] TTS falla → Respuesta texto
├─ [ ] Database error → Error 500
└─ [ ] Payload malformado → Error 400

INTEGRACIÓN:
├─ [ ] Todos servicios trabajan juntos
├─ [ ] Logging en todos los niveles
├─ [ ] Database persiste correctamente
├─ [ ] Dashboard actualiza en tiempo real
└─ [ ] Métricas se recopilan correctamente
```

---

## 🆘 SI TIENES PROBLEMAS

**Durante la implementación:**

1. **Error de import**: Verifica rutas en `src/types/schemas.ts`
2. **Mock no funciona**: Revisa `jest.mock()` o equivalente en test framework
3. **Database error**: Usa SQLite con `:memory:` para tests
4. **Timeout en test**: Aumenta timeout `jest.setTimeout(10000)`
5. **Coverage bajo**: Revisa que cubres todos los paths

**Si no puedes resolver:**
- Documenta el problema
- Incluye en reporte como "Issue encontrado"
- CLAUDE revisará y decidirá si es bloqueante

---

## 📋 CHECKLIST FINAL PRE-INICIO

Marca estas casillas ANTES de empezar:

```
DOCUMENTACIÓN LEÍDA:
✓ [ ] PHASE_2_STEP_2_SUMMARY.md (10 min)
✓ [ ] GEMINI_E2E_INSTRUCTION.md (30 min)
✓ [ ] TEAM.md (revisar rol)
✓ [ ] COMPONENT_*.md (opcional pero recomendado)

ENTORNO PREPARADO:
✓ [ ] Node.js >= 18 instalado
✓ [ ] npm install ejecutado
✓ [ ] .env.test configurado
✓ [ ] Database de test lista
✓ [ ] Mock services entendidos

CLARIDAD:
✓ [ ] Entiendo 10 escenarios
✓ [ ] Entiendo fixtures y helpers
✓ [ ] Entiendo mocking strategy
✓ [ ] Entiendo formato de reporte
✓ [ ] Entiendo timeline (4-5 horas)

DUDAS RESUELTAS:
✓ [ ] He hecho todas las preguntas necesarias
✓ [ ] CLAUDE ha respondido todas
✓ [ ] No tengo dudas para comenzar
```

---

## ✅ PUEDES COMENZAR CUANDO:

1. ✅ Has leído PHASE_2_STEP_2_SUMMARY.md
2. ✅ Has leído GEMINI_E2E_INSTRUCTION.md
3. ✅ Has hecho todas las preguntas que tenías
4. ✅ Tu entorno está preparado
5. ✅ Entiendes los 10 escenarios completamente

---

## 📞 COMUNICACIÓN DURANTE E2E TESTING

**Mientras estés implementando:**
- Reporta progreso cada hora
- Si tienes blockers, avisa inmediatamente
- Documenta issues encontrados en tiempo real
- Si necesitas cambios, consulta antes de implementar

**Formato de reporte de progreso:**
```
PROGRESO GEMINI - [HORA]:

Escenarios completados: X/10
- ✅ Escenario 1
- ✅ Escenario 2
- 🟡 Escenario 3 (en progreso)
- ⏳ Escenario 4 (por hacer)

Blockers: Ninguno / [describir]
Issues encontrados: X
ETA para finalizar: X:XX
```

---

## 🎯 META FINAL

**Entregar un reporte E2E formal que valide:**

1. ✅ **Funcionalidad**: Todos los escenarios funcionan
2. ✅ **Seguridad**: HMAC + Rate Limiting funcionan
3. ✅ **Integración**: Todos los componentes trabajan juntos
4. ✅ **Performance**: Dentro de límites aceptables
5. ✅ **Error Handling**: Degradación elegante en todos los casos

**Resultado esperado**: "Go for Production" ✅

---

## 🏁 LISTO?

```
┌────────────────────────────────────────────────────┐
│                                                    │
│     GEMINI - E2E TESTING PHASE 2 STEP 2           │
│                                                    │
│  Status: 🟢 LISTO PARA EJECUCIÓN                 │
│                                                    │
│  Pasos:                                            │
│  1️⃣  Lee PHASE_2_STEP_2_SUMMARY.md                │
│  2️⃣  Lee GEMINI_E2E_INSTRUCTION.md                │
│  3️⃣  Haz preguntas si tienes dudas                │
│  4️⃣  Implementa los 10 escenarios                 │
│  5️⃣  Genera reporte formal                        │
│  6️⃣  Entrega a CLAUDE                             │
│                                                    │
│  Timeline: 4-5 horas totales                       │
│                                                    │
│  ¡Adelante! 🚀                                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

---

## 📧 CONFIRMACIÓN REQUERIDA

Cuando estés listo, responde así:

```
CONFIRMACIÓN DE GEMINI:

✅ He leído PHASE_2_STEP_2_SUMMARY.md
✅ He leído GEMINI_E2E_INSTRUCTION.md
✅ Entiendo los 10 escenarios
✅ Mi entorno está preparado
✅ Tengo X preguntas: [listarlas si aplica]
✅ Estoy listo para comenzar E2E testing

Timeline estimado:
- Fichas y helpers: [X] minutos
- Scenarios 1-5: [X] minutos
- Scenarios 6-10: [X] minutos
- Métricas y reporte: [X] minutos
- ETA total: [X] horas [X] minutos

Comenzaré en: [hora/fecha]
Finalizaré en: [hora/fecha estimada]
```

---

**¿Listo para comenzar, GEMINI?** 🧪🚀

**Tu misión es clara:**
- Validar que Phase 2 Step 2 funciona
- Cubrir 10 escenarios críticos
- Generar reporte de aceptación
- Go/No-Go para producción

**Tiempo estimado: 4-5 horas**

**¡Adelante!**

---

**Firmado:**

**CLAUDE** - Architect/Review Specialist
**Fecha**: 15 de Enero de 2026
**Status**: ✅ INSTRUCCIONES FORMALES EMITIDAS
