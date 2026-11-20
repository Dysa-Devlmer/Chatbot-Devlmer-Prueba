'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MessageSquare, 
  Clock, 
  Bot, 
  ShoppingBag, 
  Truck, 
  Store, 
  DollarSign, 
  RefreshCw, 
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck,
  CreditCard,
  Banknote,
  Smartphone
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalConversations: number;
    activeConversations: number;
    totalUsers: number;
    totalMessages: number;
    unreadConversations: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
  orders?: {
    totalOrders: number;
    totalRevenue: number;
    confirmedOrders: number;
    deliveredOrders: number;
    pendingOrders: number;
    avgTicket: number;
    deliveryCount: number;
    pickupCount: number;
    paymentBreakdown: {
      yape: number;
      plin: number;
      cash: number;
      card: number;
    };
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      customerName: string;
      customerPhone: string;
      status: string;
      totalAmount: number;
      notes?: string;
      createdAt: string;
    }>;
  };
  trends: {
    conversationsChange: number;
    messagesChange: number;
    usersChange: number;
    responseTimeChange: number;
  };
  messagesByHour: Array<{ hour: number; count: number; label: string }>;
  messagesByDay: Array<{ date: string; count: number; dayName: string }>;
  topUsers: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    messageCount: number;
    lastContact: string;
  }>;
  peakHours: Array<{ hour: number; avgMessages: number }>;
  botPerformance: {
    botMessages: number;
    humanMessages: number;
    botPercentage: number;
    avgBotResponseTime: number;
    avgHumanResponseTime: number;
  };
  conversationsByStatus: {
    active: number;
    closed: number;
    pending: number;
  };
}

