'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bike, 
  Store, 
  MapPin, 
  Trash2, 
  X, 
  Plus, 
  Minus, 
  Check, 
  Flame, 
  Sparkles, 
  ShoppingBag, 
  TicketPercent, 
  CreditCard, 
  Banknote, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Loader2,
  Share2,
  Navigation,
  Copy,
  Compass,
  Lock
} from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  variant: string;
  basePrice: number;
  quantity: number;
  imageUrl: string;
  description: string;
  isSalchibroaster: boolean;
  salchibroasterPrice: number;
  sauces: string[];
  drinks: { name: string; price: number }[];
}

interface UpsellItem {
  id: string;
  name: string;
  tag: string;
  description: string;
  price: number;
  imageUrl: string;
  added: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  // Delivery Mode
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  
  // Cart Item State
  const [itemQty, setItemQty] = useState(1);
  const baseItemPrice = 18.50;
  const salchiPrice = 5.00;
  const drinkPrice = 4.50;
  const singleItemSubtotal = baseItemPrice + salchiPrice + drinkPrice; // 28.00

  // Upselling Items
  const [upsells, setUpsells] = useState<UpsellItem[]>([
    {
      id: 'tequenos',
      name: 'Tequeños de Pollo',
      tag: '6 und',
      description: 'Con crema de palta artesanal',
      price: 12.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCwXr2lKubOLbLFACWDELZa0bfK9iCAb3K9l8BElM25VADzSCT7gTFO-eJwZQ7dmRxvjtnokG6RQc19V-JtpCmenV_pySiUchlbD0G6be2lvsMYAhc0YORb-pv8NX4zRzw4wCXOgiBgVEP5HAAXJZOL5XwfGALfLx2QawhcaR9EGWFvGYPoYh8Tqs-31pxv5bv61H5vXS78qsJTrZikLu1Q8UoGgqxtiYkxqv_115z0',
      added: false,
    },
    {
      id: 'incakola_15',
      name: 'Inca Kola Helada',
      tag: '1.5 Litros',
      description: 'Para compartir bien heladita',
      price: 9.50,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBKdm77gWGqUV8m4ccp6zS-o__3TDkV19sw4C0pzsYax_mZDKIWuqx-XP7Sf8hlldZV7zwcq9unXwRCjw_dwNfQfug8dXXHSKnSG3d6WBFPGBHGCphmMve7Qnpe3s0K2s46B5KTFJygbsGCWk1MOISNatJOlBiszhEHKj51Ev3q2UW1LOZZeTgJhTeCf8H51ehT9iFV47ovgdUJxD7tUb4OWC8-AUin3YvNw-rDiDyV',
      added: false,
    },
    {
      id: 'pie_limon',
      name: 'Pie de Limón Casero',
      tag: 'Postre',
      description: 'Con merengue flameado',
      price: 7.00,
      imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBqmoSwbTV8KImw974Uz2bOeD4JD2v8BEAf-bVmHzDYSkX4fWKITSMM-fe9vtlUt5vzPCjpOS-IZ6HaPAjECMaa5tSDFpVL9kurVWQtUbip0H69sqGzinBuR7b8FM4NOGnSWS3OdYYV5GsVjIy8Vj2H-HGp7zwDbvf5s9mDX3UL5yxdt4bqte7EOutju9LFfhDnPPDxBM-wks_UUGP4Rgwj-oNN8-3T9BGxgUWujoyO',
      added: false,
    },
  ]);

  // Coupon State
  const [couponCode, setCouponCode] = useState('CHURUSCRUJIENTE');
  const [isCouponApplied, setIsCouponApplied] = useState(true);
  const couponDiscount = isCouponApplied ? 3.00 : 0.00;

