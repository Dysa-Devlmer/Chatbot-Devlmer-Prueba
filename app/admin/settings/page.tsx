'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import AIConfiguration from './components/AIConfiguration';
import { 
  User, 
  Shield, 
  Palette, 
  Lock, 
  Bell, 
  Bot, 
  Save, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Users, 
  KeyRound, 
  Sun, 
  Moon, 
  Laptop, 
  Sparkles,
  ChefHat,
  Truck,
  MessageSquare,
  Check,
  Eye,
  Edit3,
  ShieldCheck
} from 'lucide-react';

interface SystemRole {
  id: string;
  name: string;
  badge: string;
  color: string;
  icon: any;
  description: string;
  permissions: {
    orders: 'full' | 'view_edit' | 'view_only' | 'none';
    inbox: 'full' | 'view_edit' | 'view_only' | 'none';
    products: 'full' | 'view_edit' | 'view_only' | 'none';
    finances: 'full' | 'view_edit' | 'view_only' | 'none';
    settings: 'full' | 'view_edit' | 'view_only' | 'none';
  };
}

const SYSTEM_ROLES: SystemRole[] = [
  {
    id: 'superadmin',
    name: 'SuperAdmin / Dueño SaaS',
    badge: '👑 Dueño',
    color: 'from-amber-500 to-orange-600',
    icon: ShieldCheck,
    description: 'Acceso total y sin restricciones a finanzas, facturación, arriendo a nuevos clientes, configuración de IA y base de datos.',
    permissions: {
      orders: 'full',
      inbox: 'full',
      products: 'full',
      finances: 'full',
      settings: 'full',
    },
  },
  {
    id: 'store_manager',
    name: 'Administrador de Tienda / Gerente',
    badge: '🏬 Gerente',
    color: 'from-blue-500 to-indigo-600',
    icon: Building2,
    description: 'Gestión completa del local comercial arrendado: catálogo de productos, precios, políticas de despacho y control de comandas.',
    permissions: {
      orders: 'full',
      inbox: 'full',
      products: 'full',
      finances: 'view_only',
      settings: 'view_edit',
    },
  },
  {
    id: 'kitchen',
    name: 'Cocina & Barra (Chef / Comandas)',
    badge: '👨‍🍳 Cocina',
    color: 'from-orange-500 to-red-600',
    icon: ChefHat,
    description: 'Acceso optimizado a comanda digital (/admin/orders). Puede avanzar pedidos a preparación y listos para despacho sin tocar finanzas.',
    permissions: {
      orders: 'view_edit',
      inbox: 'none',
      products: 'view_only',
      finances: 'none',
      settings: 'none',
    },
  },
  {
    id: 'delivery',
    name: 'Repartidor / Motorizado',
    badge: '🛵 Delivery',
    color: 'from-emerald-500 to-teal-600',
    icon: Truck,
    description: 'Vista de pedidos en ruta con dirección del comensal, notas de entrega, enlace directo de WhatsApp y botón "Marcar Entregado".',
    permissions: {
      orders: 'view_edit',
      inbox: 'view_only',
      products: 'none',
      finances: 'none',
      settings: 'none',
    },
  },
  {
    id: 'support_agent',
    name: 'Agente de Atención al Cliente',
    badge: '💬 Operador',
    color: 'from-purple-500 to-pink-600',
    icon: MessageSquare,
    description: 'Gestión activa del Inbox de WhatsApp (/admin/inbox), toma de requerimientos, modo manual y resolución de dudas.',
    permissions: {
      orders: 'view_only',
      inbox: 'full',
      products: 'view_only',
      finances: 'none',
      settings: 'none',
    },
  },
];

