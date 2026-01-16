'use client'

import { useEffect, useState } from 'react'

interface AIStatusInfo {
  configured: boolean
  provider: 'perplexity' | 'claude' | 'fallback'
  model: string
  lastUsed: string | null
  responseTime: number | null
  status: 'active' | 'inactive' | 'error'
  message?: string
}

export default function AIStatus() {
  const [status, setStatus] = useState<AIStatusInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAIStatus()
    const interval = setInterval(fetchAIStatus, 30000)
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

  const statusColor =
    status?.status === 'active'
      ? 'bg-green-500'
      : status?.status === 'inactive'
        ? 'bg-yellow-500'
        : 'bg-red-500'

  const statusLabel =
    status?.status === 'active'
      ? 'En linea'
      : status?.status === 'inactive'
        ? 'Inactivo'
        : 'Error'

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-bold mb-4">Estado de IA</h2>

      <div className="flex items-center gap-4 mb-4">
        <div className={`w-4 h-4 rounded-full ${statusColor}`}></div>
        <div>
          <p className="font-semibold">
            {loading ? 'VERIFICANDO...' : status?.provider?.toUpperCase() || 'SIN PROVEEDOR'}
          </p>
          <p className="text-sm text-gray-600">
            {loading ? 'Cargando...' : statusLabel}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="border-l-4 border-blue-500 pl-4">
          <p className="text-xs text-gray-600">Modelo</p>
          <p className="font-semibold">{status?.model}</p>
        </div>
        <div className="border-l-4 border-green-500 pl-4">
          <p className="text-xs text-gray-600">Ultimo Usado</p>
          <p className="font-semibold">
            {status?.lastUsed ? new Date(status.lastUsed).toLocaleTimeString() : 'N/A'}
          </p>
        </div>
        <div className="border-l-4 border-purple-500 pl-4">
          <p className="text-xs text-gray-600">Tiempo de Respuesta</p>
          <p className="font-semibold">
            {status?.responseTime ? `${status.responseTime}ms` : 'N/A'}
          </p>
        </div>
        <div className="border-l-4 border-yellow-500 pl-4">
          <p className="text-xs text-gray-600">Configurado</p>
          <p className="font-semibold">{status?.configured ? 'Si' : 'No'}</p>
        </div>
      </div>

      {!status?.configured && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            Perplexity no esta configurado. Verifica las API keys.
          </p>
        </div>
      )}
    </div>
  )
}
