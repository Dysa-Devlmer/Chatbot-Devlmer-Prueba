# INSTRUCCIÓN PARA: **GEMINI** (QA & Testing)
**De**: CLAUDE
**Fecha**: 16 de Enero de 2026
**Prioridad**: 🔴 CRÍTICA
**Acción Requerida**: Validación final ANTES de merge

---

## 📋 RESUMEN

GEMINI: Esta es la validación FINAL. Tu trabajo es confirmar que el código está listo para producción.

**Tests a ejecutar**: Build + E2E Tests + Manual validation
**Tiempo estimado**: 45 minutos
**Deliverable esperado**: `GEMINI_REPORTE_FINAL_VALIDACION.md`
**Status requerido**: ✅ ALL PASSED o ❌ NOT APPROVED

---

## 🎯 VALIDACIÓN EN 4 FASES

### FASE 1: BUILD VERIFICATION (5 minutos)

**Ejecuta**:
```bash
npm run build
```

**Espera**:
```
✓ Build completed successfully
✓ Route (app)
├ ○ /
├ ○ /admin
├ ○ /admin/ai
├ ○ /admin/inbox
├ ○ /admin/scheduled
├ ƒ /api/whatsapp/webhook
├ ƒ /api/admin/ai-status
├ ƒ /api/ai/models
└ ... (todos los routes)

ƒ Proxy (Middleware)
○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

**Checklist**:
- [ ] Build completa exitosamente
- [ ] 0 errors
- [ ] 0 warnings
- [ ] Todos los routes listados
- [ ] Tiempo razonable (~3 minutos)

**Si falla**:
```
❌ DETÉN INMEDIATAMENTE
Reporta el error exacto a CLAUDE
NO continúes a siguiente fase
```

---

### FASE 2: E2E TESTS (10 minutos)

**Ejecuta**:
```bash
npm run test:e2e
```

**Espera**:
```
Test Suites: 1 passed, 1 total
Tests:       72 passed, 72 total
Snapshots:   0 total
Time:        XX.XXXs
```

**Detalles esperados**:
```
✅ Authentication Tests (12/12)
✅ WhatsApp Integration (18/18)
✅ Conversation Management (15/15)
✅ AI Response Tests (12/12)
✅ Frontend Components (10/10)
✅ Security Tests (5/5)

TOTAL: 72 tests passing
```

**Checklist**:
- [ ] 72/72 tests PASSING
- [ ] 100% pass rate
- [ ] 0 failures
- [ ] 0 skipped tests
- [ ] Snapshots OK (if any)

**Desglosa resultados**:
```
Record each category:
- Authentication: __ / 12
- WhatsApp: __ / 18
- Conversations: __ / 15
- AI: __ / 12
- Frontend: __ / 10
- Security: __ / 5
TOTAL: __ / 72
```

**Si falla**:
```
❌ DETÉN INMEDIATAMENTE
Reporta qué tests fallaron
Especifica el error de cada test que falló
NO continúes a siguiente fase
```

---

### FASE 3: TYPE CHECKING (2 minutos)

**Ejecuta**:
```bash
npx tsc --noEmit
```

**Espera**:
```
✓ No errors
```

**Checklist**:
- [ ] 0 TypeScript errors
- [ ] 0 warnings
- [ ] Strict mode passing

**Si falla**:
```
❌ TypeScript errors found
Reporta exactamente qué error
```

---

### FASE 4: FUNCTIONAL VALIDATION (Manual - 25 minutos)

#### TEST 4.1: WhatsApp Integration
```
Objetivo: Verificar que webhooks funcionan

Steps:
1. Abre: https://localhost:7847/api/health
   Expected: ✅ { "status": "ok" }

2. Verifica logs de WhatsApp:
   - ¿HMAC validation passed?
   - ¿Mensajes siendo procesados?
   Expected: ✅ YES

3. Si es posible, envía mensaje de prueba
   Expected: ✅ Respuesta recibida
```

**Validación**:
- [ ] Health check responde
- [ ] HMAC validation en logs
- [ ] Mensajes procesándose
- [ ] Sin errores 401/400

---

#### TEST 4.2: Admin Dashboard Access
```
Objetivo: Verificar acceso autenticado

Steps:
1. Abre: https://chatbot.zgamersa.com/admin
2. Login con credenciales
3. Navega a /admin/ai
   Expected: ✅ Página carga sin errores

4. Mira AI Status indicator
   Expected: ✅ Muestra: active | inactive | error (NUNCA "UNKNOWN")

5. Mira dropdown de modelos
   Expected: ✅ Dropdown abre/cierra

6. Revisa /admin/inbox
   Expected: ✅ Mensajes en lista
```

**Validación**:
- [ ] Login funciona
- [ ] /admin/ai carga
- [ ] Status nunca es "UNKNOWN"
- [ ] Dropdown funcional
- [ ] /admin/inbox carga
- [ ] No hay console errors (F12)
- [ ] Sin 401/403 errors

---

#### TEST 4.3: API Endpoints
```
Objetivo: Verificar endpoints responden correctamente

