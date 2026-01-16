'use client'

import { useEffect, useState } from 'react'

type Provider = 'perplexity' | 'claude' | 'fallback'

type Status = 'active' | 'inactive' | 'error'

export default function AIIndicator() {
  const [provider, setProvider] = useState<Provider>('fallback')
  const [status, setStatus] = useState<Status>('inactive')

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
      setStatus('error')
    }
  }

  const statusColor = {
    active: 'bg-green-500',
    inactive: 'bg-yellow-500',
    error: 'bg-red-500'
  }[status]

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
      <div className={`w-2 h-2 rounded-full ${statusColor}`}></div>
      <span className="text-sm font-semibold">
        {provider === 'perplexity' && 'Perplexity'}
        {provider === 'claude' && 'Claude (Fallback)'}
        {provider === 'fallback' && 'Fallback'}
      </span>
    </div>
  )
}
