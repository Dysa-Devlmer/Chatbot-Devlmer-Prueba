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