'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  Flame, 
  CheckCircle2, 
  Clock, 
  Phone, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  Volume2, 
  VolumeX, 
  X,
  AlertCircle,
  Truck,
  MessageCircle,
  Store,
  DollarSign,
  MapPin
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  product: {
    id: string;
    name: string;
    imageUrl?: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  customerPhone: string;
  customerName: string | null;
  status: 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
  totalAmount: number;
  notes: string | null;
  channel: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
}

interface ParsedOrderMetadata {
  isDelivery: boolean;
  address?: string;
  paymentMethod: string;
  paymentType: 'yape' | 'plin' | 'cash' | 'card' | 'other';
  kitchenNotes?: string;
}

function parseOrderMetadata(notes: string | null): ParsedOrderMetadata {
  if (!notes) {
    return {
      isDelivery: true,
      address: 'Dirección por WhatsApp',
      paymentMethod: 'Por confirmar',
      paymentType: 'other',
    };
  }

  const lower = notes.toLowerCase();
  
  // Delivery vs Retiro en local
  const isPickup = lower.includes('retiro') || lower.includes('recojo') || lower.includes('en local') || lower.includes('para llevar');
  const isDelivery = !isPickup;

  // Extracción limpia y precisa de dirección de entrega
  let address: string | undefined = undefined;
  if (isDelivery) {
    const parts = notes.split(/[-–|•\n]/).map(p => p.trim());
    for (const p of parts) {
      if (/^delivery/i.test(p)) {
        let addr = p.replace(/^delivery\s*:?\s*/i, '').trim();
        addr = addr.replace(/^(?:a|en|para)\s*:\s*/i, '').replace(/^(?:a|en|para)\s+/i, '').trim();
        if (addr) {
          address = addr;
          break;
        }
      }
    }
    if (!address) {
      const addrPart = parts.find(p => /san genaro|chorrillos|av\.|calle|jr\.|psje\.|mz\.|lt\.|urb\.|dpto|distrito/i.test(p));
      if (addrPart) {
        address = addrPart.replace(/^delivery\s*:?\s*/i, '').trim();
        address = address.replace(/^(?:a|en|para)\s*:\s*/i, '').replace(/^(?:a|en|para)\s+/i, '').trim();
      }
    }
  }

  // Método de pago
  let paymentMethod = 'Efectivo';
  let paymentType: 'yape' | 'plin' | 'cash' | 'card' | 'other' = 'cash';

  if (lower.includes('yape')) {
    paymentMethod = 'Yape';
    paymentType = 'yape';
  } else if (lower.includes('plin')) {
    paymentMethod = 'Plin';
    paymentType = 'plin';
  } else if (lower.includes('tarjeta') || lower.includes('pos') || lower.includes('visa') || lower.includes('mastercard')) {
    paymentMethod = 'Tarjeta POS';
    paymentType = 'card';
  } else if (lower.includes('efectivo') || lower.includes('contraentrega')) {
    paymentMethod = 'Efectivo (Contraentrega)';
    paymentType = 'cash';
  } else if (lower.includes('pago')) {
    const paymentMatch = notes.match(/pago\s*(?:contraentrega)?\s*(?:en)?\s*:?\s*([^,-–\n|]+)/i);
    paymentMethod = paymentMatch ? paymentMatch[1].trim() : 'Por confirmar';
    paymentType = 'other';
  }

  // Notas de cocina (customizaciones de plato)
  let kitchenNotes: string | undefined = undefined;
  const rawParts = notes.split(/[-–|•\n]/).map(p => p.trim()).filter(Boolean);
  const noteParts = rawParts.filter(p => 
    !/^(delivery|retiro|recojo|para llevar|en local)/i.test(p) && 
    !/^(pago|yape|plin|efectivo|tarjeta|pos|contraentrega)/i.test(p) &&
    !p.toLowerCase().includes('contraentrega') &&
    !(address && p.includes(address))
  );
  if (noteParts.length > 0) {
    kitchenNotes = noteParts.join(', ');
  }

  return {
    isDelivery,
    address,
    paymentMethod,
    paymentType,
    kitchenNotes,
  };
}

