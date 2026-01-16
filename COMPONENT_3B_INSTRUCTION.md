# 📋 COMPONENTE 3B: Dashboard UI Updates (Perplexity Integration)

**Para**: QWEN (Frontend/UI Specialist)
**Status**: 🟢 LISTO PARA IMPLEMENTACIÓN
**Fecha**: 15 de Enero de 2026
**Priority**: MEDIA (paralelo con Component 3A)

---

## 🎯 OBJETIVO

Actualizar el dashboard admin para mostrar el **cambio de IA de Ollama a Perplexity**:

```
Antes:
├─ Dashboard mostraba "IA: Ollama (Local)"
├─ Botones para activar/desactivar Ollama
└─ Estadísticas de Ollama

Después:
├─ Dashboard muestra "IA: Perplexity + Claude Fallback"
├─ Indicador de status del servicio
├─ Muestra qué IA respondió último mensaje
├─ Estadísticas de Perplexity
└─ Configuración de modelo
```

---

## 📊 ESPECIFICACIÓN TÉCNICA

### Ubicación de Cambios

**Archivos a Modificar:**
```
app/admin/ai/page.tsx                    (Panel principal de IA)
app/admin/ai/components/AIStatus.tsx     (NUEVO - Indicador de status)
app/admin/ai/components/AIConfig.tsx     (NUEVO - Configuración)
app/admin/components/AIIndicator.tsx     (Mostrar IA actual en header)
```

### Componentes a Crear

#### 1. **AIStatus Component** (Nuevo)

**Ubicación**: `app/admin/ai/components/AIStatus.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'

interface AIStatusInfo {
  isConfigured: boolean
  provider: 'perplexity' | 'claude' | 'fallback' | 'unknown'
  model: string
  lastUsed?: Date
  responseTime?: number
  status: 'online' | 'offline' | 'checking'
}

export default function AIStatus() {
  const [status, setStatus] = useState<AIStatusInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAIStatus()
    const interval = setInterval(fetchAIStatus, 30000) // Cada 30s
    return () => clearInterval(interval)
  }, [])

  async function fetchAIStatus() {
    try {
      const response = await fetch('/api/admin/ai-status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching AI status:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="animate-pulse">Cargando...</div>

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Estado de IA</h2>

      {/* Status Badge */}
      <div className="flex items-center gap-4 mb-4">
        <div className={`w-4 h-4 rounded-full ${
          status?.status === 'online' ? 'bg-green-500' :
          status?.status === 'offline' ? 'bg-red-500' :
          'bg-yellow-500'
        }`}></div>
        <div>
          <p className="font-semibold">{status?.provider.toUpperCase()}</p>
          <p className="text-sm text-gray-600">
            {status?.status === 'online' ? 'En línea' :
             status?.status === 'offline' ? 'Desconectado' :
             'Verificando...'}
          </p>
        </div>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="text-xs text-gray-600">Modelo</p>
          <p className="font-semibold">{status?.model}</p>
        </div>
        <div className="border-l-4 border-green-500 pl-4">
          <p className="text-xs text-gray-600">Último Usado</p>
          <p className="font-semibold">
            {status?.lastUsed ? new Date(status.lastUsed).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <p className="text-xs text-gray-600">Tiempo de Respuesta</p>
          <p className="font-semibold">{status?.responseTime ? `${status.responseTime}ms` : 'N/A'}</p>
        </div>
        <div className="border-l-4 border-yellow-500 pl-4">
          <p className="text-xs text-gray-600">Configurado</p>
          <p className="font-semibold">{status?.isConfigured ? 'Sí' : 'No'}</p>
        </div>
      </div>

      {!status?.isConfigured && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            ⚠️ Perplexity no está configurado. Verifica las API keys.
          </p>
        </div>
      )}
    </div>
  )
}
```

**Responsabilidades:**
- ✅ Mostrar status actual de Perplexity
- ✅ Indicador visual (online/offline/checking)
- ✅ Modelo en uso
- ✅ Tiempo de última respuesta
- ✅ Tiempo de respuesta promedio
- ✅ Avisos si no está configurado

---

#### 2. **AIConfig Component** (Nuevo)

**Ubicación**: `app/admin/ai/components/AIConfig.tsx`

