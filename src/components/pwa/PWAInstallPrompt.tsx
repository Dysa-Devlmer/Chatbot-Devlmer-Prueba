'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIOSTip, setShowIOSTip] = useState(false)

  useEffect(() => {
    // 1. Si ya esta instalada y corriendo como standalone app, no mostrar nada
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true

    if (isStandalone) {
      return
    }

    // 2. Si el usuario ya cerro el aviso recientemente (ultimas 24 horas), no insistir
    const dismissedAt = localStorage.getItem('pithy_pwa_dismissed')
    if (dismissedAt) {
      const hoursPassed = (Date.now() - parseInt(dismissedAt, 10)) / (1000 * 60 * 60)
      if (hoursPassed < 24) {
        return
      }
    }

    // 3. Detectar iOS (Safari no emite beforeinstallprompt pero soporta agregar a inicio)
    const ua = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(ua)
    setIsIOS(isAppleDevice)

    // 4. Capturar evento nativo de instalacion en Android / Chrome / Edge
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Mostrar banner tras 2 segundos para no interrumpir la carga inicial
      setTimeout(() => setShowPrompt(true), 1500)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)

    // Si es iOS, mostrar sugerencia tras 3 segundos
    if (isAppleDevice && !isStandalone) {
      setTimeout(() => setShowPrompt(true), 3000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSTip(true)
      return
    }

    if (!deferredPrompt) {
      return
    }

    // Disparar el modal nativo de Android
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setShowIOSTip(false)
    localStorage.setItem('pithy_pwa_dismissed', Date.now().toString())
  }

  if (!showPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-999 animate-in slide-in-from-bottom duration-300">
      <div className="p-4 rounded-2xl bg-slate-900/95 dark:bg-stone-900/95 backdrop-blur-xl border border-orange-500/30 shadow-2xl shadow-orange-950/40 text-white">
        <div className="flex items-start gap-3">
          {/* Logo App */}
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden">
            <Image
              src="/icons/icon-192x192.png"
              alt="App Logo"
              width={44}
              height={44}
              className="rounded-lg object-cover"
            />
          </div>

          {/* Texto y Botones */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h4 className="text-sm font-black text-white truncate">
                Instalar App en tu Celular 📱
              </h4>
              <button
                type="button"
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white p-1 rounded-lg text-xs"
                title="Cerrar aviso"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-300 dark:text-stone-300 mt-0.5 leading-relaxed">
              Pide más rápido y accede directo desde la pantalla de inicio sin usar el navegador.
            </p>

            {/* Tip especial para iOS Safari */}
            {showIOSTip && (
              <div className="mt-2.5 p-2 rounded-lg bg-orange-500/15 border border-orange-500/30 text-[11px] text-orange-200">
                👉 Para instalar en iPhone: Toca el botón <strong>Compartir</strong> (ícono cuadrado con flecha abajo) y selecciona <strong>&quot;Agregar a pantalla de inicio&quot;</strong>.
              </div>
            )}

            {/* Acciones */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 py-2 px-3.5 rounded-xl bg-orange-500 hover:bg-orange-600 active:scale-95 text-white font-black text-xs shadow-lg shadow-orange-500/25 transition-all text-center cursor-pointer"
              >
                {isIOS ? '¿Cómo instalar en iPhone?' : '⚡ Instalar App Gratis'}
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Ahora no
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
