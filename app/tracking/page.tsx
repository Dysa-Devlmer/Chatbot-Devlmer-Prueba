'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { 
  ArrowLeft, 
  Flame, 
  Check, 
  Timer, 
  Clock, 
  Bike, 
  Home, 
  Phone, 
  MessageSquare, 
  Receipt, 
  ChevronDown, 
  MapPin, 
  ShieldCheck, 
  UtensilsCrossed, 
  Sparkles,
  HelpCircle,
  FileText,
  UserCheck
} from 'lucide-react';

interface TrackingTimelineStep {
  id: string;
  title: string;
  time: string;
  desc: string;
  status: 'done' | 'active' | 'pending';
  icon: typeof Flame;
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get('order') || 'CR-8492';
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // Timeline steps
  const steps: TrackingTimelineStep[] = [
    {
      id: 'step-1',
      title: 'Pedido Confirmado',
      time: '10:45 PM',
      desc: 'Recibido e ingresado al sistema de Churu\'s.',
      status: 'done',
      icon: Check,
    },
    {
      id: 'step-2',
      title: 'Crujiendo en Cocina',
      time: '10:50 PM',
      desc: 'Dorando tu pollo broaster artesanal y papas nativas crujientes a la perfección.',
      status: 'active',
      icon: Flame,
    },
    {
      id: 'step-3',
      title: 'Repartidor en Camino',
      time: '~11:05 PM',
      desc: 'Embalado térmico para mantenerlo caliente y crocante.',
      status: 'pending',
      icon: Bike,
    },
    {
      id: 'step-4',
      title: '¡Entregado y a disfrutar!',
      time: '--:--',
      desc: '¡Buen provecho con ese ají y salsas especiales!',
      status: 'pending',
      icon: Home,
    },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#141312] text-slate-900 dark:text-[#e6e1df] font-sans flex flex-col selection:bg-orange-500 selection:text-white pb-24 transition-colors duration-200">
      
      {/* 1. Header Bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-[#141312]/90 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 shadow-[0_4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)]">
        <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link 
              href="/checkout"
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-slate-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 active:scale-95 transition-all shrink-0"
              title="Volver al checkout"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Churu's Logo Badge */}
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30 shrink-0">
              C
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 truncate">
                Paso de Orden
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                Seguimiento En Vivo
              </h1>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs shrink-0">
            🇵🇪
          </div>
        </div>
      </header>

      {/* 2. Main Tracking Content */}
      <main className="flex-1 flex flex-col relative w-full max-w-lg mx-auto pt-20 px-4 space-y-4">
        
        {/* Ambient Glow Underlay */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Hero Status Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-lg">
          {/* Internal ambient glow */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#84cc16]/10 dark:bg-[#94de2d]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            
            {/* Animated Sizzle Icon */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-lg animate-ping opacity-60" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg relative text-white">
                <Flame className="w-8 h-8 fill-amber-300 text-amber-300 animate-pulse" />
              </div>
              <span className="absolute -bottom-1 -right-1 bg-[#84cc16] dark:bg-[#94de2d] text-stone-950 rounded-full p-1 shadow flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </div>

            {/* Live Indicator Pill */}
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400 text-xs font-black tracking-wide border border-amber-300/40 dark:border-amber-700/40">
                <span className="w-2 h-2 rounded-full bg-[#84cc16] dark:bg-[#94de2d] animate-pulse" />
                PEDIDO ACTIVO • EN TIEMPO REAL
              </span>
            </div>

            <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              ¡Tu pedido está en marcha!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-300 mt-0.5">
              Orden <span className="font-extrabold text-slate-900 dark:text-white">#{orderNumber}</span>
            </p>

            {/* ETA Badge Box */}
            <div className="w-full mt-4 p-3.5 bg-stone-100 dark:bg-stone-800/80 rounded-2xl flex items-center justify-between border border-stone-200/80 dark:border-stone-700/60 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-white dark:bg-stone-700 flex items-center justify-center text-orange-600 dark:text-orange-400 shadow-2xs">
                  <Timer className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[10px] font-black uppercase text-slate-500 dark:text-stone-400">
                    Tiempo Estimado
                  </span>
                  <span className="block text-sm sm:text-base font-black text-orange-600 dark:text-orange-400">
                    25 - 35 min
                  </span>
                </div>
              </div>

              <div className="text-right pr-1">
                <span className="block text-[10px] font-black uppercase text-slate-500 dark:text-stone-400">
                  Entrega Aprox.
                </span>
                <span className="block text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  11:15 PM
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* 3. Live Stepper Tracker (Timeline de 4 Etapas) */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <h3 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                Estado de la Cocina
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300">
              4 etapas
            </span>
          </div>

          <div className="relative pl-7 space-y-4">
            {/* Background continuous line */}
            <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-stone-200 dark:bg-stone-800" />
            {/* Active completed line up to step 2 */}
            <div className="absolute left-3 top-2 h-16 w-0.5 bg-[#84cc16] dark:bg-[#94de2d]" />

            {/* Step 1: Confirmed */}
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-[#84cc16] dark:bg-[#94de2d] flex items-center justify-center text-stone-950 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    Pedido Confirmado
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-stone-400">10:45 PM</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-stone-400 mt-0.5">
                  Recibido en el sistema de Churu&apos;s.
                </p>
              </div>
            </div>

            {/* Step 2: Crujiendo en Cocina (Activo) */}
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md ring-4 ring-orange-500/20 animate-pulse">
                <Flame className="w-3.5 h-3.5 fill-white" />
              </div>
              <div className="flex-1 min-w-0 bg-stone-50 dark:bg-stone-800/70 p-3 rounded-2xl border border-orange-200 dark:border-orange-950/60 shadow-2xs">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="font-black text-xs sm:text-sm text-orange-600 dark:text-orange-400">
                    Crujiendo en Cocina
                  </h4>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#84cc16] dark:text-[#94de2d] bg-[#84cc16]/10 dark:bg-[#94de2d]/15 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] dark:bg-[#94de2d] animate-ping" />
                    En progreso
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-stone-200 mt-1">
                  Dorando tu pollo broaster artesanal y papas nativas crujientes a la perfección.
                </p>
                {/* Progress bar */}
                <div className="w-full bg-stone-200 dark:bg-stone-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-500 to-[#84cc16] h-full w-3/4 rounded-full transition-all duration-500" />
                </div>
              </div>
            </div>

            {/* Step 3: Courier on the Way (Pending) */}
            <div className="relative flex items-start gap-3 opacity-60">
              <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                <Bike className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-stone-300">
                    Repartidor en Camino
                  </h4>
                  <span className="text-[11px] text-stone-400">~11:05 PM</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  Embalado térmico para mantenerlo caliente y crocante.
                </p>
              </div>
            </div>

            {/* Step 4: Delivered (Pending) */}
            <div className="relative flex items-start gap-3 opacity-40">
              <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-stone-200 dark:bg-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-400">
                <Home className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-800 dark:text-stone-300">
                    ¡Entregado y a disfrutar!
                  </h4>
                  <span className="text-[11px] text-stone-400">--:--</span>
                </div>
                <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                  ¡Buen provecho con ese ají especial!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Driver Partner Card */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 sm:p-5 shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-stone-400">
              Tu Repartidor Asignado
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#84cc16] dark:text-[#94de2d]">
              <span className="w-2 h-2 rounded-full bg-[#84cc16] dark:bg-[#94de2d]" />
              En ruta hacia local
            </span>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Driver Avatar */}
            <div className="relative shrink-0">
              <img 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCX5E777w7C5HaKHVrgxACb4ErGDa2x7uWKyhvtFR8mXm5fF-SqdJblyWFySdGOuy7VEuy725E74z5gug95W43I0qpzrKdYbZfHqWOHuWmxD4cvkHvcRaAR-c9EKT8NU4rHACwvENpCi2OftQJs5NuVAAZb8cu1go56dGgyG9igI9VdP-b-DoKcLNPlb017KopyTBb8W3jd3-x2Oamh_wqaYcO_QZYNZiTmEZotKkK6" 
                alt="Carlos Mendoza - Repartidor Churu's" 
                className="w-14 h-14 rounded-full object-cover shadow-sm border border-stone-200 dark:border-stone-700"
              />
              <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#84cc16] dark:bg-[#94de2d] border-2 border-white dark:border-stone-900 flex items-center justify-center text-[10px] text-stone-950 font-black">
                ✓
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
                Carlos Mendoza
              </h4>
              <div className="flex items-center gap-1 text-amber-500 mt-0.5">
                <span className="text-xs">★</span>
                <span className="text-xs font-black text-slate-900 dark:text-white">4.9</span>
                <span className="text-[11px] text-slate-500 dark:text-stone-400">(420 entregas)</span>
              </div>
              <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 dark:text-stone-300">
                <Bike className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400 shrink-0" />
                <span className="truncate">Moto Honda Blanca • Placa 4821-B</span>
              </div>
            </div>
          </div>

          {/* Quick Contact Actions */}
          <div className="grid grid-cols-2 gap-2.5 mt-4">
            <a 
              href="tel:+51922931433" 
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 active:scale-95 transition-all text-slate-900 dark:text-white font-bold text-xs"
            >
              <Phone className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              <span>Llamar</span>
            </a>

            <a 
              href={`https://wa.me/51922931433?text=${encodeURIComponent(`Hola Carlos, te escribo por mi pedido de Churu's #${orderNumber}`)}`}
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 py-3 px-3 rounded-2xl bg-[#84cc16] hover:bg-[#72b513] dark:bg-[#94de2d] dark:hover:bg-[#83c923] active:scale-95 transition-all text-stone-950 font-black text-xs shadow-xs"
            >
              <MessageSquare className="w-4 h-4 fill-stone-950" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* 5. Order Details Accordion */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 overflow-hidden shadow-md">
          <button 
            type="button"
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left active:bg-stone-50 dark:active:bg-stone-800 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                  Resumen del Pedido (1 plato)
                </h4>
                <span className="text-xs text-[#84cc16] dark:text-[#94de2d] font-bold">
                  Total: S/. 29.00 • Pagado con Yape
                </span>
              </div>
            </div>

            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
              isAccordionOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isAccordionOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-stone-100 dark:border-stone-800 pt-3 animate-in fade-in duration-200">
              
              {/* Dish Preview */}
              <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex gap-3 items-center">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyqtna8vMw9z0Q9RyrdQpwiEP3Q8FFS9FWcAv_lhKR12BU_f6kgDiOVmY7jNN05P6eGHBjqo_752tcUsJ3P0CwaoFmtK_I4wSi1mYnRWGKSeUNHXpuC0mmtkViDYkA4phnZPdRn80kitHt-IKjDn0DbXfqngJ8g1leXdagvzBDjvZs1kxhzQ5tNlJolk11KsT3e6X7r8nEfQKL04tyyfj5en-gKWCyJL-1SLwX6yFE" 
                  alt="Broaster Pecho Clásico" 
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400">
                      1x
                    </span>
                    <span className="text-xs font-black text-[#84cc16] dark:text-[#94de2d]">
                      S/. 29.00
                    </span>
                  </div>
                  <h5 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate mt-0.5">
                    Broaster Pecho Clásico
                  </h5>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400 line-clamp-1 mt-0.5">
                    + Salchibroaster + Papas nativas + Inca Kola 500ml + Tártara, Ají y Mayo.
                  </p>
                </div>
              </div>

              {/* Delivery Meta */}
              <div className="space-y-2 text-xs">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-stone-400 block text-[10px] font-bold uppercase">
                      Dirección de Entrega:
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      Av. Las Palmeras 452, Dpto 302, Los Olivos
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#84cc16] dark:text-[#94de2d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-stone-400 block text-[10px] font-bold uppercase">
                      Método de Pago:
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      Yape Directo (Operación #94012)
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* 6. Garantía Crujiente Card */}
        <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-4 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#84cc16]/10 dark:bg-[#94de2d]/15 text-[#84cc16] dark:text-[#94de2d] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                Garantía Crujiente Churu&apos;s
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                Si llega tibio o frío, ¡te reenviamos otro sin costo!
              </p>
            </div>
          </div>
          <Flame className="w-5 h-5 text-orange-500 shrink-0" />
        </div>

        {/* 7. Action Buttons */}
        <div className="space-y-2 pt-2">
          {/* Boleta Button */}
          <button 
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="w-full h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <FileText className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>Ver Boleta Electrónica</span>
          </button>

          {/* Support Button */}
          <a 
            href={`https://wa.me/51922931433?text=${encodeURIComponent(`Hola Churu's, tengo una consulta sobre mi pedido #${orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition-all"
          >
            <HelpCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>¿Necesitas ayuda con tu pedido?</span>
          </a>

          {/* Back to Menu Primary Action */}
          <Link 
            href="/admin/products"
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-98 transition-all mt-3"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>Volver al Menú Principal</span>
          </Link>
        </div>

      </main>

      {/* Invoice Modal Simulation */}
      {showInvoiceModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowInvoiceModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-stone-900 text-slate-900 dark:text-white rounded-3xl p-6 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-3">
              <div>
                <h3 className="font-black text-base">Boleta Electrónica B001-{orderNumber.replace(/[^0-9]/g, '') || '008492'}</h3>
                <span className="text-[11px] text-slate-500 dark:text-stone-400">RUC 20608941231 • Churu&apos;s S.A.C.</span>
              </div>
              <button 
                type="button" 
                onClick={() => setShowInvoiceModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Fecha y Hora:</span>
                <span className="font-bold">20/11/2026 10:45 PM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Cliente:</span>
                <span className="font-bold">Consumidor Final</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Método de Pago:</span>
                <span className="font-bold text-[#84cc16] dark:text-[#94de2d]">YAPE (Op. #94012)</span>
              </div>
              <div className="border-t border-stone-200 dark:border-stone-800 pt-2 flex justify-between font-black text-sm">
                <span>TOTAL PAGADO:</span>
                <span className="text-orange-600 dark:text-orange-400">S/. 29.00</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInvoiceModal(false)}
              className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-md"
            >
              Cerrar Ticket
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

export default function OrderTrackingPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen bg-stone-50 dark:bg-[#141312] text-slate-500 text-xs font-bold">
        Cargando seguimiento de tu pedido...
      </div>
    }>
      <OrderTrackingContent />
    </Suspense>
  );
}
