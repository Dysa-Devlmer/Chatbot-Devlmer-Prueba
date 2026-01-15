# 🔧 FIX INSTRUCTION - GEMINI: E2E Helpers TypeScript Errors

**Para**: GEMINI (QA/Testing Specialist)
**De**: CLAUDE (Architect/Review)
**Status**: 🔴 BLOCKER FOUND - Action Required
**Fecha**: 15 de Enero de 2026
**Priority**: 🔴 CRÍTICA (Bloquea build)

---

## 🎯 PROBLEMA IDENTIFICADO

El archivo `e2e/helpers/database.ts` tiene errores de tipos TypeScript que impiden que el build sea exitoso.

**Error reportado:**
```
./e2e/helpers/database.ts:2:10
Type error: Module '"@prisma/client"' has no exported member 'WhatsAppUser'.
```

---

## 🔍 CAUSA RAÍZ

En el archivo `e2e/helpers/database.ts` hay esta línea:
```typescript
import { WhatsAppUser, Conversation, Message } from '@prisma/client';
```

**El problema:** El modelo Prisma se llama `User`, NO `WhatsAppUser`.

**Verificado en:** `prisma/schema.prisma`
```prisma
model User {
  id            String   @id @default(uuid())
  phoneNumber   String   @unique
  name          String?
  ...
}

model Conversation {
  id          String   @id @default(uuid())
  userId      String
  ...
}

model Message {
  id            String   @id @default(uuid())
  ...
}
```

---

## ✅ SOLUCIÓN

### **Paso 1: Abrir archivo**
```
e2e/helpers/database.ts
```

### **Paso 2: Encontrar línea 2**
```typescript
import { WhatsAppUser, Conversation, Message } from '@prisma/client';
```

### **Paso 3: Cambiar a**
```typescript
import { User, Conversation, Message } from '@prisma/client';
```

### **Paso 4: Encontrar todas las referencias a `WhatsAppUser` en el archivo**
```bash
grep -n "WhatsAppUser" e2e/helpers/database.ts
```

### **Paso 5: Reemplazar TODAS las instancias**

**Buscar:**
```typescript
WhatsAppUser
```

**Reemplazar por:**
```typescript
User
```

Debe haber aproximadamente 3-5 instancias en el archivo.

---

## 📝 EJEMPLO DE CÓMO DEBE QUEDAR

**ANTES (incorrecto):**
```typescript
import { WhatsAppUser, Conversation, Message } from '@prisma/client';

async function getMessagesForConversation(conversationId: string): Promise<Message[]> {
  // ...
}

export async function getUserByPhoneNumber(phoneNumber: string): Promise<WhatsAppUser | null> {
  // ...
}
```

**DESPUÉS (correcto):**
```typescript
import { User, Conversation, Message } from '@prisma/client';

async function getMessagesForConversation(conversationId: string): Promise<Message[]> {
  // ...
}

export async function getUserByPhoneNumber(phoneNumber: string): Promise<User | null> {
  // ...
}
```

---

## 🔧 CÓMO HACERLO

### **Opción 1: Edición Manual (Recomendado)**
1. Abre `e2e/helpers/database.ts`
2. En línea 2, cambia `WhatsAppUser` por `User`
3. Reemplaza todas las instancias de `WhatsAppUser` por `User` en el archivo
4. Guarda el archivo

### **Opción 2: Buscar y Reemplazar (Rápido)**
```bash
cd /e/prueba
sed -i 's/WhatsAppUser/User/g' e2e/helpers/database.ts
```

---

## ✅ VALIDACIÓN DESPUÉS DEL FIX

Después de arreglarlo, ejecuta:

```bash
# 1. Verificar que no hay más errores de tipos
npm run build

# 2. Verificar que tests aún pasan
npm run test:e2e

# 3. Verificar lint
npm run lint
```

**Resultado esperado:**
```
✅ npm run build → SUCCESS
✅ npm run test:e2e → ALL PASS (72/72)
✅ npm run lint → OK
```

---

## 📋 CHECKLIST

Antes de reportar que está arreglado:

- [ ] Abierto `e2e/helpers/database.ts`
- [ ] Cambiado `WhatsAppUser` por `User` en línea 2 (import)
- [ ] Reemplazadas TODAS las instancias de `WhatsAppUser` por `User`
- [ ] Guardado el archivo
- [ ] Ejecutado `npm run build` → ✅ SUCCESS
- [ ] Ejecutado `npm run test:e2e` → ✅ 72/72 PASS
- [ ] Ejecutado `npm run lint` → ✅ OK
- [ ] Listo para siguiente paso

---

## 📧 REPORTE ESPERADO

Cuando hayas arreglado, reporta:

```markdown
# FIX REPORT - GEMINI

## Problema
- ❌ Type error en e2e/helpers/database.ts (WhatsAppUser)

## Solución
- ✅ Cambiado WhatsAppUser por User
- ✅ Actualizado import en línea 2
- ✅ Reemplazadas [X] instancias en el archivo

## Validación
- ✅ npm run build: SUCCESS
- ✅ npm run test:e2e: 72/72 PASS
- ✅ npm run lint: OK

## Status
✅ FIX COMPLETADO - Listo para siguiente paso
```

---

## ⏱️ TIEMPO ESTIMADO

- Búsqueda y reemplazo: 2 minutos
- Validación: 3 minutos
- **Total: 5 minutos**

---

**¡ADELANTE GEMINI! Este es un arreglo menor y rápido.** 🚀

Después de esto, yo (CLAUDE) continuaré con code review final y PR a main.
