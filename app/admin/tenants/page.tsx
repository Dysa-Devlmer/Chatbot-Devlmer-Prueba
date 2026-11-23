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
  X
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

export default function TenantsPage() {
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
      }
    } catch (err) {
      console.error('Error cargando empresas:', err);
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
        showNotification('success', `Servicio de ${tenant.name} ${nextStatus === 'active' ? 'activado' : 'suspendido'}`);
        loadTenants();
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch {
      showNotification('error', 'No se pudo actualizar el estado de la empresa');
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCreatedCredentials({
          ...data.credentials,
          name: formData.name,
        });
        showNotification('success', data.message || '¡Empresa registrada y aprovisionada!');
        loadTenants();
      } else {
        throw new Error(data.error || 'Error al registrar empresa');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Error en el aprovisionamiento');
    } finally {
      setSubmitting(false);
    }
  };

  const copyCredentialsText = () => {
    if (!createdCredentials) return;
    const text = `🎉 ¡Hola ${createdCredentials.name}! Tu plataforma oficial de pedidos y WhatsApp IA ya está lista:\n\n🔗 Carta Digital del Cliente: ${createdCredentials.menuUrl}\n🔑 Panel Administrativo: ${createdCredentials.loginUrl}\n👤 Usuario: ${createdCredentials.username}\n🔒 Contraseña: ${createdCredentials.password}\n\nPuedes ingresar ahora mismo para personalizar tu menú y empezar a vender.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Notification */}
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-white text-xs font-bold animate-in slide-in-from-top ${
          message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="border-b border-slate-200 dark:border-stone-800 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20">
            👑 Control Maestro Dueño SaaS
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
            Empresas & Arriendos Activos
          </h1>
          <p className="text-sm text-slate-600 dark:text-stone-400 mt-0.5">
            Administra las instancias arrendadas, gestiona planes básicos/pro y da de alta nuevos clientes en 60 segundos.
          </p>
        </div>

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
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-orange-600/25 flex items-center justify-center gap-2 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Registrar Nueva Empresa</span>
        </button>
      </div>

      {/* Business Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Empresas Totales</span>
            <Building2 className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-2">
            {stats.totalTenants}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Instancias configuradas</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ingresos MRR</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-2">
            ${stats.totalMRR} <span className="text-xs font-bold text-slate-400">USD/mes</span>
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Facturación recurrente</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Operando en Vivo</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {stats.activeTenants}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Bases de datos aisladas</span>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-stone-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Plan Pro con Voz IA</span>
            <PhoneCall className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 mt-2">
            {stats.proTenants}
          </p>
          <span className="text-[10px] text-slate-400 font-medium">Calling API habilitada</span>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-orange-500" />
            <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-white">
              Listado de Empresas Arrendatarias
            </h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-stone-400">
            Aprovisionamiento Automático en VPS
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-xs font-bold text-slate-400">
            Cargando empresas y estado de servidores...
          </div>
        ) : tenants.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-stone-300">
              Aún no tienes empresas arrendadas registradas
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Haz clic en &quot;Registrar Nueva Empresa&quot; para crear tu primera instancia con base de datos y WhatsApp en menos de 60 segundos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-stone-950 text-slate-500 dark:text-stone-400 uppercase text-[10px] font-bold border-b border-slate-100 dark:border-stone-800">
                <tr>
                  <th className="py-3 px-4">Empresa / Subdominio</th>
                  <th className="py-3 px-4">Plan & Precio</th>
                  <th className="py-3 px-4">Meta WhatsApp</th>
                  <th className="py-3 px-4">Puerto VPS</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Accesos Directos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-stone-800">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 dark:hover:bg-stone-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{t.name}</span>
                        {t.slug === 'churus' && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-amber-500/20 text-amber-600 dark:text-amber-400">
                            Piloto
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-stone-400 font-mono flex items-center gap-1 mt-0.5">
                        <Globe className="w-3 h-3 text-slate-400" />
                        <span>https://{t.domain}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                        t.plan === 'pro'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                          : 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                      }`}>
                        {t.plan === 'pro' ? '👑 Pro ($99/m)' : 'Básico ($49/m)'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {t.metaSynced ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Conectado a Meta</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          {t.whatsappNumber || 'Sin vincular'}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-stone-300">
                      :{t.port}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(t)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase cursor-pointer transition-all ${
                          t.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 hover:bg-rose-500/25'
                        }`}
                        title="Clic para cambiar estado del servicio"
                      >
                        <Power className="w-3 h-3" />
                        <span>{t.status === 'active' ? '🟢 Activo' : '🔴 Suspendido'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <a
                        href={`https://${t.domain}/menu`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300 hover:bg-orange-500 hover:text-white font-bold transition-all text-[11px]"
                      >
                        <span>Menú</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>

                      <a
                        href={`https://${t.domain}/admin`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold transition-all text-[11px] shadow-xs"
                      >
                        <span>Panel</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Registrar Nueva Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in">
          <div className="w-full max-w-xl bg-white dark:bg-stone-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-stone-800 shadow-2xl my-auto space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-orange-500/15 text-orange-600 flex items-center justify-center font-black">
                  ✨
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-white">
                    Registrar y Aprovisionar Nueva Empresa
                  </h3>
                  <p className="text-xs text-slate-500">
                    Crea la instancia aislada con base de datos, SSL y Meta WhatsApp en 60 segundos.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createdCredentials ? (
              /* Success & Credentials Screen */
              <div className="space-y-4 py-2 animate-in zoom-in-95">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-center space-y-1">
                  <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500" />
                  <h4 className="font-black text-sm">¡Empresa Aprovisionada Exitosamente!</h4>
                  <p className="text-xs text-slate-600 dark:text-stone-300">
                    Instancia generada con base de datos independiente y configuración activa en VPS.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-stone-800/60">
                    <span className="text-slate-500">Panel Administrativo:</span>
                    <a href={createdCredentials.loginUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-orange-500 flex items-center gap-1">
                      {createdCredentials.loginUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-stone-800/60">
                    <span className="text-slate-500">Carta Digital:</span>
                    <a href={createdCredentials.menuUrl} target="_blank" rel="noopener noreferrer" className="font-bold text-slate-700 dark:text-stone-300 flex items-center gap-1">
                      {createdCredentials.menuUrl} <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-stone-800/60">
                    <span className="text-slate-500">Usuario:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{createdCredentials.username}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-500">Contraseña Temporal:</span>
                    <span className="font-mono font-bold text-emerald-500">{createdCredentials.password}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={copyCredentialsText}
                    className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? '¡Copiado al Portapapeles!' : 'Copiar Datos para WhatsApp del Cliente'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-3 rounded-xl bg-slate-200 dark:bg-stone-800 text-slate-700 dark:text-stone-300 font-bold text-xs"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* Create Form */
              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Nombre Comercial
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. La Pasión Broaster"
                      value={formData.name}
                      onChange={(e) => handleSlugAuto(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Subdominio Deseado
                    </label>
                    <div className="flex items-center">
                      <input
                        type="text"
                        required
                        placeholder="lapasion"
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                        className="w-full px-3.5 py-2.5 rounded-l-xl bg-slate-50 dark:bg-stone-950 border border-r-0 border-slate-200 dark:border-stone-800 text-xs focus:ring-2 focus:ring-orange-500 font-mono"
                      />
                      <span className="px-2.5 py-2.5 rounded-r-xl bg-slate-100 dark:bg-stone-800 border border-slate-200 dark:border-stone-800 text-[11px] text-slate-500 font-mono">
                        .zgamersa.com
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Moneda Oficial
                    </label>
                    <select
                      value={formData.currencySymbol}
                      onChange={(e) => {
                        const sym = e.target.value;
                        const curr = sym === '$' ? 'CLP' : sym === '€' ? 'EUR' : 'PEN';
                        setFormData({ ...formData, currencySymbol: sym, currency: curr });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-xs"
                    >
                      <option value="S/.">Perú (S/. PEN)</option>
                      <option value="$">Chile / Internacional ($)</option>
                      <option value="€">Europa (€ EUR)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Plantilla de Catálogo
                    </label>
                    <select
                      value={formData.template}
                      onChange={(e) => setFormData({ ...formData, template: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-xs"
                    >
                      <option value="fast_food">Comida Rápida / Broaster & Hamburguesas</option>
                      <option value="pizzeria">Pizzería & Trattoria</option>
                      <option value="retail">Catálogo Limpio / En Blanco</option>
                    </select>
                  </div>
                </div>

                {/* Plan Selection Cards */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-2">
                    Plan de Suscripción Mensual
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormData({ ...formData, plan: 'basic' })}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.plan === 'basic'
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-200 dark:border-stone-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Plan Básico</span>
                        <span className="font-black text-xs text-blue-500">$49/mes</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Chatbot WhatsApp texto, Menú digital, Comandas y Boleta electrónica.
                      </p>
                    </div>

                    <div
                      onClick={() => setFormData({ ...formData, plan: 'pro' })}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.plan === 'pro'
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-slate-200 dark:border-stone-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1">
                          <span>Plan Pro</span>
                          <span className="text-[10px]">👑</span>
                        </span>
                        <span className="font-black text-xs text-purple-500">$99/mes</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Todo lo anterior + <strong>Agente de Voz IA</strong> para llamadas en vivo.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meta WhatsApp Integration Card */}
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-2.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Configuración Automática en Meta (WhatsApp Business Cloud API)</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400">
                    Configura la línea para sincronizar el perfil en Meta y dejar el webhook listo para recibir pedidos.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Número WhatsApp de la Empresa
                      </label>
                      <input
                        type="text"
                        placeholder="+51 987 654 321"
                        value={formData.whatsappNumber}
                        onChange={(e) => setFormData({ ...formData, whatsappNumber: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Meta Phone Number ID (Opcional)
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. 905984725929536"
                        value={formData.phoneNumberId}
                        onChange={(e) => setFormData({ ...formData, phoneNumberId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-stone-800 text-slate-600 dark:text-stone-400 font-bold text-xs"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Aprovisionando en 60s...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
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
