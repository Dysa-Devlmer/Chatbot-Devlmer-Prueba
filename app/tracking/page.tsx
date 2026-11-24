'use client';

import { useState, useEffect, Suspense } from 'react';
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
  HelpCircle,
  FileText,
  RefreshCw,
  Store,
  Printer,
  QrCode,
  Mail
} from 'lucide-react';

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface TrackingData {
  id: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
  totalAmount: number;
  isDelivery: boolean;
  deliveryType: 'delivery' | 'pickup';
  paymentMethod?: string;
  customerEmail?: string;
  invoiceType?: string;
  address: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  business: {
    name: string;
    ruc: string;
    address: string;
    currencySymbol: string;
  };
  driver?: {
    name: string;
    rating: number;
    deliveriesCount: number;
    vehicle: string;
    phone: string;
  } | null;
}

function OrderTrackingContent() {
  const searchParams = useSearchParams();
  const rawOrder = searchParams?.get('order') || 'ORD-1004';
  const orderNumber = rawOrder.trim().toUpperCase();

  const [orderData, setOrderData] = useState<TrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchTracking = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch(`/api/tracking?order=${encodeURIComponent(orderNumber)}`);
      const data = await res.json();
      if (data.success && data.tracking) {
        setOrderData(data.tracking);
      }
    } catch (err) {
      console.error('Error fetching tracking data:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTracking();
    const interval = setInterval(() => {
      fetchTracking();
    }, 6000);
    return () => clearInterval(interval);
  }, [orderNumber]);

  const currentStatus = orderData?.status || 'confirmed';
  const isDelivery = orderData ? orderData.isDelivery : true;
  const curr = orderData?.business?.currencySymbol || 'S/.';
  const total = orderData?.totalAmount ?? 29.00;

  // Configuration according to status
  const getStageMeta = () => {
    switch (currentStatus) {
      case 'pending':
        return {
          pill: 'PEDIDO RECIBIDO • EN COLA DE COCINA',
          heroTitle: '¡Tu orden ha sido registrada!',
          progressPct: '25%',
          eta: isDelivery ? '35 - 45 min' : '15 - 25 min',
          etaApprox: 'En breve',
          stepActive: 1,
        };
      case 'confirmed':
        return {
          pill: 'CRUJIENDO EN COCINA • DORANDO POLLO',
          heroTitle: '¡Tu pedido está en el fuego!',
          progressPct: '60%',
          eta: isDelivery ? '25 - 35 min' : '10 - 15 min',
          etaApprox: 'Próximos 20 min',
          stepActive: 2,
        };
      case 'ready':
        return {
          pill: isDelivery ? 'MOTORIZADO EN CAMINO • RUTA ACTIVA' : 'LISTO PARA RETIRAR EN LOCAL',
          heroTitle: isDelivery ? '¡Tu comida va en camino calientita!' : '¡Tu pedido está listo para recoger!',
          progressPct: '85%',
          eta: isDelivery ? '10 - 15 min' : 'Disponible ahora',
          etaApprox: 'Muy pronto',
          stepActive: 3,
        };
      case 'delivered':
        return {
          pill: 'PEDIDO ENTREGADO • ¡BUEN PROVECHO!',
          heroTitle: '¡Disfruta tu banquete Churu\'s!',
          progressPct: '100%',
          eta: 'Completado',
          etaApprox: 'Entregado con éxito',
          stepActive: 4,
        };
      default:
        return {
          pill: 'ESTADO EN CONSULTA',
          heroTitle: 'Seguimiento de orden',
          progressPct: '50%',
          eta: '25 - 35 min',
          etaApprox: 'En proceso',
          stepActive: 2,
        };
    }
  };

  const meta = getStageMeta();

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-[#141312] text-slate-900 dark:text-[#e6e1df] font-sans flex flex-col selection:bg-orange-500 selection:text-white pb-24 transition-colors duration-200">
      
      {/* 1. Header Bar */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/90 dark:bg-[#141312]/90 backdrop-blur-xl border-b border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link 
              href="/menu"
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-slate-700 dark:text-stone-300 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-stone-200/60 dark:hover:bg-stone-800/60 active:scale-95 transition-all shrink-0"
              title="Volver al Menú"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30 shrink-0">
              C
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400 truncate">
                Orden #{orderNumber}
              </span>
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white truncate">
                Seguimiento En Vivo
              </h1>
            </div>
          </div>

          <button
            onClick={() => fetchTracking(true)}
            className="w-9 h-9 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-300 flex items-center justify-center transition-all active:scale-90"
            title="Actualizar estado"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </header>

      {/* 2. Main Tracking Content */}
      <main className="flex-1 flex flex-col relative w-full max-w-lg mx-auto pt-20 px-4 space-y-4">
        
        {/* Ambient Glow Underlay */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Hero Status Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-lg">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 dark:bg-orange-500/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-[#84cc16]/10 dark:bg-[#94de2d]/15 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center text-center">
            
            {/* Animated Sizzle Icon */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full bg-orange-500/30 blur-lg animate-ping opacity-60" />
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg relative text-white">
                {currentStatus === 'delivered' ? (
                  <Check className="w-8 h-8 stroke-[3] text-white" />
                ) : isDelivery && currentStatus === 'ready' ? (
                  <Bike className="w-8 h-8 text-white animate-bounce" />
                ) : !isDelivery && currentStatus === 'ready' ? (
                  <Store className="w-8 h-8 text-white" />
                ) : (
                  <Flame className="w-8 h-8 fill-amber-300 text-amber-300 animate-pulse" />
                )}
              </div>
              <span className="absolute -bottom-1 -right-1 bg-[#84cc16] dark:bg-[#94de2d] text-stone-950 rounded-full p-1 shadow flex items-center justify-center">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </span>
            </div>

            {/* Live Indicator Pill */}
            <div className="mt-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 dark:bg-stone-800 text-amber-700 dark:text-amber-400 text-xs font-black tracking-wide border border-amber-300/40 dark:border-amber-700/40">
                <span className="w-2 h-2 rounded-full bg-[#84cc16] dark:bg-[#94de2d] animate-pulse" />
                {meta.pill}
              </span>
            </div>

            <h2 className="mt-2 text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {meta.heroTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-stone-300 mt-0.5">
              Cliente: <span className="font-extrabold text-slate-900 dark:text-white">{orderData?.customerName || 'Cliente WhatsApp'}</span> • Orden <span className="font-extrabold text-orange-600 dark:text-orange-400">#{orderNumber}</span>
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
                    {meta.eta}
                  </span>
                </div>
              </div>

              <div className="text-right pr-1">
                <span className="block text-[10px] font-black uppercase text-slate-500 dark:text-stone-400">
                  {isDelivery ? 'Entrega Aprox.' : 'Retiro Aprox.'}
                </span>
                <span className="block text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {meta.etaApprox}
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
                Progreso de la Orden
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300">
              {currentStatus === 'delivered' ? '4 de 4 completadas' : 'En tiempo real'}
            </span>
          </div>

          <div className="relative pl-7 space-y-4">
            {/* Background continuous line */}
            <div className="absolute left-3 top-2 bottom-4 w-0.5 bg-stone-200 dark:bg-stone-800" />
            {/* Dynamic completed line */}
            <div 
              className="absolute left-3 top-2 w-0.5 bg-[#84cc16] dark:bg-[#94de2d] transition-all duration-700" 
              style={{
                height: meta.stepActive === 1 ? '15%' : meta.stepActive === 2 ? '45%' : meta.stepActive === 3 ? '75%' : '100%'
              }}
            />

            {/* Step 1: Confirmed */}
            <div className="relative flex items-start gap-3">
              <div className="absolute -left-7 top-0.5 w-6 h-6 rounded-full bg-[#84cc16] dark:bg-[#94de2d] flex items-center justify-center text-stone-950 shadow-xs">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                    1. Pedido Confirmado
                  </h4>
                  <span className="text-[11px] text-slate-500 dark:text-stone-400">
                    {orderData ? new Date(orderData.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) : 'Registrado'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-stone-400 mt-0.5">
                  Recibido e ingresado al sistema de Churu&apos;s.
                </p>
              </div>
            </div>

            {/* Step 2: Crujiendo en Cocina */}
            <div className={`relative flex items-start gap-3 ${meta.stepActive < 2 ? 'opacity-60' : ''}`}>
              <div className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md ${
                meta.stepActive > 2 
                  ? 'bg-[#84cc16] text-stone-950' 
                  : meta.stepActive === 2 
                  ? 'bg-orange-600 text-white ring-4 ring-orange-500/20 animate-pulse' 
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-500'
              }`}>
                {meta.stepActive > 2 ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Flame className="w-3.5 h-3.5 fill-white" />}
              </div>
              <div className={`flex-1 min-w-0 p-3 rounded-2xl border transition-all ${
                meta.stepActive === 2
                  ? 'bg-stone-50 dark:bg-stone-800/70 border-orange-200 dark:border-orange-950/60 shadow-2xs'
                  : 'border-transparent'
              }`}>
                <div className="flex items-center justify-between gap-1">
                  <h4 className={`font-black text-xs sm:text-sm ${meta.stepActive === 2 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                    2. Crujiendo en Cocina
                  </h4>
                  {meta.stepActive === 2 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#84cc16] dark:text-[#94de2d] bg-[#84cc16]/10 dark:bg-[#94de2d]/15 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] dark:bg-[#94de2d] animate-ping" />
                      En preparación
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-stone-300 mt-1">
                  Dorando pollo broaster artesanal y papas nativas crujientes a la perfección.
                </p>
                {meta.stepActive === 2 && (
                  <div className="w-full bg-stone-200 dark:bg-stone-900 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-orange-500 to-[#84cc16] h-full w-2/3 rounded-full transition-all duration-500 animate-pulse" />
                  </div>
                )}
              </div>
            </div>

            {/* Step 3: En Camino / Listo para Retiro */}
            <div className={`relative flex items-start gap-3 ${meta.stepActive < 3 ? 'opacity-60' : ''}`}>
              <div className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                meta.stepActive > 3
                  ? 'bg-[#84cc16] text-stone-950'
                  : meta.stepActive === 3
                  ? 'bg-orange-600 text-white ring-4 ring-orange-500/20 animate-pulse'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
              }`}>
                {meta.stepActive > 3 ? (
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                ) : isDelivery ? (
                  <Bike className="w-3.5 h-3.5" />
                ) : (
                  <Store className="w-3.5 h-3.5" />
                )}
              </div>
              <div className={`flex-1 min-w-0 p-3 rounded-2xl border transition-all ${
                meta.stepActive === 3
                  ? 'bg-stone-50 dark:bg-stone-800/70 border-orange-200 dark:border-orange-950/60 shadow-2xs'
                  : 'border-transparent'
              }`}>
                <div className="flex items-center justify-between">
                  <h4 className={`font-bold text-xs sm:text-sm ${meta.stepActive === 3 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'}`}>
                    {isDelivery ? '3. Repartidor en Camino' : '3. Listo para Retirar en Local'}
                  </h4>
                  {meta.stepActive === 3 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-black text-[#84cc16] dark:text-[#94de2d] bg-[#84cc16]/10 dark:bg-[#94de2d]/15 px-2 py-0.5 rounded-full">
                      ¡Ya salió!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-stone-400 mt-0.5">
                  {isDelivery 
                    ? 'Embalado térmico hermético para mantenerlo crujiente y caliente.' 
                    : 'Empacado y listo en barra esperándote en Av. Los Próceres 458.'}
                </p>
              </div>
            </div>

            {/* Step 4: Entregado */}
            <div className={`relative flex items-start gap-3 ${meta.stepActive < 4 ? 'opacity-60' : ''}`}>
              <div className={`absolute -left-7 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${
                meta.stepActive === 4
                  ? 'bg-[#84cc16] text-stone-950 ring-4 ring-[#84cc16]/20'
                  : 'bg-stone-200 dark:bg-stone-800 text-stone-500 dark:text-stone-400'
              }`}>
                <Home className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={`font-bold text-xs sm:text-sm ${meta.stepActive === 4 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                  4. ¡Entregado y a disfrutar!
                </h4>
                <p className="text-xs text-slate-600 dark:text-stone-400 mt-0.5">
                  ¡Buen provecho con ese ají artesanal y salsas especiales!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Motorizado Card (Si aplica) */}
        {isDelivery && (
          <div className="rounded-3xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 p-5 shadow-md">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Repartidor Oficial Asignado
              </span>
              <span className="text-xs font-bold text-[#84cc16] dark:text-[#94de2d] flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-[#84cc16] dark:bg-[#94de2d] animate-pulse" />
                En ruta
              </span>
            </div>

            <div className="flex items-center gap-3.5">
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
        )}

        {/* 5. Order Details Accordion (Con items reales de la DB) */}
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
                  Detalle del Pedido ({orderData?.items?.length || 1} {orderData?.items?.length === 1 ? 'ítem' : 'ítems'})
                </h4>
                <span className="text-xs text-[#84cc16] dark:text-[#94de2d] font-bold">
                  Total: {curr} {total.toFixed(2)} • {isDelivery ? 'Delivery' : 'Retiro en Local'}
                </span>
              </div>
            </div>

            <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
              isAccordionOpen ? 'rotate-180' : ''
            }`} />
          </button>

          {isAccordionOpen && (
            <div className="px-5 pb-5 space-y-4 border-t border-stone-100 dark:border-stone-800 pt-3 animate-in fade-in duration-200">
              
              {/* Product list */}
              <div className="space-y-2">
                {orderData?.items && orderData.items.length > 0 ? (
                  orderData.items.map((item, idx) => (
                    <div key={idx} className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/60 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 font-black flex items-center justify-center text-[11px]">
                          {item.quantity}x
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                      <span className="font-black text-[#84cc16] dark:text-[#94de2d]">
                        {curr} {item.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/60 text-xs text-stone-500">
                    {orderData?.notes || 'Platos solicitados por WhatsApp'}
                  </div>
                )}
              </div>

              {/* Delivery Meta */}
              <div className="space-y-2 text-xs pt-1 border-t border-stone-100 dark:border-stone-800">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-stone-400 block text-[10px] font-bold uppercase">
                      {isDelivery ? 'Dirección de Entrega:' : 'Punto de Retiro:'}
                    </span>
                    <span className="text-slate-900 dark:text-white font-medium">
                      {orderData?.address || 'Av. Los Próceres 458, Chorrillos'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-2 pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#84cc16] dark:text-[#94de2d] shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-500 dark:text-stone-400 block text-[10px] font-bold uppercase">
                      Modalidad de Pago:
                    </span>
                    <span className="text-slate-900 dark:text-white font-bold text-xs sm:text-sm">
                      {orderData?.paymentMethod || 'Tarjeta / Efectivo'}
                    </span>
                  </div>
                </div>

                {orderData?.customerEmail && (
                  <div className="flex items-start gap-2 pt-1">
                    <Mail className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-500 dark:text-stone-400 block text-[10px] font-bold uppercase">
                        Envío de Comprobante:
                      </span>
                      <span className="text-slate-900 dark:text-white text-xs font-semibold">
                        {orderData.invoiceType || 'Boleta'} a {orderData.customerEmail}
                      </span>
                    </div>
                  </div>
                )}
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
        <div className="space-y-2.5 pt-2">
          {/* Requerimiento UX Móvil: Botón CTA Grande para Reenviar pedido directamente al WhatsApp del local */}
          <a 
            href={`https://wa.me/51922931433?text=${encodeURIComponent(
              `¡Hola Churu's! 👋 Acabo de registrar mi pedido #${orderNumber || orderData?.orderNumber} en la carta digital:\n\n` +
              (orderData?.items?.length ? orderData.items.map(it => `• ${it.quantity}x ${it.name} (${curr} ${it.subtotal.toFixed(2)})`).join('\n') + '\n\n' : '') +
              `💰 Total: ${curr} ${total.toFixed(2)}\n` +
              `💳 Pago: ${orderData?.paymentMethod || 'No especificado'}\n` +
              (orderData?.customerEmail ? `📧 Boleta enviada a: ${orderData.customerEmail}\n` : '') +
              `📍 ${isDelivery ? 'Entrega: ' + (orderData?.address || '') : 'Recojo en Local'}\n` +
              `👤 Cliente: ${orderData?.customerName || 'Cliente Web'}\n\n` +
              `¿Podrían confirmarme la recepción en cocina, por favor? ¡Muchas gracias!`
            )}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-stone-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/25 active:scale-98 transition-all cursor-pointer border border-emerald-400/40"
          >
            <MessageSquare className="w-5 h-5 fill-stone-950 text-stone-950" />
            <span>Enviar pedido directamente al WhatsApp del local</span>
          </a>

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
            href="/menu"
            className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-600/30 active:scale-98 transition-all mt-3"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span>Volver a la Carta Digital</span>
          </Link>
        </div>

      </main>

      {/* Invoice Modal Completo y Formal - Boleta de Venta Electrónica */}
      {showInvoiceModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setShowInvoiceModal(false)}
        >
          <div 
            className="w-full max-w-md bg-white dark:bg-[#18181b] text-slate-900 dark:text-stone-100 rounded-3xl p-5 sm:p-7 border border-stone-200 dark:border-stone-800 shadow-2xl space-y-4 my-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Encabezado Fiscal SUNAT */}
            <div className="text-center border-b border-dashed border-stone-300 dark:border-stone-700 pb-4">
              <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center text-2xl font-black">
                🍗
              </div>
              <h2 className="font-black text-sm sm:text-base tracking-tight text-slate-900 dark:text-white uppercase">
                {orderData?.business?.name || "Churu's Comida Rápida S.A.C."}
              </h2>
              <p className="text-[11px] font-bold text-slate-600 dark:text-stone-400 mt-0.5">
                RUC: {orderData?.business?.ruc || "20608934512"}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-stone-400 max-w-xs mx-auto mt-0.5 leading-tight">
                {orderData?.business?.address || "Jr. Los Libertadores 142 • Delivery Express & Salón"}
              </p>

              {/* Badge Boleta / Factura Electrónica */}
              <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-stone-100 dark:bg-stone-800/80 border border-stone-300 dark:border-stone-700">
                <span className="text-[11px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider block">
                  {orderData?.invoiceType?.toUpperCase().includes('FACTURA') ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {orderData?.invoiceType?.toUpperCase().includes('FACTURA') ? 'F001-' : 'B001-'}{orderNumber.replace(/[^0-9]/g, '').padStart(6, '0') || '001004'}
                </span>
              </div>
            </div>

            {/* Datos del Cliente y Operación */}
            <div className="space-y-1.5 text-xs border-b border-dashed border-stone-300 dark:border-stone-700 pb-3">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Fecha y Hora:</span>
                <span className="font-semibold text-slate-800 dark:text-stone-200">
                  {orderData ? new Date(orderData.createdAt).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' }) : new Date().toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Señor(a):</span>
                <span className="font-bold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {orderData?.customerName || 'Cliente WhatsApp'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Forma de Pago:</span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  {orderData?.paymentMethod || 'No especificado'}
                </span>
              </div>
              {orderData?.customerEmail && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-stone-400">Correo Electrónico:</span>
                  <span className="font-medium text-slate-800 dark:text-stone-200 text-[11px] truncate max-w-[200px]">
                    {orderData.customerEmail}
                  </span>
                </div>
              )}
              {orderData?.invoiceType && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 dark:text-stone-400">Comprobante:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                    {orderData.invoiceType}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-stone-400">Modalidad:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isDelivery ? '🛵 Delivery a Domicilio' : '🏬 Retiro en Local'}
                </span>
              </div>
              {orderData?.address && isDelivery && (
                <div className="flex justify-between items-start gap-2 pt-0.5">
                  <span className="text-slate-500 dark:text-stone-400 shrink-0">Dirección:</span>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-stone-300 text-right leading-tight">
                    {orderData.address}
                  </span>
                </div>
              )}
            </div>

            {/* Detalle Ítems de la Boleta */}
            <div>
              <div className="grid grid-cols-12 text-[10px] font-black uppercase text-slate-400 dark:text-stone-500 pb-1.5 border-b border-stone-200 dark:border-stone-800">
                <span className="col-span-2 text-center">Cant</span>
                <span className="col-span-6">Descripción</span>
                <span className="col-span-2 text-right">P. Unit</span>
                <span className="col-span-2 text-right">Total</span>
              </div>

              <div className="divide-y divide-stone-100 dark:divide-stone-800/60 max-h-48 overflow-y-auto no-scrollbar">
                {orderData?.items && orderData.items.length > 0 ? (
                  orderData.items.map((it, idx) => (
                    <div key={idx} className="grid grid-cols-12 py-1.5 text-xs items-center">
                      <span className="col-span-2 text-center font-bold text-slate-700 dark:text-stone-300">
                        {it.quantity}
                      </span>
                      <div className="col-span-6 pr-1">
                        <span className="font-semibold text-slate-900 dark:text-stone-100 block leading-tight truncate">
                          {it.name}
                        </span>
                      </div>
                      <span className="col-span-2 text-right text-slate-500 dark:text-stone-400 text-[11px]">
                        {it.unitPrice.toFixed(2)}
                      </span>
                      <span className="col-span-2 text-right font-bold text-slate-900 dark:text-white text-xs">
                        {it.subtotal.toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="grid grid-cols-12 py-2 text-xs items-center">
                    <span className="col-span-2 text-center font-bold">1</span>
                    <span className="col-span-6 font-semibold">Consumo Gastronómico</span>
                    <span className="col-span-2 text-right">{total.toFixed(2)}</span>
                    <span className="col-span-2 text-right font-bold">{total.toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desglose Contable e Impuestos */}
            <div className="border-t border-dashed border-stone-300 dark:border-stone-700 pt-3 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 dark:text-stone-400">
                <span>Op. Gravada (Base imponible):</span>
                <span>{curr} {(total / 1.18).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-stone-400">
                <span>I.G.V. (18%):</span>
                <span>{curr} {(total - (total / 1.18)).toFixed(2)}</span>
              </div>
              {isDelivery && (
                <div className="flex justify-between text-slate-600 dark:text-stone-400">
                  <span>Servicio de Delivery:</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Incluido</span>
                </div>
              )}
              <div className="flex justify-between text-base font-black text-slate-900 dark:text-white pt-1.5 border-t border-stone-200 dark:border-stone-800">
                <span>IMPORTE TOTAL:</span>
                <span className="text-orange-600 dark:text-orange-400">{curr} {total.toFixed(2)}</span>
              </div>
            </div>

            {/* Código Hash y QR de Validación Fiscal */}
            <div className="p-2.5 rounded-2xl bg-stone-50 dark:bg-stone-900/90 border border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-stone-500 block">
                  Código Hash SUNAT:
                </span>
                <span className="text-[10px] font-mono text-slate-600 dark:text-stone-300 block truncate">
                  4a8f9c12b7e53f19d20c4e88b6f3a09c
                </span>
                <span className="text-[9px] text-slate-400 dark:text-stone-500 block mt-0.5">
                  Representación impresa de la Boleta de Venta Electrónica
                </span>
              </div>
              <div className="w-10 h-10 rounded-lg bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 flex items-center justify-center shrink-0">
                <QrCode className="w-7 h-7 text-slate-800 dark:text-stone-200" />
              </div>
            </div>

            {/* Acciones: Imprimir / Descargar & Cerrar */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-3 px-4 rounded-xl bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-900 dark:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <Printer className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                <span>Imprimir / PDF</span>
              </button>
              <button
                type="button"
                onClick={() => setShowInvoiceModal(false)}
                className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md shadow-orange-600/25 transition-all active:scale-95"
              >
                Cerrar
              </button>
            </div>
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
