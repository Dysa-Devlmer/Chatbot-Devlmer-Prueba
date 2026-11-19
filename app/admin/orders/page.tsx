'use client';

import { useState, useEffect, useRef } from 'react';
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
  DollarSign
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
    btnLabel: 'Confirmar',
    nextStatus: 'confirmed',
  },
  {
    id: 'confirmed',
    label: 'Confirmado',
    emoji: '🔵',
    color: 'border-blue-400 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
    btnLabel: 'A Cocina 🔥',
    nextStatus: 'ready',
  },
  {
    id: 'ready',
    label: 'En Cocina / Listo',
    emoji: '🟠',
    color: 'border-orange-400 bg-orange-50/50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-400',
    badgeBg: 'bg-orange-100 dark:bg-orange-900/60 text-orange-800 dark:text-orange-300',
    btnLabel: 'Entregado 🛵',
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all' or column id for mobile
  const [search, setSearch] = useState('');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const prevPendingCountRef = useRef<number>(0);

  // Play synthetic pleasant notification chime using Web Audio API
  const playChime = () => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.setValueAtTime(880.00, now + 0.12); // A5

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.45);
    } catch {
      // AudioContext policy
    }
  };

  const fetchOrders = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch('/api/admin/orders');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.orders)) {
          const currentOrders: Order[] = data.orders;
          const pendingCount = currentOrders.filter(o => o.status === 'pending').length;
          
          if (pendingCount > prevPendingCountRef.current && prevPendingCountRef.current !== 0) {
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

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders();
    }, 8000); // 8s polling for fast kitchen live feed
    return () => clearInterval(interval);
  }, [soundEnabled]);

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
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  Cocina Activa
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Churu&apos;s Comida Rápida • Actualización automática cada 8s
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar alertas' : 'Activar timbre sonoro'}
              className={`p-2.5 rounded-xl border transition-all text-xs font-medium flex items-center gap-1.5 active:scale-95 ${
                soundEnabled
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 bg-slate-50 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sonido ON' : 'Silencio'}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 active:scale-95"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-500' : ''}`} />
              <span className="hidden sm:inline">Actualizar</span>
            </button>
          </div>
        </div>

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
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
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
                  className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all ${
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
        /* Responsive Grid / Kanban Columns */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {COLUMNS.map((col) => {
            // When in mobile tab mode, if tab is not 'all' and not this col, hide
            if (activeTab !== 'all' && activeTab !== col.id) return null;

            const colOrders = getOrdersByStatus(col.id);

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
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${col.badgeBg}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Orders List inside column */}
                <div className="space-y-3">
                  {colOrders.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                      Sin pedidos
                    </div>
                  ) : (
                    colOrders.map((order) => (
                      <div
                        key={order.id}
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

                        {/* Customer Info */}
                        <div className="mb-2.5 pl-1.5">
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
                        <div className="bg-slate-50 dark:bg-slate-900/60 rounded-lg p-2 mb-2.5 text-xs space-y-1">
                          {order.items.slice(0, 3).map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                              <span className="truncate pr-2">
                                <strong className="text-amber-600 dark:text-amber-400 font-bold mr-1">
                                  {item.quantity}x
                                </strong>
                                {item.product.name}
                              </span>
                              <span className="text-slate-500 shrink-0 font-medium text-[11px]">
                                S/. {(item.unitPrice * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                          {order.items.length > 3 && (
                            <div className="text-[10px] text-slate-400 pt-0.5 font-medium">
                              +{order.items.length - 3} platos más...
                            </div>
                          )}
                        </div>

                        {/* Notes if any */}
                        {order.notes && (
                          <div className="mb-2.5 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-md text-[11px] text-amber-800 dark:text-amber-300 flex items-start gap-1">
                            <span className="font-bold">Nota:</span>
                            <span className="truncate">{order.notes}</span>
                          </div>
                        )}

                        {/* Total & Action Buttons */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-700/60 pl-1.5">
                          <div>
                            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">Total</span>
                            <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                              S/. {order.totalAmount.toFixed(2)}
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
                    ))
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

            {/* Customer Contact Card */}
            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Datos del Cliente</div>
              <div className="flex items-center justify-between">
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
              {selectedOrder.notes && (
                <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg p-2 text-amber-900 dark:text-amber-200">
                  <span className="font-bold">Indicaciones especiales:</span> {selectedOrder.notes}
                </div>
              )}
            </div>

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
                        Precio unitario: S/. {item.unitPrice.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      S/. {(item.quantity * item.unitPrice).toFixed(2)}
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
                  S/. {selectedOrder.totalAmount.toFixed(2)}
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
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-sm"
                  >
                    Confirmar Pedido
                  </button>
                )}

                {selectedOrder.status === 'confirmed' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 text-white hover:bg-orange-500 transition-all shadow-sm flex items-center gap-1"
                  >
                    <Flame className="w-4 h-4" /> En Cocina
                  </button>
                )}

                {selectedOrder.status === 'ready' && (
                  <button
                    onClick={() => updateOrderStatus(selectedOrder.id, 'delivered')}
                    className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-500 transition-all shadow-sm flex items-center gap-1"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Marcar Entregado
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
