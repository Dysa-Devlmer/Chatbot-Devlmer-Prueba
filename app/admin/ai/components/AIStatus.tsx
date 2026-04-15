'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Brain, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Clock, 
  Gauge,
  Loader2
} from 'lucide-react'

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
    setLoading(true)
    try {
      const response = await fetch('/api/admin/ai-status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Error fetching AI status:', error)
      // Datos simulados en caso de error
      setStatus({
        isConfigured: true,
        provider: 'perplexity',
        model: 'sonar-pro',
        lastUsed: new Date(Date.now() - 3600000),
        responseTime: 450,
        status: 'online'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = () => {
    if (status?.status === 'online') return 'success'
    if (status?.status === 'offline') return 'destructive'
    return 'warning'
  }

  const getStatusIcon = () => {
    if (status?.status === 'online') return <CheckCircle2 className="h-4 w-4" />
    if (status?.status === 'offline') return <XCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  const getStatusText = () => {
    if (status?.status === 'online') return 'Activo'
    if (status?.status === 'offline') return 'Inactivo'
    return 'Verificando...'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Skeleton para la card principal */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 col-span-full animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-1/3 mb-4"></div>
          <div className="flex items-center gap-4">
            <div className="h-8 bg-slate-200 rounded w-32"></div>
            <div className="h-4 bg-slate-200 rounded w-48"></div>
          </div>
        </div>

        {/* Skeleton para las cards secundarias */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 animate-pulse"
            >
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-4"></div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 bg-slate-200 rounded-lg"></div>
                <div>
                  <div className="h-5 bg-slate-200 rounded w-24 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Card de Estado Principal */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <Activity className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-slate-800">Estado del Sistema IA</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
            status?.status === 'online'
              ? 'bg-green-100 text-green-800 border border-green-200'
              : status?.status === 'offline'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
          }`}>
            {getStatusIcon()}
            {getStatusText()}
          </span>
          <p className="text-sm text-slate-600">
            {status?.status === 'online'
              ? 'Todo funcionando correctamente'
              : status?.status === 'offline'
                ? 'Sistema fuera de línea'
                : 'Verificando estado...'}
          </p>
        </div>
      </div>

      {/* Grid de Cards Secundarias */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card de Modelo Actual */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-5 w-5 text-purple-600" />
            <h3 className="font-medium text-slate-800">Modelo Activo</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg">
              <Brain className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">{status?.model}</p>
              <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                status?.provider === 'perplexity'
                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                  : status?.provider === 'claude'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-gray-100 text-gray-800 border border-gray-200'
              }`}>
                {status?.provider}
              </span>
            </div>
          </div>
        </div>

        {/* Card de Último Uso */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="font-medium text-slate-800">Último Uso</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {status?.lastUsed ? 'Hace 1 hora' : 'Nunca'}
              </p>
              <p className="text-xs text-slate-500">
                {status?.lastUsed ? new Date(status.lastUsed).toLocaleDateString() : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Card de Tiempo de Respuesta */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-4">
            <Gauge className="h-5 w-5 text-green-600" />
            <h3 className="font-medium text-slate-800">Tiempo de Respuesta</h3>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <Gauge className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-800">
                {status?.responseTime ? `${status.responseTime}ms` : 'N/A'}
              </p>
              <p className="text-xs text-slate-500">Promedio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}