'use client'

import { useState } from 'react'
import { 
  Settings, 
  Sparkles, 
  Zap, 
  Shield, 
  InfoIcon, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Save, 
  Loader2 
} from 'lucide-react'

interface AIConfig {
  model: string
  temperature: number
  maxTokens: number
}

export default function AIConfig() {
  const [config, setConfig] = useState<AIConfig>({
    model: 'sonar-pro',
    temperature: 0.7,
    maxTokens: 1000
  })
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
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
      setIsSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Configuración de Perplexity</h2>
        </div>
        <p className="text-sm text-slate-600">
          Ajusta los parámetros del modelo de IA
        </p>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      <div className="space-y-6">
        {/* Selector de Modelo */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Modelo</label>
          <div className="relative">
            <button
              type="button"
              className="w-full flex items-center justify-between px-3 py-2 border border-slate-300 rounded-lg bg-white text-left hover:bg-slate-50 transition-colors"
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
            >
              <div className="flex items-center gap-2">
                {config.model === 'sonar-pro' && <Sparkles className="h-4 w-4 text-yellow-500" />}
                {config.model === 'sonar' && <Zap className="h-4 w-4 text-blue-500" />}
                {config.model === 'claude-sonnet' && <Shield className="h-4 w-4 text-purple-500" />}
                <span className="capitalize">
                  {config.model === 'sonar-pro' ? 'Sonar Pro' :
                   config.model === 'sonar' ? 'Sonar' : 'Claude 3.5 Sonnet'}
                </span>
              </div>
              {isModelDropdownOpen ?
                <ChevronUp className="h-4 w-4 text-slate-500" /> :
                <ChevronDown className="h-4 w-4 text-slate-500" />
              }
            </button>

            {isModelDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg">
                <button
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    setConfig({...config, model: 'sonar-pro'})
                    setIsModelDropdownOpen(false)
                  }}
                >
                  <Sparkles className="h-4 w-4 text-yellow-500" />
                  <span>Sonar Pro</span>
                  <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    Recomendado
                  </span>
                </button>
                <button
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    setConfig({...config, model: 'sonar'})
                    setIsModelDropdownOpen(false)
                  }}
                >
                  <Zap className="h-4 w-4 text-blue-500" />
                  <span>Sonar</span>
                </button>
                <button
                  className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2"
                  onClick={() => {
                    setConfig({...config, model: 'claude-sonnet'})
                    setIsModelDropdownOpen(false)
                  }}
                >
                  <Shield className="h-4 w-4 text-purple-500" />
                  <span>Claude 3.5 Sonnet</span>
                  <span className="ml-auto text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                    Fallback
                  </span>
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-slate-500">
            Sonar Pro: Mejor calidad, más rápido. Claude: Fallback automático.
          </p>
        </div>

        {/* Slider de Temperatura */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700">Temperatura</label>
            <span className="text-sm font-mono bg-slate-100 px-2 py-1 rounded">
              {config.temperature.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={config.temperature}
            onChange={(e) => setConfig({...config, temperature: parseFloat(e.target.value)})}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-slate-500">
            <span>Más determinístico</span>
            <span>Más creativo</span>
          </div>
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <InfoIcon className="h-4 w-4 text-blue-600" />
              <p className="text-sm text-blue-800">
                Más baja = más determinística. Más alta = más creativa.
              </p>
            </div>
          </div>
        </div>

        {/* Input de Tokens */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Máximo de Tokens</label>
          <div className="relative">
            <input
              type="number"
              value={config.maxTokens}
              onChange={(e) => setConfig({...config, maxTokens: parseInt(e.target.value) || 1000})}
              min="100"
              max="4000"
              step="100"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="group relative inline-block">
                <HelpCircle className="h-4 w-4 text-slate-400 hover:text-slate-600 cursor-help" />
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block bg-slate-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                  1 token ≈ 4 caracteres
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(config.maxTokens / 4000) * 100}%` }}
            ></div>
          </div>
          <p className="text-xs text-slate-500">
            {config.maxTokens} / 4000 tokens ({Math.round(config.maxTokens * 4)} caracteres aprox.)
          </p>
        </div>

        {/* Botón de Guardar */}
        <div className="pt-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}