const BRAND_PRESETS = [
  {
    id: 'churus_fast_food',
    name: "Churu's / Comida Rápida & Delivery",
    industry: 'Fast Food',
    primary: '#f97316',
    secondary: '#84cc16',
    bgDark: '#141312',
    desc: 'Paleta cálida ámbar/naranja de alta conversión gastronómica.',
    badge: '⭐ Actual',
  },
  {
    id: 'tech_gamer',
    name: 'Tech & Hardware Gamer',
    industry: 'Tecnología',
    primary: '#0284c7',
    secondary: '#06b6d4',
    bgDark: '#0b0f17',
    desc: 'Azul cian y eléctrico para tiendas de cómputo y periféricos.',
    badge: 'Tech',
  },
  {
    id: 'gourmet_dining',
    name: 'Restaurante Gourmet & Salón',
    industry: 'Gastronomía',
    primary: '#059669',
    secondary: '#d97706',
    bgDark: '#0f1715',
    desc: 'Verde esmeralda y acentos dorados para locales premium.',
    badge: 'Elegante',
  },
  {
    id: 'fashion_boutique',
    name: 'Moda, Calzado & Boutique',
    industry: 'Moda',
    primary: '#7c3aed',
    secondary: '#ec4899',
    bgDark: '#130d1a',
    desc: 'Púrpura y fucsia vibrante para prendas de vestir y accesorios.',
    badge: 'Fashion',
  },
  {
    id: 'health_pharmacy',
    name: 'Salud, Óptica & Farmacia',
    industry: 'Salud',
    primary: '#0d9488',
    secondary: '#2563eb',
    bgDark: '#0d1618',
    desc: 'Teal clínico y azul de confianza para insumos médicos.',
    badge: 'Salud',
  },
];

function renderPermissionBadge(permission: 'full' | 'view_edit' | 'view_only' | 'none') {
  switch (permission) {
    case 'full':
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          Acceso Total
        </span>
      );
    case 'view_edit':
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/20">
          Edición
        </span>
      );
    case 'view_only':
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/20">
          Solo Lectura
        </span>
      );
    case 'none':
    default:
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-stone-800 text-stone-500">
          Sin Acceso
        </span>
      );
  }
}

