"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Stats {
  totalConversations: number;
  activeConversations: number;
  totalUsers: number;
  totalMessages: number;
  unreadConversations: number;
  messagesToday: number;
  autoModeCount: number;
  manualModeCount: number;
  messagesByHour: Record<string, number>;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    // Actualizar cada 30 segundos
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/stats');
      const data = await response.json();
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div suppressHydrationWarning style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}>
        <div suppressHydrationWarning style={{ color: 'white', fontSize: '20px' }}>⏳ Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div suppressHydrationWarning style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          padding: '30px',
          marginBottom: '20px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        }}>
          <h1 style={{ margin: 0, fontSize: '32px', color: '#333' }}>
            🎛️ Panel de Administración - PITHY
          </h1>
          <p style={{ margin: '10px 0 0 0', color: '#666' }}>
            Gestiona tus conversaciones de WhatsApp en tiempo real
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '20px',
          marginBottom: '20px',
        }}>
          <StatCard
            icon="💬"
            title="Conversaciones Totales"
            value={stats?.totalConversations || 0}
            color="#667eea"
          />
          <StatCard
            icon="🟢"
            title="Conversaciones Activas"
            value={stats?.activeConversations || 0}
            color="#25D366"
          />
          <StatCard
            icon="👥"
            title="Total Usuarios"
            value={stats?.totalUsers || 0}
            color="#764ba2"
          />
          <StatCard
            icon="📨"
            title="Mensajes de Hoy"
            value={stats?.messagesToday || 0}
            color="#FF6B6B"
          />
          <StatCard
            icon="🔴"
            title="No Leídos"
            value={stats?.unreadConversations || 0}
            color="#FFA500"
            highlight={true}
          />
          <StatCard
            icon="🤖"
            title="Modo Automático"
            value={stats?.autoModeCount || 0}
            color="#4ECDC4"
          />
          <StatCard
            icon="👤"
            title="Modo Manual"
            value={stats?.manualModeCount || 0}
            color="#95E1D3"
          />
          <StatCard
            icon="📊"
            title="Total Mensajes"
            value={stats?.totalMessages || 0}
            color="#6C5CE7"
          />
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
        }}>
          <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📊</div>
              <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Analytics Dashboard</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                Estadísticas avanzadas y gráficos en tiempo real
              </p>
            </div>
          </Link>

          <Link href="/admin/inbox" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📥</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Bandeja de Mensajes</h3>
              <p style={{ margin: 0, color: '#666' }}>
                Ver y responder conversaciones en tiempo real
              </p>
            </div>
          </Link>

          <Link href="/admin/inbox?mode=manual" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>👤</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Modo Manual</h3>
              <p style={{ margin: 0, color: '#666' }}>
                Conversaciones que requieren atención personal
              </p>
            </div>
          </Link>

          <Link href="/admin/inbox?unread=true" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🔔</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>No Leídos</h3>
              <p style={{ margin: 0, color: '#666' }}>
                Mensajes pendientes de revisar
              </p>
            </div>
          </Link>

          <Link href="/admin/tags" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🏷️</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Etiquetas</h3>
              <p style={{ margin: 0, color: '#666' }}>
                Organiza conversaciones con tags personalizados
              </p>
            </div>
          </Link>

          <Link href="/admin/ai" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #4ECDC4 0%, #25D366 100%)',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              color: 'white',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>🤖</div>
              <h3 style={{ margin: '0 0 10px 0', color: 'white' }}>Configuración IA</h3>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.9)' }}>
                Ajusta el modelo, temperatura y características de IA
              </p>
            </div>
          </Link>

          <Link href="/admin/scheduled" style={{ textDecoration: 'none' }}>
            <div style={{
              background: 'white',
              borderRadius: '12px',
              padding: '30px',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-5px)';
              e.currentTarget.style.boxShadow = '0 8px 12px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
            }}>
              <div style={{ fontSize: '48px', marginBottom: '15px' }}>📅</div>
              <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Mensajes Programados</h3>
              <p style={{ margin: 0, color: '#666' }}>
                Programa mensajes para enviar automáticamente
              </p>
            </div>
          </Link>
        </div>

        {/* System Info */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '20px',
          marginTop: '20px',
          color: 'white',
        }}>
          <h3 style={{ margin: '0 0 10px 0' }}>ℹ️ Información del Sistema</h3>
          <ul style={{ margin: 0, padding: '0 0 0 20px' }}>
            <li>Actualización automática cada 30 segundos</li>
            <li>Chatbot PITHY creado por Ulmer Solier para Devlmer Project CL</li>
            <li>WhatsApp Business API integrado</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color, highlight }: {
  icon: string;
  title: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div style={{
      background: highlight ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)` : 'white',
      borderRadius: '12px',
      padding: '25px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s',
      cursor: 'default',
      color: highlight ? 'white' : '#333',
    }}
    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
      <div style={{ fontSize: '36px', marginBottom: '10px' }}>{icon}</div>
      <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '5px' }}>
        {value.toLocaleString()}
      </div>
      <div style={{
        fontSize: '14px',
        opacity: 0.8,
        color: highlight ? 'white' : '#666',
      }}>
        {title}
      </div>
    </div>
  );
}