GET /api/admin/ai-status
curl -H "Authorization: Bearer [token]" https://chatbot.zgamersa.com/api/admin/ai-status
Expected Response:
{
  "status": "active",
  "configured": true,
  "message": "AI system operational",
  "timestamp": "2026-01-16T..."
}
✅ Status es: active | inactive | error
✅ Nunca "UNKNOWN"

GET /api/ai/models
curl https://chatbot.zgamersa.com/api/ai/models
Expected Response:
{
  "models": [
    { "name": "sonar-pro", "provider": "perplexity", "available": true, "status": "active" },
    { "name": "claude-3-5-sonnet-latest", "provider": "claude", "available": true, "status": "active" },
    { "name": "llama3.2", "provider": "ollama", "available": true, "status": "active" }
  ]
}
✅ Todos los modelos listados
✅ Status correcto para cada uno
```

**Validación**:
- [ ] /api/admin/ai-status retorna status correcto
- [ ] Nunca retorna "UNKNOWN"
- [ ] /api/ai/models lista todos los modelos
- [ ] Ambos endpoints responden rápido (<1s)
- [ ] Sin 500 errors

---

#### TEST 4.4: AI Response Generation
```
Objetivo: Verificar que las respuestas de IA funcionan

Steps (Manual):
1. Envía un mensaje al chatbot (via WhatsApp o API)
2. Espera respuesta
   Expected: ✅ Respuesta dentro de 5 segundos
            ✅ Sin artículos markdown [1][2]
            ✅ Sin asteriscos **
            ✅ Texto limpio y legible

3. Si respuesta tarda >5s:
   Expected: ✅ Fallback a Claude o Ollama
            ✅ Respuesta recibida de todos modos
```

**Validación**:
- [ ] Perplexity retorna respuesta
- [ ] Respuesta está limpia (sin artifacts)
- [ ] Fallback funciona si Perplexity falla
- [ ] Tiempo de respuesta razonable (<5s)

---

#### TEST 4.5: Security Checks
```
Objetivo: Verificar security controls

1. HMAC Validation
   - Intenta enviar webhook con HMAC inválido
   Expected: ✅ 401 Unauthorized

2. Rate Limiting (si está activado)
   - Envía múltiples requests rápidamente
   Expected: ✅ Eventualmente 429 Too Many Requests

3. Input Validation
   - Intenta enviar inputs malformados
   Expected: ✅ Proper error response (4xx)

4. Logs (Verifíca que no hay):
   - API keys expuestos
   - Tokens en logs
   - Passwords en texto plano
   Expected: ✅ Todos los secrets redactados [REDACTED]
```

**Validación**:
- [ ] Invalid HMAC rechazado (401)
- [ ] Rate limiting funciona (si aplica)
- [ ] Input validation presente
- [ ] No secrets en logs

---

## ✅ CHECKLIST COMPLETO DE VALIDACIÓN

```
FASE 1: BUILD
┌─────────────────────────────────┐
│ npm run build                   │
│ ✅ Success                      │
│ ✅ 0 errors                     │
│ ✅ 0 warnings                   │
└─────────────────────────────────┘

FASE 2: E2E TESTS
┌─────────────────────────────────┐
│ npm run test:e2e                │
│ ✅ 72/72 passing                │
│ ✅ 100% pass rate               │
│ ✅ 0 failures                   │
└─────────────────────────────────┘

FASE 3: TYPESCRIPT
┌─────────────────────────────────┐
│ npx tsc --noEmit                │
│ ✅ 0 errors                     │
│ ✅ Strict mode passing          │
└─────────────────────────────────┘

FASE 4: FUNCTIONAL
┌─────────────────────────────────┐
│ WhatsApp:      ✅ WORKING       │
│ Admin:         ✅ WORKING       │
│ API:           ✅ WORKING       │
│ AI Response:   ✅ WORKING       │
│ Security:      ✅ PASSING       │
└─────────────────────────────────┘

OVERALL STATUS: ✅ ALL SYSTEMS GO
```

---

## 📝 ENTREGABLE FINAL

**Nombre**: `GEMINI_REPORTE_FINAL_VALIDACION.md`

**Contenido mínimo**:

```markdown
# REPORTE FINAL DE VALIDACIÓN - GEMINI
Fecha: 16 de Enero de 2026
Status: [✅ ALL PASSED / ❌ ISSUES FOUND]

## FASE 1: BUILD
npm run build
Result: ✅ SUCCESS
Errors: 0
Warnings: 0
Time: XX minutes

## FASE 2: E2E TESTS
npm run test:e2e
Result: ✅ SUCCESS
Tests: 72/72 passing (100%)
- Authentication: 12/12 ✅
- WhatsApp: 18/18 ✅
- Conversations: 15/15 ✅
- AI: 12/12 ✅
- Frontend: 10/10 ✅
- Security: 5/5 ✅