function SettingsContent() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active theme
  const [activeThemeMode, setActiveThemeMode] = useState<'light' | 'dark' | 'system'>('dark');
  const [selectedBrandPreset, setSelectedBrandPreset] = useState('churus_fast_food');

  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company: 'PITHY SaaS',
    role: 'CEO / SuperAdmin',
    timezone: 'America/Lima',
    language: 'es',
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notifications state
  const [notifications, setNotifications] = useState({
    emailNewMessage: true,
    emailDailyReport: false,
    pushNewMessage: true,
    pushMentions: true,
    soundEnabled: true,
    desktopNotifications: true,
  });

  // AI Configuration state
  const [aiConfig, setAiConfig] = useState({
    ai_provider: 'ollama',
    ai_model: 'llama3.2',
    perplexity_api_key: '',
    perplexity_model: 'llama-3.1-sonar-large-128k-chat',
    perplexity_temperature: '0.7',
    perplexity_max_tokens: '1024',
    ai_enabled: 'true',
    rag_enabled: 'true',
  });

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['profile', 'security', 'roles', 'notifications', 'appearance'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load profile from database on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile({
              name: data.profile.name || 'Pierre Arturo',
              email: data.profile.email || 'bpier@zgamersa.com',
              phone: data.profile.phone || '+51 900 372 689',
              company: data.profile.company || "Churu's Fast Food",
              role: data.profile.role || 'CEO / SuperAdmin',
              timezone: data.profile.timezone || 'America/Lima',
              language: data.profile.language || 'es',
            });
            if (data.profile.avatar) {
              setAvatar(data.profile.avatar);
            }
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };

    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/admin/profile/notifications');
        if (response.ok) {
          const data = await response.json();
          if (data.preferences) {
            setNotifications(data.preferences);
          }
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };

    const loadAIConfig = async () => {
      try {
        const response = await fetch('/api/admin/ai-config');
        if (response.ok) {
          const data = await response.json();
          if (data.config) {
            setAiConfig({
              ai_provider: data.config.ai_provider?.value || 'ollama',
              ai_model: data.config.ai_model?.value || 'llama3.2',
              perplexity_api_key: data.config.perplexity_api_key?.value || '',
              perplexity_model: data.config.perplexity_model?.value || 'llama-3.1-sonar-large-128k-chat',
              perplexity_temperature: data.config.perplexity_temperature?.value || '0.7',
              perplexity_max_tokens: data.config.perplexity_max_tokens?.value || '1024',
              ai_enabled: data.config.ai_enabled?.value || 'true',
              rag_enabled: data.config.rag_enabled?.value || 'true',
            });
          }
        }
      } catch (error) {
        console.error('Error loading AI config:', error);
      }
    };

    // Sync theme
    const stored = localStorage.getItem('pithy_theme');
    if (stored === 'light' || stored === 'dark') {
      setActiveThemeMode(stored);
    }

    loadProfile();
    loadNotifications();
    loadAIConfig();
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        await update({ name: profile.name });
        showMessage('success', '¡Perfil actualizado correctamente!');
      } else {
        throw new Error('Error al guardar');
      }
    } catch {
      showMessage('error', 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (security.newPassword !== security.confirmPassword) {
      showMessage('error', 'Las contraseñas no coinciden');
      return;
    }

    if (security.newPassword.length < 8) {
      showMessage('error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/profile/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      });

      if (response.ok) {
        showMessage('success', '¡Contraseña actualizada correctamente!');
        setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar contraseña');
      }
    } catch (err: any) {
      showMessage('error', err.message || 'Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/profile/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notifications),
      });

      if (response.ok) {
        showMessage('success', 'Preferencias de notificaciones guardadas');
      } else {
        throw new Error('Error al guardar');
      }
    } catch {
      showMessage('error', 'Error al guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showMessage('error', 'La imagen es demasiado grande. Máximo 2MB.');
      return;
    }

    setUploadingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        const response = await fetch('/api/admin/profile/avatar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar: base64 }),
        });

        if (response.ok) {
          const data = await response.json();
          setAvatar(data.avatar);
          showMessage('success', 'Avatar actualizado con éxito');
        } else {
          throw new Error('Error al subir avatar');
        }
        setUploadingAvatar(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      showMessage('error', err.message || 'Error al subir avatar');
      setUploadingAvatar(false);
    }
  };

  const handleSetTheme = (theme: 'light' | 'dark' | 'system') => {
    setActiveThemeMode(theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pithy_theme', 'dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pithy_theme', 'light');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      localStorage.removeItem('pithy_theme');
    }
    showMessage('success', `Tema cambiado a: ${theme.toUpperCase()}`);
  };

  const handleSaveAIConfig = async (newConfig: typeof aiConfig) => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/ai-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });

      if (response.ok) {
        setAiConfig(newConfig);
        showMessage('success', '¡Configuración de IA actualizada y activa!');
      } else {
        throw new Error('Error al guardar la configuración de IA');
      }
    } catch {
      showMessage('error', 'Error al guardar la configuración de IA');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: User },
    { id: 'roles', label: 'Equipo & Roles', icon: Shield },
    { id: 'appearance', label: 'Apariencia & Marca', icon: Palette },
    { id: 'security', label: 'Seguridad', icon: Lock },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      
      {/* Toast Feedback */}
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-white text-xs font-bold animate-in slide-in-from-top ${
          message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Page Title */}
      <div className="border-b border-slate-200 dark:border-stone-800 pb-5">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20">
          Administración & Seguridad
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
          Configuración del Sistema
        </h1>
        <p className="text-sm text-slate-600 dark:text-stone-400 mt-0.5">
          Gestiona perfiles de usuario, roles de equipo, identidad visual, seguridad y alertas.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          
          {/* User Profile Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm flex items-center gap-3.5">
            <div className="relative group shrink-0">
              {avatar ? (
                <img 
                  src={avatar} 
                  alt="Avatar" 
                  className="w-13 h-13 rounded-2xl object-cover border border-orange-500/40 shadow-sm"
                />
              ) : (
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-lg flex items-center justify-center shadow-sm">
                  {profile.name?.charAt(0).toUpperCase() || 'P'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer"
                title="Cambiar avatar"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {profile.name || 'Admin'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                {profile.email || 'admin@pithy.pe'}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                  {profile.role || 'SuperAdmin'}
                </span>
              </div>
            </div>
          </div>

          {/* Tab Navigation List */}
          <nav className="p-1.5 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left whitespace-nowrap ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-8 xl:col-span-9">
          
          {/* TAB 1: Profile */}
          {activeTab === 'profile' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Información Personal & Comercial
                </h2>
                <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                  Datos del administrador principal de la cuenta.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Nombre Completo
                    </label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Correo Electrónico
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Teléfono de Contacto
                    </label>
                    <input
                      type="text"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Empresa / Razón Social
                    </label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="pt-3 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Roles & Permissions (NUEVO) */}
          {activeTab === 'roles' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-stone-800/80 pb-4">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-orange-500" />
                    <span>Control de Roles & Permisos del Sistema</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                    Define qué secciones y acciones puede ejecutar cada integrante del equipo (Cocina, Delivery, Gerencia).
                  </p>
                </div>

                <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 text-xs font-semibold self-start sm:self-auto">
                  5 Roles Configurados
                </span>
              </div>

              {/* Roles Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SYSTEM_ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <div 
                      key={role.id}
                      className="p-4 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Icon className="w-4 h-4 text-orange-500" />
                            {role.name}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">
                            {role.badge}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-stone-400 mt-2 leading-relaxed">
                          {role.description}
                        </p>
                      </div>

                      {/* Permissions Pills */}
                      <div className="pt-2 border-t border-slate-200/60 dark:border-stone-800/60 grid grid-cols-2 gap-1.5 text-[11px]">
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800/60">
                          <span className="text-slate-500 dark:text-stone-400">Comandas:</span>
                          {renderPermissionBadge(role.permissions.orders)}
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800/60">
                          <span className="text-slate-500 dark:text-stone-400">Chats Inbox:</span>
                          {renderPermissionBadge(role.permissions.inbox)}
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800/60">
                          <span className="text-slate-500 dark:text-stone-400">Catálogo:</span>
                          {renderPermissionBadge(role.permissions.products)}
                        </div>
                        <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white dark:bg-stone-900 border border-slate-100 dark:border-stone-800/60">
                          <span className="text-slate-500 dark:text-stone-400">Finanzas:</span>
                          {renderPermissionBadge(role.permissions.finances)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Active Users Table */}
              <div className="pt-4 border-t border-slate-100 dark:border-stone-800/80">
                <h3 className="text-sm font-black text-slate-900 dark:text-white mb-3">
                  Usuarios del Sistema Activos
                </h3>

                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
                        PA
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Pierre Arturo (Devlmer)</p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400">bpier@zgamersa.com</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-black">
                      👑 SuperAdmin
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center font-bold text-xs">
                        CC
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Comanda Cocina Churu&apos;s</p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400">cocina@churus.com</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500 text-[10px] font-black">
                      👨‍🍳 Cocina
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-800 text-stone-200 flex items-center justify-center font-bold text-xs">
                        DM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Despacho & Motorizado</p>
                        <p className="text-[11px] text-slate-500 dark:text-stone-400">delivery@churus.com</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-black">
                      🛵 Repartidor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Appearance & Brand Presets */}
          {activeTab === 'appearance' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  Apariencia, Modo Oscuro / Claro & Marca del Sistema
                </h2>
                <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                  Garantiza una identidad visual unificada o selecciona presets para arrendar el SaaS a cualquier rubro.
                </p>
              </div>

              {/* Light & Dark Switcher */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300">
                  Modo de Visualización (Light / Dark)
                </label>
                
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSetTheme('light')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      activeThemeMode === 'light'
                        ? 'border-orange-500 bg-orange-500/10 shadow-md ring-2 ring-orange-500/30'
                        : 'border-slate-200 dark:border-stone-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Modo Claro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTheme('dark')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      activeThemeMode === 'dark'
                        ? 'border-orange-500 bg-orange-500/10 shadow-md ring-2 ring-orange-500/30'
                        : 'border-slate-200 dark:border-stone-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-stone-800 text-orange-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Modo Oscuro</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetTheme('system')}
                    className={`p-3.5 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                      activeThemeMode === 'system'
                        ? 'border-orange-500 bg-orange-500/10 shadow-md ring-2 ring-orange-500/30'
                        : 'border-slate-200 dark:border-stone-800 hover:border-slate-300'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-stone-800 text-slate-700 dark:text-stone-300 flex items-center justify-center">
                      <Laptop className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Del Sistema</span>
                  </button>
                </div>
              </div>

              {/* Presets de Marca para Arriendo a Rubros */}
              <div className="pt-4 border-t border-slate-100 dark:border-stone-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span>Paletas de Marca Disponibles para Arriendo (Multi-Tenant)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-stone-400">
                      Adapta la estética del SaaS automáticamente según el rubro del negocio que arriende el sistema.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  {BRAND_PRESETS.map((preset) => {
                    const isSelected = selectedBrandPreset === preset.id;
                    return (
                      <div
                        key={preset.id}
                        onClick={() => {
                          setSelectedBrandPreset(preset.id);
                          showMessage('success', `Paleta de marca ${preset.name} aplicada al tenant.`);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500/5 ring-2 ring-orange-500/30'
                            : 'border-slate-200 dark:border-stone-800 hover:border-slate-300 dark:hover:border-stone-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {preset.name}
                          </span>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-stone-300">
                            {preset.badge}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-stone-400 mt-1">
                          {preset.desc}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <div 
                            className="w-5 h-5 rounded-full border border-black/20"
                            style={{ backgroundColor: preset.primary }}
                            title="Color Primario"
                          />
                          <div 
                            className="w-5 h-5 rounded-full border border-black/20"
                            style={{ backgroundColor: preset.secondary }}
                            title="Color Secundario"
                          />
                          <div 
                            className="w-5 h-5 rounded-full border border-white/20"
                            style={{ backgroundColor: preset.bgDark }}
                            title="Fondo Oscuro"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* TAB 4: Security */}
          {activeTab === 'security' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-orange-500" />
                  <span>Seguridad & Credenciales de Acceso</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                  Actualiza tu contraseña periódicamente para proteger los datos de comensales y pedidos.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Nueva Contraseña (mínimo 8 caracteres)
                  </label>
                  <input
                    type="password"
                    value={security.newPassword}
                    onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    value={security.confirmPassword}
                    onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{saving ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 5: Notifications */}
          {activeTab === 'notifications' && (
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="w-5 h-5 text-orange-500" />
                  <span>Notificaciones & Alertas en Tiempo Real</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                  Configura cómo deseas enterarte de nuevos pedidos y mensajes entrantes.
                </p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Sonido al recibir nuevo pedido</p>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400">Emite una campana audible en cocina cuando entra una comanda</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.soundEnabled}
                    onChange={(e) => setNotifications({ ...notifications, soundEnabled: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Notificaciones push en navegador</p>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400">Muestra una burbuja emergente cuando un cliente escribe en WhatsApp</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.desktopNotifications}
                    onChange={(e) => setNotifications({ ...notifications, desktopNotifications: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Reporte diario por correo</p>
                    <p className="text-[11px] text-slate-500 dark:text-stone-400">Recibe un resumen nocturno con el total de ventas del día</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.emailDailyReport}
                    onChange={(e) => setNotifications({ ...notifications, emailDailyReport: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded"
                  />
                </label>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveNotifications}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Guardando...' : 'Guardar Preferencias'}</span>
                </button>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] text-slate-500 text-xs font-bold">
        Cargando configuración...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