```typescript
'use client'

import { useState } from 'react'

export default function AIConfig() {
  const [model, setModel] = useState('sonar-pro')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleSave() {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model,
          temperature,
          maxTokens,
        }),
      })

      if (response.ok) {
        setMessage({
          type: 'success',
          text: '✅ Configuración guardada exitosamente'
        })
      } else {
        setMessage({
          type: 'error',
          text: '❌ Error guardando configuración'
        })
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: '❌ Error: ' + (error instanceof Error ? error.message : 'Desconocido')
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-6">Configuración de Perplexity</h2>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-4 rounded ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* Modelo */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">Modelo</label>
        <select
          value={model}
          onChange={(e) => setModel(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2"
        >
          <option value="sonar-pro">Sonar Pro (Recomendado)</option>
          <option value="sonar">Sonar</option>
          <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Fallback)</option>
        </select>
        <p className="text-xs text-gray-600 mt-1">
          Sonar Pro: Mejor calidad, más rápido. Claude: Fallback automático.
        </p>
      </div>

      {/* Temperatura */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Temperatura: {temperature.toFixed(2)}
        </label>
        <input
          type="range"
          min="0"
          max="2"
          step="0.1"
          value={temperature}
          onChange={(e) => setTemperature(parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-600 mt-1">
          Más baja = más determinística. Más alta = más creativa.
        </p>
      </div>

      {/* Max Tokens */}
      <div className="mb-6">
        <label className="block text-sm font-semibold mb-2">
          Máximo de Tokens: {maxTokens}
        </label>
        <input
          type="number"
          min="100"
          max="4000"
          step="100"
          value={maxTokens}
          onChange={(e) => setMaxTokens(parseInt(e.target.value))}
          className="w-full border border-gray-300 rounded px-3 py-2"
        />
        <p className="text-xs text-gray-600 mt-1">
          Tokens máximos por respuesta (1 token ≈ 4 caracteres)
        </p>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? '⏳ Guardando...' : '💾 Guardar Configuración'}
      </button>
    </div>
  )
}
```

**Responsabilidades:**
- ✅ Selector de modelo (Sonar Pro / Claude)
- ✅ Control de temperatura
- ✅ Control de max_tokens
- ✅ Guardar configuración
- ✅ Feedback de éxito/error

---

#### 3. **AIIndicator Component** (Para Header)

**Ubicación**: `app/admin/components/AIIndicator.tsx` (Nuevo o modificar existente)

```typescript
'use client'

import { useEffect, useState } from 'react'

export default function AIIndicator() {
  const [provider, setProvider] = useState<'perplexity' | 'claude' | 'unknown'>('unknown')
  const [status, setStatus] = useState<'online' | 'offline' | 'checking'>('checking')

  useEffect(() => {
    fetchStatus()
  }, [])

  async function fetchStatus() {
    try {
      const response = await fetch('/api/admin/ai-status')
      const data = await response.json()
      setProvider(data.provider)
      setStatus(data.status)
    } catch {
      setStatus('offline')
    }
  }

  const statusColor = {
    online: 'bg-green-500',
    offline: 'bg-red-500',
    checking: 'bg-yellow-500'
  }[status]

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
      <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
      <span className="text-sm font-semibold">
        {provider === 'perplexity' && '🧠 Perplexity'}
        {provider === 'claude' && '🤖 Claude (Fallback)'}
        {provider === 'unknown' && '❓ Verificando...'}
      </span>
    </div>
  )
}
```

**Responsabilidades:**
- ✅ Mostrar IA actual en tiempo real
- ✅ Indicador de status compacto
- ✅ Icono según proveedor

---

## 📝 PATRONES A SEGUIR

### **React 19 + TypeScript**

```typescript
'use client'

import { useState, useEffect, FC } from 'react'

interface ComponentProps {
  title: string
  onSave?: (data: any) => Promise<void>
}

const MyComponent: FC<ComponentProps> = ({ title, onSave }) => {
  const [state, setState] = useState<string>('')

  return <div>{title}</div>
}

export default MyComponent
```

### **Tailwind CSS**

```typescript
// ✅ BIEN
className="bg-white rounded-lg shadow p-6 mb-4"
className={`px-4 py-2 ${isActive ? 'bg-blue-600' : 'bg-gray-200'}`}

// ❌ MAL
className="padding: 16px; margin-bottom: 16px;"
```

### **Error Handling**

```typescript
try {
  const response = await fetch('/api/endpoint')
  const data = await response.json()
  setMessage({ type: 'success', text: 'Listo!' })
} catch (error) {
  setMessage({
    type: 'error',
    text: error instanceof Error ? error.message : 'Error desconocido'
  })
}
```

---

## 📦 API ROUTES NECESARIAS

CODEX necesitará crear estas rutas para que QWEN pueda obtener datos:

```
GET  /api/admin/ai-status       → { isConfigured, provider, model, lastUsed, responseTime, status }
POST /api/admin/ai-config       → { model, temperature, maxTokens }
```

