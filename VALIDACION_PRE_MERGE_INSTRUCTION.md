# 🔐 INSTRUCCIÓN FORMAL - VALIDACIÓN PRE-MERGE

---

## 📋 INSTRUCCIÓN OFICIAL

**Para**: CLAUDE (Architect/Code Review)
**De**: Usuario (Project Manager)
**Status**: 🟡 BLOCKER - Validación Requerida Antes de Mergear
**Fecha**: 15 de Enero de 2026
**Priority**: 🔴 CRÍTICA (Merge depende de esto)

---

## 🎯 OBJETIVO

Ejecutar validación completa de Phase 2 Step 2 antes de mergear PR #5 a main.

---

## ✅ PASOS DE VALIDACIÓN (en orden)

### **1️⃣ VALIDACIÓN GIT**

```bash
# Comando
git status
git log --oneline -5

# Criterio PASS
✅ Working directory clean
✅ 2 commits nuevos: d269671a y 8862cf12
```

---

### **2️⃣ VALIDACIÓN TYPESCRIPT BUILD**

```bash
# Comandos
rm -rf .next
npm run build 2>&1 | grep "✓ Compiled\|Failed to compile"

# Criterio PASS
✅ Output: ✓ Compiled successfully
❌ FAIL si hay "Failed to compile" o "Type error:"
```

---

### **3️⃣ VALIDACIÓN TSCONFIG.JSON**

```bash
# Comando
cat tsconfig.json | tail -3

# Criterio PASS
✅ Línea 33 contiene: "exclude": ["node_modules", "src/**/__tests__/**", ".e2e-tests/**"]
```

---

### **4️⃣ VALIDACIÓN ESTRUCTURA E2E**

```bash
# Comandos
ls -d .e2e-tests/scenarios .e2e-tests/helpers .e2e-tests/fixtures
ls .e2e-tests/scenarios/*.ts | wc -l
ls e2e 2>&1

# Criterio PASS
✅ Carpeta .e2e-tests/ existe con 3 subcarpetas
✅ Mínimo 10 archivos *.ts en scenarios
✅ Output: "e2e: No such file or directory" (carpeta NO debe existir)
```

---

### **5️⃣ VALIDACIÓN CODE REVIEW**

```bash
# Comando
grep -r "WhatsAppUser" src/ app/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l

# Criterio PASS
✅ Output: 0 (cero resultados = correcto)
❌ FAIL si hay líneas con WhatsAppUser
```

---

### **6️⃣ VALIDACIÓN TEST FILES EXCLUIDOS**

```bash
# Comandos
ls test-perplexity-integration.ts 2>&1
ls .test-perplexity-integration.ts.bak

# Criterio PASS
✅ test-perplexity-integration.ts: No such file (archivo movido)
✅ .test-perplexity-integration.ts.bak existe
```

---

### **7️⃣ VALIDACIÓN PR EN GITHUB**

```bash
# Comando
gh pr list --state open | grep "Phase 2 Step 2"

# Criterio PASS
✅ PR #5 aparece en lista
✅ Título contiene "Phase 2 Step 2"
```

---

### **8️⃣ VALIDACIÓN COMMITS**

```bash
# Comando
git log main..HEAD --oneline

# Criterio PASS
✅ 2 commits visibles
✅ Primer commit: d269671a (fix: resolve TypeScript...)
✅ Segundo commit: 8862cf12 (chore: exclude test files...)
✅ Ambos incluyen: Co-Authored-By: Claude Haiku 4.5
```

---

## 📊 MATRIZ DE VALIDACIÓN

| Paso | Descripción | Esperado | Status |
|------|-------------|----------|--------|
| 1 | Git limpio y commits | 2 nuevos | [ ] |
| 2 | TypeScript compila | ✓ Compiled | [ ] |
| 3 | tsconfig correcto | exclude OK | [ ] |
| 4 | .e2e-tests existe | 10+ archivos | [ ] |
| 5 | Sin WhatsAppUser | 0 resultados | [ ] |
| 6 | Tests movidos | .bak existe | [ ] |
| 7 | PR #5 abierta | En GitHub | [ ] |
| 8 | Commits firmados | 2 commits | [ ] |

---

## 🔴 CRITERIOS DE BLOQUEO (NO MERGEAR si falla alguno)

```
❌ BLOQUEO 1: npm run build falla con TypeScript error
❌ BLOQUEO 2: WhatsAppUser aún existe en código
❌ BLOQUEO 3: test-perplexity-integration.ts en raíz sin mover
❌ BLOQUEO 4: PR #5 no existe o está cerrada
❌ BLOQUEO 5: Git status muestra cambios sin commitear
```

---

## ✅ CUANDO TODO PASE

Si todas las validaciones son ✅:

```bash
# 1. Ver URL de PR
gh pr list | grep "Phase 2 Step 2"

# 2. Reportar
echo "✅ TODAS LAS VALIDACIONES PASARON"
echo "✅ LISTO PARA MERGEAR A MAIN"
```

---

## 📝 REPORTE ESPERADO

Cuando termines, reporta exactamente:

```
# ✅ VALIDACIÓN PRE-MERGE COMPLETADA

## Resultados

- [x] Validación 1: Git limpio - 2 commits nuevos
- [x] Validación 2: TypeScript ✓ Compiled successfully
- [x] Validación 3: tsconfig.json configurado
- [x] Validación 4: .e2e-tests/ estructura correcta
- [x] Validación 5: WhatsAppUser eliminado del código
- [x] Validación 6: test files excluidos
- [x] Validación 7: PR #5 abierta en GitHub
- [x] Validación 8: 2 commits con firma correcta

## Conclusión

✅ TODAS LAS VALIDACIONES PASARON
✅ SEGURO PARA MERGEAR A MAIN

PR: https://github.com/Dysa-Devlmer/Chatbot-Devlmer-Prueba/pull/5
```

---

## ⏱️ TIEMPO ESTIMADO

- Validación completa: 5-10 minutos
- Reporting: 2 minutos
- **Total: ~15 minutos**

---

**Instrucción creada por**: CLAUDE
**Fecha**: 15 de Enero de 2026
**Propósito**: Validar integridad antes de mergear a main