type Period = '24h' | '7d' | '30d';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const maxHourCount = Math.max(...(analytics?.messagesByHour.map((h) => h.count) || [1]), 1);
  const maxDayCount = Math.max(...(analytics?.messagesByDay.map((d) => d.count) || [1]), 1);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <div className="w-10 h-10 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-500 dark:text-stone-400">
          Cargando métricas de negocio en tiempo real...
        </p>
      </div>
    );
  }

  const orders = analytics?.orders || {
    totalOrders: 0,
    totalRevenue: 0,
    confirmedOrders: 0,
    deliveredOrders: 0,
    pendingOrders: 0,
    avgTicket: 0,
    deliveryCount: 0,
    pickupCount: 0,
    paymentBreakdown: { yape: 0, plin: 0, cash: 0, card: 0 },
    recentOrders: [],
  };

  const overview = analytics?.overview || {
    totalConversations: 0,
    activeConversations: 0,
    totalUsers: 0,
    totalMessages: 0,
    unreadConversations: 0,
    avgResponseTime: 45,
    satisfactionScore: 95,
  };

  const bot = analytics?.botPerformance || {
    botMessages: 0,
    humanMessages: 0,
    botPercentage: 0,
    avgBotResponseTime: 2,
    avgHumanResponseTime: 120,
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* Top Header & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-stone-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Métricas & Rendimiento
            </span>
            <span className="text-xs text-slate-400 dark:text-stone-500">
              • Actualizado {lastUpdated.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Analytics de Negocio & WhatsApp
          </h1>
          <p className="text-sm text-slate-600 dark:text-stone-400 mt-0.5">
            Monitoreo en vivo de ventas, pedidos por delivery/tienda y efectividad del bot IA.
          </p>
        </div>

        {/* Period Selector & Refresh */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="p-1 rounded-xl bg-slate-100 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 flex items-center shadow-inner">
            {(['24h', '7d', '30d'] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  period === p
                    ? 'bg-orange-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {p === '24h' ? 'Últimas 24h' : p === '7d' ? '7 Días' : '30 Días'}
              </button>
            ))}
          </div>

          <button
            onClick={fetchAnalytics}
            disabled={isRefreshing}
            className="p-2 rounded-xl bg-slate-100 dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-slate-600 dark:text-stone-400 hover:text-orange-600 dark:hover:text-orange-400 transition-all active:scale-95 disabled:opacity-50"
            title="Refrescar métricas ahora"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-orange-500' : ''}`} />
          </button>
        </div>
      </div>

      {/* 1. Core KPIs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Revenue */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
              Ventas Estimadas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#94de2d] flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xs font-black text-slate-500 dark:text-stone-400">S/.</span>
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {orders.totalRevenue.toFixed(2)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 dark:text-[#94de2d] font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Ticket prom: S/. {orders.avgTicket.toFixed(2)}</span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
              Pedidos Realizados
            </span>
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {orders.totalOrders}
            </span>
            <span className="text-xs text-slate-500 dark:text-stone-400">
              ({orders.confirmedOrders} en cocina)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 dark:text-stone-400">
            <span className="flex items-center gap-1">
              <Truck className="w-3 h-3 text-orange-500" />
              <b>{orders.deliveryCount}</b> Delivery
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Store className="w-3 h-3 text-purple-500" />
              <b>{orders.pickupCount}</b> Local
            </span>
          </div>
        </div>

        {/* WhatsApp Clients & Conversations */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
              Clientes Atendidos
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {overview.totalUsers}
            </span>
            <span className="text-xs text-slate-500 dark:text-stone-400">
              ({overview.totalConversations} chats)
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-stone-400">
            <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
            <span>{overview.totalMessages} mensajes intercambiados</span>
          </div>
        </div>

        {/* Bot IA Automation Rate */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-stone-400 uppercase tracking-wider">
              Automatización IA
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Bot className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
              {bot.botPercentage}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-[#94de2d] font-bold">
              Autónomo
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600 dark:text-stone-400">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Respuesta en ~{bot.avgBotResponseTime}s</span>
          </div>
        </div>

      </div>

      {/* 2. Charts Section: Daily Activity & Peak Hours */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly Traffic Bars */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-orange-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Volumen de Mensajes por Día
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-stone-400">Última semana</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
              Frecuencia de consultas y pedidos entrantes por los clientes en WhatsApp.
            </p>
          </div>

          {/* Clean Bar Visualization */}
          <div className="mt-6 pt-4 flex items-end justify-between gap-2 sm:gap-4 h-44 border-b border-slate-100 dark:border-stone-800/80 px-2">
            {analytics?.messagesByDay.map((day, idx) => {
              const heightPct = Math.max(12, Math.round((day.count / maxDayCount) * 100));
              const isToday = idx === analytics.messagesByDay.length - 1;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[10px] font-bold text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {day.count}
                  </span>
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                      isToday
                        ? 'bg-gradient-to-t from-orange-600 to-amber-500 shadow-md shadow-orange-500/20'
                        : 'bg-slate-200 dark:bg-stone-800 hover:bg-orange-500/60'
                    }`}
                  />
                  <span className={`text-xs font-bold mt-1 ${
                    isToday ? 'text-orange-600 dark:text-orange-400 font-black' : 'text-slate-500 dark:text-stone-400'
                  }`}>
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-orange-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Métodos de Pago Preferidos
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
              Preferencia de pago de los comensales.
            </p>
          </div>

          <div className="mt-4 space-y-3">
            {/* Yape */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200/60 dark:border-stone-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-purple-900/20 text-purple-600 dark:text-purple-300 flex items-center justify-center font-black text-[10px]">
                  YP
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Yape</p>
                  <p className="text-[10px] text-slate-500 dark:text-stone-400">Transferencia móvil</p>
                </div>
              </div>
              <span className="text-sm font-black text-purple-600 dark:text-purple-400">
                {orders.paymentBreakdown.yape} pedidos
              </span>
            </div>

            {/* Plin */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200/60 dark:border-stone-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-cyan-900/20 text-cyan-600 dark:text-cyan-300 flex items-center justify-center font-black text-[10px]">
                  PL
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Plin</p>
                  <p className="text-[10px] text-slate-500 dark:text-stone-400">Interbancario</p>
                </div>
              </div>
              <span className="text-sm font-black text-cyan-600 dark:text-cyan-400">
                {orders.paymentBreakdown.plin} pedidos
              </span>
            </div>

            {/* Cash */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200/60 dark:border-stone-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Efectivo</p>
                  <p className="text-[10px] text-slate-500 dark:text-stone-400">Contraentrega</p>
                </div>
              </div>
              <span className="text-sm font-black text-emerald-600 dark:text-[#94de2d]">
                {orders.paymentBreakdown.cash} pedidos
              </span>
            </div>

            {/* Card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200/60 dark:border-stone-800/60 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-900/20 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Tarjeta POS</p>
                  <p className="text-[10px] text-slate-500 dark:text-stone-400">Al repartidor</p>
                </div>
              </div>
              <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                {orders.paymentBreakdown.card} pedidos
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Hourly Activity & Top Clients */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Peak Hours (24h Distribution) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Horas Pico de Pedidos & Atención
              </h3>
            </div>
            <span className="text-xs text-slate-500 dark:text-stone-400">24 Horas</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
            Distribución horaria para programar turnos de cocina y motorizados de delivery.
          </p>

          <div className="mt-5 grid grid-cols-6 sm:grid-cols-12 gap-1.5">
            {analytics?.messagesByHour.map((h) => {
              const intensity = h.count > 0 ? Math.min(100, Math.max(20, Math.round((h.count / maxHourCount) * 100))) : 0;
              return (
                <div
                  key={h.hour}
                  title={`${h.label}: ${h.count} interacciones`}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                    h.count > 0
                      ? 'bg-orange-500/20 border border-orange-500/40 text-orange-600 dark:text-orange-400 font-bold'
                      : 'bg-slate-50 dark:bg-stone-950 border border-slate-100 dark:border-stone-800/40 text-slate-400 dark:text-stone-600'
                  }`}
                >
                  <span className="text-[10px]">{h.label.slice(0, 2)}h</span>
                  <span className="text-xs font-black">{h.count}</span>
                </div>
              );
            })}
          </div>

          {/* Highlight Top 3 Peak Hours */}
          {analytics?.peakHours && analytics.peakHours.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-bold text-slate-800 dark:text-orange-200">
                  Horas de Mayor Demanda:
                </span>
              </div>
              <div className="flex items-center gap-2">
                {analytics.peakHours.map((ph) => (
                  <span
                    key={ph.hour}
                    className="px-2 py-0.5 rounded-md bg-orange-500 text-white text-[10px] font-black"
                  >
                    {ph.hour.toString().padStart(2, '0')}:00 ({ph.avgMessages} msgs)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Top Active Customers */}
        <div className="p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Clientes Más Frecuentes
                </h3>
              </div>
              <Link
                href="/admin/inbox"
                className="text-xs text-orange-600 dark:text-orange-400 font-bold hover:underline flex items-center gap-1"
              >
                <span>Ver Inbox</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
              Fidelización de comensales que compran o consultan recurrentemente por WhatsApp.
            </p>
          </div>

          <div className="mt-4 divide-y divide-slate-100 dark:divide-stone-800/80">
            {analytics?.topUsers && analytics.topUsers.length > 0 ? (
              analytics.topUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 flex items-center justify-center font-bold text-xs shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                        +{user.phoneNumber}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#94de2d] text-xs font-black">
                      {user.messageCount} msgs
                    </span>
                    <Link
                      href="/admin/inbox"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-300 hover:text-orange-500 transition-colors"
                      title="Abrir chat en WhatsApp Web"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 text-center">
                Aún no hay interacciones registradas.
              </p>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
