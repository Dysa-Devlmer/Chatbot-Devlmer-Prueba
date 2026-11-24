'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  Store, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Phone, 
  MapPin, 
  FileText, 
  Bot, 
  Sparkles, 
  Sliders, 
  Building2, 
  Calendar, 
  MessageSquare, 
  Check, 
  Power,
  ShieldCheck,
  Send,
  Camera,
  Upload,
  ImageIcon,
  Loader2,
  X,
  Volume2,
  Zap,
  PhoneCall,
  Wallet
} from 'lucide-react';

interface DiaKey {
  lunes: string;
  martes: string;
  miercoles: string;
  jueves: string;
  viernes: string;
  sabado: string;
  domingo: string;
}

interface HorarioDia {
  abierto: boolean;
  apertura: string;
  cierre: string;
}

interface HoursConfig {
  horarios: {
    habilitado: boolean;
    zona_horaria: string;
    modo_manual: 'auto' | 'abierto_forzado' | 'cerrado_forzado';
    dias_semana: Record<string, HorarioDia>;
  };
  mensajes: {
    fuera_de_horario: string;
    proximo_a_cerrar: string;
    recien_abierto: string;
  };
  configuracion: {
    avisar_antes_de_cerrar_minutos: number;
    mensaje_bienvenida_al_abrir: boolean;
    pausar_ai_fuera_horario: boolean;
  };
}

interface HoursStatus {
  abierto: boolean;
  modo: 'auto' | 'abierto_forzado' | 'cerrado_forzado';
  mensaje: string | null;
  diaActual: string;
  horaActual: string;
  horarioHoy: string;
}

const COUNTRY_PRESETS = [
  { id: 'PE', country: 'Perú', currency: 'PEN', symbol: 'S/.', phonePrefix: '+51', name: 'Sol Peruano', samplePrice: 'S/. 18.50' },
  { id: 'CL', country: 'Chile', currency: 'CLP', symbol: '$', phonePrefix: '+56', name: 'Peso Chileno', samplePrice: '$ 5.500' },
  { id: 'AR', country: 'Argentina', currency: 'ARS', symbol: '$', phonePrefix: '+54', name: 'Peso Argentino', samplePrice: '$ 8.500' },
];

const INDUSTRIES = [
  { id: 'fast_food', label: 'Comida Rápida & Delivery', emoji: '🍔' },
  { id: 'chicken', label: 'Pollería & Broaster', emoji: '🍗' },
  { id: 'pizza', label: 'Pizzería & Pastas', emoji: '🍕' },
  { id: 'coffee', label: 'Cafetería & Pastelería', emoji: '☕' },
  { id: 'sushi', label: 'Sushi & Comida Nikkei / Asiática', emoji: '🍣' },
  { id: 'restaurant', label: 'Restaurante General & Menú', emoji: '🍽️' },
  { id: 'drinks', label: 'Bar, Licores & Bebidas', emoji: '🍹' },
  { id: 'retail', label: 'Comercio & Retail', emoji: '🛍️' },
];

const DIAS_LABELS: Record<string, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

