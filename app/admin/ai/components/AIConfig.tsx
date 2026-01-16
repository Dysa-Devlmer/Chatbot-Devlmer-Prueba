'use client'

import { useState } from 'react'

export default function AIConfig() {
  const [model, setModel] = useState('sonar-pro')
  const [temperature, setTemperature] = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(1000)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

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
        <div className="relative">
          <button
            type="button"
            className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-left flex justify-between items-center"
            onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          >
            <span>
              {model === 'sonar-pro' && 'Sonar Pro (Recomendado)'}
              {model === 'sonar' && 'Sonar'}
              {model === 'claude-3-5-sonnet' && 'Claude 3.5 Sonnet (Fallback)'}
            </span>
            <svg
              className={`h-4 w-4 transition-transform ${isModelDropdownOpen ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {isModelDropdownOpen && (
            <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded shadow-lg">
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setModel('sonar-pro')
                  setIsModelDropdownOpen(false)
                }}
              >
                Sonar Pro (Recomendado)
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setModel('sonar')
                  setIsModelDropdownOpen(false)
                }}
              >
                Sonar
              </div>
              <div
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => {
                  setModel('claude-3-5-sonnet')
                  setIsModelDropdownOpen(false)
                }}
              >
                Claude 3.5 Sonnet (Fallback)
              </div>
            </div>
          )}
        </div>
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