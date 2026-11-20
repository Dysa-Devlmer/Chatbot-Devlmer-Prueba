'use client';

import { useState, useEffect } from 'react';
import { 
  Building2, 
  Store, 
  MapPin, 
  Phone, 
  Coins, 
  FileText, 
  Bot, 
  CheckCircle2, 
  Save, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

const INDUSTRIES = [
  { id: 'fast_food', label: '🍔 Comida Rápida / Delivery', desc: 'Broasters, hamburguesas, alitas, salchipapas y bebidas' },
  { id: 'restaurant', label: '🍽️ Restaurante / Gastronomía', desc: 'Menú a la carta, reservas de mesa y platos ejecutivos' },
  { id: 'technology', label: '💻 Tecnología / Hardware / Computación', desc: 'Venta de componentes gamer, periféricos y accesorios' },
  { id: 'clothing', label: '👗 Ropa / Moda / Calzado', desc: 'Prendas de vestir, tallas, catálogo de moda y despacho' },
  { id: 'pharmacy', label: '💊 Farmacia / Salud / Belleza', desc: 'Medicamentos, artículos de cuidado personal y aseo' },
  { id: 'services', label: '🔧 Servicios Profesionales / Reparaciones', desc: 'Consultorías, soporte técnico y cotizaciones' },
  { id: 'other', label: '📦 Comercio General / Otro', desc: 'Cualquier otro rubro o tienda minorista' },
];

export default function BusinessProfilePage() {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('fast_food');
  const [description, setDescription] = useState('');
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

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/admin/business');
        const data = await res.json();
        if (data.success && data.profile) {
          const p = data.profile;
          setName(p.name || '');
          setIndustry(p.industry || 'fast_food');
          setDescription(p.description || '');
          setCurrency(p.currency || 'PEN');
          setCurrencySymbol(p.currencySymbol || 'S/.');
          setPhone(p.phone || '');
          setAddress(p.address || '');
          setAllowReservations(p.allowReservations ?? true);
          setPolicies(p.policies || '');
          setCustomPrompt(p.customPrompt || '');
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/admin/business', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          industry,
          description,
          currency,
          currencySymbol,
          phone,
          address,
          allowReservations,
          policies,
          customPrompt,
        }),
      });

      if (res.ok) {
        setMessage({ type: 'success', text: '¡Configuración del local guardada y sincronizada con la IA exitosamente!' });
        setTimeout(() => setMessage(null), 4000);
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
        <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Cargando perfil del local...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-28 sm:pb-12 animate-in fade-in duration-150">
      
      {/* Header de Página */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Mi Local & Perfil Comercial
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Personaliza los datos clave de tu negocio. El bot de IA adoptará esta información para responder a tus clientes.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-600/20 transition-all disabled:opacity-50 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
        </button>
      </div>

      {/* Alerta de Estado */}
      {message && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs sm:text-sm font-semibold border animate-in slide-in-from-top-2 duration-150 ${
          message.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Formulario Principal */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Card 1: Identidad y Rubro */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <Store className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Identidad del Negocio
            </h2>
          </div>

          <div className="space-y-4">
            {/* Sector / Rubro */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Rubro o Sector Comercial *
              </label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              >
                {INDUSTRIES.map((ind) => (
                  <option key={ind.id} value={ind.id}>
                    {ind.label}
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                La IA modula automáticamente su vocabulario y actitud según el rubro que elijas.
              </span>
            </div>

            {/* Nombre Comercial y Moneda */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Nombre Comercial *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ej: Churu's Comida Rápida"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Código de Moneda
                </label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  placeholder="PEN"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Símbolo de Moneda *
                </label>
                <input
                  type="text"
                  required
                  value={currencySymbol}
                  onChange={(e) => setCurrencySymbol(e.target.value)}
                  placeholder="S/."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-indigo-600 dark:text-indigo-400"
                />
              </div>
            </div>

            {/* Descripción comercial */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Descripción de lo que ofrece el local
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ej: Especialistas en broaster crispy, alitas con salsas exclusivas, hamburguesas artesanales..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Ubicación y Contacto */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Ubicación Física & Atención al Cliente
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Dirección Física / Punto de Recojo en Tienda *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="ej: Av. Los Próceres 458 (Ref: A media cuadra del parque)"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">
                Esta dirección se la compartirá el bot a los clientes que elijan recoger su pedido en el local.
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Teléfono de Contacto / Central
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+51 987 654 321"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Card 3: Políticas y Configuración de IA */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800/80">
            <Bot className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
              Políticas de Despacho & Prompt del Asistente
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Políticas de Despacho, Pagos y Reservas
              </label>
              <textarea
                rows={2}
                value={policies}
                onChange={(e) => setPolicies(e.target.value)}
                placeholder="ej: Pedidos por delivery o recojo en tienda. Pagos vía Yape, Plin o contraentrega en efectivo..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Instrucciones Personalizadas para la IA (Prompt de Negocio)
              </label>
              <textarea
                rows={3}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="ej: Si el cliente pregunta por salsas, recomienda la salsa acevichada de la casa. Si piden broaster, aclara que incluye papas y ensalada..."
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            {/* Checkbox de Pedidos Automáticos */}
            <label className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/60 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors">
              <input
                type="checkbox"
                checked={allowReservations}
                onChange={(e) => setAllowReservations(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500/30 border-slate-300 dark:border-slate-600"
              />
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                  Permitir toma de pedidos y reservas automáticas por WhatsApp
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                  Si se desmarca, el bot únicamente responderá consultas informativas sin crear órdenes en el tablero.
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
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-extrabold text-sm shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando Perfil...' : 'Guardar Perfil de Empresa'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
