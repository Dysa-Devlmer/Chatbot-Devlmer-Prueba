'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building2, 
  Plus, 
  ExternalLink, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  DollarSign, 
  Users, 
  PhoneCall, 
  ShieldCheck, 
  Power, 
  Copy, 
  Check, 
  Globe, 
  Server,
  Layers,
  ArrowRight,
  X,
  RefreshCw,
  TrendingUp,
  MessageSquare
} from 'lucide-react';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  plan: 'basic' | 'pro' | string;
  status: 'active' | 'suspended' | string;
  currencySymbol: string;
  currency: string;
  port: number;
  domain: string;
  whatsappNumber: string | null;
  phoneNumberId: string | null;
  metaSynced: boolean;
  monthlyPrice: number;
  adminEmail: string | null;
  adminInitialPassword: string | null;
  createdAt: string;
}

interface Stats {
  totalTenants: number;
  activeTenants: number;
  proTenants: number;
  totalMRR: number;
}

export default function MasterDashboardPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTenants: 0, activeTenants: 0, proTenants: 0, totalMRR: 0 });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    loginUrl: string;
    menuUrl: string;
    username: string;
    password: string;
    name: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    plan: 'basic',
    currencySymbol: 'S/.',
    currency: 'PEN',
    whatsappNumber: '',
    phoneNumberId: '',
    template: 'fast_food',
  });

  const showNotification = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);
        if (data.stats) setStats(data.stats);
      } else {
        const errData = await res.json().catch(() => ({}));
        showNotification('error', errData.error || 'Error al conectar con la base de datos de empresas.');
      }
    } catch (err) {
      console.error('Error cargando empresas:', err);
      showNotification('error', 'Error de red al consultar empresas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTenants();
  }, []);

  const handleSlugAuto = (name: string) => {
    const clean = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');
    setFormData(prev => ({ ...prev, name, slug: clean }));
  };

  const handleToggleStatus = async (tenant: Tenant) => {
    const nextStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const actionDesc = nextStatus === 'active' ? 'activar' : 'suspender temporalmente';
    
    if (!confirm(`¿Está seguro de ${actionDesc} el servicio para "${tenant.name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/tenants/${tenant.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        showNotification('success', `Empresa ${tenant.name} ${nextStatus === 'active' ? 'activada' : 'suspendida'} correctamente.`);
        loadTenants();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'No se pudo cambiar el estado.');
      }
    } catch (err) {
      showNotification('error', 'Error al comunicar con el servidor.');
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.slug.trim()) {
      showNotification('error', 'Complete el nombre y el subdominio de la empresa.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        showNotification('success', `¡Empresa ${data.tenant.name} registrada exitosamente!`);
        setCreatedCredentials({
          loginUrl: data.credentials.loginUrl,
          menuUrl: data.credentials.menuUrl,
          username: data.credentials.username,
          password: data.credentials.password,
          name: data.tenant.name,
        });
        loadTenants();
      } else {
        showNotification('error', data.error || 'Error al aprovisionar la empresa.');
      }
    } catch (err) {
      showNotification('error', 'Error inesperado de conexión al crear empresa.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdCredentials) return;
    const text = `🎉 *¡Bienvenido a tu Sistema de Pedidos WhatsApp!*

Tu plataforma para *${createdCredentials.name}* está lista y activa:

🔗 *Acceso a tu Panel de Administrador:*
${createdCredentials.loginUrl}

👤 *Usuario:* ${createdCredentials.username}
🔑 *Contraseña Inicial:* ${createdCredentials.password}

🍽️ *Tu Carta Digital Pública para Clientes:*
${createdCredentials.menuUrl}

_Guarda este mensaje para iniciar sesión y configurar tus platos._`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 border shadow-xl ${
          message.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200' 
            : 'bg-rose-950/80 border-rose-500/40 text-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Hero SaaS Control Header with controlled two-row layout & min-h */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-[#151a22] to-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden min-h-[140px]">
        <div className="space-y-2 z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Acceso Privado Maestro &bull; Modo CEO
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Gestión de Empresas & Arriendos SaaS
          </h1>
          <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">
            Aprovisiona nuevas empresas en segundos con bases de datos aisladas, subdominios dedicados y sincronización automática de WhatsApp Cloud API en Meta.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-3 z-10 shrink-0">
          <button
            onClick={loadTenants}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0 cursor-pointer"
            title="Refrescar lista"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => {
              setCreatedCredentials(null);
              setFormData({
                name: '',
                slug: '',
                plan: 'basic',
                currencySymbol: 'S/.',
                currency: 'PEN',
                whatsappNumber: '',
                phoneNumberId: '',
                template: 'fast_food',
              });
              setShowModal(true);
            }}
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[3]" />
            <span>+ Registrar Nueva Empresa</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* MRR & Business Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total MRR Card */}
        <div className="bg-[#12161c] border border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">MRR Recurrente</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-bold">
              <DollarSign className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            ${stats.totalMRR.toFixed(2)}
            <span className="text-xs text-slate-400 font-medium ml-1">USD/mes</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Facturación mensual activa estimada
          </p>
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />
        </div>

        {/* Total Tenants */}
        <div className="bg-[#12161c] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Empresas</span>
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats.totalTenants}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Instancias aprovisionadas en el VPS
          </p>
        </div>

        {/* Active Tenants */}
        <div className="bg-[#12161c] border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Activas / Al Día</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats.activeTenants}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Servicio habilitado y recibiendo pedidos
          </p>
        </div>

        {/* Pro Plan (AI Voice Agents) */}
        <div className="bg-[#12161c] border border-purple-500/30 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">Plan Pro (Voz IA)</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white">
            {stats.proTenants}
          </div>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            Empresas con agente de llamadas Gemini
          </p>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="bg-[#12161c] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-black text-white">Empresas Arrendatarias Registradas</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {tenants.length} {tenants.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-[#0f1318] text-xs font-black text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-4 px-6">Empresa & Subdominio</th>
                <th className="py-4 px-4">Plan & Precio</th>
                <th className="py-4 px-4">WhatsApp & Meta</th>
                <th className="py-4 px-4">Moneda</th>
                <th className="py-4 px-4">Puerto VPS</th>
                <th className="py-4 px-4">Estado</th>
                <th className="py-4 px-6 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {tenants.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 font-medium">
                    {loading ? 'Cargando empresas...' : 'Aún no hay empresas registradas. Haga clic en "+ Registrar Nueva Empresa" para agregar la primera.'}
                  </td>
                </tr>
              ) : (
                tenants.map((t) => {
                  const isActive = t.status === 'active';
                  const isPro = t.plan === 'pro';

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Name & Domain */}
                      <td className="py-4 px-6">
                        <div className="font-black text-white text-base">{t.name}</div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                          <Globe className="w-3.5 h-3.5 text-amber-400" />
                          <span className="font-mono text-amber-400/90">{t.domain}</span>
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                          isPro 
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30' 
                            : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                        }">
                          {isPro ? <Sparkles className="w-3.5 h-3.5 text-purple-400" /> : null}
                          <span>{t.plan}</span>
                        </div>
                        <div className="text-xs text-slate-400 font-semibold mt-1">
                          ${t.monthlyPrice || (isPro ? 99 : 49)}/mes
                        </div>
                      </td>

                      {/* WhatsApp & Meta */}
                      <td className="py-4 px-4">
                        {t.whatsappNumber ? (
                          <div>
                            <div className="font-mono text-xs font-bold text-emerald-400">
                              {t.whatsappNumber}
                            </div>
                            <div className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <span>ID:</span>
                              <span className="font-mono">{t.phoneNumberId || 'Pendiente'}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500 italic">No configurado</span>
                        )}
                      </td>

                      {/* Currency */}
                      <td className="py-4 px-4">
                        <span className="font-black text-slate-200">{t.currencySymbol}</span>
                        <span className="text-xs text-slate-400 ml-1">({t.currency})</span>
                      </td>

                      {/* Port */}
                      <td className="py-4 px-4">
                        <span className="font-mono text-xs px-2 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                          :{t.port}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                          isActive 
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                          <span>{isActive ? 'Activo' : 'Suspendido'}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Toggle Active/Suspended */}
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all border ${
                              isActive 
                                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={isActive ? 'Suspender cliente por falta de pago' : 'Reactivar servicio'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Open Admin link */}
                          <Link
                            href={`https://${t.domain}/admin`}
                            target="_blank"
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
                            title="Abrir panel administrativo de la empresa"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Registrar Nueva Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141820] border border-slate-700/80 rounded-3xl w-full max-w-xl p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {createdCredentials ? (
              /* Success & Credentials Display */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-black text-white">¡Empresa Lista para Operar!</h3>
                  <p className="text-sm text-slate-400">
                    La base de datos aislada, subdominio y configuración han sido creados exitosamente.
                  </p>
                </div>

                <div className="bg-slate-900/90 rounded-2xl p-5 border border-slate-800 space-y-3 font-mono text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Enlace de Administrador:</span>
                    <a href={createdCredentials.loginUrl} target="_blank" className="text-amber-400 hover:underline break-all font-bold">
                      {createdCredentials.loginUrl}
                    </a>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Usuario:</span>
                      <span className="text-white font-bold">{createdCredentials.username}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">Contraseña Inicial:</span>
                      <span className="text-emerald-400 font-bold">{createdCredentials.password}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleCopyCredentials}
                  className={`w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 shadow-xl ${
                    copied 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
                  }`}
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? '¡Copiado para WhatsApp!' : 'Copiar Credenciales para el Cliente (WhatsApp)'}</span>
                </button>
              </div>
            ) : (
              /* Creation Form */
              <form onSubmit={handleCreateTenant} className="space-y-6">
                <div>
                  <h3 className="text-xl font-black text-white">Registrar Nueva Empresa Arrendataria</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Configure los datos comerciales. El sistema aprovisionará la base de datos de manera 100% aislada.
                  </p>
                </div>

                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Nombre Comercial de la Empresa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Pollería La Pasión"
                      value={formData.name}
                      onChange={(e) => handleSlugAuto(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  {/* Slug / Subdomain */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Subdominio Asignado *
                    </label>
                    <div className="flex items-center rounded-xl bg-slate-900 border border-slate-700 overflow-hidden focus-within:border-amber-500">
                      <input
                        type="text"
                        required
                        placeholder="lapasion"
                        value={formData.slug}
                        onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        className="flex-1 px-4 py-3 bg-transparent text-white text-sm focus:outline-hidden font-mono"
                      />
                      <span className="px-3 text-xs text-slate-500 font-mono">.zgamersa.com</span>
                    </div>
                  </div>

                  {/* Currency Selection */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Símbolo de Moneda
                      </label>
                      <input
                        type="text"
                        value={formData.currencySymbol}
                        onChange={(e) => setFormData(prev => ({ ...prev, currencySymbol: e.target.value }))}
                        placeholder="S/. o $"
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                        Código ISO
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => {
                          const c = e.target.value;
                          const sym = c === 'PEN' ? 'S/.' : c === 'CLP' ? '$' : c === 'USD' ? '$' : '$';
                          setFormData(prev => ({ ...prev, currency: c, currencySymbol: sym }));
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="PEN">PEN (Perú - Soles S/.)</option>
                        <option value="CLP">CLP (Chile - Pesos $)</option>
                        <option value="USD">USD (Dólares $)</option>
                      </select>
                    </div>
                  </div>

                  {/* Plan Selection */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      Plan Comercial de Suscripción
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, plan: 'basic' }))}
                        className={`p-4 rounded-2xl border text-left transition-all ${
                          formData.plan === 'basic'
                            ? 'bg-amber-500/10 border-amber-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-black text-sm">Plan Básico</div>
                        <div className="text-xl font-black text-amber-400 mt-1">$49 <span className="text-xs text-slate-400 font-normal">/mes</span></div>
                        <div className="text-[11px] text-slate-400 mt-1">Chatbot WhatsApp + Menú + Comandas</div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, plan: 'pro' }))}
                        className={`p-4 rounded-2xl border text-left transition-all relative ${
                          formData.plan === 'pro'
                            ? 'bg-purple-500/15 border-purple-500 text-white'
                            : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-black text-sm flex items-center justify-between">
                          <span>Plan Pro</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">Voz IA</span>
                        </div>
                        <div className="text-xl font-black text-purple-400 mt-1">$99 <span className="text-xs text-slate-400 font-normal">/mes</span></div>
                        <div className="text-[11px] text-slate-400 mt-1">Incluye Agente Telefónico de Voz con Gemini</div>
                      </button>
                    </div>
                  </div>

                  {/* Meta WhatsApp Configuration */}
                  <div className="p-4 rounded-2xl bg-[#0f1318] border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                      <MessageSquare className="w-4 h-4" />
                      <span>Sincronización Automática con WhatsApp Cloud API (Meta)</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Número de WhatsApp Oficial
                        </label>
                        <input
                          type="text"
                          placeholder="+56 9 1234 5678"
                          value={formData.whatsappNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Phone Number ID de Meta
                        </label>
                        <input
                          type="text"
                          placeholder="Ej: 905984725929536"
                          value={formData.phoneNumberId}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumberId: e.target.value }))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs focus:outline-hidden focus:border-amber-500 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-xs shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {submitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Aprovisionando en VPS...</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4 stroke-[3]" />
                        <span>Crear y Aprovisionar Empresa</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
