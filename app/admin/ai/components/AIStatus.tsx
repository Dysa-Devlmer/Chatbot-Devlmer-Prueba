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