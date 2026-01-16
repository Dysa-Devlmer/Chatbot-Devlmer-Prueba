"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  const [editingMessage, setEditingMessage] = useState<ScheduledMessage | null>(null);
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
          userName: formUserName || undefined,
          content: formContent,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      if (response.ok) {
        await fetchMessages();
        resetForm();
        setShowCreateModal(false);
      } else {
        const data = await response.json();
        alert(data.error || 'Error al crear mensaje');
      }
    } catch (error) {
      console.error('Error creating message:', error);
      alert('Error de conexión');
    }
  };

  const updateMessage = async () => {
    if (!editingMessage || !formContent || !formDate || !formTime) return;

    const scheduledFor = new Date(`${formDate}T${formTime}`);

    try {
      const response = await fetch('/api/admin/scheduled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingMessage.id,
          content: formContent,
          scheduledFor: scheduledFor.toISOString(),
        }),
      });

      if (response.ok) {
        await fetchMessages();
        resetForm();
        setEditingMessage(null);
      }
    } catch (error) {
      console.error('Error updating message:', error);
    }
  };

  const cancelMessage = async (id: string) => {
    if (!confirm('¿Cancelar este mensaje programado?')) return;

    try {
      await fetch('/api/admin/scheduled', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: 'cancelled' }),
      });
      await fetchMessages();
    } catch (error) {
      console.error('Error cancelling message:', error);
    }
  };

  const deleteMessage = async (id: string) => {
    if (!confirm('¿Eliminar permanentemente este mensaje?')) return;

    try {
      await fetch(`/api/admin/scheduled?id=${id}`, { method: 'DELETE' });
      await fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  };

  const resetForm = () => {
    setFormPhoneNumber('');
    setFormUserName('');
    setFormContent('');
    setFormDate('');
    setFormTime('');
  };

  const openEditModal = (msg: ScheduledMessage) => {
    setEditingMessage(msg);
    setFormPhoneNumber(msg.phoneNumber);
    setFormUserName(msg.userName || '');
    setFormContent(msg.content);
    const date = new Date(msg.scheduledFor);
    setFormDate(date.toISOString().split('T')[0]);
    setFormTime(date.toTimeString().slice(0, 5));
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('es-CL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; label: string }> = {
      pending: { bg: '#FFA500', text: 'white', label: '⏳ Pendiente' },
      sent: { bg: '#25D366', text: 'white', label: '✅ Enviado' },
      completed: { bg: '#25D366', text: 'white', label: '✅ Enviado' },
      failed: { bg: '#FF4444', text: 'white', label: '❌ Fallido' },
      cancelled: { bg: '#6C757D', text: 'white', label: '🚫 Cancelado' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span
        style={{
          background: style.bg,
          color: style.text,
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: '500',
        }}
      >
        {style.label}
      </span>
    );
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  if (loading) {
    return (
      <div style={pageStyles.loadingContainer}>
        <div style={{ fontSize: '20px', color: '#666' }}>Cargando mensajes programados...</div>
      </div>
    );
  }

  return (
    <div style={pageStyles.container}>
      {/* Header */}
      <div style={pageStyles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            <span style={{ cursor: 'pointer' }}>←</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📅 Mensajes Programados</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)} style={pageStyles.createBtn}>
          + Programar Mensaje
        </button>
      </div>

      {/* Stats */}
      <div style={pageStyles.statsRow}>
        <div style={pageStyles.statCard}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#667eea' }}>{stats?.total || 0}</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Total</div>
        </div>
        <div style={pageStyles.statCard}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FFA500' }}>{stats?.pending || 0}</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Pendientes</div>
        </div>
        <div style={pageStyles.statCard}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#25D366' }}>{stats?.sent || 0}</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Enviados</div>
        </div>
        <div style={pageStyles.statCard}>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#FF4444' }}>{stats?.failed || 0}</div>
          <div style={{ color: '#666', fontSize: '14px' }}>Fallidos</div>
        </div>
      </div>

      {/* Filter */}
      <div style={pageStyles.filterRow}>
        {['all', 'pending', 'sent', 'failed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{
              ...pageStyles.filterBtn,
              background: filterStatus === status ? '#667eea' : 'white',
              color: filterStatus === status ? 'white' : '#333',
            }}
          >
            {status === 'all' ? 'Todos' :
             status === 'pending' ? '⏳ Pendientes' :
             status === 'sent' ? '✅ Enviados' :
             status === 'failed' ? '❌ Fallidos' : '🚫 Cancelados'}
          </button>
        ))}
      </div>

      {/* Messages List */}
      <div style={pageStyles.messagesList}>
        {messages.length === 0 ? (
          <div style={pageStyles.emptyState}>
            <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
            <div style={{ fontSize: '18px', color: '#666' }}>No hay mensajes programados</div>
            <button
              onClick={() => setShowCreateModal(true)}
              style={{ ...pageStyles.createBtn, marginTop: '20px' }}
            >
              + Programar Primer Mensaje
            </button>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} style={pageStyles.messageCard}>
              <div style={pageStyles.messageHeader}>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '16px' }}>
                    {msg.userName || msg.phoneNumber}
                  </div>
                  <div style={{ color: '#666', fontSize: '13px' }}>{msg.phoneNumber}</div>
                </div>
                {getStatusBadge(msg.status)}
              </div>

              <div style={pageStyles.messageContent}>{msg.content}</div>

              <div style={pageStyles.messageFooter}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  <span style={{ color: '#666', fontSize: '13px' }}>
                    📅 {formatDateTime(msg.scheduledFor)}
                  </span>
                  <span style={{ color: '#888', fontSize: '12px' }}>
                    Creado: {formatDateTime(msg.createdAt)}
                  </span>
                </div>

                {msg.status === 'pending' && (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      onClick={() => openEditModal(msg)}
                      style={pageStyles.actionBtn}
                      title="Editar"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => cancelMessage(msg.id)}
                      style={pageStyles.actionBtn}
                      title="Cancelar"
                    >
                      🚫
                    </button>
                    <button
                      onClick={() => deleteMessage(msg.id)}
                      style={{ ...pageStyles.actionBtn, color: '#FF4444' }}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                )}

                {(msg.status === 'cancelled' || msg.status === 'failed') && (
                  <button
                    onClick={() => deleteMessage(msg.id)}
                    style={{ ...pageStyles.actionBtn, color: '#FF4444' }}
                    title="Eliminar"
                  >
                    🗑️
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingMessage) && (
        <div style={pageStyles.modalOverlay}>
          <div style={pageStyles.modal}>
            <h2 style={{ margin: '0 0 20px 0' }}>
              {editingMessage ? '✏️ Editar Mensaje' : '📅 Programar Mensaje'}
            </h2>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Número de teléfono *</label>
              <input
                type="tel"
                value={formPhoneNumber}
                onChange={(e) => setFormPhoneNumber(e.target.value)}
                placeholder="+56912345678"
                style={pageStyles.input}
                disabled={!!editingMessage}
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Nombre (opcional)</label>
              <input
                type="text"
                value={formUserName}
                onChange={(e) => setFormUserName(e.target.value)}
                placeholder="Nombre del contacto"
                style={pageStyles.input}
                disabled={!!editingMessage}
              />
            </div>

            <div style={pageStyles.formGroup}>
              <label style={pageStyles.label}>Mensaje *</label>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder="Escribe tu mensaje..."
                style={pageStyles.textarea}
                rows={4}
              />
              <div style={{ fontSize: '12px', color: '#888', marginTop: '5px' }}>
                {formContent.length} caracteres
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Fecha *</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={pageStyles.input}
                />
              </div>

              <div style={pageStyles.formGroup}>
                <label style={pageStyles.label}>Hora *</label>
                <input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  style={pageStyles.input}
                />
              </div>
            </div>

            {formDate && formTime && (
              <div style={pageStyles.previewDate}>
                📅 Se enviará: {formatDateTime(`${formDate}T${formTime}`)}
              </div>
            )}

            <div style={pageStyles.modalActions}>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingMessage(null);
                  resetForm();
                }}
                style={pageStyles.cancelBtn}
              >
                Cancelar
              </button>
              <button
                onClick={editingMessage ? updateMessage : createMessage}
                disabled={!formPhoneNumber || !formContent || !formDate || !formTime}
                style={{
                  ...pageStyles.saveBtn,
                  opacity: formPhoneNumber && formContent && formDate && formTime ? 1 : 0.5,
                }}
              >
                {editingMessage ? 'Guardar Cambios' : 'Programar Mensaje'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div style={pageStyles.infoSection}>
        <h3 style={{ margin: '0 0 15px 0' }}>💡 Información</h3>
        <ul style={{ margin: 0, padding: '0 0 0 20px', color: '#666', lineHeight: '1.8' }}>
          <li>Los mensajes programados se enviarán automáticamente a la hora especificada.</li>
          <li>Solo puedes editar o cancelar mensajes que aún están pendientes.</li>
          <li>Asegúrate de que el número incluya el código de país (ej: +56).</li>
          <li>El sistema verificará cada minuto si hay mensajes para enviar.</li>
        </ul>
      </div>
    </div>
  );
}