(Ya existen en Component 1, pero confirmar que funcionan)

---

## ✅ CHECKLIST DE ACEPTACIÓN

Antes de marcar como "Done", QWEN debe verificar:

**Componentes:**
- [ ] AIStatus.tsx creado (máx 150 líneas)
- [ ] AIConfig.tsx creado (máx 150 líneas)
- [ ] AIIndicator.tsx creado o modificado (máx 80 líneas)
- [ ] Todos usan React 19 + TypeScript strict
- [ ] Props bien tipadas con interfaces
- [ ] Styling con Tailwind CSS
- [ ] Responsive design (mobile/tablet/desktop)
- [ ] Accesibilidad (labels, aria-, contrast)

**Funcionalidad:**
- [ ] AIStatus muestra estado en tiempo real
- [ ] AIConfig permite cambiar modelo/temperatura/tokens
- [ ] AIIndicator muestra IA actual en header
- [ ] Mensajes de error/éxito claros
- [ ] Loading states adecuados

**Integración:**
- [ ] Build: `npm run build` → ✅ SUCCESS
- [ ] No hay nuevos lint errors en componentes
- [ ] TypeScript strict mode cumplido
- [ ] Funciona con rutas API (/api/admin/ai-status, /api/admin/ai-config)

---

## 📐 UBICACIÓN EN DASHBOARD

**Sugerencia de ubicación:**

```
/admin (Dashboard principal)
├─ /analytics (Estadísticas)
├─ /ai          ← AQUÍ VA Component 3B
│  ├─ page.tsx (Panel principal)
│  └─ components/
│     ├─ AIStatus.tsx (NUEVO)
│     ├─ AIConfig.tsx (NUEVO)
│     └─ (otros componentes existentes)
├─ /inbox
├─ /settings
└─ components/
   ├─ AdminHeader.tsx (agregar AIIndicator aquí o crear nuevo)
   └─ (otros componentes)
```

---

## 🧪 TESTING

No es obligatorio en Component 3B (es UI), pero sería bueno:

```typescript
// Ejemplo de test snapshot
import { render } from '@testing-library/react'
import AIStatus from '@/app/admin/ai/components/AIStatus'

test('AIStatus renders correctly', () => {
  const { container } = render(<AIStatus />)
  expect(container).toMatchSnapshot()
})
```

---

## 📧 REPORTE ESPERADO

Cuando termines, reporta así:

```markdown
# REPORTE COMPONENT 3B - QWEN

## Status: ✅ COMPLETADO

### Componentes Creados/Modificados
- ✅ app/admin/ai/components/AIStatus.tsx (NUEVO - XX líneas)
- ✅ app/admin/ai/components/AIConfig.tsx (NUEVO - XX líneas)
- ✅ app/admin/components/AIIndicator.tsx (NUEVO/MODIFICADO - XX líneas)

### Funcionalidad
- ✅ Status badge con indicador online/offline
- ✅ Configuración de modelo, temperatura, tokens
- ✅ Indicador en header mostrando IA actual
- ✅ Mensajes de error/éxito
- ✅ Loading states

### Responsive Design
- ✅ Mobile (< 640px)
- ✅ Tablet (640px - 1024px)
- ✅ Desktop (> 1024px)

### Build & Lint
- npm run build: ✅ SUCCESS
- npm run lint: ✅ No new errors
- TypeScript: ✅ Strict mode

### Observaciones
[Cualquier nota sobre decisiones de diseño]

### Tiempo gastado
X horas Y minutos
```

---

## 🎨 DESIGN NOTES

**Colores sugeridos:**
- Perplexity: 🧠 Azul (#667eea)
- Claude Fallback: 🤖 Púrpura (#8b5cf6)
- Status Online: Verde (#10b981)
- Status Offline: Rojo (#ef4444)

**Iconografía:**
- Online: ● (círculo verde)
- Offline: ● (círculo rojo)
- Checking: ● (círculo amarillo)

---

## 🚀 PRÓXIMOS PASOS (Para CLAUDE)

Una vez aprobado Component 3B:
1. CODEX: Finalizar Component 3A (WhatsAppService)
2. GEMINI: Integration tests
3. CODEX: Refactorizar webhook route

---

**¿LISTO PARA EMPEZAR?**

Confirma que:
- [ ] Entiendes los 3 componentes a crear
- [ ] Sabes dónde colocarlos
- [ ] Entiendes el design
- [ ] Sabes que necesitas /api/admin/ai-status y /api/admin/ai-config
- [ ] ¿Preguntas? Pregunta ahora

**¡Adelante QWEN! 🎨🚀**
