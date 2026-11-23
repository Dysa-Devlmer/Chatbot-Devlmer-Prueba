'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Bell, 
  UtensilsCrossed, 
  MessageSquare, 
  Store, 
  TrendingUp, 
  Users, 
  Clock, 
  Bot, 
  UserCheck, 
  ChevronRight,
  Sparkles,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface Stats {
  totalConversations: number;
  activeConversations: number;
  totalUsers: number;
  totalMessages: number;
  unreadConversations: number;
  messagesToday: number;
  autoModeCount: number;
  manualModeCount: number;
}

interface OrderSummary {
  total: number;
  pending: number;
  ready: number;
  delivered: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [orderSummary, setOrderSummary] = useState<OrderSummary>({ total: 0, pending: 0, ready: 0, delivered: 0 });
  const [businessName, setBusinessName] = useState("Mi Negocio");
  const [currencySymbol, setCurrencySymbol] = useState("S/.");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes, busRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/business'),
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
      }

      if (ordersRes.ok) {
        const oData = await ordersRes.json();
        if (oData.success && Array.isArray(oData.orders)) {
          const orders = oData.orders;
          setOrderSummary({
            total: orders.length,
            pending: orders.filter((o: { status: string }) => o.status === 'pending').length,
            ready: orders.filter((o: { status: string }) => o.status === 'ready' || o.status === 'confirmed').length,
            delivered: orders.filter((o: { status: string }) => o.status === 'delivered').length,
          });
        }
      }

      if (busRes.ok) {
        const bData = await busRes.json();
        if (bData.profile?.name) setBusinessName(bData.profile.name);
        if (bData.profile?.currencySymbol) setCurrencySymbol(bData.profile.currencySymbol);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-full overflow-x-hidden">
      {/* Welcome Banner - Mobile-First & Gastro-Tech Identity */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 shadow-lg border border-slate-800">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Local Activo
              </span>
              <span className="text-[11px] sm:text-xs text-slate-400 font-medium">WhatsApp Business SaaS</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white truncate max-w-full">
              {businessName}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              Panel de control táctil para recepción de pedidos, catálogo en {currencySymbol} y atención automática.
            </p>
          </div>

          {/* Quick Action Button to Live Orders */}
          <Link
            href="/admin/orders"
            className="self-start sm:self-auto px-4 py-2.5 sm:px-5 sm:py-3 rounded-xl sm:rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <Bell className="w-4 h-4 stroke-[2.5]" />
            <span>Ver Pedidos en Vivo</span>
            {orderSummary.pending > 0 && (
              <span className="bg-rose-600 text-white text-[10px] sm:text-[11px] px-1.5 sm:px-2 py-0.5 rounded-full font-black animate-bounce">
                {orderSummary.pending}
              </span>
            )}
          </Link>
        </div>

        {/* Decorative subtle background circle */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Main SaaS Highlights (Gastro-specific metrics) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Pending Orders Card */}
        <Link
          href="/admin/orders"
          className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-amber-600 dark:text-amber-400">Pendientes</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {orderSummary.pending}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-0.5 sm:gap-1 group-hover:text-amber-600 transition-colors">
              <span>Por confirmar</span>
              <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </Link>

        {/* In Kitchen / Ready Card */}
        <Link
          href="/admin/orders"
          className="bg-white dark:bg-slate-900 border border-blue-200/80 dark:border-blue-900/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400">En Cocina</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
              <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {orderSummary.ready}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-0.5 sm:gap-1 group-hover:text-blue-600 transition-colors truncate">
              <span>Preparación</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </p>
          </div>
        </Link>

        {/* Total Delivered */}
        <Link
          href="/admin/orders"
          className="bg-white dark:bg-slate-900 border border-emerald-200/80 dark:border-emerald-900/40 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">Entregados</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {orderSummary.delivered}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-0.5 sm:gap-1 group-hover:text-emerald-600 transition-colors truncate">
              <span>Completados</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </p>
          </div>
        </Link>

        {/* WhatsApp Conversations */}
        <Link
          href="/admin/inbox"
          className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-xs hover:shadow-md transition-all active:scale-[0.98] flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between mb-1.5 sm:mb-2">
            <span className="text-[11px] sm:text-xs font-bold text-slate-600 dark:text-slate-300">Chats WhatsApp</span>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
              <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
              {stats?.totalConversations || 0}
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5 flex items-center gap-0.5 sm:gap-1 group-hover:text-slate-900 dark:group-hover:text-white transition-colors truncate">
              <span>{stats?.unreadConversations || 0} sin leer</span>
              <ChevronRight className="w-3 h-3 shrink-0" />
            </p>
          </div>
        </Link>
      </div>

      {/* Main Feature Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
        {/* Card 1: Pedidos en Vivo */}
        <Link
          href="/admin/orders"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] hover:border-amber-400 group flex flex-col justify-between"
        >
          <div className="space-y-2 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 flex items-center justify-center">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors">
                Tablero Kanban en Vivo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Control de comandas en tiempo real: acepta pedidos, envía a cocina y despacha con un toque.
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-amber-600">
            <span>Abrir Comandas</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 2: Menú y Catálogo */}
        <Link
          href="/admin/products"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] hover:border-orange-400 group flex flex-col justify-between"
        >
          <div className="space-y-2 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 flex items-center justify-center">
              <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-orange-600 transition-colors">
                Menú & Control de Platos
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Modifica precios en {currencySymbol}, sube o baja stock en 1 toque y pausa platos agotados al instante.
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-orange-600">
            <span>Gestionar Menú</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Card 3: WhatsApp Inbox */}
        <Link
          href="/admin/inbox"
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-md transition-all active:scale-[0.99] hover:border-emerald-400 group flex flex-col justify-between"
        >
          <div className="space-y-2 sm:space-y-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                Bandeja WhatsApp en Vivo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                Conversaciones directas con los clientes, modo automático con IA o intervención humana manual.
              </p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-emerald-600">
            <span>Ir a Mensajes</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Operational Bot & AI Details */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
          <Bot className="w-4 h-4 text-emerald-600" />
          <span>Estado del Asistente Virtual WhatsApp</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="text-slate-500 block mb-1">Modo IA Automático:</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {stats?.autoModeCount || 0} chats
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="text-slate-500 block mb-1">Atención Manual (Humana):</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {stats?.manualModeCount || 0} chats
            </span>
          </div>
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
            <span className="text-slate-500 block mb-1">Mensajes Totales Hoy:</span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
              {stats?.messagesToday || 0} msgs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
