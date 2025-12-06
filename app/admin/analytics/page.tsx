"use client";

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';

interface AnalyticsData {
  overview: {
    totalConversations: number;
    activeConversations: number;
    totalUsers: number;
    totalMessages: number;
    unreadConversations: number;
    avgResponseTime: number;
    satisfactionScore: number;
  };
  trends: {
    conversationsChange: number;
    messagesChange: number;
    usersChange: number;
    responseTimeChange: number;
  };
  messagesByHour: Array<{ hour: number; count: number; label: string }>;
  messagesByDay: Array<{ date: string; count: number; dayName: string }>;
  sentimentDistribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  topUsers: Array<{
    id: string;
    name: string;
    phoneNumber: string;
    messageCount: number;
    lastContact: Date;
  }>;
  peakHours: Array<{ hour: number; avgMessages: number }>;
  botPerformance: {
    botMessages: number;
    humanMessages: number;
    botPercentage: number;
    avgBotResponseTime: number;
    avgHumanResponseTime: number;
  };
  conversationsByStatus: {
    active: number;
    closed: number;
    pending: number;
  };
  topIntents: Array<{ intent: string; count: number; percentage: number }>;
}

type Period = '24h' | '7d' | '30d';

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>('7d');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchAnalytics = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/analytics?period=${period}`);
      const data = await response.json();
      setAnalytics(data.analytics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Cargando analytics...</p>
        </div>
      </div>
    );
  }

  const maxHourCount = Math.max(...(analytics?.messagesByHour.map(h => h.count) || [1]));
  const maxDayCount = Math.max(...(analytics?.messagesByDay.map(d => d.count) || [1]));

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <Link href="/admin" style={styles.backLink}>← Volver</Link>
          <h1 style={styles.title}>📊 Analytics Dashboard</h1>
          <p style={styles.subtitle}>
            Última actualización: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div style={styles.periodSelector}>
          {(['24h', '7d', '30d'] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => { setPeriod(p); setLoading(true); }}
              style={{
                ...styles.periodButton,
                ...(period === p ? styles.periodButtonActive : {}),
              }}
            >
              {p === '24h' ? '24 Horas' : p === '7d' ? '7 Días' : '30 Días'}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={styles.kpiGrid}>
        <KPICard
          icon="💬"
          title="Total Conversaciones"
          value={analytics?.overview.totalConversations || 0}
          trend={analytics?.trends.conversationsChange || 0}
          color="#667eea"
        />
        <KPICard
          icon="📨"
          title="Total Mensajes"
          value={analytics?.overview.totalMessages || 0}
          trend={analytics?.trends.messagesChange || 0}
          color="#764ba2"
        />
        <KPICard
          icon="👥"
          title="Usuarios"
          value={analytics?.overview.totalUsers || 0}
          trend={analytics?.trends.usersChange || 0}
          color="#25D366"
        />
        <KPICard
          icon="⏱️"
          title="Tiempo Respuesta"
          value={`${analytics?.overview.avgResponseTime || 0}s`}
          trend={analytics?.trends.responseTimeChange || 0}
          color="#FF6B6B"
          invertTrend
        />
        <KPICard
          icon="😊"
          title="Satisfacción"
          value={`${analytics?.overview.satisfactionScore || 0}%`}
          color="#4ECDC4"
        />
        <KPICard
          icon="🔴"
          title="Sin Leer"
          value={analytics?.overview.unreadConversations || 0}
          color="#FFA500"
          highlight
        />
      </div>

      {/* Charts Row 1 */}
      <div style={styles.chartsRow}>
        {/* Mensajes por Hora */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📈 Mensajes por Hora (24h)</h3>
          <div style={styles.barChart}>
            {analytics?.messagesByHour.map((item) => (
              <div key={item.hour} style={styles.barContainer}>
                <div
                  style={{
                    ...styles.bar,
                    height: `${maxHourCount > 0 ? (item.count / maxHourCount) * 100 : 0}%`,
                    background: item.count > 0
                      ? `linear-gradient(180deg, #667eea 0%, #764ba2 100%)`
                      : '#e0e0e0',
                  }}
                >
                  {item.count > 0 && (
                    <span style={styles.barValue}>{item.count}</span>
                  )}
                </div>
                <span style={styles.barLabel}>{item.hour}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Mensajes por Día */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>📅 Mensajes por Día (7d)</h3>
          <div style={styles.dayChart}>
            {analytics?.messagesByDay.map((item, index) => (
              <div key={index} style={styles.dayBarContainer}>
                <div style={styles.dayBarWrapper}>
                  <span style={styles.dayBarValue}>{item.count}</span>
                  <div
                    style={{
                      ...styles.dayBar,
                      height: `${maxDayCount > 0 ? (item.count / maxDayCount) * 100 : 0}%`,
                    }}
                  />
                </div>
                <span style={styles.dayBarLabel}>{item.dayName}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={styles.chartsRow}>
        {/* Distribución de Sentimiento */}
        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>😊 Sentimiento</h3>
          <div style={styles.sentimentContainer}>
            <div style={styles.sentimentRow}>
              <span style={styles.sentimentLabel}>😊 Positivo</span>
              <div style={styles.sentimentBarContainer}>
                <div
                  style={{
                    ...styles.sentimentBar,
                    width: `${analytics?.sentimentDistribution.positive || 0}%`,
                    background: '#4ECDC4',
                  }}
                />
              </div>
              <span style={styles.sentimentValue}>
                {analytics?.sentimentDistribution.positive || 0}%
              </span>
            </div>
            <div style={styles.sentimentRow}>
              <span style={styles.sentimentLabel}>😐 Neutral</span>
              <div style={styles.sentimentBarContainer}>
                <div
                  style={{
                    ...styles.sentimentBar,
                    width: `${analytics?.sentimentDistribution.neutral || 0}%`,
                    background: '#FFD93D',
                  }}
                />
              </div>
              <span style={styles.sentimentValue}>
                {analytics?.sentimentDistribution.neutral || 0}%
              </span>
            </div>
            <div style={styles.sentimentRow}>
              <span style={styles.sentimentLabel}>😞 Negativo</span>
              <div style={styles.sentimentBarContainer}>
                <div
                  style={{
                    ...styles.sentimentBar,
                    width: `${analytics?.sentimentDistribution.negative || 0}%`,
                    background: '#FF6B6B',
                  }}
                />
              </div>
              <span style={styles.sentimentValue}>
                {analytics?.sentimentDistribution.negative || 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Bot vs Human Performance */}
        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>🤖 Bot vs Humano</h3>
          <div style={styles.performanceContainer}>
            <div style={styles.performanceCircle}>
              <svg width="120" height="120" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#e0e0e0"
                  strokeWidth="10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="#667eea"
                  strokeWidth="10"
                  strokeDasharray={`${(analytics?.botPerformance.botPercentage || 0) * 3.14} 314`}
                  strokeLinecap="round"
                  transform="rotate(-90 60 60)"
                />
                <text
                  x="60"
                  y="55"
                  textAnchor="middle"
                  style={{ fontSize: '24px', fontWeight: 'bold', fill: '#333' }}
                >
                  {analytics?.botPerformance.botPercentage || 0}%
                </text>
                <text
                  x="60"
                  y="75"
                  textAnchor="middle"
                  style={{ fontSize: '12px', fill: '#666' }}
                >
                  Bot
                </text>
              </svg>
            </div>
            <div style={styles.performanceStats}>
              <div style={styles.performanceStat}>
                <span style={styles.performanceIcon}>🤖</span>
                <span>{analytics?.botPerformance.botMessages || 0} msgs</span>
              </div>
              <div style={styles.performanceStat}>
                <span style={styles.performanceIcon}>👤</span>
                <span>{analytics?.botPerformance.humanMessages || 0} msgs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Top Intenciones */}
        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>🎯 Top Intenciones</h3>
          <div style={styles.intentsList}>
            {analytics?.topIntents.length ? (
              analytics.topIntents.map((intent, index) => (
                <div key={index} style={styles.intentRow}>
                  <span style={styles.intentName}>
                    {getIntentEmoji(intent.intent)} {intent.intent}
                  </span>
                  <div style={styles.intentBarContainer}>
                    <div
                      style={{
                        ...styles.intentBar,
                        width: `${intent.percentage}%`,
                      }}
                    />
                  </div>
                  <span style={styles.intentValue}>{intent.percentage}%</span>
                </div>
              ))
            ) : (
              <p style={styles.noData}>Sin datos aún</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Users & Peak Hours */}
      <div style={styles.chartsRow}>
        {/* Top Usuarios */}
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>👥 Top Usuarios</h3>
          <div style={styles.usersList}>
            {analytics?.topUsers.slice(0, 5).map((user, index) => (
              <div key={user.id} style={styles.userRow}>
                <div style={styles.userRank}>#{index + 1}</div>
                <div style={styles.userInfo}>
                  <span style={styles.userName}>{user.name}</span>
                  <span style={styles.userPhone}>{formatPhone(user.phoneNumber)}</span>
                </div>
                <div style={styles.userStats}>
                  <span style={styles.userMessages}>💬 {user.messageCount}</span>
                </div>
              </div>
            ))}
            {!analytics?.topUsers.length && (
              <p style={styles.noData}>Sin usuarios aún</p>
            )}
          </div>
        </div>

        {/* Horas Pico */}
        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>⏰ Horas Pico</h3>
          <div style={styles.peakHoursList}>
            {analytics?.peakHours.map((peak, index) => (
              <div key={index} style={styles.peakHourRow}>
                <span style={styles.peakHourMedal}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                </span>
                <span style={styles.peakHourTime}>
                  {peak.hour.toString().padStart(2, '0')}:00
                </span>
                <span style={styles.peakHourCount}>
                  {peak.avgMessages} msgs
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Estado de Conversaciones */}
        <div style={styles.chartCardSmall}>
          <h3 style={styles.chartTitle}>📊 Estado Conversaciones</h3>
          <div style={styles.statusList}>
            <div style={styles.statusRow}>
              <span style={styles.statusDot} data-status="active">🟢</span>
              <span style={styles.statusLabel}>Activas</span>
              <span style={styles.statusValue}>
                {analytics?.conversationsByStatus.active || 0}
              </span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.statusDot} data-status="pending">🟡</span>
              <span style={styles.statusLabel}>Pendientes</span>
              <span style={styles.statusValue}>
                {analytics?.conversationsByStatus.pending || 0}
              </span>
            </div>
            <div style={styles.statusRow}>
              <span style={styles.statusDot} data-status="closed">⚫</span>
              <span style={styles.statusLabel}>Cerradas</span>
              <span style={styles.statusValue}>
                {analytics?.conversationsByStatus.closed || 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={styles.footer}>
        <p>📊 Dashboard actualizado automáticamente cada 30 segundos</p>
        <p>Chatbot PITHY • Devlmer Project CL</p>
      </div>
    </div>
  );
}

// Componente KPI Card
function KPICard({
  icon,
  title,
  value,
  trend,
  color,
  highlight,
  invertTrend,
}: {
  icon: string;
  title: string;
  value: number | string;
  trend?: number;
  color: string;
  highlight?: boolean;
  invertTrend?: boolean;
}) {
  const trendColor = trend
    ? (invertTrend ? trend < 0 : trend > 0)
      ? '#4ECDC4'
      : '#FF6B6B'
    : '#666';

  return (
    <div
      style={{
        ...styles.kpiCard,
        background: highlight
          ? `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`
          : 'white',
        color: highlight ? 'white' : '#333',
      }}
    >
      <div style={styles.kpiIcon}>{icon}</div>
      <div style={styles.kpiContent}>
        <div style={styles.kpiValue}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        <div style={{ ...styles.kpiTitle, color: highlight ? 'rgba(255,255,255,0.9)' : '#666' }}>
          {title}
        </div>
        {trend !== undefined && (
          <div style={{ ...styles.kpiTrend, color: highlight ? 'white' : trendColor }}>
            {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
          </div>
        )}
      </div>
    </div>
  );
}

// Helpers
function formatPhone(phone: string): string {
  if (phone.length > 8) {
    return `...${phone.slice(-4)}`;
  }
  return phone;
}

function getIntentEmoji(intent: string): string {
  const emojis: Record<string, string> = {
    consulta: '❓',
    saludo: '👋',
    soporte: '🔧',
    venta: '💰',
    queja: '😤',
    despedida: '👋',
    comando: '⚡',
    otros: '📝',
  };
  return emojis[intent.toLowerCase()] || '📝';
}

// Styles
const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  },
  loadingSpinner: {
    textAlign: 'center' as const,
    color: 'white',
  },
  spinner: {
    width: '50px',
    height: '50px',
    border: '4px solid rgba(255,255,255,0.3)',
    borderTop: '4px solid #667eea',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 20px',
  },
  loadingText: {
    fontSize: '18px',
    color: 'rgba(255,255,255,0.8)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    flexWrap: 'wrap' as const,
    gap: '20px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '5px',
  },
  backLink: {
    color: 'rgba(255,255,255,0.7)',
    textDecoration: 'none',
    fontSize: '14px',
    marginBottom: '10px',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 'bold',
    color: 'white',
  },
  subtitle: {
    margin: 0,
    color: 'rgba(255,255,255,0.6)',
    fontSize: '14px',
  },
  periodSelector: {
    display: 'flex',
    gap: '10px',
    background: 'rgba(255,255,255,0.1)',
    padding: '5px',
    borderRadius: '10px',
  },
  periodButton: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    color: 'rgba(255,255,255,0.7)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  periodButtonActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  kpiCard: {
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    transition: 'transform 0.2s',
  },
  kpiIcon: {
    fontSize: '40px',
  },
  kpiContent: {
    flex: 1,
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: 'bold',
    marginBottom: '5px',
  },
  kpiTitle: {
    fontSize: '13px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
  },
  kpiTrend: {
    fontSize: '12px',
    fontWeight: '600',
    marginTop: '5px',
  },
  chartsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  chartCard: {
    background: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  chartCardSmall: {
    background: 'white',
    borderRadius: '16px',
    padding: '25px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    minHeight: '250px',
  },
  chartTitle: {
    margin: '0 0 20px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
  },
  barChart: {
    display: 'flex',
    alignItems: 'flex-end',
    height: '150px',
    gap: '2px',
  },
  barContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    height: '100%',
  },
  bar: {
    width: '100%',
    minHeight: '2px',
    borderRadius: '4px 4px 0 0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    transition: 'height 0.3s',
  },
  barValue: {
    fontSize: '9px',
    color: 'white',
    fontWeight: 'bold',
    marginTop: '2px',
  },
  barLabel: {
    fontSize: '10px',
    color: '#999',
    marginTop: '5px',
  },
  dayChart: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '150px',
  },
  dayBarContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    flex: 1,
  },
  dayBarWrapper: {
    height: '120px',
    width: '40px',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  dayBar: {
    width: '100%',
    background: 'linear-gradient(180deg, #4ECDC4 0%, #44A08D 100%)',
    borderRadius: '8px 8px 0 0',
    minHeight: '4px',
    transition: 'height 0.3s',
  },
  dayBarValue: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  dayBarLabel: {
    fontSize: '12px',
    color: '#666',
    marginTop: '8px',
    fontWeight: '500',
  },
  sentimentContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  sentimentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  sentimentLabel: {
    width: '90px',
    fontSize: '13px',
    color: '#666',
  },
  sentimentBarContainer: {
    flex: 1,
    height: '12px',
    background: '#f0f0f0',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  sentimentBar: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.3s',
  },
  sentimentValue: {
    width: '40px',
    textAlign: 'right' as const,
    fontSize: '13px',
    fontWeight: '600',
    color: '#333',
  },
  performanceContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '30px',
  },
  performanceCircle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  performanceStats: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  performanceStat: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '14px',
    color: '#666',
  },
  performanceIcon: {
    fontSize: '20px',
  },
  intentsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  intentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  intentName: {
    width: '100px',
    fontSize: '13px',
    color: '#333',
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  intentBarContainer: {
    flex: 1,
    height: '8px',
    background: '#f0f0f0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  intentBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '4px',
    transition: 'width 0.3s',
  },
  intentValue: {
    width: '35px',
    textAlign: 'right' as const,
    fontSize: '12px',
    fontWeight: '600',
    color: '#666',
  },
  usersList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
  },
  userRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  userRank: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column' as const,
  },
  userName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#333',
  },
  userPhone: {
    fontSize: '12px',
    color: '#999',
  },
  userStats: {
    display: 'flex',
    gap: '10px',
  },
  userMessages: {
    fontSize: '13px',
    color: '#667eea',
    fontWeight: '600',
  },
  peakHoursList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  peakHourRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    padding: '12px 15px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  peakHourMedal: {
    fontSize: '24px',
  },
  peakHourTime: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  peakHourCount: {
    fontSize: '14px',
    color: '#667eea',
    fontWeight: '600',
  },
  statusList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '15px',
  },
  statusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 15px',
    background: '#f8f9fa',
    borderRadius: '10px',
  },
  statusDot: {
    fontSize: '16px',
  },
  statusLabel: {
    flex: 1,
    fontSize: '14px',
    color: '#333',
  },
  statusValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#667eea',
  },
  noData: {
    textAlign: 'center' as const,
    color: '#999',
    fontSize: '14px',
    padding: '20px',
  },
  footer: {
    textAlign: 'center' as const,
    color: 'rgba(255,255,255,0.5)',
    marginTop: '30px',
    fontSize: '13px',
  },
};
