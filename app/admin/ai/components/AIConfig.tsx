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