'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Store, 
  MapPin, 
  Phone, 
  Coins, 
  Bot, 
  CheckCircle2, 
  Save, 
  AlertCircle,
  Check,
  Clock,
  Calendar,
  Sparkles,
  AlertTriangle,
  Copy,
  MessageSquare,
  Power
} from 'lucide-react';

interface CountryPreset {
  id: string;
  country: string;
  currency: string;
  symbol: string;
  phonePrefix: string;
  name: string;
  samplePrice: string;
}

const COUNTRY_PRESETS: CountryPreset[] = [
  { id: 'PE', country: 'Perú', currency: 'PEN', symbol: 'S/.', phonePrefix: '+51', name: 'Sol Peruano', samplePrice: 'S/. 18.50' },
  { id: 'CL', country: 'Chile', currency: 'CLP', symbol: '$', phonePrefix: '+56', name: 'Peso Chileno', samplePrice: '$ 5.500' },
  { id: 'AR', country: 'Argentina', currency: 'ARS', symbol: '$', phonePrefix: '+54', name: 'Peso Argentino', samplePrice: '$ 8.500' },
];

function CountryFlag({ id }: { id: string }) {
  switch (id) {
    case 'PE':
      return (
        <svg viewBox="0 0 36 24" className="w-7 h-5 rounded shadow-xs shrink-0 overflow-hidden">
          <rect width="12" height="24" fill="#D91023" />
          <rect x="12" width="12" height="24" fill="#FFFFFF" />
          <rect x="24" width="12" height="24" fill="#D91023" />
        </svg>
      );
    case 'CL':
      return (
        <svg viewBox="0 0 36 24" className="w-7 h-5 rounded shadow-xs shrink-0 overflow-hidden">
          <rect width="36" height="12" fill="#FFFFFF" />
          <rect y="12" width="36" height="12" fill="#D52B1E" />
          <rect width="12" height="12" fill="#0039A6" />
          <polygon points="6,2 7.2,5.8 11.2,5.8 8,8.2 9.2,12 6,9.6 2.8,12 4,8.2 0.8,5.8 4.8,5.8" fill="#FFFFFF" />
        </svg>
      );
    case 'AR':
      return (
        <svg viewBox="0 0 36 24" className="w-7 h-5 rounded shadow-xs shrink-0 overflow-hidden">
          <rect width="36" height="8" fill="#74ACDF" />
          <rect y="8" width="36" height="8" fill="#FFFFFF" />
          <rect y="16" width="36" height="8" fill="#74ACDF" />
          <circle cx="18" cy="12" r="2.5" fill="#F6B40E" />
        </svg>
      );
    default:
      return <span className="text-xl">🌐</span>;
  }
}

const BUSINESS_INDUSTRIES = [
  { id: 'fast_food', label: '🍔 Comida Rápida & Delivery', desc: 'Broasters, hamburguesas, salchipapas, alitas, tacos' },
  { id: 'restaurant', label: '🍲 Restaurante & Gastronomía', desc: 'Menú a la carta, platos criollos, marisquerías' },
  { id: 'technology', label: '💻 Tecnología, PC Gamer & Celulares', desc: 'Venta de hardware, periféricos, repuestos y soporte técnico' },
  { id: 'clothing', label: '👗 Moda, Calzado & Accesorios', desc: 'Boutiques, ropa urbana, calzado deportivo' },
  { id: 'pharmacy', label: '💊 Farmacia, Salud & Bienestar', desc: 'Medicamentos, cuidado personal y suplementos' },
  { id: 'services', label: '🛠️ Servicios Profesionales & Citas', desc: 'Barberías, spas, consultorías y talleres' },
  { id: 'other', label: '📦 Comercio General / Retail', desc: 'Cualquier otro rubro o tienda minorista' },
];

const TIMEZONES = [
  { id: 'America/Lima', label: '🇵🇪 Perú (GMT-5) - Lima' },
  { id: 'America/Santiago', label: '🇨🇱 Chile (GMT-4 / GMT-3) - Santiago' },
  { id: 'America/Argentina/Buenos_Aires', label: '🇦🇷 Argentina (GMT-3) - Buenos Aires' },
  { id: 'America/Bogota', label: '🇨🇴 Colombia (GMT-5) - Bogotá' },
  { id: 'America/Mexico_City', label: '🇲🇽 México (GMT-6) - CDMX' },
  { id: 'Europe/Madrid', label: '🇪🇸 España (GMT+1) - Madrid' },
];