const pageStyles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: '#f0f2f5',
    padding: '20px',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f0f2f5',
  },
  header: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    padding: '20px 30px',
    borderRadius: '12px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'background 0.2s',
  },
  statsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '15px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  filterRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
    flexWrap: 'wrap',
  },
  filterBtn: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  messagesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
    marginBottom: '20px',
  },
  emptyState: {
    background: 'white',
    borderRadius: '12px',
    padding: '60px 40px',
    textAlign: 'center',
  },
  messageCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  messageHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '15px',
  },
  messageContent: {
    background: '#f8f9fa',
    padding: '15px',
    borderRadius: '8px',
    marginBottom: '15px',
    fontSize: '14px',
    lineHeight: '1.5',
    whiteSpace: 'pre-wrap',
  },
  messageFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionBtn: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '5px 10px',
    borderRadius: '5px',
    transition: 'background 0.2s',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: 'white',
    borderRadius: '16px',
    padding: '30px',
    width: '500px',
    maxWidth: '90vw',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  input: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    padding: '12px 15px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  previewDate: {
    background: '#f0fdf4',
    border: '1px solid #25D366',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    color: '#333',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
  cancelBtn: {
    padding: '12px 24px',
    background: '#f0f2f5',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  saveBtn: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  infoSection: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
  },
};