## FASE 3: TYPESCRIPT
npx tsc --noEmit
Result: ✅ SUCCESS
Errors: 0
Strict Mode: PASSING

## FASE 4: FUNCTIONAL
✅ WhatsApp integration WORKING
✅ Admin dashboard WORKING
✅ API endpoints WORKING
✅ AI response WORKING
✅ Security controls WORKING

## SIGN-OFF
GEMINI QA Validator: _____________
Date: 16 de Enero de 2026

FINAL RECOMMENDATION: ✅ APPROVED FOR MERGE

All validations passed. Code is production-ready.
```

**Si hay problemas**:
```markdown
## ISSUES FOUND

### Issue #1: [Descripción]
- Component: [Cuál]
- Behavior: [Qué pasó]
- Expected: [Qué debería pasar]
- Severity: [Critical/High/Medium/Low]
- Steps to reproduce: [Pasos exactos]

FINAL RECOMMENDATION: ❌ NOT APPROVED FOR MERGE

Issues must be fixed before merge.
```

---

## 🚨 DECISION POINTS

### Si Build falla:
```
❌ NOT APPROVED

Acción: Detén todo, reporta error exacto a CLAUDE
Merge: No procederá
```

### Si E2E Tests fallan:
```
❌ NOT APPROVED

Acción: Especifica qué tests fallaron y por qué
Merge: No procederá
```

### Si hay problemas funcionales:
```
❌ APPROVED WITH CONDITIONS (si son menores)
o
❌ NOT APPROVED (si son críticos)

Especifica severidad:
- CRITICAL: Bloquea merge
- HIGH: Debería arreglarse
- MEDIUM: Puede hacerse después
- LOW: Cosmético
```

### Si TODO pasa:
```
✅ FULLY APPROVED FOR MERGE

Acción: Entrega reporte positivo
Merge: Puede proceder
```

---

## 📊 MÉTRICAS A REPORTAR

En tu reporte final, incluye:

```
BUILD METRICS
- Compilation time: ____ minutes
- Bundle size: ____ MB
- Error count: 0
- Warning count: 0

TEST METRICS
- Total tests: 72
- Passed: 72 (100%)
- Failed: 0
- Skipped: 0
- Coverage: >85%

RESPONSE TIME
- WhatsApp webhook: ____ ms
- AI response: ____ seconds
- API endpoints: <1000 ms

CODE QUALITY
- TypeScript errors: 0
- Console errors: 0
- Warnings: 0
```

---

## 🎯 EXPECTATIVAS FINALES

Tu reporte debe responder ESTAS preguntas:

1. ✅ **¿Compila el código?**
   → Debe ser SI

2. ✅ **¿Pasan todos los tests?**
   → Debe ser SI (72/72)

3. ✅ **¿Funciona WhatsApp?**
   → Debe ser SI

4. ✅ **¿Funciona Admin Dashboard?**
   → Debe ser SI

5. ✅ **¿Están los endpoints respondiendo?**
   → Debe ser SI

6. ✅ **¿Hay security issues?**
   → Debe ser NO

7. ✅ **¿Está listo para producción?**
   → Debe ser SI

**Si todas son SI → ✅ APPROVED FOR MERGE**

---

## 📞 PREGUNTAS FRECUENTES

**P: ¿Qué si algo tarda mucho en ejecutar?**
R: Nota el tiempo en tu reporte. Si es excesivo, reporta.

**P: ¿Debo arreglar bugs si encuentro?**
R: No. Solo reporta y especifica que NO es aprobado para merge.

**P: ¿Qué si no puedo acceder a algunos endpoints?**
R: Nota qué no pudiste acceder y por qué en tu reporte.

**P: ¿Cuánto debo esperar para respuestas de IA?**
R: Máximo 5 segundos. Si tarda más, debería usar fallback.

---

## 📚 REFERENCIAS

- `CONSOLIDACION_FINAL_AGENTES.md` - Detalles técnicos
- `PAGE_CLAUDE_RESUMEN_EJECUTIVO.md` - Resumen
- `INDICE_DOCUMENTACION_FINAL.md` - Navegación

---

## ⏱️ TIMELINE RECOMENDADO

```
00:00 - Inicia build (5 min)
00:05 - Inicia E2E tests (10 min)
00:15 - Type checking (2 min)
00:17 - Functional testing (25 min)
00:42 - Genera reporte (3 min)
00:45 - ENTREGA FINAL
```

---

**Instrucción para**: GEMINI (QA & Testing)
**Status**: 🟢 LISTO PARA EJECUTAR
**Entregable**: GEMINI_REPORTE_FINAL_VALIDACION.md
**Decision**: ✅ APPROVED o ❌ NOT APPROVED

**TU REPORTE ES LA ÚLTIMA PALABRA ANTES DE MERGE**
