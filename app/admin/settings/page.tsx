'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { 
  User, 
  Lock, 
  Save, 
  Upload, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  KeyRound, 
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Globe,
  Clock,
  Check
} from 'lucide-react';

function SettingsContent() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    company: '',
    role: 'SuperAdmin / Propietario',
    timezone: 'America/Lima',
    language: 'es',
    createdAt: '',
  });

  // Security state
  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab === 'security') {
      setActiveTab('security');
    } else {
      setActiveTab('profile');
    }
  }, [searchParams]);

  // Load real profile from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile({
              id: data.profile.id || '',
              name: data.profile.name || 'Admin Devlmer',
              email: data.profile.email || 'admin@zgamersa.com',
              phone: data.profile.phone || '+56 9 6541 9765',
              company: data.profile.company || 'Devlmer Apps',
              role: data.profile.role || 'SuperAdmin / Propietario',
              timezone: data.profile.timezone || 'America/Lima',
              language: data.profile.language || 'es',
              createdAt: data.profile.createdAt ? new Date(data.profile.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '2025',
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

    loadProfile();
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
        body: JSON.stringify({
          name: profile.name,
          email: profile.email,
          phone: profile.phone,
          company: profile.company,
          timezone: profile.timezone,
          language: profile.language,
        }),
      });

      if (response.ok) {
        if (update) {
          await update({ name: profile.name });
        }
        showMessage('success', '¡Datos del perfil actualizados correctamente en base de datos!');
      } else {
        throw new Error('Error al guardar datos del perfil');
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

  // Helper para procesar, recortar al centro y comprimir el avatar en el cliente
  const processAvatarImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('No se pudo leer el archivo seleccionado'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('La imagen seleccionada no es válida'));
        img.onload = () => {
          try {
            const maxDim = 400;
            const width = img.width;
            const height = img.height;

            // Recorte cuadrado centrado
            const minSide = Math.min(width, height);
            const sx = (width - minSide) / 2;
            const sy = (height - minSide) / 2;

            const canvas = document.createElement('canvas');
            canvas.width = Math.min(minSide, maxDim);
            canvas.height = Math.min(minSide, maxDim);

            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(e.target?.result as string);
              return;
            }

            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, sx, sy, minSide, minSide, 0, 0, canvas.width, canvas.height);

            // Generar JPEG optimizado de 50KB-80KB
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.88);
            resolve(compressedBase64);
          } catch {
            resolve(e.target?.result as string);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Por favor selecciona una imagen válida (JPG, PNG o WebP)');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploadingAvatar(true);
    try {
      // Comprime y escala automáticamente cualquier imagen (incluso de 10MB+)
      const base64 = await processAvatarImage(file);

      const response = await fetch('/api/admin/profile/avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: base64 }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAvatar(data.avatar);
        showMessage('success', '¡Foto de perfil actualizada con éxito!');
        window.dispatchEvent(new Event('admin-profile-updated'));
      } else {
        throw new Error(data.error || 'Error al guardar foto en el servidor');
      }
    } catch (err: any) {
      console.error('Error subiendo avatar:', err);
      showMessage('error', err.message || 'Error al procesar la imagen');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveAvatar = async () => {
    if (!confirm('¿Deseas eliminar tu foto de perfil y volver a las iniciales predeterminadas?')) return;
    setUploadingAvatar(true);
    try {
      const response = await fetch('/api/admin/profile/avatar', {
        method: 'DELETE',
      });
      if (response.ok) {
        setAvatar(null);
        showMessage('success', 'Foto de perfil eliminada');
        window.dispatchEvent(new Event('admin-profile-updated'));
      } else {
        throw new Error('Error al eliminar');
      }
    } catch {
      showMessage('error', 'No se pudo eliminar la foto de perfil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Mi Perfil & Datos', icon: User, desc: 'Nombre, correo, WhatsApp y tenancy' },
    { id: 'security' as const, label: 'Seguridad & Contraseña', icon: Lock, desc: 'Credenciales de acceso y cifrado' },
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

      {/* Header Banner */}
      <div className="border-b border-slate-200 dark:border-stone-800 pb-5">
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20">
          Cuenta de Administrador
        </span>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1">
          Mi Perfil & Seguridad
        </h1>
        <p className="text-sm text-slate-600 dark:text-stone-400 mt-0.5">
          Gestiona tus datos de acceso, información comercial del titular y credenciales de seguridad.
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
                  {profile.name?.charAt(0).toUpperCase() || 'A'}
                </div>
              )}

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition-opacity cursor-pointer"
                title="Cambiar foto de perfil"
              >
                <Upload className="w-4 h-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {profile.name || 'Admin Devlmer'}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate">
                {profile.email || 'admin@zgamersa.com'}
              </p>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">
                  👑 {profile.role || 'SuperAdmin'}
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
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-left ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <div className="min-w-0">
                    <p className="leading-tight">{tab.label}</p>
                    <p className={`text-[10px] font-normal truncate mt-0.5 ${isActive ? 'text-orange-100' : 'text-slate-400 dark:text-stone-500'}`}>
                      {tab.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Quick Info Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-xs space-y-2">
            <div className="flex items-center gap-2 text-slate-700 dark:text-stone-300 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Seguridad del Sistema</span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-stone-400 leading-relaxed">
              Tu cuenta tiene privilegios totales para gestionar comandas, cobros, catálogo y la API de WhatsApp Calling.
            </p>
          </div>
        </div>

        {/* Tab Content Panel */}
        <div className="lg:col-span-8 xl:col-span-9">
          
          {/* TAB 1: Mi Perfil & Datos */}
          {activeTab === 'profile' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              
              <div className="border-b border-slate-100 dark:border-stone-800/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <User className="w-5 h-5 text-orange-500" />
                    <span>Datos del Administrador & Perfil</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                    Información oficial de contacto, zona horaria y personalización de tu cuenta.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    🟢 En Línea
                  </span>
                </div>
              </div>

              {/* Avatar Uploader Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 flex flex-col sm:flex-row items-center gap-4">
                <div className="relative group shrink-0">
                  {avatar ? (
                    <img 
                      src={avatar} 
                      alt="Avatar" 
                      className="w-18 h-18 rounded-2xl object-cover border-2 border-orange-500 shadow-sm"
                    />
                  ) : (
                    <div className="w-18 h-18 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-black text-2xl flex items-center justify-center shadow-sm">
                      {profile.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    Foto de Perfil del Administrador
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-stone-400">
                    Formatos admitidos: JPEG, PNG o WebP. Tamaño máximo recomendado: 2MB.
                  </p>
                  
                  <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingAvatar}
                      className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{uploadingAvatar ? 'Subiendo...' : 'Subir nueva foto'}</span>
                    </button>

                    {avatar && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={uploadingAvatar}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-stone-800 hover:bg-rose-100 dark:hover:bg-rose-950/40 text-slate-700 dark:text-stone-300 hover:text-rose-600 dark:hover:text-rose-400 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Eliminar foto</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Real Profile Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Nombre Completo */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Nombre Completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={profile.name}
                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                        required
                        placeholder="Ej. Admin Devlmer"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Correo Electrónico */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Correo Electrónico
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        required
                        placeholder="admin@zgamersa.com"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Teléfono de Contacto / WhatsApp */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Teléfono de Contacto / WhatsApp
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Phone className="w-4 h-4" />
                      </div>
                      <input
                        type="tel"
                        value={profile.phone}
                        onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                        placeholder="+56 9 6541 9765"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Empresa / Razón Social */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Empresa / Entidad Propietaria
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={profile.company}
                        onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                        placeholder="Devlmer Apps"
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      />
                    </div>
                  </div>

                  {/* Zona Horaria */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Zona Horaria del Administrador
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <select
                        value={profile.timezone}
                        onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      >
                        <option value="America/Lima">Perú / Lima (UTC-5)</option>
                        <option value="America/Santiago">Chile / Santiago (UTC-3 / UTC-4)</option>
                        <option value="America/Bogota">Colombia / Bogotá (UTC-5)</option>
                        <option value="America/Argentina/Buenos_Aires">Argentina / Buenos Aires (UTC-3)</option>
                        <option value="America/Mexico_City">México / CDMX (UTC-6)</option>
                      </select>
                    </div>
                  </div>

                  {/* Idioma del Panel */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                      Idioma Predeterminado
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Globe className="w-4 h-4" />
                      </div>
                      <select
                        value={profile.language}
                        onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                        className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                      >
                        <option value="es">Español Latinoamericano</option>
                        <option value="en">English (US)</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Account Summary Card */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Rol del Sistema</span>
                    <span className="font-bold text-amber-500">👑 SuperAdmin / Propietario</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Autenticación</span>
                    <span className="font-bold text-slate-700 dark:text-stone-300">NextAuth BCrypt (v12)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Miembro Desde</span>
                    <span className="font-bold text-slate-700 dark:text-stone-300">{profile.createdAt || 'Diciembre 2025'}</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Guardando en BD...' : 'Guardar Cambios de Perfil'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Seguridad & Contraseña */}
          {activeTab === 'security' && (
            <div className="p-5 sm:p-7 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
              <div className="border-b border-slate-100 dark:border-stone-800/80 pb-4">
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-orange-500" />
                  <span>Seguridad & Credenciales de Acceso</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-stone-400 mt-0.5">
                  Actualiza tu contraseña periódicamente para proteger el panel, pedidos y las llamadas del Agente de Voz.
                </p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    value={security.currentPassword}
                    onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                    required
                    placeholder="Introduce tu contraseña actual"
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
                    placeholder="Mínimo 8 caracteres seguros"
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
                    placeholder="Vuelve a escribir la nueva contraseña"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs sm:text-sm shadow-md flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{saving ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
                  </button>
                </div>
              </form>
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
        Cargando perfil y configuración...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
