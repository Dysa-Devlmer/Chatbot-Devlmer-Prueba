'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Bike, 
  Store, 
  MapPin, 
  Trash2, 
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
  Copy,
  Compass,
  Lock,
  Phone,
  User,
  AlertCircle
} from 'lucide-react';

export interface CartItem {
  productId: string;
  productName: string;
  basePrice: number;
  totalPrice: number;
  quantity: number;
  isSalchibroaster?: boolean;
  baseSauces?: string[];
  premiumSauces?: string[];
  extras?: { id: string; name: string; price: number; quantity: number }[];
  kitchenNotes?: string;
  imageUrl?: string;
}

export default function CheckoutPage() {
  const router = useRouter();

  // Business Profile Info
  const [business, setBusiness] = useState<{
    name: string;
    currency: string;
    currencySymbol: string;
    phone: string;
    address: string;
    isOpen?: boolean;
    todayHours?: string;
  }>({
    name: "Churu's Comida Rápida",
    currency: 'CLP',
    currencySymbol: '$',
    phone: '+56912345678',
    address: 'Av. Los Próceres 458',
  });

  // Cart from localStorage
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartLoaded, setIsCartLoaded] = useState(false);

  // Customer Contact Fields
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  // Delivery Mode & Address
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [deliveryAddress, setDeliveryAddress] = useState('Av. Las Palmeras 452, Los Olivos');
  const [deliveryReference, setDeliveryReference] = useState('');
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [gpsToast, setGpsToast] = useState<string | null>(null);

  // Coupon State
  const [couponCode, setCouponCode] = useState('');
  const [isCouponApplied, setIsCouponApplied] = useState(false);

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'yape' | 'card' | 'cash'>('yape');
  const [cashChangeAmount, setCashChangeAmount] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [operationCode, setOperationCode] = useState('');

  // Order Placement State & Errors
  const [orderState, setOrderState] = useState<'idle' | 'processing' | 'confirmed'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load business info and saved cart
  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/menu', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && data.business) {
          setBusiness(data.business);
        }
      } catch (e) {
        console.error('Error fetching business for checkout:', e);
      }

      try {
        const saved = localStorage.getItem('pithy_cart');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setCart(parsed);
          }
        }
      } catch (e) {
        console.error('Error parsing cart from localStorage:', e);
      } finally {
        setIsCartLoaded(true);
      }
    }
    loadData();
  }, []);

  // Save cart changes back to localStorage
  const updateCartState = (newCart: CartItem[]) => {
    setCart(newCart);
    try {
      localStorage.setItem('pithy_cart', JSON.stringify(newCart));
    } catch (e) {
      console.error('Error saving cart to localStorage:', e);
    }
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    const updated = [...cart];
    const item = updated[index];
    const newQty = item.quantity + delta;
    if (newQty <= 0) {
      handleRemoveItem(index);
      return;
    }
    const unitPrice = item.totalPrice / item.quantity;
    item.quantity = newQty;
    item.totalPrice = unitPrice * newQty;
    updateCartState(updated);
  };

  const handleRemoveItem = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    updateCartState(updated);
  };

  const isHighDenomination = business.currency === 'CLP' || business.currency === 'COP' || business.currency === 'ARS';

  const formatPrice = (val: number) => {
    const sym = business.currencySymbol || '$';
    const curr = (business.currency || 'CLP').toUpperCase();
    if (curr === 'CLP' || curr === 'COP' || curr === 'ARS' || sym === '$') {
      return `${sym} ${Math.round(val).toLocaleString('es-CL')}`;
    }
    return `${sym} ${val.toFixed(2)}`;
  };

  // GPS Geolocation Handler
  const handleGetGPS = () => {
    setIsLocating(true);
    if (typeof window !== 'undefined' && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(4);
          const lng = position.coords.longitude.toFixed(4);
          setDeliveryAddress(`Ubicación GPS: Lat ${lat}, Lng ${lng}`);
          setIsLocating(false);
          setGpsToast('📍 Ubicación GPS detectada con éxito');
          setTimeout(() => setGpsToast(null), 3000);
        },
        () => {
          setIsLocating(false);
          setGpsToast('📍 Por favor ingresa tu dirección manualmente');
          setIsEditingAddress(true);
          setTimeout(() => setGpsToast(null), 3000);
        },
        { timeout: 7000, enableHighAccuracy: true }
      );
    } else {
      setIsLocating(false);
      setIsEditingAddress(true);
    }
  };

  // Copy phone handler
  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phoneToCopy = business.phone || '+56912345678';
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phoneToCopy);
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
  };

  // Price Calculations
  const deliveryFee = deliveryMode === 'delivery' ? (isHighDenomination ? 2500 : 4.00) : 0.00;
  const subtotalProducts = cart.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
  const couponDiscount = isCouponApplied ? (isHighDenomination ? 1500 : 3.00) : 0.00;
  const grandTotal = Math.max(0, subtotalProducts + deliveryFee - couponDiscount);

  // Real Order Submission to API
  const handlePlaceOrder = async () => {
    setErrorMessage(null);

    if (cart.length === 0) {
      setErrorMessage('Tu carrito está vacío. Agrega al menos un plato de la carta.');
      return;
    }

    if (!customerPhone.trim()) {
      setErrorMessage('Por favor ingresa tu número de WhatsApp o teléfono de contacto.');
      return;
    }

    if (deliveryMode === 'delivery' && !deliveryAddress.trim()) {
      setErrorMessage('Por favor especifica tu dirección de entrega.');
      return;
    }

    setOrderState('processing');

    try {
      const fullAddress = deliveryMode === 'delivery'
        ? `${deliveryAddress}${deliveryReference ? ' (Ref: ' + deliveryReference + ')' : ''}`
        : 'Recojo en Local Comercial';

      const payload = {
        customerName: customerName.trim() || 'Cliente Web',
        customerPhone: customerPhone.trim(),
        deliveryMode,
        deliveryAddress: fullAddress,
        paymentMethod: paymentMethod === 'yape' 
          ? (business.currency === 'CLP' ? 'Transferencia CuentaRUT' : 'Yape / Plin')
          : paymentMethod === 'card' 
            ? 'Tarjeta POS' 
            : `Efectivo${cashChangeAmount ? ' (Paga con: ' + business.currencySymbol + ' ' + cashChangeAmount + ')' : ''}`,
        notes: [
          orderNotes ? `Nota: ${orderNotes}` : null,
          operationCode ? `Cód. Operación: ${operationCode}` : null,
        ].filter(Boolean).join(' | '),
        items: cart.map(item => ({
          productId: item.productId,
          productName: item.productName,
          name: item.productName,
          quantity: item.quantity,
          price: item.totalPrice / item.quantity,
          options: {
            isSalchibroaster: item.isSalchibroaster,
            baseSauces: item.baseSauces,
            premiumSauces: item.premiumSauces,
            extras: item.extras,
            notes: item.kitchenNotes
          }
        }))
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo crear la orden. Intenta nuevamente.');
      }

      // Order created successfully!
      setOrderState('confirmed');
      localStorage.removeItem('pithy_cart');

      setTimeout(() => {
        router.push(`/tracking?order=${data.order.orderNumber}`);
      }, 1000);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setErrorMessage(err.message || 'Ocurrió un error al procesar el pedido');
      setOrderState('idle');
    }
  };

  return (
    <div className="min-h-screen bg-[#141312] text-[#e6e1df] font-sans flex flex-col selection:bg-orange-500 selection:text-white pb-36">
      
      {/* Top Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-[#141312]/90 backdrop-blur-xl border-b border-stone-800/80 shadow-[0_12px_32px_-8px_rgba(0,0,0,0.65)]">
        <div className="h-16 max-w-lg mx-auto px-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Link 
              href="/menu"
              className="w-10 h-10 -ml-1 flex items-center justify-center rounded-full text-stone-300 hover:text-orange-400 hover:bg-stone-800/60 active:scale-95 transition-all shrink-0"
              title="Volver a la Carta"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            {/* Business Avatar */}
            <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30 shrink-0">
              {business.name.charAt(0).toUpperCase()}
            </div>

            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-[11px] font-bold text-orange-400 uppercase tracking-wider truncate">
                Confirmación de Orden
              </span>
              <h1 className="text-base sm:text-lg font-black text-white truncate">
                Checkout & Pago Real
              </h1>
            </div>
          </div>

          <div className="px-2.5 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-black text-xs shrink-0">
            {business.currency} ({business.currencySymbol})
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative w-full max-w-lg mx-auto pt-20 pb-36 px-4 space-y-6">
        
        {/* Glow Overlay */}
        <div className="absolute top-12 left-1/2 -translate-x-1/2 w-80 h-36 bg-gradient-to-b from-orange-500/15 via-amber-500/5 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Business Closed Warning */}
        {business.isOpen === false && (
          <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 flex items-start gap-3 shadow-md">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1" />
            <div>
              <span className="text-xs sm:text-sm font-black text-rose-400 block">
                Local Fuera de Horario ({business.todayHours || 'Cerrado ahora'})
              </span>
              <span className="text-[11px] text-stone-300 block mt-0.5 leading-relaxed">
                Tu pedido quedará agendado y la cocina lo preparará prioritariamente al iniciar operaciones.
              </span>
            </div>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 1. Customer Contact Details Module */}
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800/80 space-y-3 shadow-md">
          <h3 className="text-sm font-black text-white flex items-center gap-2">
            <User className="w-4 h-4 text-orange-400" />
            Datos de Contacto para el Pedido
          </h3>

          <div className="space-y-2.5">
            <div>
              <label className="block text-[11px] font-bold text-stone-400 mb-1">
                Tu Nombre completo:
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Marcelo Morales"
                className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-stone-400 mb-1">
                Teléfono / WhatsApp * (Para notificarte el estado):
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Ej: 922 931 433"
                  className="w-full px-3 py-2 pl-9 rounded-xl bg-stone-950 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-all font-bold"
                />
                <Phone className="w-4 h-4 text-orange-400 absolute left-3 top-2.5" />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Delivery Mode & Address Module */}
        <div className="space-y-3">
          <div className="p-1 rounded-full bg-stone-900 border border-stone-800 flex items-center shadow-inner relative">
            <button
              type="button"
              onClick={() => setDeliveryMode('delivery')}
              className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm active:scale-95 transition-all duration-200 ${
                deliveryMode === 'delivery'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Bike className="w-4 h-4" />
              <span>Delivery (30-45 min)</span>
            </button>

            <button
              type="button"
              onClick={() => setDeliveryMode('pickup')}
              className={`flex-1 py-2 px-3 rounded-full flex items-center justify-center gap-1.5 font-black text-xs sm:text-sm active:scale-95 transition-all duration-200 ${
                deliveryMode === 'pickup'
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                  : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/40'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Retiro en Local</span>
            </button>
          </div>

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

              {/* GPS Fast Location */}
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
                      <span>Detectando ubicación GPS...</span>
                    </>
                  ) : (
                    <>
                      <Compass className="w-4 h-4 text-orange-400" />
                      <span>Detectar mi GPS actual</span>
                    </>
                  )}
                </button>
              </div>

              {/* Delivery Reference */}
              <div className="pt-2 border-t border-stone-800/80">
                <label className="block text-[11px] font-bold text-stone-400 mb-1">
                  Referencia de entrega (Opcional):
                </label>
                <input
                  type="text"
                  value={deliveryReference}
                  onChange={(e) => setDeliveryReference(e.target.value)}
                  placeholder="Ej: Portón negro, timbre 2B, frente al parque..."
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
                  {business.name}
                </p>
                <span className="text-xs text-stone-400 truncate">
                  {business.address || 'Local Comercial'} (¡Listo en 15-20 min!)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* 3. Real Cart Items Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white">Tu Canasta</h2>
              <span className="px-2 py-0.5 rounded-full bg-stone-800 text-orange-400 text-xs font-bold">
                {cart.reduce((acc, it) => acc + it.quantity, 0)} {cart.length === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>
            <Link href="/menu" className="text-xs font-bold text-orange-400 hover:underline">
              + Agregar más
            </Link>
          </div>

          {cart.length === 0 ? (
            <div className="p-6 rounded-2xl bg-stone-900 border border-stone-800 text-center space-y-3">
              <ShoppingBag className="w-12 h-12 text-stone-600 mx-auto" />
              <p className="text-sm font-bold text-stone-300">
                Tu canasta está vacía
              </p>
              <p className="text-xs text-stone-500">
                Selecciona tus platos favoritos desde la carta para continuar.
              </p>
              <Link 
                href="/menu"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs transition-all shadow-md"
              >
                Explorar Carta & Menú
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((item, idx) => (
                <div 
                  key={idx}
                  className="p-3.5 rounded-2xl bg-stone-900 border border-stone-800/80 flex flex-col gap-2.5 shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-sm text-white truncate">
                        {item.productName}
                      </h4>
                      <span className="text-xs font-bold text-[#94de2d] mt-0.5 block">
                        {formatPrice(item.totalPrice)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-stone-400 hover:text-red-400 p-1 transition-colors"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modifiers List */}
                  {((item.baseSauces && item.baseSauces.length > 0) || (item.extras && item.extras.length > 0) || item.isSalchibroaster || item.kitchenNotes) && (
                    <div className="p-2 rounded-xl bg-stone-950/80 border border-stone-800/60 text-[11px] text-stone-300 space-y-0.5">
                      {item.isSalchibroaster && (
                        <div className="text-orange-400 font-bold">🌭 Con Salchibroaster</div>
                      )}
                      {item.baseSauces && item.baseSauces.length > 0 && (
                        <div>🥣 Cremas: <span className="font-medium text-stone-200">{item.baseSauces.join(', ')}</span></div>
                      )}
                      {item.premiumSauces && item.premiumSauces.length > 0 && (
                        <div>✨ Gourmet: <span className="font-medium text-stone-200">{item.premiumSauces.join(', ')}</span></div>
                      )}
                      {item.extras && item.extras.length > 0 && (
                        <div>➕ Extras: <span className="font-medium text-stone-200">{item.extras.map(e => `${e.name} (${e.quantity}x)`).join(', ')}</span></div>
                      )}
                      {item.kitchenNotes && (
                        <div className="italic text-stone-400">📝 &quot;{item.kitchenNotes}&quot;</div>
                      )}
                    </div>
                  )}

                  {/* Quantity Stepper */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="h-9 px-1 rounded-full bg-stone-800 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, -1)}
                        className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-white active:scale-95 transition-all"
                        aria-label="Disminuir"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center font-black text-xs text-white">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(idx, 1)}
                        className="w-7 h-7 rounded-full bg-stone-700 hover:bg-stone-600 flex items-center justify-center text-orange-400 active:scale-95 transition-all"
                        aria-label="Aumentar"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="text-xs text-stone-400">
                      Unitario: {formatPrice(item.totalPrice / (item.quantity || 1))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 4. Kitchen Notes Field */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-stone-400 block">
            Instrucciones para Cocina o Despacho (Opcional):
          </label>
          <input
            type="text"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
            placeholder="Ej: Enviar salsas por separado, tocar timbre suave..."
            className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-white placeholder-stone-500 focus:outline-none focus:border-orange-500 transition-all"
          />
        </div>

        {/* 5. Coupon Code */}
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
                placeholder="Ingresa cupón (Ej: CHURUS)"
                className="w-full h-11 pl-3.5 pr-8 rounded-xl bg-stone-900 border border-stone-800 text-white font-bold text-xs uppercase placeholder-stone-500 focus:outline-none focus:border-orange-500"
              />
              {isCouponApplied && (
                <CheckCircle2 className="w-4 h-4 text-[#94de2d] absolute right-3 top-3.5" />
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (couponCode.trim().length > 0) {
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
                🎉 Cupón aplicado: ¡Descuento de {formatPrice(isHighDenomination ? 1500 : 3.00)}!
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

        {/* 6. Payment Methods Module */}
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

          {/* Option 1: Mobile Transfer (Yape/Plin PE, CuentaRUT CL, Alias AR) */}
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
                  {business.currency === 'CLP' ? 'TR' : (business.currency === 'ARS' ? 'MP' : 'YP')}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">
                      {business.currency === 'CLP' ? 'Transferencia (CuentaRUT / Banco)' : (business.currency === 'ARS' ? 'Mercado Pago / CBU' : 'Yape / Plin')}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-[#94de2d]/15 text-[#94de2d] text-[10px] font-black">
                      Sin comisión
                    </span>
                  </div>
                  <span className="text-xs text-stone-400">
                    Transfiere al instante: <strong className="text-purple-300">{business.phone || '+56 9 1234 5678'}</strong>
                  </span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                paymentMethod === 'yape' ? 'bg-orange-600 text-white' : 'border border-stone-600'
              }`}>
                {paymentMethod === 'yape' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {paymentMethod === 'yape' && (
              <div className="pt-2 border-t border-purple-900/40 space-y-2.5 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-stone-400">Titular: {business.name}</span>
                  <button
                    type="button"
                    onClick={handleCopyPhone}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all active:scale-90 ${
                      copiedPhone 
                        ? 'bg-[#84cc16] text-stone-950 shadow-xs' 
                        : 'bg-purple-950/80 hover:bg-purple-900 text-purple-200 border border-purple-800/60'
                    }`}
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>¡Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar contacto</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="pt-1">
                  <label className="block text-[11px] font-bold text-purple-200/90 mb-1">
                    Código de operación o últimos 4 dígitos (Opcional):
                  </label>
                  <input
                    type="text"
                    value={operationCode}
                    onChange={(e) => setOperationCode(e.target.value)}
                    placeholder="Ej: Op. 849201..."
                    className="w-full px-3 py-2 rounded-xl bg-stone-950 border border-purple-900/60 text-xs font-mono text-purple-200 placeholder-stone-600 focus:outline-none focus:border-purple-400 transition-all"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Option 2: Card POS */}
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
                  <span className="text-xs text-stone-400">
                    {business.currency === 'CLP' ? 'Redcompra, Visa, Mastercard • POS Inalámbrico' : 'Visa, Mastercard • Sin contacto'}
                  </span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                paymentMethod === 'card' ? 'bg-orange-600 text-white' : 'border border-stone-600'
              }`}>
                {paymentMethod === 'card' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          {/* Option 3: Cash */}
          <div 
            onClick={() => setPaymentMethod('cash')}
            className={`p-3.5 rounded-2xl flex flex-col gap-2.5 border transition-all cursor-pointer ${
              paymentMethod === 'cash'
                ? 'bg-stone-900 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/40'
                : 'bg-stone-900/60 border-stone-800/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-stone-800 text-[#94de2d] flex items-center justify-center border border-stone-700">
                  <Banknote className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-sm text-white">Efectivo contra entrega</span>
                  <span className="text-xs text-stone-400">Paga al recibir en tu puerta o en caja</span>
                </div>
              </div>

              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                paymentMethod === 'cash' ? 'bg-orange-600 text-white' : 'border border-stone-600'
              }`}>
                {paymentMethod === 'cash' && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="pl-13 pt-1 flex items-center gap-2 animate-in fade-in duration-200">
                <span className="text-xs text-stone-400 whitespace-nowrap">¿Con cuánto pagarás?</span>
                <div className="relative flex-1">
                  <span className="absolute left-2.5 top-1.5 text-xs font-bold text-stone-400">{business.currencySymbol}</span>
                  <input
                    type="number"
                    value={cashChangeAmount}
                    onChange={(e) => setCashChangeAmount(e.target.value)}
                    placeholder={isHighDenomination ? '10000' : '50'}
                    className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-stone-950 border border-stone-700 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 7. Price Summary Ticket */}
        <div className="p-4 rounded-2xl bg-stone-900 border border-stone-800/80 flex flex-col gap-2.5 shadow-md">
          <h4 className="text-xs font-black uppercase tracking-wider text-stone-400">
            Resumen de Cuenta
          </h4>

          <div className="flex items-center justify-between text-xs text-stone-300">
            <span>Subtotal platos ({cart.reduce((a, b) => a + b.quantity, 0)})</span>
            <span className="font-bold text-white">{formatPrice(subtotalProducts)}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-stone-300">
            <span className="flex items-center gap-1">
              <span>{deliveryMode === 'delivery' ? 'Costo de Envío' : 'Retiro en Local'}</span>
              <HelpCircle className="w-3.5 h-3.5 text-stone-500" />
            </span>
            <span className="font-bold text-white">
              {deliveryMode === 'delivery' ? formatPrice(deliveryFee) : 'Gratis'}
            </span>
          </div>

          {isCouponApplied && (
            <div className="flex items-center justify-between text-xs text-[#94de2d]">
              <span className="flex items-center gap-1 font-bold">
                <TicketPercent className="w-3.5 h-3.5" />
                Descuento cupón
              </span>
              <span className="font-black">-{formatPrice(couponDiscount)}</span>
            </div>
          )}

          {/* Grand Total */}
          <div className="pt-3 mt-1 flex items-baseline justify-between bg-stone-950/80 border border-stone-800/60 p-3 rounded-xl">
            <div className="flex flex-col">
              <span className="text-sm font-black text-white">Total a Pagar</span>
              <span className="text-[10px] text-stone-400">Impuestos y empaque incluidos</span>
            </div>
            <span className="text-2xl font-black text-white">
              {formatPrice(grandTotal)}
            </span>
          </div>
        </div>

      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 inset-x-0 z-40 bg-[#141312]/95 backdrop-blur-xl border-t border-stone-800 px-4 py-3 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-lg mx-auto flex flex-col gap-1.5">
          <button
            type="button"
            disabled={orderState !== 'idle' || cart.length === 0}
            onClick={handlePlaceOrder}
            className={`w-full h-14 rounded-full font-black text-sm sm:text-base flex items-center justify-between px-5 active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 cursor-pointer ${
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
                  <span>Confirmar y Enviar Pedido</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="bg-black/20 px-2.5 py-1 rounded-xl text-xs sm:text-sm">
                    {formatPrice(grandTotal)}
                  </span>
                  <ChevronRight className="w-5 h-5" />
                </div>
              </>
            )}

            {orderState === 'processing' && (
              <div className="flex items-center justify-center gap-2 w-full">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Registrando en Cocina...</span>
              </div>
            )}

            {orderState === 'confirmed' && (
              <div className="flex items-center justify-center gap-2 w-full text-white">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
                <span>¡Pedido Creado! Redirigiendo a seguimiento...</span>
              </div>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 text-stone-500 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#94de2d]" />
            <span>Pedido 100% real • Guardado directo en el sistema de cocina</span>
          </div>
        </div>
      </div>

    </div>
  );
}
