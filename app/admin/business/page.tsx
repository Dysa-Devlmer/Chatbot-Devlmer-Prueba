'use client'

import { useState, useEffect } from 'react'

const INDUSTRIES = [
  { id: 'technology', label: '💻 Tecnología / Hardware / Computación', icon: '💻' },
  { id: 'clothing', label: '👗 Ropa / Moda / Calzado', icon: '👗' },
  { id: 'restaurant', label: '🍽️ Restaurante / Gastronomía', icon: '🍽️' },
  { id: 'fast_food', label: '🍔 Comida Rápida / Delivery', icon: '🍔' },
  { id: 'pharmacy', label: '💊 Farmacia / Salud / Belleza', icon: '💊' },
  { id: 'services', label: '🔧 Servicios Profesionales / Reparaciones', icon: '🔧' },
  { id: 'other', label: '📦 Comercio General / Otro', icon: '📦' },
]

export default function BusinessProfilePage() {
  const [name, setName] = useState('')
  const [industry, setIndustry] = useState('technology')
  const [description, setDescription] = useState('')
  const [currency, setCurrency] = useState('CLP')
  const [currencySymbol, setCurrencySymbol] = useState('$')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [allowReservations, setAllowReservations] = useState(true)
  const [policies, setPolicies] = useState('')
  const [customPrompt, setCustomPrompt] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const res = await fetch('/api/admin/business')
        const data = await res.json()
        if (data.success && data.profile) {
          const p = data.profile
          setName(p.name || '')
          setIndustry(p.industry || 'technology')
          setDescription(p.description || '')
          setCurrency(p.currency || 'CLP')
          setCurrencySymbol(p.currencySymbol || '$')
          setPhone(p.phone || '')
          setAddress(p.address || '')
          setAllowReservations(p.allowReservations ?? true)
          setPolicies(p.policies || '')
          setCustomPrompt(p.customPrompt || '')
        }
      } catch (err) {
        console.error('Error cargando perfil:', err)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

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
      })

      if (res.ok) {
        setMessage('✅ Configuración de empresa guardada exitosamente')
      } else {
        setMessage('❌ Error al guardar configuración')
      }
    } catch (err) {
      console.error(err)
      setMessage('❌ Error de conexión')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>Cargando perfil...</div>
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '10px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', margin: 0 }}>
          🏢 Configuración de la Empresa (Multi-Rubro)
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>
          Personaliza los datos y el rubro de la empresa. La IA adoptará este perfil automáticamente para atender a los clientes.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            backgroundColor: message.includes('✅') ? '#dcfce7' : '#fee2e2',
            color: message.includes('✅') ? '#15803d' : '#b91c1c',
            fontSize: '14px',
            fontWeight: '600',
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSave} style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
        {/* Rubro Selector */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#334155', marginBottom: '8px' }}>
            Rubro del Negocio (Sector de Trabajo) *
          </label>
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
          >
            {INDUSTRIES.map((ind) => (
              <option key={ind.id} value={ind.id}>
                {ind.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'block' }}>
            Al cambiar el rubro, la IA adapta su vocabulario y comportamiento para ese sector comercial.
          </span>
        </div>

        {/* Nombre y Moneda */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
              Nombre Comercial *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej: Devlmer / Dysa Store"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
              Moneda
            </label>
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              placeholder="CLP / USD"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
              Símbolo
            </label>
            <input
              type="text"
              value={currencySymbol}
              onChange={(e) => setCurrencySymbol(e.target.value)}
              placeholder="$"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        {/* Contacto */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
              Teléfono de Contacto
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+56 9 6541 9765"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
              Dirección Física / Ubicación
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Av. Principal 123, Santiago"
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
            />
          </div>
        </div>

        {/* Descripción */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            Descripción de lo que vende la empresa
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Breve resumen de los productos o servicios ofrecidos..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* Políticas de Reserva y Despacho */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            Políticas de Despacho y Reserva
          </label>
          <textarea
            value={policies}
            onChange={(e) => setPolicies(e.target.value)}
            rows={2}
            placeholder="ej: Despacho gratis sobre $50.000. Reservas activas por 48 horas sin costo..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* Instrucciones Especiales para la IA */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '4px' }}>
            Instrucciones Personalizadas para el Bot (Prompt Adicional)
          </label>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            placeholder="Instrucciones específicas que el inquilino quiera darle a la IA (ej: 'Menciona siempre que tenemos 10% de descuento pagando por transferencia')..."
            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1' }}
          />
        </div>

        {/* Reservas Toggle */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
            <input
              type="checkbox"
              checked={allowReservations}
              onChange={(e) => setAllowReservations(e.target.checked)}
            />
            <span>Habilitar sistema de reservas / pedidos automáticos por WhatsApp</span>
          </label>
        </div>

        {/* Botón Guardar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#667eea',
              color: '#fff',
              padding: '10px 24px',
              borderRadius: '8px',
              border: 'none',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            {saving ? 'Guardando...' : 'Guardar Perfil de Empresa'}
          </button>
        </div>
      </form>
    </div>
  )
}
