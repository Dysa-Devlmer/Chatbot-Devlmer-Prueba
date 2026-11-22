'use client'

import { useEffect, useState } from 'react'

type Provider = 'gemini' | 'perplexity' | 'claude' | 'fallback'
type Status = 'active' | 'inactive' | 'error'

export default function AIIndicator() {
  const [provider, setProvider] = useState<Provider>('gemini')
  const [status, setStatus] = useState<Status>('active')
  const [model, setModel] = useState<string>('gemini-3.5-flash')

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 45000)
    return () => clearInterval(interval)
  }, [])

  async function fetchStatus() {
    try {
      const response = await fetch('/api/admin/ai-status')
      if (response.ok) {
        const data = await response.json()
        setProvider(data.provider || 'gemini')
        setStatus(data.status || 'active')
        if (data.model) setModel(data.model)
      }
    } catch {
      setStatus('active')
      setProvider('gemini')
    }
  }

  const isGemini = provider === 'gemini'
  const isHealthy = status === 'active'

  return (
    <div 
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold transition-all shadow-xs ${
        isHealthy && isGemini
          ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
          : isHealthy && provider === 'perplexity'
          ? 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
          : 'bg-amber-950/60 border-amber-500/40 text-amber-300'
      }`}
      title={`Motor IA: ${isGemini ? 'Google Gemini' : provider} (${model}) • Estado: ${status}`}
    >
      <span className={`w-2 h-2 rounded-full shrink-0 ${
        isHealthy ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
      }`} />
      <span className="tracking-tight text-[11px]">
        {isGemini ? 'Gemini Flash' : provider === 'perplexity' ? 'Perplexity' : 'IA Respaldo'}
      </span>
    </div>
  )
}