const DIAS_KEYS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const;
type DiaKey = typeof DIAS_KEYS[number];

const DIAS_LABELS: Record<DiaKey, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
};

interface HorarioDia {
  abierto: boolean;
  apertura: string | null;
  cierre: string | null;
}

interface HoursConfig {
  horarios: {
    habilitado: boolean;
    zona_horaria: string;
    modo_manual: 'auto' | 'abierto_forzado' | 'cerrado_forzado';
    dias_semana: Record<DiaKey, HorarioDia>;
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

export default function BusinessProfilePage() {
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

          const matched = COUNTRY_PRESETS.find(
            (c) => c.currency === loadedCurrency && c.symbol === loadedSymbol
          );
          if (matched) {
            setSelectedCountry(matched.id);
          } else if (loadedCurrency === 'CLP' || loadedSymbol === '$') {
            setSelectedCountry('CL');
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

  // Handle Automatic Country / Currency Selection
  const handleCountryChange = (countryId: string) => {
    setSelectedCountry(countryId);
    const preset = COUNTRY_PRESETS.find((c) => c.id === countryId);
    if (preset) {
      setCurrency(preset.currency);
      setCurrencySymbol(preset.symbol);
      
      // Auto-update phone prefix if phone is empty or matches another preset prefix
      if (!phone || phone.trim() === '') {
        setPhone(`${preset.phonePrefix} `);
      } else {
        const prevPrefix = COUNTRY_PRESETS.find(c => phone.startsWith(c.phonePrefix))?.phonePrefix;
        if (prevPrefix && prevPrefix !== preset.phonePrefix) {
          setPhone(phone.replace(prevPrefix, preset.phonePrefix));
        }
      }

      // Auto-update timezone matching country
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
    setHoursConfig((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        [field]: value,
      },
    }));
  };

  const updateDaySchedule = (dia: DiaKey, field: keyof HorarioDia, value: any) => {
    setHoursConfig((prev) => ({
      ...prev,
      horarios: {
        ...prev.horarios,
        dias_semana: {
          ...prev.horarios.dias_semana,
          [dia]: {
            ...prev.horarios.dias_semana[dia],
            [field]: value,
          },
        },
      },
    }));
  };

  const copyMondayToAllDays = () => {
    const monday = hoursConfig.horarios.dias_semana.lunes;
    setHoursConfig((prev) => {
      const updatedDays = { ...prev.horarios.dias_semana };
      for (const d of DIAS_KEYS) {
        updatedDays[d] = { ...monday };
      }
      return {
        ...prev,
        horarios: {
          ...prev.horarios,
          dias_semana: updatedDays,
        },
      };
    });
    setMessage({
      type: 'success',
      text: '¡Horario del Lunes copiado a todos los días de la semana!',
    });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleManualOverride = async (modo: 'auto' | 'abierto_forzado' | 'cerrado_forzado') => {
    const updated = {
      ...hoursConfig,
      horarios: {
        ...hoursConfig.horarios,
        modo_manual: modo,
      },
    };
    setHoursConfig(updated);

    try {
      const res = await fetch('/api/admin/business/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      if (data.success) {
        setHoursStatus(data.status);
        const labels = {
          auto: '⚡ Modo Automático activado (se rige por el horario semanal)',
          abierto_forzado: '🟢 Local Forzado a ABIERTO ahora',
          cerrado_forzado: '🔴 Local Forzado a CERRADO ahora (pausa temporal)',
        };
        setMessage({ type: 'success', text: labels[modo] });
        setTimeout(() => setMessage(null), 4000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
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
          text: `¡Configuración y horarios guardados! Moneda activa: ${currencySymbol} (${currency}). WhatsApp y la carta están 100% sincronizados.` 
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
    <div className="max-w-5xl mx-auto space-y-6 pb-28 sm:pb-12 animate-in fade-in duration-150">
      
      {/* Toast Feedback */}
      {message && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-white text-xs sm:text-sm font-bold border animate-in slide-in-from-top-2 duration-150 ${
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

      {/* Header de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-5 border-b border-slate-200 dark:border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-orange-500">
                Operaciones, Horarios & Moneda
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Mi Local & Perfil Comercial
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-stone-400 mt-1">
            Personaliza los datos clave de tu restaurante, horarios de atención y mensajes automáticos de fuera de horario.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-xs sm:text-sm shadow-md shadow-orange-600/20 transition-all disabled:opacity-50 shrink-0 cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Todo'}</span>
        </button>
      </div>

      {/* Formulario Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Horarios de Atención Semanal & Mensaje Fuera de Horario */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-500" />
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  Horario de Atención Semanal & Respuestas Automáticas
                </h2>
                <p className="text-xs text-slate-500 dark:text-stone-400">
                  Controla cuándo está abierta la cocina y responde automáticamente por WhatsApp cuando el local esté cerrado.
                </p>
              </div>
            </div>

            {/* Live Status Badge */}
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

          {/* Quick Override Buttons & Master Toggle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-stone-950 p-4 rounded-xl border border-slate-200 dark:border-stone-800">
            {/* Master Enable Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white block">
                  Activar Control Automático de Horario
                </span>
                <span className="text-[11px] text-slate-500 dark:text-stone-400 block">
                  {hoursConfig.horarios.habilitado 
                    ? 'El bot y la carta respetan los horarios semanales configurados.' 
                    : 'Desactivado: El restaurante siempre figurará como abierto 24/7.'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => updateHoursConfig('habilitado', !hoursConfig.horarios.habilitado)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
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

            {/* Quick Manual Override (Auto / Abierto / Cerrado) */}
            <div>
              <span className="text-xs font-bold text-slate-700 dark:text-stone-300 block mb-1.5">
                Control Rápido de Estado en Vivo:
              </span>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleManualOverride('auto')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border text-center ${
                    hoursConfig.horarios.modo_manual === 'auto'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs'
                      : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-800 hover:bg-slate-100 dark:hover:bg-stone-800'
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
                      : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-800 hover:bg-slate-100 dark:hover:bg-stone-800'
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
                      : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-stone-300 border-slate-200 dark:border-stone-800 hover:bg-slate-100 dark:hover:bg-stone-800'
                  }`}
                >
                  🔴 Cerrar Ya
                </button>
              </div>
            </div>
          </div>

          {/* Timezone Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Zona Horaria Oficial del Negocio
              </label>
              <select
                value={hoursConfig.horarios.zona_horaria}
                onChange={(e) => updateHoursConfig('zona_horaria', e.target.value)}
                className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.id} value={tz.id}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 block">
                Garantiza que la hora calculada coincida exactamente con tu país sin importar la ubicación del servidor.
              </span>
            </div>

            <div className="flex items-end pb-1">
              <button
                type="button"
                onClick={copyMondayToAllDays}
                className="w-full py-2 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/40 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/80 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs"
              >
                <Copy className="w-3.5 h-3.5 text-orange-500" />
                <span>Copiar horario del Lunes a toda la semana ⚡</span>
              </button>
            </div>
          </div>

          {/* Weekly Days Table */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-stone-300">
              Días de la Semana y Horas de Atención
            </label>
            <div className="grid grid-cols-1 gap-2 border border-slate-200 dark:border-stone-800 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-stone-800">
              {DIAS_KEYS.map((diaKey) => {
                const dia = hoursConfig.horarios.dias_semana[diaKey];
                const label = DIAS_LABELS[diaKey];
                const crossesMidnight = dia.apertura && dia.cierre && dia.cierre < dia.apertura;

                return (
                  <div
                    key={diaKey}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-3 transition-colors ${
                      dia.abierto ? 'bg-white dark:bg-stone-900' : 'bg-slate-50/70 dark:bg-stone-950/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3 sm:w-36">
                      <input
                        type="checkbox"
                        checked={dia.abierto}
                        onChange={(e) => updateDaySchedule(diaKey, 'abierto', e.target.checked)}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-stone-700 cursor-pointer"
                      />
                      <span className={`text-xs sm:text-sm font-bold ${dia.abierto ? 'text-slate-900 dark:text-white' : 'text-slate-400 line-through'}`}>
                        {label}
                      </span>
                    </div>

                    {dia.abierto ? (
                      <div className="flex items-center gap-2 flex-1 justify-start sm:justify-end">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 dark:text-stone-400 font-semibold">Apertura:</span>
                          <input
                            type="time"
                            value={dia.apertura || '12:00'}
                            onChange={(e) => updateDaySchedule(diaKey, 'apertura', e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>

                        <span className="text-slate-400 text-xs">a</span>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-slate-500 dark:text-stone-400 font-semibold">Cierre:</span>
                          <input
                            type="time"
                            value={dia.cierre || '23:30'}
                            onChange={(e) => updateDaySchedule(diaKey, 'cierre', e.target.value)}
                            className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-stone-700 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white font-mono font-bold"
                          />
                        </div>

                        {crossesMidnight && (
                          <span className="hidden md:inline-block px-2 py-0.5 rounded text-[10px] font-black bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                            🌙 Madrugada
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-rose-500 font-bold sm:text-right">
                        Cerrado todo el día (Descanso)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mensaje Automático de Fuera de Horario (WhatsApp) */}
          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-stone-800">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300">
                💬 Mensaje Automático de WhatsApp al estar Fuera de Horario
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                Variables: {'{horario}'}, {'{link_carta}'}
              </span>
            </div>

            <textarea
              rows={5}
              value={hoursConfig.mensajes.fuera_de_horario}
              onChange={(e) =>
                setHoursConfig((prev) => ({
                  ...prev,
                  mensajes: {
                    ...prev.mensajes,
                    fuera_de_horario: e.target.value,
                  },
                }))
              }
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono leading-relaxed"
            />

            {/* Live WhatsApp Bubble Preview */}
            <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-3.5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-inner">
              <span className="text-[10px] font-bold text-slate-500 dark:text-stone-400 block mb-2 uppercase tracking-wider">
                📱 Vista previa de cómo lo recibe el cliente en WhatsApp:
              </span>
              <div className="max-w-md bg-white dark:bg-[#202c33] text-slate-900 dark:text-stone-100 p-3 rounded-2xl rounded-tl-none shadow-sm text-xs leading-relaxed whitespace-pre-line border border-black/5">
                {hoursConfig.mensajes.fuera_de_horario
                  .replace('{horario}', '• Lunes a Jueves: 12:00 a 23:30\n• Viernes y Sábado: 12:00 a 01:00\n• Domingo: 12:00 a 23:00')
                  .replace('{link_carta}', 'https://chatbot.zgamersa.com/menu')}
              </div>
            </div>

            {/* Checkbox Pausar IA */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-stone-950 border border-slate-200 dark:border-stone-800 cursor-pointer hover:bg-slate-100 dark:hover:bg-stone-800/60 transition-colors">
              <input
                type="checkbox"
                checked={hoursConfig.configuracion.pausar_ai_fuera_horario}
                onChange={(e) =>
                  setHoursConfig((prev) => ({
                    ...prev,
                    configuracion: {
                      ...prev.configuracion,
                      pausar_ai_fuera_horario: e.target.checked,
                    },
                  }))
                }
                className="mt-0.5 w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-slate-300 dark:border-stone-700 cursor-pointer"
              />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white block">
                  Pausar toma de pedidos con IA cuando el local esté cerrado
                </span>
                <span className="text-[11px] text-slate-500 dark:text-stone-400 mt-0.5 block">
                  Al recibir un mensaje fuera de horario, el bot envía automáticamente el horario y el link del catálogo digital sin ingresar pedidos a la comanda de cocina.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Card 2: País, Moneda y Símbolo Automático (Prioridad: Perú, Chile, Argentina) */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-orange-500" />
              <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                País, Moneda Oficial & Formato de Precios
              </h2>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-[#94de2d] text-xs font-black border border-emerald-500/20">
              Sincronización Automática
            </span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-2">
                Selecciona tu País o Región Comercial (Configura moneda y formato al instante)
              </label>

              {/* Grid Selector de Países con Banderas SVG Reales */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {COUNTRY_PRESETS.map((preset) => {
                  const isSelected = selectedCountry === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleCountryChange(preset.id)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between gap-2 cursor-pointer ${
                        isSelected
                          ? 'border-orange-500 bg-orange-500/10 ring-2 ring-orange-500/30 shadow-xs'
                          : 'border-slate-200 dark:border-stone-800 hover:border-slate-300 dark:hover:border-stone-700 bg-slate-50/50 dark:bg-stone-950'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <CountryFlag id={preset.id} />
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-orange-600 text-white flex items-center justify-center text-[10px] font-black">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 dark:text-white block">
                          {preset.country}
                        </span>
                        <span className="text-[11px] text-orange-600 dark:text-orange-400 font-extrabold block">
                          {preset.symbol} ({preset.currency})
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inputs de Moneda y Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-stone-400 mb-1">
                  Código ISO (3 letras)
                </label>
                <input
                  type="text"
                  value={currency}
                  readOnly
                  className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-100 dark:bg-stone-950 text-slate-700 dark:text-stone-300 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-stone-400 mb-1">
                  Símbolo de Visualización *
                </label>
                <input
                  type="text"
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="ej: S/., $, €"
                  className="w-full px-3 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono"
                  required
                />
              </div>

              <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 flex flex-col justify-center">
                <span className="text-[10px] font-black uppercase text-orange-600 dark:text-orange-400 tracking-wider block">
                  Vista Previa en Carta & Comandas:
                </span>
                <span className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                  Hamburguesa Clásica: <strong className="text-orange-500">{selectedCountry === 'CL' ? '$ 5.500' : selectedCountry === 'AR' ? '$ 8.500' : 'S/. 18.50'}</strong>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Identidad del Negocio */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-stone-800">
            <Building2 className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Identidad del Negocio & Especialidad
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Rubro o Sector Comercial *
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium cursor-pointer"
              >
                {BUSINESS_INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 block">
                La IA modula automáticamente su vocabulario, tono y actitud gastronómica según el rubro elegido.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Nombre Comercial del Restaurante / Tienda *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ej: Churu's Comida Rápida"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Descripción de lo que ofrece el local
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej: Especialistas en broaster, alitas con salsas exclusivas, hamburguesas artesanales, salchipapas, enchiladas y complementos."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Card 4: Ubicación Física & Atención al Cliente */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-stone-800">
            <MapPin className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Ubicación Física & Atención al Cliente
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Dirección Física / Punto de Recojo en Tienda *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ej: Av. Los Próceres 458 (Ref: A media cuadra del parque principal)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium"
              />
              <span className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 block">
                Esta dirección se la compartirá el bot a los clientes que elijan recoger su pedido en el local.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Teléfono de Contacto / Central
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="ej: +51 900 372 689 o +56 9 6541 9765"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
              />
              <span className="text-[11px] text-slate-500 dark:text-stone-400 mt-1 block">
                Número oficial donde el comensal puede consultar dudas o coordinar despachos.
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Políticas de Despacho & Prompt del Asistente */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-stone-900 border border-slate-200 dark:border-stone-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-stone-800">
            <Bot className="w-4 h-4 text-orange-500" />
            <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Políticas de Despacho, Pagos & Reglas para la IA
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Políticas de Despacho, Pagos y Reservas
              </label>
              <textarea
                rows={2}
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                placeholder="ej: Pedidos por delivery o recojo en tienda. Pagos vía Yape, Plin o contraentrega en efectivo. Radio de reparto hasta 5 km..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-stone-300 mb-1.5">
                Instrucciones Personalizadas para el Bot (Prompt Gastronómico)
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="ej: Si el cliente duda de la porción, aclara que el broaster pecho es súper contundente e incluye ensalada y cremas artesanales. Recomienda siempre agregar salchibroaster o gaseosa helada."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-stone-800 bg-slate-50 dark:bg-stone-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Checkbox de Pedidos Automáticos */}
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

        {/* Botón Guardar Inferior */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 active:scale-95 text-white font-black text-sm shadow-lg shadow-orange-600/20 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando Perfil & Horarios...' : 'Guardar Perfil & Horarios de Atención'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
