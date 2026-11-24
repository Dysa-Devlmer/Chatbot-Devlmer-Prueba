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
  MessageSquare,
  Trash2,
  HelpCircle,
  Info
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

  // Plan Change Modal State
  const [planModalTenant, setPlanModalTenant] = useState<Tenant | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'pro'>('basic');
  const [updatingPlan, setUpdatingPlan] = useState(false);

  // Delete Tenant Modal State
  const [deleteModalTenant, setDeleteModalTenant] = useState<Tenant | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingTenant, setDeletingTenant] = useState(false);

  // Guide Tooltip State
  const [showPhoneIdGuide, setShowPhoneIdGuide] = useState(false);

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

  const handleOpenPlanModal = (tenant: Tenant) => {
    setPlanModalTenant(tenant);
    setSelectedPlan(tenant.plan === 'pro' ? 'pro' : 'basic');
  };

  const handleUpdatePlan = async () => {
    if (!planModalTenant) return;
    try {
      setUpdatingPlan(true);
      const res = await fetch(`/api/admin/tenants/${planModalTenant.id}/plan`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      if (res.ok) {
        const data = await res.json();
        showNotification('success', data.message || 'Plan de empresa actualizado con éxito.');
        setPlanModalTenant(null);
        loadTenants();
      } else {
        const err = await res.json();
        showNotification('error', err.error || 'No se pudo actualizar el plan.');
      }
    } catch (err) {
      showNotification('error', 'Error al comunicar con el servidor.');
    } finally {
      setUpdatingPlan(false);
    }
  };

  const handleDeleteTenant = async () => {
    if (!deleteModalTenant) return;
    if (deleteConfirmText.trim().toLowerCase() !== deleteModalTenant.slug.toLowerCase()) {
      showNotification('error', `Debe escribir exactamente "${deleteModalTenant.slug}" para confirmar.`);
      return;
    }

    try {
      setDeletingTenant(true);
      const res = await fetch(`/api/admin/tenants/${deleteModalTenant.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (res.ok) {
        showNotification('success', data.message || `Empresa ${deleteModalTenant.name} desprovisionada y eliminada.`);
        setDeleteModalTenant(null);
        setDeleteConfirmText('');
        loadTenants();
      } else {
        showNotification('error', data.error || 'No se pudo eliminar la empresa.');
      }
    } catch (err) {
      showNotification('error', 'Error al comunicar con el servidor.');
    } finally {
      setDeletingTenant(false);
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
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300 w-full min-w-0">
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

      {/* Hero SaaS Control Header with controlled responsive layout */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-5 bg-gradient-to-r from-slate-900 via-[#151a22] to-slate-900 p-4 sm:p-6 lg:p-7 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden w-full max-w-full">
        <div className="space-y-1.5 sm:space-y-2 z-10 max-w-2xl min-w-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            Acceso Privado Maestro &bull; Modo CEO
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight break-words">
            Gestión de Empresas & Arriendos SaaS
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Aprovisiona nuevas empresas en segundos con bases de datos aisladas, subdominios dedicados y sincronización automática de WhatsApp Cloud API en Meta.
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 z-10 shrink-0 w-full md:w-auto pt-2 md:pt-0">
          <button
            onClick={loadTenants}
            className="p-3 sm:p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all shrink-0 cursor-pointer"
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
            className="flex-1 md:flex-initial px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-stone-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
            <span>+ Registrar Nueva Empresa</span>
          </button>
        </div>

        {/* Ambient background glow */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* MRR & Business Health Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 w-full max-w-full">
        {/* Total MRR Card */}
        <div className="bg-[#12161c] border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg relative overflow-hidden">
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
        <div className="bg-[#12161c] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
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
        <div className="bg-[#12161c] border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-lg">
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
        <div className="bg-[#12161c] border border-purple-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
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

      {/* Tenants Table with contained horizontal scrolling */}
      <div className="bg-[#12161c] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl w-full max-w-full">
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-400" />
            <h2 className="text-base sm:text-lg font-black text-white">Empresas Arrendatarias Registradas</h2>
          </div>
          <span className="text-xs text-slate-400 font-bold">
            {tenants.length} {tenants.length === 1 ? 'empresa' : 'empresas'}
          </span>
        </div>

        <div className="w-full max-w-full overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-sm text-slate-300">
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
                        <button
                          type="button"
                          onClick={() => handleOpenPlanModal(t)}
                          className="group text-left cursor-pointer"
                          title="Haga clic para cambiar de Plan"
                        >
                          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-black uppercase tracking-wider border transition-all group-hover:scale-105 ${
                            isPro 
                              ? 'bg-purple-500/10 text-purple-300 border-purple-500/30 group-hover:bg-purple-500/20' 
                              : 'bg-blue-500/10 text-blue-300 border-blue-500/30 group-hover:bg-blue-500/20'
                          }`}>
                            {isPro ? <Sparkles className="w-3.5 h-3.5 text-purple-400" /> : null}
                            <span>{t.plan}</span>
                            <span className="text-[10px] text-slate-400 opacity-60 group-hover:opacity-100">✏️</span>
                          </div>
                          <div className="text-xs text-slate-400 font-semibold mt-1">
                            ${t.monthlyPrice || (isPro ? 99 : 49)}/mes
                          </div>
                        </button>
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
                          {/* Change Plan Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenPlanModal(t)}
                            className="p-2 rounded-xl text-xs font-bold transition-all border bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border-purple-500/30 cursor-pointer"
                            title="Cambiar Plan (Básico / Pro)"
                          >
                            <Sparkles className="w-4 h-4 text-purple-400" />
                          </button>

                          {/* Toggle Active/Suspended */}
                          <button
                            onClick={() => handleToggleStatus(t)}
                            className={`p-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                              isActive 
                                ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30' 
                                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            }`}
                            title={isActive ? 'Suspender cliente por falta de pago (Pausa temporal)' : 'Reactivar servicio'}
                          >
                            <Power className="w-4 h-4" />
                          </button>

                          {/* Delete Tenant Button (Disabled for master demo 'churus') */}
                          {t.slug !== 'churus' && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteModalTenant(t);
                                setDeleteConfirmText('');
                              }}
                              className="p-2 rounded-xl text-xs font-bold transition-all border bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30 cursor-pointer"
                              title="Eliminar y desprovisionar empresa permanentemente"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}

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
                          const sym = c === 'PEN' ? 'S/.' : '$';
                          setFormData(prev => ({ ...prev, currency: c, currencySymbol: sym }));
                        }}
                        className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-hidden focus:border-amber-500"
                      >
                        <option value="PEN">PEN (Perú - Soles S/.)</option>
                        <option value="CLP">CLP (Chile - Pesos $)</option>
                        <option value="ARS">ARS (Argentina - Pesos $)</option>
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
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#0f1318] border border-emerald-500/30 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span>Sincronización Oficial con WhatsApp Cloud API (Meta)</span>
                      </div>
                      <a
                        href="https://business.facebook.com/latest/whatsapp_manager/phone_numbers/?business_id=1702023544088035&asset_id=779998311756531"
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-all shrink-0 cursor-pointer w-fit"
                        title="Abrir WhatsApp Manager en Meta para agregar el número y verificar el SMS"
                      >
                        <span>Abrir Meta WhatsApp Manager</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-200/90 leading-relaxed">
                      💡 <strong>Paso Rápido (3 min):</strong> Abre Meta con el botón de arriba &rarr; Pulsa <em>&quot;Agregar número de teléfono&quot;</em> &rarr; Pídele al cliente el código SMS de 6 dígitos &rarr; Meta te entregará el <strong>Phone Number ID</strong> (15 dígitos). Pégalos abajo:
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* WhatsApp Official Number with real-time format feedback */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-slate-300">
                            Número de WhatsApp Oficial *
                          </label>
                          {formData.whatsappNumber ? (
                            formData.whatsappNumber.startsWith('+') && formData.whatsappNumber.replace(/\D/g, '').length >= 10 ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> Formato válido
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-bold">
                                Debe incluir + y código país
                              </span>
                            )
                          ) : null}
                        </div>
                        <input
                          type="text"
                          placeholder="Ej: +51 987 654 321 o +56 9 1234 5678"
                          value={formData.whatsappNumber}
                          onChange={(e) => {
                            let val = e.target.value;
                            if (val && !val.startsWith('+') && /^\d/.test(val)) {
                              val = '+' + val;
                            }
                            setFormData(prev => ({ ...prev, whatsappNumber: val }));
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-white text-xs focus:outline-hidden font-mono transition-all ${
                            formData.whatsappNumber && formData.whatsappNumber.startsWith('+') && formData.whatsappNumber.replace(/\D/g, '').length >= 10
                              ? 'border-emerald-500/60 focus:border-emerald-500'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Formato internacional E.164 (Ej. Perú +51, Chile +56).
                        </span>
                      </div>

                      {/* Phone Number ID with Tooltip & Digit Counter Feedback */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1">
                            <label className="text-[11px] font-bold text-slate-300">
                              Phone Number ID de Meta *
                            </label>
                            <button
                              type="button"
                              onClick={() => setShowPhoneIdGuide(!showPhoneIdGuide)}
                              className="text-amber-400 hover:text-amber-300 transition-colors p-0.5 rounded cursor-pointer"
                              title="¿Dónde encuentro este ID?"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {formData.phoneNumberId ? (
                            /^\d{14,17}$/.test(formData.phoneNumberId) ? (
                              <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                                <Check className="w-3 h-3 stroke-[3]" /> {formData.phoneNumberId.length} dígitos ✓
                              </span>
                            ) : (
                              <span className="text-[10px] text-amber-400 font-bold">
                                {formData.phoneNumberId.length}/15 dígitos
                              </span>
                            )
                          ) : (
                            <span className="text-[10px] text-slate-500">15 dígitos</span>
                          )}
                        </div>
                        <input
                          type="text"
                          maxLength={18}
                          placeholder="Ej: 905984725929536 (15 dígitos)"
                          value={formData.phoneNumberId}
                          onChange={(e) => {
                            // Only allow pure digits
                            const digitsOnly = e.target.value.replace(/\D/g, '');
                            setFormData(prev => ({ ...prev, phoneNumberId: digitsOnly }));
                          }}
                          className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border text-xs focus:outline-hidden font-mono font-bold transition-all ${
                            /^\d{14,17}$/.test(formData.phoneNumberId)
                              ? 'border-emerald-500/80 text-emerald-300 focus:border-emerald-400'
                              : formData.phoneNumberId.length > 0
                                ? 'border-amber-500/70 text-amber-300 focus:border-amber-400'
                                : 'border-slate-700 text-white focus:border-amber-500'
                          }`}
                        />
                        <span className="text-[10px] text-slate-500 mt-1 block">
                          Identificador numérico de 15 dígitos asignado por Meta.
                        </span>
                      </div>
                    </div>

                    {/* Contextual Micro-guide Tooltip Banner */}
                    {showPhoneIdGuide && (
                      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-amber-500/30 text-xs text-slate-300 space-y-1.5 animate-in fade-in duration-200">
                        <div className="flex items-center gap-2 font-bold text-amber-400">
                          <Info className="w-4 h-4 shrink-0" />
                          <span>¿Dónde encuentro el Phone Number ID?</span>
                        </div>
                        <p className="text-[11px] text-slate-300 leading-relaxed pl-6">
                          1. Entra a <strong className="text-white">developers.facebook.com</strong> &rarr; Tu App.<br />
                          2. En el menú izquierdo ve a <strong className="text-white">WhatsApp &gt; Configuración de la API</strong>.<br />
                          3. En el paso 1 verás: <em className="text-amber-300 font-mono">Identificador de número de teléfono</em> (ej: 905984725929536). Cópialo y pégalo aquí.
                        </p>
                      </div>
                    )}

                    {/* Roadmap v2.5: Embedded Signup 1-Click Button */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3 bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-300">Conectar con WhatsApp Directo</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/40">
                            Roadmap v2.5
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 truncate">
                          Próximamente: Alta en 1-clic con Meta Embedded Signup sin salir del portal.
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled
                        className="px-3.5 py-1.5 rounded-xl bg-slate-800/80 text-slate-500 border border-slate-700/60 text-[11px] font-bold flex items-center gap-1.5 shrink-0 opacity-60 cursor-not-allowed"
                        title="Función en hoja de ruta (Roadmap v2.5)"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-purple-400/50" />
                        <span>Embedded Signup</span>
                      </button>
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

      {/* Modal: Cambiar Plan de Suscripción */}
      {planModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141820] border border-slate-700/80 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setPlanModalTenant(null)}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <h3 className="text-xl font-black text-white">Modificar Plan de Arriendo</h3>
                </div>
                <p className="text-xs text-slate-400">
                  Empresa: <span className="font-bold text-white">{planModalTenant.name}</span> &bull; Subdominio: <span className="font-mono text-amber-400">{planModalTenant.domain}</span>
                </p>
              </div>

              {/* Selector de Planes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Plan Básico */}
                <div
                  onClick={() => setSelectedPlan('basic')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    selectedPlan === 'basic'
                      ? 'border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-blue-400">
                      Plan Básico
                    </span>
                    {selectedPlan === 'basic' && (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="text-xl font-black text-white mb-2">
                    $49 <span className="text-xs text-slate-400 font-normal">USD/mes</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Chatbot WhatsApp IA</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Tablero Kanban de Cocina</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>Menú Digital QR</span>
                    </li>
                  </ul>
                </div>

                {/* Plan Pro */}
                <div
                  onClick={() => setSelectedPlan('pro')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                    selectedPlan === 'pro'
                      ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/10'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-purple-400">
                      Plan Pro (Voz IA)
                    </span>
                    {selectedPlan === 'pro' && (
                      <CheckCircle2 className="w-4 h-4 text-purple-400" />
                    )}
                  </div>
                  <div className="text-xl font-black text-white mb-2">
                    $99 <span className="text-xs text-slate-400 font-normal">USD/mes</span>
                  </div>
                  <ul className="text-[11px] text-slate-300 space-y-1.5">
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Todo lo del Plan Básico</span>
                    </li>
                    <li className="flex items-center gap-1.5 font-bold text-purple-300">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Agente de Llamadas IA</span>
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Atención telefónica 24/7</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Dynamic Impact Notice (You Should Know) */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Impacto Operativo & Facturación (You Should Know):</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {selectedPlan === 'pro' 
                    ? 'Al activar el Plan Pro, se habilitará la recepción de llamadas de voz automáticas con Gemini y la facturación estimada mensual del cliente se actualizará a $99.00 USD.' 
                    : 'Al cambiar a Plan Básico, se desactivará el módulo de llamadas telefónicas y el cliente operará únicamente con chatbot de mensajería y catálogo a $49.00 USD/mes.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPlanModalTenant(null)}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpdatePlan}
                  disabled={updatingPlan || selectedPlan === planModalTenant.plan}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs shadow-lg shadow-purple-600/20 transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {updatingPlan ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Actualizando...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Guardar Nuevo Plan</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Confirmar Eliminación Definitiva de Empresa */}
      {deleteModalTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#141820] border border-rose-500/40 rounded-3xl w-full max-w-lg p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                if (!deletingTenant) {
                  setDeleteModalTenant(null);
                  setDeleteConfirmText('');
                }
              }}
              className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/40 shrink-0">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white">¿Desmantelar y Eliminar Empresa?</h3>
                  <p className="text-xs text-rose-400 font-semibold mt-0.5">
                    Acción destructiva de desprovisionamiento de infraestructura
                  </p>
                </div>
              </div>

              {/* Warning Box (You Should Know) */}
              <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/30 space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-1.5 font-bold text-rose-400">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>YOU SHOULD KNOW (Centinela Activo):</span>
                </div>
                <ul className="space-y-1.5 text-[11px] text-slate-300 list-disc list-inside">
                  <li>
                    Se respaldará la base de datos de <strong className="text-white">{deleteModalTenant.name}</strong> a un archivo histórico <code className="text-amber-400">.archived_{'{timestamp}'}</code>.
                  </li>
                  <li>
                    Se detendrá y purgará el proceso PM2 <code className="text-white">tenant-{deleteModalTenant.slug}</code> del VPS.
                  </li>
                  <li>
                    Se retirará la configuración Nginx y el subdominio <strong className="text-white">{deleteModalTenant.domain}</strong> dejará de responder de inmediato.
                  </li>
                  <li>
                    Si solo desea interrumpir el acceso por falta de pago, use el botón <strong className="text-amber-400">Suspender</strong> (color naranja) en lugar de eliminar.
                  </li>
                </ul>
              </div>

              {/* Confirmation Input */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-300">
                  Para confirmar, escriba el subdominio exacto de la empresa:
                  <span className="block font-mono text-rose-400 text-sm mt-1 select-all bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800 inline-block">
                    {deleteModalTenant.slug}
                  </span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={`Escriba ${deleteModalTenant.slug}`}
                  disabled={deletingTenant}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900/90 border border-rose-500/30 text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono text-sm"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteModalTenant(null);
                    setDeleteConfirmText('');
                  }}
                  disabled={deletingTenant}
                  className="px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 font-bold text-xs cursor-pointer disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteTenant}
                  disabled={
                    deletingTenant || 
                    deleteConfirmText.trim().toLowerCase() !== deleteModalTenant.slug.toLowerCase()
                  }
                  className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  {deletingTenant ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Desmantelando VPS...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Destruir y Archivar Empresa</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