export default function BusinessProfilePage() {
  // Navigation Tabs: 'company' | 'hours' | 'messages'
  const [activeTab, setActiveTab] = useState<'company' | 'hours' | 'messages'>('company');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'messages' || tab === 'hours' || tab === 'company') {
        setActiveTab(tab);
      }
    }
  }, []);

  // Business Profile Form State
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('fast_food');
  const [description, setDescription] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('PE');
  const [currency, setCurrency] = useState('PEN');
  const [currencySymbol, setCurrencySymbol] = useState('S/.');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [allowReservations, setAllowReservations] = useState(true);
  const [policies, setPolicies] = useState('');
  const [customPrompt, setCustomPrompt] = useState('');
  const [responseMode, setResponseMode] = useState<'text' | 'voice'>('text');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Bank Configuration State (Adaptable per country)
  const [bankConfig, setBankConfig] = useState({
    // Perú (PEN)
    pe_bankName: 'BCP',
    pe_accountType: 'Cuenta Corriente',
    pe_accountNumber: '',
    pe_cci: '',
    pe_yapeNumber: '',
    pe_holderName: '',
    pe_holderId: '',
    // Chile (CLP)
    cl_bankName: 'Banco Estado',
    cl_accountType: 'CuentaRUT',
    cl_accountNumber: '',
    cl_rut: '',
    cl_holderName: '',
    cl_email: '',
    // Argentina (ARS)
    ar_bankName: 'Mercado Pago',
    ar_accountType: 'CBU / CVU',
    ar_cbu: '',
    ar_alias: '',
    ar_cuit: '',
    ar_holderName: '',
  });

  // Horarios State
  const [hoursConfig, setHoursConfig] = useState<HoursConfig>({
    horarios: {
      habilitado: true,
      zona_horaria: 'America/Lima',
      modo_manual: 'auto',
      dias_semana: {
        lunes: { abierto: true, apertura: '12:00', cierre: '23:30' },
        martes: { abierto: true, apertura: '12:00', cierre: '23:30' },
        miercoles: { abierto: true, apertura: '12:00', cierre: '23:30' },
        jueves: { abierto: true, apertura: '12:00', cierre: '23:30' },
        viernes: { abierto: true, apertura: '12:00', cierre: '01:00' },
        sabado: { abierto: true, apertura: '12:00', cierre: '01:00' },
        domingo: { abierto: true, apertura: '12:00', cierre: '23:00' },
      },
    },
    mensajes: {
      fuera_de_horario: '🌙 *¡Hola! En este momento nos encontramos fuera de nuestro horario de atención.*\n\n⏰ *Nuestro horario es:*\n{horario}\n\n📖 Puedes revisar nuestra carta digital y promociones aquí:\n👉 {link_carta}\n\nDéjanos tu mensaje y te responderemos a primera hora al abrir. ¡Muchas gracias! 🙌🍔',
      proximo_a_cerrar: '⚠️ *Aviso de Cocina:* Cerraremos en {minutos} minutos.',
      recien_abierto: '👋 ¡Hola! Ya estamos abiertos y listos para atenderte.',
    },
    configuracion: {
      avisar_antes_de_cerrar_minutos: 15,
      mensaje_bienvenida_al_abrir: true,
      pausar_ai_fuera_horario: true,
    },
  });

  const [hoursStatus, setHoursStatus] = useState<HoursStatus | null>(null);
  const [metaProfile, setMetaProfile] = useState<{
    profile_picture_url?: string;
    description?: string;
    address?: string;
    websites?: string[];
    vertical?: string;
  } | null>(null);

  // WhatsApp Profile Picture Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Load business profile and hours on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const [busRes, hoursRes] = await Promise.all([
          fetch('/api/admin/business'),
          fetch('/api/admin/business/hours'),
        ]);

        const busData = await busRes.json();
        const hoursData = await hoursRes.json();

        if (busData.success && busData.profile) {
          const p = busData.profile;
          setName(p.name || "Churu's Comida Rápida");
          setIndustry(p.industry || 'fast_food');
          setDescription(p.description || '');
          const loadedCurrency = p.currency || 'PEN';
          const loadedSymbol = p.currencySymbol || 'S/.';
          setCurrency(loadedCurrency);
          setCurrencySymbol(loadedSymbol);
          setPhone(p.phone || '+51 900 372 689');
          setAddress(p.address || '');
          setAllowReservations(p.allowReservations ?? true);
          setPolicies(p.policies || '');
          setCustomPrompt(p.customPrompt || '');
          setResponseMode(p.responseMode === 'voice' ? 'voice' : 'text');

          if (p.bankDetails) {
            try {
              const parsed = typeof p.bankDetails === 'string' ? JSON.parse(p.bankDetails) : p.bankDetails;
              setBankConfig(prev => ({ ...prev, ...parsed }));
            } catch (err) {
              console.error('Error parsing bankDetails:', err);
            }
          }

          const matched = COUNTRY_PRESETS.find(
            (c) => c.currency === loadedCurrency && c.symbol === loadedSymbol
          );
          if (matched) {
            setSelectedCountry(matched.id);
          } else if (loadedCurrency === 'CLP' || loadedSymbol === '$') {
            setSelectedCountry('CL');
          }

          if (busData.metaProfile) {
            setMetaProfile(busData.metaProfile);
          }
        }

        if (hoursData.success && hoursData.config) {
          setHoursConfig(hoursData.config);
          setHoursStatus(hoursData.status);
        }
      } catch (err) {
        console.error('Error cargando configuración:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle Country Selection
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    const preset = COUNTRY_PRESETS.find((c) => c.id === countryId);
    if (preset) {
      setCurrency(preset.currency);
      setCurrencySymbol(preset.symbol);

      if (!phone || phone.trim() === '') {
        setPhone(`${preset.phonePrefix} `);
      } else {
        const prevPrefix = COUNTRY_PRESETS.find(c => phone.startsWith(c.phonePrefix))?.phonePrefix;
        if (prevPrefix && prevPrefix !== preset.phonePrefix) {
          setPhone(phone.replace(prevPrefix, preset.phonePrefix));
        }
      }

      if (countryId === 'PE') {
        updateHoursConfig('zona_horaria', 'America/Lima');
      } else if (countryId === 'CL') {
        updateHoursConfig('zona_horaria', 'America/Santiago');
      } else if (countryId === 'AR') {
        updateHoursConfig('zona_horaria', 'America/Argentina/Buenos_Aires');
      }
    }
  };

  const updateHoursConfig = (field: string, value: any) => {
    setHoursConfig(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [field]: value
      }
    }));
  };

  const updateDia = (dia: string, field: 'abierto' | 'apertura' | 'cierre', value: any) => {
    setHoursConfig(prev => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        dias_semana: {
          ...prev.horarios.dias_semana,
          [dia]: {
            ...prev.horarios.dias_semana[dia],
            [field]: value
          }
        }
      }
    }));
  };

  const updateMensaje = (key: 'fuera_de_horario' | 'proximo_a_cerrar' | 'recien_abierto', value: string) => {
    setHoursConfig(prev => ({
      ...prev,
      mensajes: {
        ...prev.mensajes,
        [key]: value
      }
    }));
  };

  const updateConfiguracion = (key: 'avisar_antes_de_cerrar_minutos' | 'mensaje_bienvenida_al_abrir' | 'pausar_ai_fuera_horario', value: any) => {
    setHoursConfig(prev => ({
      ...prev,
      configuracion: {
        ...prev.configuracion,
        [key]: value
      }
    }));
  };

  const handleManualOverride = async (modo: 'auto' | 'abierto_forzado' | 'cerrado_forzado') => {
    updateHoursConfig('modo_manual', modo);
    try {
      const res = await fetch('/api/admin/business/hours', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_override', modo }),
      });
      const data = await res.json();
      if (data.success && data.status) {
        setHoursStatus(data.status);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Profile Picture Handlers (Meta WhatsApp Cloud API)
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      setMessage({ type: 'error', text: 'El formato de imagen debe ser JPG o PNG.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La imagen no debe superar los 5 MB de tamaño.' });
      return;
    }

    setSelectedPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCancelPhoto = () => {
    setSelectedPhotoFile(null);
    setPhotoPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUploadPhoto = async () => {
    if (!selectedPhotoFile) return;
    setUploadingPhoto(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedPhotoFile);

      const res = await fetch('/api/admin/business/profile-picture', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.success) {
        if (data.metaProfile) {
          setMetaProfile(data.metaProfile);
        } else if (data.profilePictureUrl) {
          setMetaProfile(prev => ({
            ...(prev || {}),
            profile_picture_url: data.profilePictureUrl,
          }));
        }
        setSelectedPhotoFile(null);
        setPhotoPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        setMessage({
          type: 'success',
          text: '¡Foto de perfil de WhatsApp Business actualizada exitosamente en Meta!'
        });
        setTimeout(() => setMessage(null), 6000);
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'No se pudo subir la foto a WhatsApp Business.'
        });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error de conexión al transferir la foto a Meta.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Single Unified Save Action
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const [busRes, hoursRes] = await Promise.all([
        fetch('/api/admin/business', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name.trim(),
            industry,
            description: description.trim(),
            currency: currency.trim(),
            currencySymbol: currencySymbol.trim(),
            phone: phone.trim(),
            address: address.trim(),
            allowReservations,
            policies: policies.trim(),
            customPrompt: customPrompt.trim(),
            responseMode,
            bankDetails: bankConfig,
          }),
        }),
        fetch('/api/admin/business/hours', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(hoursConfig),
        }),
      ]);

      const busData = await busRes.json();
      const hoursData = await hoursRes.json();

      if (busRes.ok && hoursRes.ok && busData.success && hoursData.success) {
        setHoursStatus(hoursData.status);
        setMessage({ 
          type: 'success', 
          text: `¡Cambios guardados con éxito! Datos sincronizados con WhatsApp Empresa y carta en ${currencySymbol} (${currency}).` 
        });
        setTimeout(() => setMessage(null), 5000);
      } else {
        setMessage({ type: 'error', text: 'No se pudo guardar la configuración. Revisa los datos ingresados.' });
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error de conexión con el servidor.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold text-slate-500 dark:text-stone-400">Cargando perfil y horarios del local...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-28 sm:pb-12 animate-in fade-in duration-150">
      
      {/* Toast Feedback */}
      {message && (
        <div className={`fixed top-20 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-xs sm:text-sm font-bold border animate-in slide-in-from-top-2 duration-150 ${
          message.type === 'success'
            ? 'bg-emerald-600 border-emerald-500/40 shadow-emerald-600/20'
            : 'bg-red-600 border-red-500/40 shadow-red-600/20'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* 1. Header Estático (Sticky) con 1 Solo Botón de Guardar */}
      <div className="sticky top-14 sm:top-16 z-30 bg-slate-50/95 dark:bg-[#141312]/95 backdrop-blur-md pt-2 pb-3.5 border-b border-slate-200 dark:border-stone-800 -mx-3 px-3 sm:-mx-6 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 sm:p-2.5 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Mi Local & Perfil Comercial
                </h1>
                {hoursStatus && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                    hoursStatus.abierto
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    {hoursStatus.abierto ? '🟢 Abierto' : '🔴 Cerrado'}
                  </span>
                )}
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-stone-400">
                Configura datos comerciales, horarios de atención y mensajes automáticos sincronizados con WhatsApp Empresa.
              </p>
            </div>
          </div>

          {/* Único botón de Guardar Prominente */}
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-5 sm:px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-600/25 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
          </button>
        </div>

        {/* 2. Pestañas de Organización (Tabs) */}
        <div className="flex items-center gap-1 sm:gap-2 mt-3 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'company'
                ? 'bg-orange-500 text-stone-950 shadow-sm font-black'
                : 'bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200/80 dark:border-stone-800'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span>1. Datos de Empresa</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('hours')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'hours'
                ? 'bg-orange-500 text-stone-950 shadow-sm font-black'
                : 'bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200/80 dark:border-stone-800'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>2. Horarios de Atención</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('messages')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'messages'
                ? 'bg-orange-500 text-stone-950 shadow-sm font-black'
                : 'bg-white dark:bg-stone-900 text-slate-600 dark:text-stone-300 hover:bg-slate-100 dark:hover:bg-stone-800 border border-slate-200/80 dark:border-stone-800'
            }`}
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>3. Mensajes Automáticos & Tono IA</span>
          </button>
        </div>
      </div>

      {/* Contenido Principal por Pestañas */}
      <div className="space-y-6 pt-1">

        {/* =========================================================================
            PESTAÑA 1: DATOS DE LA EMPRESA & PERFIL COMERCIAL
           ========================================================================= */}
        {activeTab === 'company' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* Banner de Sincronización con WhatsApp Empresa */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
                      Sincronización en Vivo con WhatsApp Business Profile
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                      Meta Cloud API
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-600 dark:text-stone-300 block mt-0.5 leading-relaxed">
                    Al guardar cambios en este formulario, se actualizan automáticamente tu biografía, dirección, enlaces y catálogo en el perfil de WhatsApp que ven los clientes.
                  </span>
                </div>
              </div>

              {metaProfile?.profile_picture_url && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shrink-0">
                  <img 
                    src={metaProfile.profile_picture_url} 
                    alt="WhatsApp Profile" 
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500/40"
                  />
                  <div className="flex flex-col text-left">
                    <span className="text-[10px] font-bold text-slate-800 dark:text-slate-200">Foto WhatsApp</span>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-medium">Vinculada</span>
                  </div>
                </div>
              )}
            </div>

            {/* Módulo de Foto de Perfil Oficial de WhatsApp Business */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Foto de Perfil Oficial de WhatsApp Business
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-stone-400">
                    Sube el logo o avatar de la empresa. Se sincroniza directamente con Meta para que tus clientes lo vean en su celular.
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Meta Resumable Upload
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
                {/* Avatar Preview */}
                <div className="relative group shrink-0">
                  <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-3 border-orange-500/30 p-1 bg-slate-50 dark:bg-stone-950 overflow-hidden shadow-inner flex items-center justify-center">
                    {photoPreview || metaProfile?.profile_picture_url ? (
                      <img 
                        src={photoPreview || metaProfile?.profile_picture_url} 
                        alt="Logo WhatsApp Empresa" 
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-orange-500/10 flex flex-col items-center justify-center text-orange-600 dark:text-orange-400">
                        <ImageIcon className="w-8 h-8 opacity-60" />
                        <span className="text-[9px] font-bold mt-1">Sin foto</span>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-1 right-1 p-2 rounded-full bg-orange-600 hover:bg-orange-500 text-white shadow-md transition-all cursor-pointer border-2 border-white dark:border-stone-900"
                    title="Seleccionar foto de perfil"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                </div>

                {/* Controles de Carga */}
                <div className="flex-1 space-y-3 text-center sm:text-left">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />

                  {selectedPhotoFile ? (
                    <div className="space-y-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold">
                        <Camera className="w-3.5 h-3.5 shrink-0" />
                        <span>Nueva imagen seleccionada: {selectedPhotoFile.name} ({(selectedPhotoFile.size / 1024).toFixed(0)} KB)</span>
                      </div>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleUploadPhoto}
                          disabled={uploadingPhoto}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all disabled:opacity-50 cursor-pointer"
                        >
                          {uploadingPhoto ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Subiendo a Meta WhatsApp...</span>
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              <span>Subir a WhatsApp Business</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelPhoto}
                          disabled={uploadingPhoto}
                          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-slate-700 dark:text-stone-300 font-bold text-xs transition-all cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Cancelar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-50 dark:bg-stone-800 hover:bg-orange-100 dark:hover:bg-stone-700 text-orange-600 dark:text-orange-400 border border-orange-500/30 font-bold text-xs transition-all cursor-pointer"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Elegir Nueva Foto de Perfil</span>
                      </button>
                      <p className="text-[11px] text-slate-500 dark:text-stone-400">
                        Formato recomendado: Cuadrado (ej. 640 x 640 px), máximo 5 MB. Formatos admitidos: JPG o PNG.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Selector de País y Moneda Oficial */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800">
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    País, Moneda Oficial & Formato de Precios
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-stone-400">
                    Define la divisa comercial del restaurante. Los precios del catálogo y WhatsApp se ajustan automáticamente.
                  </p>
                </div>
                <span className="px-2 py-0.5 text-[10px] font-black uppercase rounded bg-orange-500/15 text-orange-600 dark:text-orange-400">
                  {currencySymbol} ({currency})
                </span>
              </div>

              {/* Grid de Países */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COUNTRY_PRESETS.map((preset) => {
                  const isSelected = selectedCountry === preset.id;
                  return (
                    <button
                      type="button"
                      key={preset.id}
                      onClick={() => handleCountryChange(preset.id)}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/20 shadow-xs'
                          : 'border-slate-200 dark:border-stone-800 hover:border-slate-300 dark:hover:border-stone-700 bg-slate-50 dark:bg-stone-950/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-900 dark:text-white">
                          {preset.country}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />}
                      </div>
                      <span className="text-[11px] font-bold text-orange-600 dark:text-orange-400 block mt-0.5">
                        {preset.symbol} ({preset.currency})
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-stone-500 font-mono block mt-0.5">
                        Ej: {preset.samplePrice}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Configuración de Cuentas Bancarias y Transferencias (Automático por País) */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Cuentas Bancarias & Datos para Transferencias
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-stone-400">
                      Datos oficiales que verán tus clientes al transferir en la Carta Digital y que el bot de WhatsApp responderá automáticamente.
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-black uppercase rounded-lg bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30 self-start sm:self-auto">
                  {selectedCountry === 'PE' ? '🇵🇪 Perú (PEN - S/.)' : (selectedCountry === 'CL' ? '🇨🇱 Chile (CLP - $)' : '🇦🇷 Argentina (ARS - $)')}
                </span>
              </div>

              {/* Formulario Dinámico según País */}
              {selectedCountry === 'PE' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Banco Principal (Perú)
                      </label>
                      <input
                        type="text"
                        value={bankConfig.pe_bankName}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, pe_bankName: e.target.value }))}
                        placeholder="ej: BCP, BBVA, Interbank, Scotiabank"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={bankConfig.pe_accountType}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, pe_accountType: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all font-semibold"
                      >
                        <option value="Cuenta Corriente">Cuenta Corriente</option>
                        <option value="Cuenta de Ahorros">Cuenta de Ahorros</option>
                        <option value="Cuenta Corriente Soles">Cuenta Corriente Soles</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Número de Cuenta Bancaria
                      </label>
                      <input
                        type="text"
                        value={bankConfig.pe_accountNumber}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, pe_accountNumber: e.target.value }))}
                        placeholder="ej: 193-98765432-0-12"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Código Interbancario (CCI) (20 dígitos)
                      </label>
                      <input
                        type="text"
                        value={bankConfig.pe_cci}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, pe_cci: e.target.value }))}
                        placeholder="ej: 00219300987654320123"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Número Oficial para Yape / Plin
                      </label>
                      <input
                        type="text"
                        value={bankConfig.pe_yapeNumber}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, pe_yapeNumber: e.target.value }))}
                        placeholder="ej: +51 922 931 433"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Titular de la Cuenta / Razón Social
                      </label>
                      <input
                        type="text"
                        value={bankConfig.pe_holderName}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, pe_holderName: e.target.value }))}
                        placeholder="ej: Churu's Comida Rápida S.A.C."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCountry === 'CL' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Banco Principal (Chile)
                      </label>
                      <input
                        type="text"
                        value={bankConfig.cl_bankName}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, cl_bankName: e.target.value }))}
                        placeholder="ej: Banco Estado, Banco de Chile, Santander"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={bankConfig.cl_accountType}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, cl_accountType: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                      >
                        <option value="CuentaRUT">CuentaRUT (Banco Estado)</option>
                        <option value="Cuenta Corriente">Cuenta Corriente</option>
                        <option value="Cuenta Vista">Cuenta Vista</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Número de Cuenta
                      </label>
                      <input
                        type="text"
                        value={bankConfig.cl_accountNumber}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, cl_accountNumber: e.target.value }))}
                        placeholder="ej: 12345678 (o RUT sin dígito verificador)"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        RUT del Titular
                      </label>
                      <input
                        type="text"
                        value={bankConfig.cl_rut}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, cl_rut: e.target.value }))}
                        placeholder="ej: 12.345.678-9"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Nombre o Razón Social del Titular
                      </label>
                      <input
                        type="text"
                        value={bankConfig.cl_holderName}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, cl_holderName: e.target.value }))}
                        placeholder="ej: Churu's Chile SpA"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Email para Notificación de Transferencia
                      </label>
                      <input
                        type="email"
                        value={bankConfig.cl_email}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, cl_email: e.target.value }))}
                        placeholder="ej: pagos@churus.cl"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedCountry === 'AR' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Banco o Billetera (Argentina)
                      </label>
                      <input
                        type="text"
                        value={bankConfig.ar_bankName}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, ar_bankName: e.target.value }))}
                        placeholder="ej: Mercado Pago, Banco Galicia, Santander"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Tipo de Cuenta
                      </label>
                      <select
                        value={bankConfig.ar_accountType}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, ar_accountType: e.target.value }))}
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-semibold"
                      >
                        <option value="CBU / CVU">CBU / CVU Digital</option>
                        <option value="Caja de Ahorro">Caja de Ahorro en Pesos</option>
                        <option value="Cuenta Corriente">Cuenta Corriente</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Alias CBU / CVU (Para transferir)
                      </label>
                      <input
                        type="text"
                        value={bankConfig.ar_alias}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, ar_alias: e.target.value.toUpperCase() }))}
                        placeholder="ej: CHURUS.BURGER.MP"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        CBU / CVU Completo (22 dígitos)
                      </label>
                      <input
                        type="text"
                        value={bankConfig.ar_cbu}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, ar_cbu: e.target.value }))}
                        placeholder="ej: 0000003100012345678901"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        CUIT / CUIL del Titular
                      </label>
                      <input
                        type="text"
                        value={bankConfig.ar_cuit}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, ar_cuit: e.target.value }))}
                        placeholder="ej: 30-71234567-8"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                        Titular de la Cuenta
                      </label>
                      <input
                        type="text"
                        value={bankConfig.ar_holderName}
                        onChange={(e) => setBankConfig(prev => ({ ...prev, ar_holderName: e.target.value }))}
                        placeholder="ej: Churu's Argentina S.R.L."
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Datos Básicos de la Empresa */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-stone-800">
                Información del Restaurante / Negocio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Nombre Comercial del Restaurante *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej: Churu's Comida Rápida"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Rubro o Especialidad Gastronómica
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  >
                    {INDUSTRIES.map((ind) => (
                      <option key={ind.id} value={ind.id}>
                        {ind.emoji} {ind.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Teléfono Oficial para WhatsApp de Clientes *
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="ej: +51 900 372 689"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Dirección Física del Local (Para Retiros y GPS)
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="ej: Av. Los Próceres 458, Lima"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                  Políticas de Despacho, Pagos y Reservas
                </label>
                <textarea
                  rows={2}
                  value={policies}
                  onChange={(e) => setPolicies(e.target.value)}
                  placeholder="ej: Pedidos por delivery o recojo en tienda. Pagos vía Yape, Plin o contraentrega. Indicar dirección exacta..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none leading-relaxed"
                />
              </div>

              {/* Checkbox Generación Automática */}
              <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800/60 transition-colors">
                <input
                  type="checkbox"
                  checked={allowReservations}
                  onChange={(e) => setAllowReservations(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-stone-700 cursor-pointer"
                />
                <div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                    Permitir generación de comandas automáticas por WhatsApp
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5 block">
                    El bot creará la comanda directamente en el tablero de Cocina en Vivo apenas el comensal confirme su pedido.
                  </span>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* =========================================================================
            PESTAÑA 2: HORARIOS DE ATENCIÓN SEMANAL
           ========================================================================= */}
        {activeTab === 'hours' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* Control Rápido de Estado en Vivo */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Control Rápido de Estado en Vivo
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-stone-400">
                      Fuerza el estado de cocina abierta/cerrada o déjalo en modo automático según el horario semanal.
                    </p>
                  </div>
                </div>

                {hoursStatus && (
                  <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-2 shrink-0 ${
                    hoursStatus.abierto
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  }`}>
                    <span className={`w-2.5 h-2.5 rounded-full ${hoursStatus.abierto ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span>{hoursStatus.abierto ? '🟢 Local Abierto Ahora' : '🔴 Local Cerrado Ahora'}</span>
                    <span className="text-[10px] opacity-75 font-mono">({hoursStatus.horaActual})</span>
                  </div>
                )}
              </div>

              {/* Botones de Modo Manual / Auto */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-stone-950 p-4 rounded-xl border border-slate-200 dark:border-stone-800">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
                      Activar Control Automático de Horario
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-stone-400 block">
                      {hoursConfig.horarios.habilitado 
                        ? 'El bot y la carta respetan los horarios semanales.' 
                        : 'Desactivado: El restaurante siempre figura como abierto 24/7.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => updateHoursConfig('habilitado', !hoursConfig.horarios.habilitado)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      hoursConfig.horarios.habilitado ? 'bg-orange-600' : 'bg-slate-300 dark:bg-stone-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        hoursConfig.horarios.habilitado ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-stone-300 block mb-1.5">
                    Modo Forzado en Tiempo Real:
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleManualOverride('auto')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border text-center ${
                        hoursConfig.horarios.modo_manual === 'auto'
                          ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-800 hover:bg-slate-100'
                      }`}
                    >
                      ⚡ Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualOverride('abierto_forzado')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border text-center ${
                        hoursConfig.horarios.modo_manual === 'abierto_forzado'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-800 hover:bg-slate-100'
                      }`}
                    >
                      🟢 Abrir Ya
                    </button>
                    <button
                      type="button"
                      onClick={() => handleManualOverride('cerrado_forzado')}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border text-center ${
                        hoursConfig.horarios.modo_manual === 'cerrado_forzado'
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-800 hover:bg-slate-100'
                      }`}
                    >
                      🔴 Cerrar Ya
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Programación Día por Día */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-stone-800">
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Horarios Semanales (Lunes a Domingo)
                </h3>
                <span className="text-xs text-slate-400 font-mono">
                  Zona: {hoursConfig.horarios.zona_horaria}
                </span>
              </div>

              <div className="space-y-2.5">
                {Object.entries(DIAS_LABELS).map(([diaKey, diaLabel]) => {
                  const diaData = hoursConfig.horarios.dias_semana[diaKey] || { abierto: true, apertura: '12:00', cierre: '23:30' };
                  return (
                    <div
                      key={diaKey}
                      className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        diaData.abierto
                          ? 'bg-white dark:bg-stone-900 border-slate-200 dark:border-stone-800'
                          : 'bg-slate-50 dark:bg-stone-950/40 border-slate-200/50 dark:border-stone-800/40 opacity-70'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => updateDia(diaKey, 'abierto', !diaData.abierto)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${
                            diaData.abierto ? 'bg-orange-600' : 'bg-slate-300 dark:bg-stone-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
                              diaData.abierto ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-xs sm:text-sm font-black ${diaData.abierto ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {diaLabel}
                        </span>
                      </div>

                      {diaData.abierto ? (
                        <div className="flex items-center gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Apertura:</span>
                            <input
                              type="time"
                              value={diaData.apertura}
                              onChange={(e) => updateDia(diaKey, 'apertura', e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white font-mono text-xs font-bold"
                            />
                          </div>
                          <span className="text-slate-400">—</span>
                          <div className="flex items-center gap-1">
                            <span className="text-slate-400 text-[10px]">Cierre:</span>
                            <input
                              type="time"
                              value={diaData.cierre}
                              onChange={(e) => updateDia(diaKey, 'cierre', e.target.value)}
                              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white font-mono text-xs font-bold"
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-rose-500">
                          Cerrado todo el día
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            PESTAÑA 3: MENSAJES AUTOMÁTICOS & TONO IA
           ========================================================================= */}
        {activeTab === 'messages' && (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* Mensajes Fuera de Horario */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-stone-800">
                <MessageSquare className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Mensaje Automático Cuando el Local Está Cerrado
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                  Texto enviado automáticamente por WhatsApp fuera de horario:
                </label>
                <textarea
                  rows={4}
                  value={hoursConfig.mensajes.fuera_de_horario}
                  onChange={(e) => updateMensaje('fuera_de_horario', e.target.value)}
                  placeholder="🌙 ¡Hola! En este momento nos encontramos fuera de horario..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-mono leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Variables dinámicas disponibles: <code className="text-orange-500 font-bold">&#123;horario&#125;</code> (horario del día), <code className="text-orange-500 font-bold">&#123;link_carta&#125;</code> (link a carta digital).
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                    Aviso Previo al Cierre (Minutos):
                  </label>
                  <input
                    type="number"
                    value={hoursConfig.configuracion.avisar_antes_de_cerrar_minutos}
                    onChange={(e) => updateConfiguracion('avisar_antes_de_cerrar_minutos', parseInt(e.target.value, 10) || 15)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white font-mono font-bold"
                  />
                </div>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hoursConfig.configuracion.pausar_ai_fuera_horario}
                    onChange={(e) => updateConfiguracion('pausar_ai_fuera_horario', e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-stone-700 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Pausar IA de conversación fuera de horario
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Solo envía el mensaje informativo y guarda el chat para el día siguiente.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Modalidad de Respuesta del Chatbot: Texto Instantáneo vs Notas de Voz Sintetizadas */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-stone-800">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                    Modo de Respuesta del Asistente en WhatsApp
                  </h3>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 w-fit">
                  Modelo Híbrido Asimétrico
                </span>
              </div>

              {/* Callout de Valor Comercial */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed flex items-start gap-2.5">
                <span className="text-base shrink-0">💡</span>
                <div>
                  <strong className="font-bold">Estrategia recomendada para delivery:</strong> Responder con <strong>Texto instantáneo</strong> reduce la tasa de abandono en más de un <strong>40%</strong>. La respuesta en texto toma apenas <strong>2 segundos</strong> y permite a los comensales leer precios, promociones y cuentas bancarias sin esperar la descarga de un audio largo.
                </div>
              </div>

              {/* Selector de Modo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {/* Opción 1: Texto Instantáneo (Recomendado) */}
                <button
                  type="button"
                  onClick={() => setResponseMode('text')}
                  className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                    responseMode === 'text'
                      ? 'bg-emerald-500/10 border-emerald-500 text-slate-900 dark:text-white ring-2 ring-emerald-500/20'
                      : 'bg-slate-50 dark:bg-stone-950 border-slate-200 dark:border-stone-800 text-slate-500 hover:border-slate-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                      <Zap className="w-4 h-4" />
                      Texto Instantáneo
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black uppercase">
                      Recomendado (2s)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-stone-300 font-medium">
                    El bot responde en texto con negritas, emojis y enlaces directos a la carta. Máxima claridad y velocidad en compras.
                  </p>
                </button>

                {/* Opción 2: Notas de Voz Sintetizadas */}
                <button
                  type="button"
                  onClick={() => setResponseMode('voice')}
                  className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer ${
                    responseMode === 'voice'
                      ? 'bg-purple-500/10 border-purple-500 text-slate-900 dark:text-white ring-2 ring-purple-500/20'
                      : 'bg-slate-50 dark:bg-stone-950 border-slate-200 dark:border-stone-800 text-slate-500 hover:border-slate-300 dark:hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5 text-purple-600 dark:text-purple-400">
                      <Volume2 className="w-4 h-4" />
                      Notas de Voz Sintetizadas
                    </span>
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 font-black uppercase">
                      Plan Pro (TTS)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-stone-300 font-medium">
                    El bot sintetiza su respuesta en notas de voz con audio humano mediante Gemini TTS. Experiencia auditiva para clientes Pro.
                  </p>
                </button>
              </div>
            </div>

            {/* Actitud y Prompt Gastronómico del Chatbot */}
            <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-stone-800">
                <Bot className="w-5 h-5 text-orange-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Personalidad, Respuestas y Tono de la IA
                </h3>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1">
                  Instrucciones Personalizadas para el Asistente Virtual:
                </label>
                <textarea
                  rows={4}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="ej: Sé muy directo, amable, educado y profesional. Respuestas cortas sin texto excesivo. Recomienda las salsas caseras y aclara que el broaster pecho incluye ensalada y papas nativas."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium leading-relaxed"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Regla CEO: Respuestas directas, cortas y educadas sin spam para una atención rápida y efectiva en WhatsApp.
                </span>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
}
