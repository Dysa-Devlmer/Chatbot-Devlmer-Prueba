"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Plus, Clock, CheckCircle, AlertCircle, XCircle, Trash2, X, Send } from 'lucide-react';

interface ScheduledMessage {
  id: string;
  phoneNumber: string;
  content: string;
  scheduledFor: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  userName?: string;
  createdAt: string;
  sentAt?: string;
}

interface Stats {
  total: number;
  pending: number;
  sent: number;
  failed: number;
  cancelled: number;
}

export default function ScheduledMessagesPage() {
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [formPhoneNumber, setFormPhoneNumber] = useState('');
  const [formUserName, setFormUserName] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formDate, setFormDate] = useState('');
  const [formTime, setFormTime] = useState('');

  useEffect(() => {
    fetchMessages();
  }, [filterStatus]);

  const fetchMessages = async () => {
    try {
      let url = '/api/admin/scheduled';
      if (filterStatus !== 'all') {
        url += `?status=${filterStatus}`;
      }
      const response = await fetch(url);
      const data = await response.json();
      setMessages(data.scheduledMessages || []);
      setStats(data.stats || null);
    } catch (error) {
      console.error('Error fetching scheduled messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const createMessage = async () => {
    if (!formPhoneNumber || !formContent || !formDate || !formTime) {
      alert('Todos los campos son requeridos');
      return;
    }

    const scheduledFor = new Date(`${formDate}T${formTime}`);
    if (scheduledFor <= new Date()) {
      alert('La fecha debe ser en el futuro');
      return;
    }

    try {
      const response = await fetch('/api/admin/scheduled', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formPhoneNumber,
          userName: formUserName || null,
          content: formContent,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      if (response.ok) {
        await fetchMessages();
        resetForm();
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Error creating scheduled message:', error);
    }
  };

  const cancelMessage = async (id: string) => {
    if (!confirm('¿Estás seguro de cancelar este mensaje programado?')) return;

    try {
      const response = await fetch(`/api/admin/scheduled?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchMessages();
      }
    } catch (error) {
      console.error('Error cancelling message:', error);
    }
  };

  const resetForm = () => {
    setFormPhoneNumber('');
    setFormUserName('');
    setFormContent('');
    setFormDate('');
    setFormTime('');
  };

  const getStatusBadge = (status: ScheduledMessage['status']) => {
    const config = {
      pending: { label: 'Pendiente', bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800' },
      sent: { label: 'Enviado', bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800' },
      failed: { label: 'Fallido', bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-800' },
      cancelled: { label: 'Cancelado', bg: 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700' },
    }[status];

    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-stone-500 dark:text-stone-400">Cargando mensajes programados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="w-10 h-10 rounded-2xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 flex items-center justify-center text-stone-700 dark:text-stone-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">Automatización & Marketing</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span>Mensajes Programados</span>
            </h1>
          </div>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Programar Mensaje</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-stone-400 mb-1">Total Programados</div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">{stats?.total || 0}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-amber-500 mb-1">Pendientes</div>
          <div className="text-3xl font-black text-amber-600 dark:text-amber-400">{stats?.pending || 0}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-emerald-500 mb-1">Enviados</div>
          <div className="text-3xl font-black text-emerald-600 dark:text-emerald-400">{stats?.sent || 0}</div>
        </div>
        <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold uppercase text-rose-500 mb-1">Fallidos</div>
          <div className="text-3xl font-black text-rose-600 dark:text-rose-400">{stats?.failed || 0}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: 'all', label: 'Todos' },
          { id: 'pending', label: 'Pendientes' },
          { id: 'sent', label: 'Enviados' },
          { id: 'failed', label: 'Fallidos' },
          { id: 'cancelled', label: 'Cancelados' },
        ].map((f) => (
          <button
            key={f.id}
            onClick={() => setFilterStatus(f.id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              filterStatus === f.id
                ? 'bg-orange-600 text-white shadow-sm'
                : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl overflow-hidden shadow-sm">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-stone-400 text-sm">
            No hay mensajes programados en esta categoría.
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-stone-800">
            {messages.map((m) => (
              <div key={m.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-stone-50 dark:hover:bg-stone-850 transition-colors">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5">
                    {getStatusBadge(m.status)}
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {m.userName || 'Cliente'} ({m.phoneNumber})
                    </span>
                    <span className="text-xs text-stone-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(m.scheduledFor).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm text-stone-600 dark:text-stone-300 font-medium">
                    {m.content}
                  </p>
                </div>

                {m.status === 'pending' && (
                  <button
                    onClick={() => cancelMessage(m.id)}
                    className="self-end sm:self-center px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Cancelar</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Programar */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                Programar Mensaje WhatsApp
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="w-8 h-8 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-500 hover:text-stone-900 dark:hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Número de WhatsApp *</label>
                <input
                  type="text"
                  value={formPhoneNumber}
                  onChange={(e) => setFormPhoneNumber(e.target.value)}
                  placeholder="Ej: 51999888777"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Nombre Destinatario (Opcional)</label>
                <input
                  type="text"
                  value={formUserName}
                  onChange={(e) => setFormUserName(e.target.value)}
                  placeholder="Ej: Carlos Mendoza"
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Fecha *</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Hora *</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-stone-400 uppercase mb-1">Mensaje *</label>
                <textarea
                  rows={4}
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Escribe el mensaje que se enviará automáticamente..."
                  className="w-full px-4 py-2.5 rounded-xl border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2.5 rounded-xl text-stone-600 dark:text-stone-300 font-semibold text-sm hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={createMessage}
                className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all active:scale-95"
              >
                Confirmar Envío
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