  // Address & GPS State
  const [deliveryAddress, setDeliveryAddress] = useState('Av. Las Palmeras 452, Dpto 302, Los Olivos, Lima');
  const [deliveryReference, setDeliveryReference] = useState('Fachada blanca, tocar timbre 302');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsToast, setGpsToast] = useState<string | null>(null);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'card' | 'cash'>('yape');
  const [cashChangeAmount, setCashChangeAmount] = useState('50.00');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [operationCode, setOperationCode] = useState('');

  // Submit & Order Placed Simulation
  const [orderState, setOrderState] = useState<'idle' | 'processing' | 'confirmed'>('idle');

  // Toggle Upsell Item
  const toggleUpsell = (id: string) => {
    setUpsells(prev => prev.map(item => 
      item.id === id ? { ...item, added: !item.added } : item
    ));
  };

  // GPS Geolocation Handler
  const handleGetGPS = () => {
    setIsLocating(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          setDeliveryAddress(`Ubicación GPS: Av. Antúnez de Mayolo c/ Universitaria (${lat}, ${lng}), Los Olivos`);
          setIsLocating(false);
          setGpsToast('📍 Ubicación GPS detectada con éxito');
          setTimeout(() => setGpsToast(null), 3000);
        },
        () => {
          // Fallback geocoding simulation
          setDeliveryAddress('Ubicación GPS: Av. Carlos Izaguirre 840 (frente a Municipalidad), Los Olivos');
          setIsLocating(false);
          setGpsToast('📍 Ubicación aproximada detectada');
          setTimeout(() => setGpsToast(null), 3000);
        },
        { timeout: 5000, enableHighAccuracy: true }
      );
    } else {
      setDeliveryAddress('Ubicación GPS: Av. Antúnez de Mayolo 1240, Los Olivos');
      setIsLocating(false);
      setGpsToast('📍 Ubicación detectada');
      setTimeout(() => setGpsToast(null), 3000);
    }
  };

  // Copy Yape/Plin phone handler
  const handleCopyYapePhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText('922931433');
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  // Price Calculations
  const deliveryFee = deliveryMode === 'delivery' ? 4.00 : 0.00;
  const itemTotal = singleItemSubtotal * itemQty;
  const upsellsTotal = upsells
    .filter(u => u.added)
    .reduce((sum, u) => sum + u.price, 0);
  
  const subtotalProducts = itemTotal + upsellsTotal;
  const grandTotal = Math.max(0, subtotalProducts + deliveryFee - couponDiscount);

  const handlePlaceOrder = () => {
    setOrderState('processing');
    setTimeout(() => {
      setOrderState('confirmed');
      setTimeout(() => {
        router.push('/tracking?order=CR-8492');
      }, 900);
    }, 1400);
  };

  return (
    <div className="min-h-screen bg-[#141312] text-[#e6e1df] font-sans flex flex-col selection:bg-orange-500 selection:text-white pb-36">
      
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#141312]/90 backdrop-blur-xl border-b border-stone-800/80 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)]">
        <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link 
              href="/admin/products"
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-stone-300 hover:text-orange-400 hover:bg-stone-800/60 active:scale-95 transition-all shrink-0"
              title="Volver"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Churu's Avatar/Badge */}
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30 shrink-0">
              C
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider truncate">
                Paso de Orden
              </span>
              <h1 className="text-base sm:text-lg font-black text-white truncate">
                Checkout Y Pago
              </h1>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs shrink-0">
            🇵🇪
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full max-w-lg mx-auto pt-20 pb-36 px-4 space-y-6">
        
        {/* Atmospheric Glow Overlay */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* 1. Delivery Mode & Address Module */}
        <div className="space-y-3">
          {/* Segmented Control with Enhanced Haptic & Spring Micro-interactions */}
          <div className="p-1 rounded-full bg-stone-900 border border-stone-800 flex items-center shadow-inner relative">
            <button
              type="button"
              onClick={() => setDeliveryMode('delivery')}
              className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm active:scale-95 hover:scale-[1.01] transition-all duration-200 ${
                deliveryMode === 'delivery'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Bike className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Delivery (30-40 min)</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMode('pickup')}
              className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm active:scale-95 hover:scale-[1.01] transition-all duration-200 ${
                deliveryMode === 'pickup'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Store className="w-4 h-4 transition-transform group-hover:scale-110" />
              <span>Recojo en Tienda</span>
            </button>
          </div>

          {/* Active Address Card (Shown only on delivery) */}
          {deliveryMode === 'delivery' ? (
            <div className="p-3.5 sm:p-4 rounded-2xl bg-stone-900/90 border border-stone-800/80 flex flex-col gap-3 shadow-md animate-in fade-in duration-200">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-9 h-9 rounded-full bg-stone-800 text-orange-400 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-5 h-5 fill-orange-400 text-stone-900" />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-wider text-[#94de2d]">
                        Dirección de Entrega
                      </span>
                      {gpsToast && (
                        <span className="text-[10px] font-bold text-amber-400 animate-pulse truncate">
                          {gpsToast}
                        </span>
                      )}
                    </div>

                    {isEditingAddress ? (
                      <input
                        type="text"
                        value={deliveryAddress}
                        onChange={(e) => setDeliveryAddress(e.target.value)}
                        placeholder="Ingresa tu dirección exacta..."
                        className="w-full mt-1 px-3 py-1.5 rounded-lg bg-stone-950 border border-stone-700 text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                      />
                    ) : (
                      <p className="text-xs sm:text-sm font-bold text-white leading-snug mt-0.5">
                        {deliveryAddress}
                      </p>
                    )}
                  </div>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsEditingAddress(!isEditingAddress)}
                  className="px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-orange-400 text-xs font-bold active:scale-95 transition-all shrink-0"
                >
                  {isEditingAddress ? 'Listo' : 'Editar'}
                </button>
              </div>

              {/* GPS Fast Location Button */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleGetGPS}
                  disabled={isLocating}
                  className="flex-1 py-2 px-3 rounded-xl bg-orange-600/15 hover:bg-orange-600/25 border border-orange-500/40 text-orange-400 hover:text-orange-300 font-bold text-xs flex items-center justify-center gap-2 active:scale-98 transition-all"
                >
                  {isLocating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                      <span>Detectando tu ubicación GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-orange-400" />
                      <span>Usar mi ubicación actual (GPS)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Delivery Reference Input */}
              <div className="pt-2 border-t border-stone-800/80">
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  Referencia de llegada (Opcional):
                </label>
                <input
                  type="text"
                  value={deliveryReference}
                  onChange={(e) => setDeliveryReference(e.target.value)}
                  placeholder="Ej: Fachada blanca, tocar timbre 302, casa frente al parque..."
                  className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-2xl bg-stone-900/90 border border-stone-800/80 flex items-center gap-3 shadow-md animate-in fade-in duration-200">
              <div className="w-9 h-9 rounded-full bg-stone-800 text-[#94de2d] flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#94de2d]">
                  Punto de Retiro
                </span>
                <p className="text-sm font-bold text-white truncate">
                  Local Principal Churu&apos;s
                </p>
                <span className="text-xs text-stone-400 truncate">
                  Av. Antúnez de Mayolo 1240, Los Olivos (¡Listo en 15 min!)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 2. Tu Pedido Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white">Tu Pedido</h2>
              <span className="px-2 py-0.5 rounded-full bg-stone-800 text-orange-400 text-xs font-bold">
                1 plato
              </span>
            </div>
          </div>

          {/* Dish Card with Customizations */}
          <div className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800/80 flex flex-col gap-3 shadow-lg relative overflow-hidden">
            <div className="flex gap-3.5 items-start">
              {/* Thumbnail */}
              <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-stone-800 shrink-0">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZ0QRDEDelDQCPOmkIoMfHohdc_ohdM5F1SUeo4eBcD6oixjvDL_pDJnFcm3ctb7NxXaE_450rc_2LI1tFfj5o2qJfXW9mLlB_p-iIa6KcGEHLmsXJe4-gH5ftgn6-vvsQiliD5HnrvuRP0cH4_R5zQ0GbLjjr9DA7LV4jcw1SXmf6rlu_BXhrSyLvfPb2WzoL7uctiYaYqaYhWe1SulzNK5aZEi8F5a8VjEZmgnsz" 
                  alt="Broaster Pecho Clásico" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[#94de2d] text-[10px] font-black">
                  Pecho
                </div>
              </div>

              {/* Dish Meta */}
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight">
                    Broaster Pecho Clásico
                  </h3>
                </div>
                <p className="text-xs text-stone-400 line-clamp-1 mt-0.5">
                  Crocante por fuera, jugoso por dentro con papas fritas.
                </p>
                <div className="mt-1 flex items-baseline gap-1.5">
                  <span className="text-base font-black text-[#94de2d]">
                    S/. {baseItemPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-stone-400">Base</span>
                </div>
              </div>
            </div>

            {/* Customizations Breakdown */}
            <div className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/60 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Salchibroaster doradita</span>
                </div>
                <span className="font-bold text-white">+S/. 5.00</span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-500" />
                  <span className="truncate">Tártara casera, Ají pollero, Mayo</span>
                </div>
                <span className="font-bold text-[#94de2d]">Incluidas</span>
              </div>

              <div className="flex items-center justify-between text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs">🥤</span>
                  <span>Gaseosa Inca Kola 500ml</span>
                </div>
                <span className="font-bold text-white">+S/. 4.50</span>
              </div>
            </div>

            {/* Stepper & Subtotal Row */}
            <div className="flex items-center justify-between pt-1">
              <div className="h-10 px-1 rounded-full bg-stone-800 flex items-center gap-2 shadow-inner">
                <button
                  type="button"
                  onClick={() => setItemQty(prev => Math.max(1, prev - 1))}
                  disabled={itemQty <= 1}
                  className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 disabled:opacity-40 flex items-center justify-center text-white active:scale-95 transition-all"
                  aria-label="Disminuir"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-5 text-center font-black text-sm text-white">
                  {itemQty}
                </span>
                <button
                  type="button"
                  onClick={() => setItemQty(prev => prev + 1)}
                  className="w-8 h-8 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-orange-400 active:scale-95 transition-all"
                  aria-label="Aumentar"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-stone-400 block">Subtotal ítem</span>
                <span className="text-base font-black text-white">
                  S/. {itemTotal.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Upselling Carousel ("¿Se te antoja algo más?") */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-black text-white">¿Se te antoja un extra?</h3>
            </div>
            <span className="text-[11px] font-black text-[#94de2d] uppercase tracking-wider">
              Combina y Ahorra
            </span>
          </div>

          <div className="flex gap-3 overflow-x-auto no-scrollbar scroll-smooth pb-2 pt-1 -mx-4 px-4">
            {upsells.map((upsell) => (
              <div 
                key={upsell.id}
                className="min-w-[200px] max-w-[210px] p-2.5 rounded-2xl bg-stone-900 border border-stone-800 flex flex-col justify-between shadow-md shrink-0"
              >
                <div className="relative w-full h-24 rounded-xl overflow-hidden bg-stone-800 mb-2">
                  <img src={upsell.imageUrl} alt={upsell.name} className="w-full h-full object-cover" />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-black/85 text-orange-400 text-[10px] font-black">
                    {upsell.tag}
                  </span>
                </div>

                <div className="flex flex-col">
                  <h4 className="font-bold text-xs text-white truncate">{upsell.name}</h4>
                  <span className="text-[10px] text-stone-400">{upsell.description}</span>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1">
                  <span className="font-black text-sm text-[#94de2d]">
                    S/. {upsell.price.toFixed(2)}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleUpsell(upsell.id)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                      upsell.added 
                        ? 'bg-[#94de2d] text-stone-950 font-bold scale-105' 
                        : 'bg-orange-600 hover:bg-orange-500 text-white'
                    }`}
                  >
                    {upsell.added ? <Check className="w-4 h-4 stroke-[3]" /> : <Plus className="w-4 h-4 stroke-[3]" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Coupon Code Module */}
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
            <TicketPercent className="w-4 h-4 text-orange-400" />
            Cupón de Descuento
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder="Ingresa tu cupón"
                className="w-full h-11 pl-3.5 pr-8 rounded-xl bg-stone-900 border border-stone-800 text-white font-bold text-xs uppercase placeholder-stone-500 focus:outline-none focus:border-orange-500"
              />
              {isCouponApplied && (
                <CheckCircle2 className="w-4 h-4 text-[#94de2d] absolute right-3 top-3.5" />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (couponCode.trim() === 'CHURUSCRUJIENTE') {
                  setIsCouponApplied(true);
                }
              }}
              className="px-4 h-11 rounded-xl bg-stone-800 hover:bg-stone-700 text-orange-400 font-bold text-xs active:scale-95 transition-all"
            >
              Aplicar
            </button>
          </div>

          {isCouponApplied && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-stone-900 border border-emerald-900/60 text-[#94de2d] text-xs">
              <span className="flex items-center gap-1.5 font-bold">
                🎉 Cupón aplicado: ¡Descuento de S/. 3.00!
              </span>
              <button 
                type="button"
                onClick={() => setIsCouponApplied(false)}
                className="text-stone-400 hover:text-red-400 text-[11px] font-bold"
              >
                Quitar
              </button>
            </div>
          )}
        </div>

        {/* 5. Payment Methods (Peruvian Standard & Anti-Fraud Security) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <Banknote className="w-4 h-4 text-orange-400" />
              Forma de Pago
            </h3>
            <span className="text-[11px] text-[#94de2d] font-bold flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Pago Cifrado TLS
            </span>
          </div>

          {/* Security & Anti-Fraud Notice (Directive CEO) */}
          <div className="p-3 sm:p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300 shadow-sm">
            <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-amber-200">
                Validación Oficial Directa en Caja y Despacho
              </p>
              <p className="text-[11px] text-amber-300/80 leading-relaxed">
                Por seguridad del cliente y del restaurante, <strong>no requerimos subida de capturas ni comprobantes de imagen</strong> (previniendo fraudes o comprobantes editados). Tu pago se valida directamente en el sistema de caja o POS móvil al momento de la entrega.
              </p>
            </div>
          </div>

          {/* Option 1: Yape / Plin */}
          <div 
            onClick={() => setPaymentMethod('yape')}
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 cursor-pointer transition-all border ${
              paymentMethod === 'yape'
                ? 'bg-stone-900 border-purple-500/80 shadow-md ring-1 ring-purple-500/40'
                : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950 text-purple-300 flex items-center justify-center font-black text-xs border border-purple-800/60 shadow-xs">
                  YP
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Yape / Plin</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#94de2d]/15 text-[#94de2d] text-[10px] font-black">
                      Sin comisión
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">Paga al instante: <strong className="text-purple-300">922 931 433</strong></span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                paymentMethod === 'yape' ? 'bg-orange-600 text-white' : 'border border-stone-600'
              }`}>
                {paymentMethod === 'yape' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Quick Copy Phone Button & Operation Code Field */}
            {paymentMethod === 'yape' && (
              <div className="pt-2 border-t border-purple-900/40 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">Titular: Churu&apos;s Comida Rápida</span>
                  <button
                    type="button"
                    onClick={handleCopyYapePhone}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-90 hover:scale-105 ${
                      copiedPhone 
                        ? 'bg-[#84cc16] text-stone-950 shadow-xs' 
                        : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/60'
                    }`}
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>¡Número copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar número (922 931 433)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Operation Code Input (Anti-fraud verification) */}
                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-purple-200/90 mb-1">
                    Código de operación o número de emisor (Opcional):
                  </label>
                  <input
                    type="text"
                    value={operationCode}
                    onChange={(e) => setOperationCode(e.target.value)}
                    placeholder="Ej: Op. 849201 o últimos 4 dígitos..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-purple-900/60 text-xs font-mono text-purple-200 placeholder-stone-600 focus:outline-none focus:border-purple-400 transition-all"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">
                    Validamos el abono al instante en caja sin requerir fotos de comprobante.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Card POS / Tokenized Gateway */}
          <div 
            onClick={() => setPaymentMethod('card')}
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 cursor-pointer transition-all border ${
              paymentMethod === 'card'
                ? 'bg-stone-900 border-orange-500/80 shadow-md ring-1 ring-orange-500/40'
                : 'bg-stone-900/60 border-stone-800/80 hover:bg-stone-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-orange-400 flex items-center justify-center border border-stone-700 shadow-xs">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Tarjeta Débito / Crédito</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[10px] font-bold">
                      POS Móvil
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">Visa, Mastercard, Amex • Encriptación Segura</span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                paymentMethod === 'card' ? 'bg-orange-600 text-white' : 'border border-stone-600'
              }`}>
                {paymentMethod === 'card' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {/* Tokenized Gateway Container */}
            {paymentMethod === 'card' && (
              <div className="pt-2 border-t border-stone-800 flex flex-col gap-2 animate-in fade-in duration-200 text-xs">
                <div className="flex items-center justify-between text-stone-400">
                  <span className="flex items-center gap-1.5 font-bold text-stone-300">
                    <Lock className="w-3.5 h-3.5 text-[#94de2d]" /> Pasarela Tokenizada Segura
                  </span>
                  <span className="text-[10px] bg-stone-800 px-2 py-0.5 rounded text-stone-300 font-mono">
                    Zero-Risk POS
                  </span>
                </div>
                <p className="text-[11px] text-stone-400 leading-snug">
                  El motorizado llevará el terminal POS inalámbrico con chip y sin contacto. No se almacenan datos bancarios sensibles en el navegador.
                </p>
              </div>
            )}
          </div>

          {/* Option 3: Cash */}
          <div className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border transition-all ${
            paymentMethod === 'cash'
              ? 'bg-stone-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
              : 'bg-stone-900/60 border-stone-800/80'
          }`}>
            <label 
              onClick={() => setPaymentMethod('cash')}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-[#94de2d] flex items-center justify-center border border-stone-700">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">Efectivo contra entrega</span>
                  <span className="text-xs text-stone-400">Paga al recibir en tu puerta</span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                paymentMethod === 'cash' ? 'bg-orange-600 text-white' : 'border border-stone-600'
              }`}>
                {paymentMethod === 'cash' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </label>

            {paymentMethod === 'cash' && (
              <div className="pl-13 pt-1 flex items-center gap-2 animate-in fade-in duration-200">
                <span className="text-xs text-stone-400 whitespace-nowrap">¿Con cuánto pagarás?</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-stone-400">S/.</span>
                  <input
                    type="number"
                    value={cashChangeAmount}
                    onChange={(e) => setCashChangeAmount(e.target.value)}
                    placeholder="50.00"
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 6. Price Summary Ticket */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800/80 flex flex-col gap-2.5 shadow-md">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
            Resumen de Cuenta
          </h4>

          <div className="flex items-center justify-between text-xs text-stone-300">
            <span>Subtotal productos</span>
            <span className="font-bold text-white">S/. {subtotalProducts.toFixed(2)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-300">
            <span className="flex items-center gap-1">
              <span>{deliveryMode === 'delivery' ? 'Envío a Los Olivos' : 'Retiro en Local'}</span>
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            </span>
            <span className="font-bold text-white">
              {deliveryMode === 'delivery' ? `S/. ${deliveryFee.toFixed(2)}` : 'Gratis'}
            </span>
          </div>

          {isCouponApplied && (
            <div className="flex items-center justify-between text-xs text-[#94de2d]">
              <span className="flex items-center gap-1 font-bold">
                <TicketPercent className="w-3.5 h-3.5" />
                Descuento cupón
              </span>
              <span className="font-black">-S/. {couponDiscount.toFixed(2)}</span>
            </div>
          )}

          {/* Grand Total Row */}
          <div className="pt-3 mt-1 flex items-baseline justify-between bg-stone-950/80 border border-stone-800/60 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">Total a Pagar</span>
              <span className="text-[10px] text-stone-400">Incluye IGV (18%)</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-black text-orange-400">S/.</span>
              <span className="text-2xl font-black text-white">
                {grandTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#141312]/95 backdrop-blur-xl border-t border-stone-800 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-lg mx-auto flex flex-col gap-1.5">
          <button
            type="button"
            disabled={orderState !== 'idle'}
            onClick={handlePlaceOrder}
            className={`w-full h-14 rounded-full font-black text-sm sm:text-base flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl ${
              orderState === 'confirmed'
                ? 'bg-emerald-600 text-white'
                : 'bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white shadow-orange-600/30'
            }`}
          >
            {orderState === 'idle' && (
              <>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span>Confirmar y Pagar</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-black/20 px-2.5 py-1 rounded-xl text-xs sm:text-sm">
                    S/. {grandTotal.toFixed(2)}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </>
            )}

            {orderState === 'processing' && (
              <div className="flex items-center justify-center gap-2 w-full">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Procesando tu pedido...</span>
              </div>
            )}

            {orderState === 'confirmed' && (
              <div className="flex items-center justify-center gap-2 w-full text-white">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                <span>¡Listo! Cocinando tu pedido</span>
              </div>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-stone-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#94de2d]" />
            <span>Pedido 100% protegido • Cocina rápida garantizada</span>
          </div>
        </div>
      </div>

    </div>
  );
}
