'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SettingsContent() {
  const { data: session, update } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile state
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    company: 'PITHY',
    role: 'Administrador',
    timezone: 'America/Santiago',
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

  // Appearance state
  const [appearance, setAppearance] = useState({
    theme: 'dark',
    accentColor: '#667eea',
    fontSize: 'medium',
    compactMode: false,
  });

  useEffect(() => {
    const tab = searchParams?.get('tab');
    if (tab && ['profile', 'security', 'notifications', 'appearance'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    if (session?.user) {
      setProfile((prev) => ({
        ...prev,
        name: session.user?.name || '',
        email: session.user?.email || '',
      }));
    }
  }, [session]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        await update({ name: profile.name });
        showMessage('success', 'Perfil actualizado correctamente');
      } else {
        throw new Error('Error al guardar');
      }
    } catch (error) {
      showMessage('error', 'Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
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
        showMessage('success', 'Contraseña actualizada correctamente');
        setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Error al cambiar contraseña');
      }
    } catch (error: any) {
      showMessage('error', error.message || 'Error al cambiar la contraseña');
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
    } catch (error) {
      showMessage('error', 'Error al guardar las preferencias');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Mi Perfil', icon: '👤' },
    { id: 'security', label: 'Seguridad', icon: '🔒' },
    { id: 'notifications', label: 'Notificaciones', icon: '🔔' },
    { id: 'appearance', label: 'Apariencia', icon: '🎨' },
  ];

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <Link href="/admin" style={styles.backButton}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 style={styles.title}>Configuración</h1>
            <p style={styles.subtitle}>Administra tu cuenta y preferencias</p>
          </div>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div style={{
          ...styles.toast,
          background: message.type === 'success' ? '#22c55e' : '#ef4444',
        }}>
          {message.type === 'success' ? '✓' : '✕'} {message.text}
        </div>
      )}

      <div style={styles.content}>
        {/* Sidebar */}
        <div style={styles.sidebar}>
          <div style={styles.profileCard}>
            <div style={styles.avatarLarge}>
              {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <h3 style={styles.profileName}>{session?.user?.name || 'Admin'}</h3>
            <p style={styles.profileEmail}>{session?.user?.email || 'admin@pithy.cl'}</p>
            <span style={styles.roleBadge}>Administrador</span>
          </div>

          <nav style={styles.tabNav}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  ...styles.tabButton,
                  ...(activeTab === tab.id ? styles.tabButtonActive : {}),
                }}
              >
                <span style={styles.tabIcon}>{tab.icon}</span>
                <span>{tab.label}</span>
                {activeTab === tab.id && <div style={styles.tabIndicator} />}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div style={styles.main}>
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={styles.tabContent}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Información Personal</h2>
                <p style={styles.sectionDescription}>
                  Actualiza tu información de perfil y cómo apareces en el sistema.
                </p>

                <div style={styles.avatarSection}>
                  <div style={styles.avatarUpload}>
                    <div style={styles.avatarPreview}>
                      {session?.user?.name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                    <div style={styles.avatarActions}>
                      <button style={styles.uploadButton}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="17 8 12 3 7 8" />
                          <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                        Subir imagen
                      </button>
                      <button style={styles.removeButton}>Eliminar</button>
                    </div>
                  </div>
                  <p style={styles.avatarHint}>JPG, PNG o GIF. Máximo 2MB.</p>
                </div>

                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nombre completo</label>
                    <input
                      type="text"
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      style={styles.input}
                      placeholder="Tu nombre"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Correo electrónico</label>
                    <input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      style={styles.input}
                      placeholder="tu@email.com"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Teléfono</label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      style={styles.input}
                      placeholder="+56 9 1234 5678"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Empresa</label>
                    <input
                      type="text"
                      value={profile.company}
                      onChange={(e) => setProfile({ ...profile, company: e.target.value })}
                      style={styles.input}
                      placeholder="Nombre de la empresa"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Zona horaria</label>
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile({ ...profile, timezone: e.target.value })}
                      style={styles.select}
                    >
                      <option value="America/Santiago">Santiago (GMT-3)</option>
                      <option value="America/Lima">Lima (GMT-5)</option>
                      <option value="America/Bogota">Bogotá (GMT-5)</option>
                      <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                      <option value="America/Buenos_Aires">Buenos Aires (GMT-3)</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Idioma</label>
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile({ ...profile, language: e.target.value })}
                      style={styles.select}
                    >
                      <option value="es">Español</option>
                      <option value="en">English</option>
                      <option value="pt">Português</option>
                    </select>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button onClick={handleSaveProfile} disabled={saving} style={styles.saveButton}>
                    {saving ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div style={styles.tabContent}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Cambiar Contraseña</h2>
                <p style={styles.sectionDescription}>
                  Asegúrate de usar una contraseña segura que no uses en otros sitios.
                </p>

                <div style={styles.formStack}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Contraseña actual</label>
                    <input
                      type="password"
                      value={security.currentPassword}
                      onChange={(e) => setSecurity({ ...security, currentPassword: e.target.value })}
                      style={styles.input}
                      placeholder="••••••••"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Nueva contraseña</label>
                    <input
                      type="password"
                      value={security.newPassword}
                      onChange={(e) => setSecurity({ ...security, newPassword: e.target.value })}
                      style={styles.input}
                      placeholder="••••••••"
                    />
                    <p style={styles.hint}>Mínimo 8 caracteres, incluye mayúsculas y números.</p>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      value={security.confirmPassword}
                      onChange={(e) => setSecurity({ ...security, confirmPassword: e.target.value })}
                      style={styles.input}
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div style={styles.actions}>
                  <button onClick={handleChangePassword} disabled={saving} style={styles.saveButton}>
                    {saving ? 'Actualizando...' : 'Actualizar contraseña'}
                  </button>
                </div>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Sesiones Activas</h2>
                <p style={styles.sectionDescription}>
                  Dispositivos donde tu cuenta está activa actualmente.
                </p>

                <div style={styles.sessionList}>
                  <div style={styles.sessionItem}>
                    <div style={styles.sessionIcon}>💻</div>
                    <div style={styles.sessionInfo}>
                      <span style={styles.sessionDevice}>Windows - Chrome</span>
                      <span style={styles.sessionDetails}>Santiago, Chile • Activa ahora</span>
                    </div>
                    <span style={styles.currentBadge}>Sesión actual</span>
                  </div>
                </div>

                <button style={styles.dangerButton}>
                  Cerrar todas las otras sesiones
                </button>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Autenticación de dos factores</h2>
                <p style={styles.sectionDescription}>
                  Añade una capa extra de seguridad a tu cuenta.
                </p>

                <div style={styles.twoFactorBox}>
                  <div style={styles.twoFactorIcon}>🔐</div>
                  <div style={styles.twoFactorContent}>
                    <h4 style={styles.twoFactorTitle}>No configurado</h4>
                    <p style={styles.twoFactorDesc}>
                      Protege tu cuenta con autenticación de dos factores usando una app como Google Authenticator.
                    </p>
                  </div>
                  <button style={styles.enableButton}>Configurar</button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div style={styles.tabContent}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Notificaciones por Email</h2>
                <p style={styles.sectionDescription}>
                  Configura qué notificaciones recibes en tu correo.
                </p>

                <div style={styles.toggleList}>
                  <div style={styles.toggleItem}>
                    <div style={styles.toggleInfo}>
                      <span style={styles.toggleLabel}>Nuevos mensajes</span>
                      <span style={styles.toggleDesc}>Recibe un email cuando llegue un nuevo mensaje</span>
                    </div>
                    <button
                      style={{
                        ...styles.toggle,
                        background: notifications.emailNewMessage ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
                      }}
                      onClick={() => setNotifications({ ...notifications, emailNewMessage: !notifications.emailNewMessage })}
                    >
                      <div style={{
                        ...styles.toggleKnob,
                        transform: notifications.emailNewMessage ? 'translateX(18px)' : 'translateX(0)',
                      }} />
                    </button>
                  </div>

                  <div style={styles.toggleItem}>
                    <div style={styles.toggleInfo}>
                      <span style={styles.toggleLabel}>Reporte diario</span>
                      <span style={styles.toggleDesc}>Resumen diario de actividad del chatbot</span>
                    </div>
                    <button
                      style={{
                        ...styles.toggle,
                        background: notifications.emailDailyReport ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
                      }}
                      onClick={() => setNotifications({ ...notifications, emailDailyReport: !notifications.emailDailyReport })}
                    >
                      <div style={{
                        ...styles.toggleKnob,
                        transform: notifications.emailDailyReport ? 'translateX(18px)' : 'translateX(0)',
                      }} />
                    </button>
                  </div>
                </div>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Notificaciones Push</h2>
                <p style={styles.sectionDescription}>
                  Notificaciones en tiempo real en tu navegador.
                </p>

                <div style={styles.toggleList}>
                  <div style={styles.toggleItem}>
                    <div style={styles.toggleInfo}>
                      <span style={styles.toggleLabel}>Nuevos mensajes</span>
                      <span style={styles.toggleDesc}>Notificación push para mensajes entrantes</span>
                    </div>
                    <button
                      style={{
                        ...styles.toggle,
                        background: notifications.pushNewMessage ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
                      }}
                      onClick={() => setNotifications({ ...notifications, pushNewMessage: !notifications.pushNewMessage })}
                    >
                      <div style={{
                        ...styles.toggleKnob,
                        transform: notifications.pushNewMessage ? 'translateX(18px)' : 'translateX(0)',
                      }} />
                    </button>
                  </div>

                  <div style={styles.toggleItem}>
                    <div style={styles.toggleInfo}>
                      <span style={styles.toggleLabel}>Sonido de notificación</span>
                      <span style={styles.toggleDesc}>Reproducir sonido al recibir mensajes</span>
                    </div>
                    <button
                      style={{
                        ...styles.toggle,
                        background: notifications.soundEnabled ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
                      }}
                      onClick={() => setNotifications({ ...notifications, soundEnabled: !notifications.soundEnabled })}
                    >
                      <div style={{
                        ...styles.toggleKnob,
                        transform: notifications.soundEnabled ? 'translateX(18px)' : 'translateX(0)',
                      }} />
                    </button>
                  </div>

                  <div style={styles.toggleItem}>
                    <div style={styles.toggleInfo}>
                      <span style={styles.toggleLabel}>Notificaciones de escritorio</span>
                      <span style={styles.toggleDesc}>Mostrar notificaciones del sistema</span>
                    </div>
                    <button
                      style={{
                        ...styles.toggle,
                        background: notifications.desktopNotifications ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
                      }}
                      onClick={() => setNotifications({ ...notifications, desktopNotifications: !notifications.desktopNotifications })}
                    >
                      <div style={{
                        ...styles.toggleKnob,
                        transform: notifications.desktopNotifications ? 'translateX(18px)' : 'translateX(0)',
                      }} />
                    </button>
                  </div>
                </div>

                <div style={styles.actions}>
                  <button onClick={handleSaveNotifications} disabled={saving} style={styles.saveButton}>
                    {saving ? 'Guardando...' : 'Guardar preferencias'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Tab */}
          {activeTab === 'appearance' && (
            <div style={styles.tabContent}>
              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Tema</h2>
                <p style={styles.sectionDescription}>
                  Personaliza la apariencia del panel de administración.
                </p>

                <div style={styles.themeGrid}>
                  <button
                    style={{
                      ...styles.themeOption,
                      ...(appearance.theme === 'light' ? styles.themeOptionActive : {}),
                    }}
                    onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                  >
                    <div style={styles.themePreview}>
                      <div style={{ ...styles.themePreviewBox, background: '#ffffff' }}>
                        <div style={{ width: '60%', height: '8px', background: '#e2e8f0', borderRadius: '4px' }} />
                        <div style={{ width: '40%', height: '8px', background: '#e2e8f0', borderRadius: '4px', marginTop: '8px' }} />
                      </div>
                    </div>
                    <span style={styles.themeLabel}>Claro</span>
                  </button>

                  <button
                    style={{
                      ...styles.themeOption,
                      ...(appearance.theme === 'dark' ? styles.themeOptionActive : {}),
                    }}
                    onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                  >
                    <div style={styles.themePreview}>
                      <div style={{ ...styles.themePreviewBox, background: '#1e293b' }}>
                        <div style={{ width: '60%', height: '8px', background: '#334155', borderRadius: '4px' }} />
                        <div style={{ width: '40%', height: '8px', background: '#334155', borderRadius: '4px', marginTop: '8px' }} />
                      </div>
                    </div>
                    <span style={styles.themeLabel}>Oscuro</span>
                  </button>

                  <button
                    style={{
                      ...styles.themeOption,
                      ...(appearance.theme === 'system' ? styles.themeOptionActive : {}),
                    }}
                    onClick={() => setAppearance({ ...appearance, theme: 'system' })}
                  >
                    <div style={styles.themePreview}>
                      <div style={{ ...styles.themePreviewBox, background: 'linear-gradient(135deg, #ffffff 50%, #1e293b 50%)' }}>
                        <div style={{ width: '60%', height: '8px', background: 'rgba(128,128,128,0.3)', borderRadius: '4px' }} />
                        <div style={{ width: '40%', height: '8px', background: 'rgba(128,128,128,0.3)', borderRadius: '4px', marginTop: '8px' }} />
                      </div>
                    </div>
                    <span style={styles.themeLabel}>Sistema</span>
                  </button>
                </div>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Color de Acento</h2>
                <p style={styles.sectionDescription}>
                  Elige el color principal de la interfaz.
                </p>

                <div style={styles.colorGrid}>
                  {['#667eea', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'].map((color) => (
                    <button
                      key={color}
                      style={{
                        ...styles.colorOption,
                        background: color,
                        ...(appearance.accentColor === color ? styles.colorOptionActive : {}),
                      }}
                      onClick={() => setAppearance({ ...appearance, accentColor: color })}
                    >
                      {appearance.accentColor === color && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div style={styles.section}>
                <h2 style={styles.sectionTitle}>Densidad</h2>
                <p style={styles.sectionDescription}>
                  Ajusta el espaciado de la interfaz.
                </p>

                <div style={styles.densityOptions}>
                  {[
                    { id: 'compact', label: 'Compacto', desc: 'Más contenido, menos espacio' },
                    { id: 'medium', label: 'Normal', desc: 'Balance equilibrado' },
                    { id: 'comfortable', label: 'Espacioso', desc: 'Más espacio, mejor legibilidad' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      style={{
                        ...styles.densityOption,
                        ...(appearance.fontSize === option.id ? styles.densityOptionActive : {}),
                      }}
                      onClick={() => setAppearance({ ...appearance, fontSize: option.id })}
                    >
                      <span style={styles.densityLabel}>{option.label}</span>
                      <span style={styles.densityDesc}>{option.desc}</span>
                    </button>
                  ))}
                </div>
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0f172a', color: 'white' }}>
        Cargando configuración...
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    minHeight: '100vh',
    background: '#0f172a',
  },
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '24px 32px',
  },
  headerContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    background: 'rgba(148, 163, 184, 0.1)',
    color: '#94a3b8',
    textDecoration: 'none',
  },
  title: {
    color: '#f1f5f9',
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0,
  },
  subtitle: {
    color: '#64748b',
    fontSize: '14px',
    margin: '4px 0 0 0',
  },
  toast: {
    position: 'fixed',
    top: '100px',
    right: '24px',
    padding: '12px 20px',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: 2000,
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
  },
  content: {
    display: 'flex',
    gap: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '32px',
  },
  sidebar: {
    width: '280px',
    flexShrink: 0,
  },
  profileCard: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderRadius: '16px',
    padding: '24px',
    textAlign: 'center',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    marginBottom: '24px',
  },
  avatarLarge: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 auto 16px',
  },
  profileName: {
    color: '#f1f5f9',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  profileEmail: {
    color: '#64748b',
    fontSize: '13px',
    margin: '0 0 12px 0',
  },
  roleBadge: {
    display: 'inline-block',
    padding: '4px 12px',
    borderRadius: '20px',
    background: 'rgba(102, 126, 234, 0.2)',
    color: '#667eea',
    fontSize: '12px',
    fontWeight: '500',
  },
  tabNav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 16px',
    borderRadius: '10px',
    border: 'none',
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    textAlign: 'left',
    position: 'relative',
    transition: 'all 0.2s',
  },
  tabButtonActive: {
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
  },
  tabIcon: {
    fontSize: '18px',
  },
  tabIndicator: {
    position: 'absolute',
    left: 0,
    top: '50%',
    transform: 'translateY(-50%)',
    width: '3px',
    height: '24px',
    background: '#667eea',
    borderRadius: '0 3px 3px 0',
  },
  main: {
    flex: 1,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },
  section: {
    background: '#1e293b',
    borderRadius: '16px',
    padding: '24px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  },
  sectionTitle: {
    color: '#f1f5f9',
    fontSize: '18px',
    fontWeight: '600',
    margin: '0 0 8px 0',
  },
  sectionDescription: {
    color: '#64748b',
    fontSize: '14px',
    margin: '0 0 24px 0',
  },
  avatarSection: {
    marginBottom: '24px',
  },
  avatarUpload: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  avatarPreview: {
    width: '72px',
    height: '72px',
    borderRadius: '16px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '28px',
    fontWeight: 'bold',
  },
  avatarActions: {
    display: 'flex',
    gap: '8px',
  },
  uploadButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'transparent',
    color: '#f1f5f9',
    fontSize: '13px',
    cursor: 'pointer',
  },
  removeButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    background: 'transparent',
    color: '#ef4444',
    fontSize: '13px',
    cursor: 'pointer',
  },
  avatarHint: {
    color: '#64748b',
    fontSize: '12px',
    marginTop: '8px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '20px',
  },
  formStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '400px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    color: '#e2e8f0',
    fontSize: '13px',
    fontWeight: '500',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(15, 23, 42, 0.5)',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  select: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(15, 23, 42, 0.5)',
    color: '#f1f5f9',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer',
  },
  hint: {
    color: '#64748b',
    fontSize: '12px',
    margin: 0,
  },
  actions: {
    marginTop: '24px',
    paddingTop: '24px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
  },
  saveButton: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'opacity 0.2s',
  },
  sessionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '16px',
  },
  sessionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.5)',
  },
  sessionIcon: {
    fontSize: '24px',
  },
  sessionInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  sessionDevice: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '500',
  },
  sessionDetails: {
    color: '#64748b',
    fontSize: '12px',
  },
  currentBadge: {
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'rgba(34, 197, 94, 0.2)',
    color: '#22c55e',
    fontSize: '11px',
    fontWeight: '500',
  },
  dangerButton: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    background: 'transparent',
    color: '#ef4444',
    fontSize: '13px',
    cursor: 'pointer',
  },
  twoFactorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    padding: '20px',
    borderRadius: '12px',
    background: 'rgba(15, 23, 42, 0.5)',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  },
  twoFactorIcon: {
    fontSize: '32px',
  },
  twoFactorContent: {
    flex: 1,
  },
  twoFactorTitle: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
    margin: '0 0 4px 0',
  },
  twoFactorDesc: {
    color: '#64748b',
    fontSize: '13px',
    margin: 0,
  },
  enableButton: {
    padding: '10px 20px',
    borderRadius: '8px',
    border: 'none',
    background: 'rgba(102, 126, 234, 0.2)',
    color: '#667eea',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
  },
  toggleList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  toggleItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.5)',
  },
  toggleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  toggleLabel: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '500',
  },
  toggleDesc: {
    color: '#64748b',
    fontSize: '12px',
  },
  toggle: {
    width: '44px',
    height: '26px',
    borderRadius: '13px',
    border: 'none',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background 0.2s',
  },
  toggleKnob: {
    position: 'absolute',
    top: '3px',
    left: '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.2s',
  },
  themeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  themeOption: {
    padding: '16px',
    borderRadius: '12px',
    border: '2px solid rgba(148, 163, 184, 0.1)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  themeOptionActive: {
    borderColor: '#667eea',
    background: 'rgba(102, 126, 234, 0.1)',
  },
  themePreview: {
    marginBottom: '12px',
  },
  themePreviewBox: {
    height: '60px',
    borderRadius: '8px',
    padding: '12px',
  },
  themeLabel: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '500',
  },
  colorGrid: {
    display: 'flex',
    gap: '12px',
  },
  colorOption: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: '3px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s',
  },
  colorOptionActive: {
    borderColor: 'white',
    boxShadow: '0 0 0 2px rgba(255,255,255,0.2)',
  },
  densityOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  densityOption: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: '16px',
    borderRadius: '10px',
    border: '2px solid rgba(148, 163, 184, 0.1)',
    background: 'transparent',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  densityOptionActive: {
    borderColor: '#667eea',
    background: 'rgba(102, 126, 234, 0.1)',
  },
  densityLabel: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '500',
  },
  densityDesc: {
    color: '#64748b',
    fontSize: '12px',
  },
};