const COLUMNS: {
  id: Order['status'];
  label: string;
  emoji: string;
  color: string;
  badgeBg: string;
  btnLabel?: string;
  nextStatus?: Order['status'];
}[] = [
  {
    id: 'pending',
    label: 'Pendiente',
    emoji: '🟡',
    color: 'border-amber-400 bg-amber-50/50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400',
    badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
    btnLabel: 'A Cocina 👨‍🍳🔥',
    nextStatus: 'confirmed',
  },
  {
    id: 'confirmed',
    label: 'En Preparación',
    emoji: '🔵',
    color: 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
    btnLabel: 'Listo / En Camino 🛵',
    nextStatus: 'ready',
  },
  {
    id: 'ready',
    label: 'Listo / En Camino',
    emoji: '🟠',
    color: 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300',
    btnLabel: 'Marcar Entregado 🟢',
    nextStatus: 'delivered',
  },
  {
    id: 'delivered',
    label: 'Entregado',
    emoji: '🟢',
    color: 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
  },
];

export default function LiveOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currencySymbol, setCurrencySymbol] = useState('S/.');
  const [currencyCode, setCurrencyCode] = useState('PEN');
  const [isKitchenOpen, setIsKitchenOpen] = useState<boolean>(true);
  const [todayHours, setTodayHours] = useState<string>('');
  const [businessName, setBusinessName] = useState<string>("Churu's Comida Rápida");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' or column id for mobile
  const [search, setSearch] = useState('');
  const [volumeLevel, setVolumeLevel] = useState<'high' | 'normal' | 'muted'>('high');
  const [audioPermissionGranted, setAudioPermissionGranted] = useState(false);
  const [alarmSilenced, setAlarmSilenced] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deliveredDateFilter, setDeliveredDateFilter] = useState<'today' | 'yesterday' | 'older'>('today');
  const prevPendingCountRef = useRef<number>(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Initialize or resume persistent AudioContext
  const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      setAudioPermissionGranted(true);
      return audioCtxRef.current;
    } catch {
      return null;
    }
  };

  // High-clarity penetrative kitchen alert (3-stage tone sequence D5 -> A5 -> D6)
  const playChime = (overrideGain?: number) => {
    if (volumeLevel === 'muted' && overrideGain === undefined) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const gainMultiplier = overrideGain !== undefined 
        ? overrideGain 
        : (volumeLevel === 'high' ? 0.45 : 0.22);

      // Chime Note 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.01, now);
      gain1.gain.linearRampToValueAtTime(gainMultiplier, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.3);

      // Chime Note 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.00, now + 0.12);
      gain2.gain.setValueAtTime(0.01, now + 0.12);
      gain2.gain.linearRampToValueAtTime(gainMultiplier * 1.1, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.45);

      // Chime Note 3: D6 (1174.66 Hz - Kitchen Bell finish)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1174.66, now + 0.26);
      gain3.gain.setValueAtTime(0.01, now + 0.26);
      gain3.gain.linearRampToValueAtTime(gainMultiplier * 1.25, now + 0.30);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.26);
      osc3.stop(now + 0.75);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  };

  const handleTestSound = () => {
    setAudioPermissionGranted(true);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pithy_audio_unlocked', 'true');
      } catch {}
    }
    const ctx = getAudioContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().then(() => playChime());
    } else {
      playChime();
    }
  };

  const changeVolumeLevel = (level: 'high' | 'normal' | 'muted') => {
    setVolumeLevel(level);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pithy_kitchen_volume', level);
      } catch {}
    }
    if (level === 'muted') {
      setAlarmSilenced(true);
    } else {
      setAlarmSilenced(false);
      handleTestSound();
    }
  };

  // Restore audio unlock & kitchen volume preferences from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedVol = localStorage.getItem('pithy_kitchen_volume') as 'high' | 'normal' | 'muted' | null;
      if (savedVol) setVolumeLevel(savedVol);

      const unlocked = localStorage.getItem('pithy_audio_unlocked') === 'true';
      if (unlocked) {
        setAudioPermissionGranted(true);
        const unlockOnFirstTouch = () => {
          getAudioContext();
          window.removeEventListener('click', unlockOnFirstTouch);
          window.removeEventListener('keydown', unlockOnFirstTouch);
          window.removeEventListener('touchstart', unlockOnFirstTouch);
        };
        window.addEventListener('click', unlockOnFirstTouch, { once: true });
        window.addEventListener('keydown', unlockOnFirstTouch, { once: true });
        window.addEventListener('touchstart', unlockOnFirstTouch, { once: true });
      }
    } catch {}
  }, []);

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          if (data.currencySymbol) setCurrencySymbol(data.currencySymbol);
          if (data.currency) setCurrencyCode(data.currency);
          if (data.businessName) setBusinessName(data.businessName);
          if (data.isKitchenOpen !== undefined) setIsKitchenOpen(data.isKitchenOpen);
          if (data.todayHours) setTodayHours(data.todayHours);
          const currentOrders: Order[] = data.orders;
          const pendingCount = currentOrders.filter(o => o.status === 'pending').length;
          
          // Trigger alarm if new pending order arrived
          if (pendingCount > prevPendingCountRef.current) {
            setAlarmSilenced(false);
            playChime();
          }
          prevPendingCountRef.current = pendingCount;
          setOrders(currentOrders);
        }
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Live polling every 7 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 7000);
    return () => clearInterval(interval);
  }, [volumeLevel]);

  // Persistent repeating alert for unacknowledged pending kitchen orders (every 18 seconds)
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  useEffect(() => {
    if (pendingOrdersCount > 0 && !alarmSilenced && volumeLevel !== 'muted') {
      const repeatInterval = setInterval(() => {
        playChime();
      }, 18000);
      return () => clearInterval(repeatInterval);
    }
  }, [pendingOrdersCount, alarmSilenced, volumeLevel]);

  const formatMoney = (val: number) => {
    if (['CLP', 'COP', 'ARS'].includes(currencyCode) || (currencySymbol === '$' && val > 100)) {
      return `${currencySymbol} ${Math.round(val).toLocaleString('es')}`;
    }
    return `${currencySymbol} ${val.toFixed(2)}`;
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setActionLoading(orderId);
    try {
      // Optimistic update
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus } : null);
      }

      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!res.ok) {
        // Rollback on error
        fetchOrders();
      }
    } catch (err) {
      console.error('Error updating order:', err);
      fetchOrders();
    } finally {
      setActionLoading(null);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Hace un momento';
    if (minutes === 1) return 'Hace 1 min';
    if (minutes < 60) return `Hace ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Hace 1 hora';
    return `Hace ${hours}h`;
  };

  const getDateCategory = (dateStr: string): 'today' | 'yesterday' | 'older' => {
    const date = new Date(dateStr);
    const now = new Date();
    
    const isToday = date.getFullYear() === now.getFullYear() &&
                    date.getMonth() === now.getMonth() &&
                    date.getDate() === now.getDate();
    if (isToday) return 'today';

    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.getFullYear() === yesterday.getFullYear() &&
                        date.getMonth() === yesterday.getMonth() &&
                        date.getDate() === yesterday.getDate();
    if (isYesterday) return 'yesterday';

    return 'older';
  };

  const formatOrderDateHeader = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-PE', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = 
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search) ||
      (o.customerName && o.customerName.toLowerCase().includes(search.toLowerCase()));
    
    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && o.status === activeTab;
  });

  const getOrdersByStatus = (status: Order['status']) => {
    return filteredOrders.filter(o => o.status === status);
  };

  const allDeliveredOrders = filteredOrders.filter(o => o.status === 'delivered');
  const todayDelivered = allDeliveredOrders.filter(o => getDateCategory(o.createdAt) === 'today');
  const yesterdayDelivered = allDeliveredOrders.filter(o => getDateCategory(o.createdAt) === 'yesterday');
  const olderDelivered = allDeliveredOrders.filter(o => getDateCategory(o.createdAt) === 'older');

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  return (
    <div className="space-y-4">
      {/* Top Banner / Restaurant Identity & Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                  Pedidos en Vivo
                </h1>
                {isKitchenOpen ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    Cocina Abierta • {todayHours || 'Atendiendo'}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Cocina Cerrada (Fuera de Horario)
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {businessName} • Actualización automática cada 7s
              </p>
            </div>
          </div>

          {/* Quick Action Buttons & Audio Selector */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* Audio Volume Controller */}
            <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-1">
              <button
                type="button"
                onClick={() => changeVolumeLevel('muted')}
                title="Silenciar sonido"
                className={`px-2 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  volumeLevel === 'muted'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mute</span>
              </button>
              
              <button
                type="button"
                onClick={() => changeVolumeLevel('normal')}
                title="Volumen Normal"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  volumeLevel === 'normal'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Normal</span>
              </button>

              <button
                type="button"
                onClick={() => changeVolumeLevel('high')}
                title="Volumen Alto (Ambiente de Cocina Ruidosa)"
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                  volumeLevel === 'high'
                    ? 'bg-emerald-600 text-white shadow-xs animate-pulse'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Cocina 📢</span>
              </button>
            </div>

            {/* Test Sound Button */}
            <button
              type="button"
              onClick={handleTestSound}
              title="Probar timbre sonoro"
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-amber-300/80 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 dark:text-amber-300 text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="hidden sm:inline">Probar Timbre</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

        {/* Browser Audio Permission Activation Banner (if audioContext needs unlock) */}
        {!audioPermissionGranted && (
          <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200 animate-in fade-in">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <p className="font-semibold">
                🔔 <strong>Permiso de audio:</strong> Para escuchar las alertas automáticas de comanda cuando entre un pedido, activa el sonido en este navegador.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestSound}
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-black text-xs active:scale-95 transition-all shadow-xs"
              >
                Activar Sonido Ahora
              </button>
              <button
                type="button"
                onClick={() => {
                  setAudioPermissionGranted(true);
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem('pithy_audio_unlocked', 'true');
                    } catch {}
                  }
                }}
                title="Descartar aviso"
                className="p-1 rounded-md text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Persistent Alert Banner for Pending Orders */}
        {pendingCount > 0 && (
          <div className={`mt-3 p-3 sm:p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
            alarmSilenced || volumeLevel === 'muted'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-200'
              : 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300 animate-pulse'
          }`}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs">
                {pendingCount}
              </div>
              <div>
                <p className="font-black text-xs sm:text-sm">
                  🔥 ¡ATENCIÓN COCINA! {pendingCount} pedido{pendingCount > 1 ? 's' : ''} nuevo{pendingCount > 1 ? 's' : ''} pendiente{pendingCount > 1 ? 's' : ''} de ingreso.
                </p>
                <p className="text-[11px] opacity-80">
                  {volumeLevel === 'muted' 
                    ? 'El sonido está silenciado manualmente.' 
                    : alarmSilenced 
                      ? 'Alerta sonora pausada para este lote.' 
                      : 'El timbre sonará repetidamente hasta que aceptes la comanda o lo pauses.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              {!alarmSilenced && volumeLevel !== 'muted' ? (
                <button
                  type="button"
                  onClick={() => setAlarmSilenced(true)}
                  className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Silenciar Alerta</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setAlarmSilenced(false);
                    if (volumeLevel === 'muted') setVolumeLevel('normal');
                    playChime();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Reanudar Alarma</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Banner de Cocina Cerrada si el local está fuera de horario */}
        {!isKitchenOpen && (
          <div className="mt-3 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-800 dark:text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 sm:gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <div className="min-w-0">
                <p className="font-bold text-xs sm:text-sm">
                  🌙 Cocina CERRADA por horario {todayHours ? `(${todayHours})` : ''}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5 line-clamp-2 sm:line-clamp-none">
                  Los clientes que escriban a WhatsApp recibirán el mensaje automático y catálogo digital.
                </p>
              </div>
            </div>
            <Link
              href="/admin/business"
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0 self-end sm:self-auto active:scale-95 transition-all shadow-xs"
            >
              Ajustar Horario
            </Link>
          </div>
        )}

        {/* Search & Mobile Tabs Filter */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por ORD-XXXX, cliente o teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Tabs for Mobile / Quick Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 no-scrollbar -mx-1 px-1">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Todos ({orders.length})
            </button>
            {COLUMNS.map((col) => {
              const count = orders.filter(o => o.status === col.id).length;
              return (
                <button
                  key={col.id}
                  onClick={() => setActiveTab(col.id)}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all shrink-0 ${
                    activeTab === col.id
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  <span>{col.emoji}</span>
                  <span>{col.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    col.id === 'pending' && count > 0 ? 'bg-amber-500 text-white font-bold animate-pulse' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Kanban / List View */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-3">
          <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium">Cargando pedidos de cocina...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-2xl">
            🍔
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
            No hay pedidos para mostrar
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search ? 'No se encontraron pedidos con ese término de búsqueda.' : 'Los nuevos pedidos recibidos por WhatsApp aparecerán aquí en vivo.'}
          </p>
        </div>
      ) : (
        /* Responsive Grid / Focused Kanban Column */
        <div className={
          activeTab === 'all'
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start'
            : 'max-w-4xl mx-auto w-full'
        }>
          {COLUMNS.map((col) => {
            // When in mobile tab mode or single tab filter, if tab is not 'all' and not this col, hide
            if (activeTab !== 'all' && activeTab !== col.id) return null;

            const colOrders = getOrdersByStatus(col.id);
            const displayedOrders = col.id === 'delivered'
              ? (deliveredDateFilter === 'today' 
                  ? todayDelivered 
                  : deliveredDateFilter === 'yesterday' 
                    ? yesterdayDelivered 
                    : olderDelivered)
              : colOrders;

            return (
              <div 
                key={col.id}
                className="bg-slate-100/70 dark:bg-slate-900/40 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-3.5 space-y-3"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{col.emoji}</span>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      {col.label}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {activeTab !== 'all' && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('all')}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
                      >
                        ← Ver todas
                      </button>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                      {col.id === 'delivered' ? displayedOrders.length : colOrders.length}
                    </span>
                  </div>
                </div>

                {/* Sub-filtro de fechas exclusivo para pedidos Entregados */}
                {col.id === 'delivered' && (
                  <div className="p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80 flex items-center gap-1 text-[11px] font-bold">
                    <button
                      type="button"
                      onClick={() => setDeliveredDateFilter('today')}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all ${
                        deliveredDateFilter === 'today'
                          ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-extrabold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Hoy ({todayDelivered.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveredDateFilter('yesterday')}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all ${
                        deliveredDateFilter === 'yesterday'
                          ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 font-extrabold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Ayer ({yesterdayDelivered.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveredDateFilter('older')}
                      className={`flex-1 py-1 px-1.5 rounded-lg text-center transition-all ${
                        deliveredDateFilter === 'older'
                          ? 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-400 font-extrabold shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      Pasadas ({olderDelivered.length})
                    </button>
                  </div>
                )}

                {/* Orders List inside column */}
                <div className={activeTab === 'all' ? 'space-y-3' : 'grid grid-cols-1 md:grid-cols-2 gap-3'}>
                  {displayedOrders.length === 0 ? (
                    <div className={`py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl ${
                      activeTab !== 'all' ? 'col-span-full' : ''
                    }`}>
                      {col.id === 'delivered' 
                        ? (deliveredDateFilter === 'today' 
                            ? 'Sin entregas registradas hoy' 
                            : deliveredDateFilter === 'yesterday' 
                              ? 'Sin entregas registradas ayer' 
                              : 'Sin entregas en fechas pasadas')
                        : 'Sin pedidos'}
                    </div>
                  ) : (
                    displayedOrders.map((order, orderIdx) => {
                      const meta = parseOrderMetadata(order.notes);
                      const showDateDivider = col.id === 'delivered' && deliveredDateFilter === 'older' && (
                        orderIdx === 0 || formatOrderDateHeader(displayedOrders[orderIdx - 1].createdAt) !== formatOrderDateHeader(order.createdAt)
                      );

                      return (
                        <div key={order.id} className={`space-y-2 ${showDateDivider && activeTab !== 'all' ? 'col-span-full' : ''}`}>
                          {showDateDivider && (
                            <div className="pt-2 pb-1 flex items-center gap-2">
                              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-200/80 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                📅 {formatOrderDateHeader(order.createdAt)}
                              </span>
                              <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                            </div>
                          )}

                          <div
                            className="group bg-white dark:bg-slate-800/90 hover:shadow-md border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 transition-all duration-200 relative overflow-hidden active:scale-[0.99]"
                          >
                          {/* Status side indicator */}
                          <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                            order.status === 'pending' ? 'bg-amber-500' :
                            order.status === 'confirmed' ? 'bg-blue-500' :
                            order.status === 'ready' ? 'bg-orange-500' : 'bg-emerald-500'
                          }`} />

                          {/* Top row: Order Number & Time */}
                          <div className="flex items-center justify-between mb-2 pl-1.5">
                            <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-slate-100">
                              {order.orderNumber}
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatRelativeTime(order.createdAt)}
                            </span>
                          </div>

                          {/* Badges: Tipo de Pedido (🛵 Delivery / 🏬 Retiro) & Método de Pago */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-2 pl-1.5">
                            {meta.isDelivery ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 shadow-xs">
                                <Truck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>🛵 Delivery</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-black bg-purple-100 text-purple-800 border border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800 shadow-xs">
                                <Store className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>🏬 Retiro en Local</span>
                              </span>
                            )}

                            {/* Método de pago */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border shadow-xs ${
                              meta.paymentType === 'yape' 
                                ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800' 
                                : meta.paymentType === 'plin'
                                ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800'
                                : meta.paymentType === 'card'
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800'
                            }`}>
                              {meta.paymentType === 'yape' ? '📱 Yape' :
                               meta.paymentType === 'plin' ? '⚡ Plin' :
                               meta.paymentType === 'card' ? '💳 Tarjeta POS' : '💵 Efectivo'}
                            </span>
                          </div>

                          {/* Dirección de Entrega Destacada (Si es Delivery) */}
                          {meta.isDelivery && meta.address && (
                            <div className="mb-2 pl-1.5">
                              <div className="flex items-start gap-1.5 text-xs text-slate-700 dark:text-slate-300 bg-emerald-50/50 dark:bg-emerald-950/20 p-2 rounded-lg border border-emerald-200/70 dark:border-emerald-900/50">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                <div className="leading-tight">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wide text-emerald-700 dark:text-emerald-400 block mb-0.5">
                                    Dirección de Entrega:
                                  </span>
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {meta.address}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Customer Info */}
                          <div className="mb-2 pl-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[170px]">
                                {order.customerName || 'Cliente WhatsApp'}
                              </span>
                              <a
                                href={`https://wa.me/${order.customerPhone.replace(/\+/g, '')}`}
                                target="_blank"
                                rel="noreferrer"
                                title="Chatear por WhatsApp"
                                className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-1 rounded-md hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              +{order.customerPhone}
                            </span>
                          </div>

                          {/* Items list preview */}
                          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2 mb-2 text-xs space-y-1">
                            {order.items.slice(0, 3).map((item) => (
                              <div key={item.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                                <span className="truncate pr-2">
                                  <strong className="text-amber-600 dark:text-amber-400 font-bold mr-1">
                                    {item.quantity}x
                                  </strong>
                                  {item.product.name}
                                </span>
                                <span className="text-slate-500 shrink-0 font-medium text-[11px]">
                                  {formatMoney(item.unitPrice * item.quantity)}
                                </span>
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="text-[10px] text-slate-400 pt-0.5 font-medium">
                                +{order.items.length - 3} platos más...
                              </div>
                            )}
                          </div>

                          {/* Notas de Cocina (Chef Notes) destacadas */}
                          {meta.kitchenNotes && (
                            <div className="mb-2.5 px-2.5 py-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-950 dark:text-amber-200 flex items-start gap-1.5 shadow-2xs">
                              <span className="font-black shrink-0 text-amber-700 dark:text-amber-400">👨‍🍳 Cocina:</span>
                              <span className="font-semibold leading-tight">{meta.kitchenNotes}</span>
                            </div>
                          )}

                          {/* Total & Action Buttons */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 pl-1.5">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total</span>
                              <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatMoney(order.totalAmount)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Fast Next Status Advance Button */}
                              {col.nextStatus && (
                                <button
                                  onClick={() => updateOrderStatus(order.id, col.nextStatus!)}
                                  disabled={actionLoading === order.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm transition-all active:scale-95 flex items-center gap-1 disabled:opacity-50"
                                >
                                  {actionLoading === order.id ? (
                                    <RefreshCw className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <>
                                      <span>{col.btnLabel}</span>
                                      <ChevronRight className="w-3 h-3" />
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Details modal button */}
                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                                title="Ver detalles completos"
                              >
                                <Search className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal / Bottom Sheet */}
      {selectedOrder && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity animate-in fade-in"
          onClick={() => setSelectedOrder(null)}
        >
          <div 
            className="w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-h-[90vh] overflow-y-auto p-5 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Pedido {selectedOrder.orderNumber}
                  </h2>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                    selectedOrder.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                    selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                    selectedOrder.status === 'ready' ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300' :
                    'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  }`}>
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Recibido el {new Date(selectedOrder.createdAt).toLocaleDateString('es-PE', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Customer & Delivery / Payment Card */}
            {(() => {
              const selectedMeta = parseOrderMetadata(selectedOrder.notes);
              return (
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Información de Despacho</span>
                    <div className="flex items-center gap-1.5">
                      {selectedMeta.isDelivery ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                          <Truck className="w-3.5 h-3.5" /> 🛵 Delivery
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-black bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300">
                          <Store className="w-3.5 h-3.5" /> 🏬 Retiro en Local
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                        {selectedMeta.paymentMethod}
                      </span>
                    </div>
                  </div>

                  {selectedMeta.isDelivery && selectedMeta.address && (
                    <div className="flex items-start gap-2 bg-emerald-50/70 dark:bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-200/80 dark:border-emerald-900/50">
                      <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <span className="font-extrabold text-emerald-800 dark:text-emerald-400 block uppercase text-[10px]">
                          Dirección de Entrega:
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          {selectedMeta.address}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <div>
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {selectedOrder.customerName || 'Cliente WhatsApp'}
                      </div>
                      <div className="text-xs text-slate-500 font-mono">
                        +{selectedOrder.customerPhone}
                      </div>
                    </div>
                    <a
                      href={`https://wa.me/${selectedOrder.customerPhone.replace(/\+/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp
                    </a>
                  </div>

                  {selectedMeta.kitchenNotes && (
                    <div className="text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/60 rounded-lg p-2.5 text-amber-950 dark:text-amber-200 flex items-start gap-1.5">
                      <span className="font-extrabold text-amber-700 dark:text-amber-400 shrink-0">👨‍🍳 Cocina:</span>
                      <span className="font-medium">{selectedMeta.kitchenNotes}</span>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Items Breakdown */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Platos Solicitados</div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden">
                {selectedOrder.items.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        <span className="font-extrabold text-amber-600 dark:text-amber-400 mr-1.5">{item.quantity}x</span>
                        {item.product.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Precio unitario: {formatMoney(item.unitPrice)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      {formatMoney(item.quantity * item.unitPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Total and Advance State Actions */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-slate-500">Total a cobrar:</span>
                <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                  {formatMoney(selectedOrder.totalAmount)}
                </div>
              </div>

              {/* Status change actions */}
              <div className="flex items-center gap-2">
                {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  >
                    Cancelar
                  </button>
                )}

                {selectedOrder.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'confirmed')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Flame className="w-4 h-4" /> A Cocina (Preparar)
                  </button>
                )}

                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-500 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <Truck className="w-4 h-4" /> Listo / Despachar 🛵
                  </button>
                )}

                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar Entregado 🟢
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
