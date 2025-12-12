"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface LearningStats {
  overview: {
    totalLearnings: number;
    helpfulCount: number;
    notHelpfulCount: number;
    pendingEvaluation: number;
    satisfactionRate: string;
  };
  feedback: {
    total: number;
    thumbs_up?: number;
    thumbs_down?: number;
  };
  categories: Array<{ category: string; count: number }>;
  intents: Array<{ intent: string; count: number }>;
  daily: Array<{
    date: string;
    totalLearnings: number;
    positiveFeedback: number;
    negativeFeedback: number;
  }>;
  topPatterns: Array<{
    id: string;
    pattern: string;
    exampleQuery: string;
    bestResponse: string;
    frequency: number;
  }>;
  embeddings: {
    total_embeddings: number;
    ollama_status: string;
    chromadb_status: string;
  };
  recent: Array<{
    id: string;
    userMessage: string;
    botResponse: string;
    wasHelpful: boolean | null;
    intent: string | null;
    category: string | null;
    createdAt: string;
  }>;
}

export default function LearningPage() {
  const [stats, setStats] = useState<LearningStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'recent' | 'patterns'>('overview');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/learning/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setMessage({ type: 'error', text: 'Error al cargar estadisticas' });
    } finally {
      setLoading(false);
    }
  };

  const refreshStats = async () => {
    setRefreshing(true);
    setMessage(null);

    try {
      const response = await fetch('/api/learning/stats', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh' }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Estadisticas actualizadas' });
        await fetchStats();
      } else {
        setMessage({ type: 'error', text: 'Error al actualizar' });
      }
    } catch (error) {
      console.error('Error refreshing:', error);
      setMessage({ type: 'error', text: 'Error de conexion' });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '20px', color: '#666' }}>Cargando sistema de aprendizaje...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            <span style={{ cursor: 'pointer' }}>&#8592;</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px' }}>Sistema de Aprendizaje RAG</h1>
        </div>
        <button onClick={refreshStats} disabled={refreshing} style={styles.refreshBtn}>
          {refreshing ? 'Actualizando...' : 'Actualizar Stats'}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          style={{
            ...styles.message,
            background: message.type === 'success' ? '#d4edda' : '#f8d7da',
            color: message.type === 'success' ? '#155724' : '#721c24',
          }}
        >
          {message.type === 'success' ? 'OK' : 'Error'} {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={styles.tabs}>
        <button
          onClick={() => setSelectedTab('overview')}
          style={{
            ...styles.tab,
            background: selectedTab === 'overview' ? '#667eea' : '#e0e0e0',
            color: selectedTab === 'overview' ? 'white' : '#333',
          }}
        >
          Resumen
        </button>
        <button
          onClick={() => setSelectedTab('recent')}
          style={{
            ...styles.tab,
            background: selectedTab === 'recent' ? '#667eea' : '#e0e0e0',
            color: selectedTab === 'recent' ? 'white' : '#333',
          }}
        >
          Recientes
        </button>
        <button
          onClick={() => setSelectedTab('patterns')}
          style={{
            ...styles.tab,
            background: selectedTab === 'patterns' ? '#667eea' : '#e0e0e0',
            color: selectedTab === 'patterns' ? 'white' : '#333',
          }}
        >
          Patrones
        </button>
      </div>

      {selectedTab === 'overview' && (
        <>
          {/* Stats Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>Total</div>
              <div style={styles.statValue}>{stats?.overview?.totalLearnings || 0}</div>
              <div style={styles.statLabel}>Conversaciones Aprendidas</div>
            </div>

            <div style={{ ...styles.statCard, borderTop: '4px solid #25D366' }}>
              <div style={styles.statIcon}>OK</div>
              <div style={styles.statValue}>{stats?.overview?.helpfulCount || 0}</div>
              <div style={styles.statLabel}>Respuestas Utiles</div>
            </div>

            <div style={{ ...styles.statCard, borderTop: '4px solid #dc3545' }}>
              <div style={styles.statIcon}>X</div>
              <div style={styles.statValue}>{stats?.overview?.notHelpfulCount || 0}</div>
              <div style={styles.statLabel}>No Utiles</div>
            </div>

            <div style={{ ...styles.statCard, borderTop: '4px solid #ffc107' }}>
              <div style={styles.statIcon}>?</div>
              <div style={styles.statValue}>{stats?.overview?.pendingEvaluation || 0}</div>
              <div style={styles.statLabel}>Pendientes</div>
            </div>

            <div style={{ ...styles.statCard, borderTop: '4px solid #17a2b8' }}>
              <div style={styles.statIcon}>%</div>
              <div style={styles.statValue}>{stats?.overview?.satisfactionRate || '0%'}</div>
              <div style={styles.statLabel}>Satisfaccion</div>
            </div>

            <div style={{ ...styles.statCard, borderTop: '4px solid #6610f2' }}>
              <div style={styles.statIcon}>Vec</div>
              <div style={styles.statValue}>{stats?.embeddings?.total_embeddings || 0}</div>
              <div style={styles.statLabel}>Embeddings en ChromaDB</div>
            </div>
          </div>

          {/* Service Status */}
          <div style={styles.grid}>
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Estado de Servicios</h2>

              {/* Info message when services are not running */}
              {(stats?.embeddings?.ollama_status !== 'connected' || stats?.embeddings?.chromadb_status !== 'connected') && (
                <div style={{
                  background: '#e7f3ff',
                  border: '1px solid #b6d4fe',
                  borderRadius: '8px',
                  padding: '12px',
                  marginBottom: '15px',
                  fontSize: '13px',
                  color: '#084298',
                }}>
                  <strong>Nota:</strong> El servicio de embeddings es opcional. Tu chatbot funciona perfectamente sin el.
                  Activalo solo si deseas habilitar el aprendizaje automatico.
                </div>
              )}

              <div style={styles.serviceRow}>
                <span>Ollama (Embeddings)</span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: stats?.embeddings?.ollama_status === 'connected' ? '#d4edda' : '#f5f5f5',
                  color: stats?.embeddings?.ollama_status === 'connected' ? '#155724' : '#666',
                }}>
                  {stats?.embeddings?.ollama_status === 'connected' ? 'Conectado' : 'No iniciado'}
                </span>
              </div>
              <div style={styles.serviceRow}>
                <span>ChromaDB (Vector Store)</span>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  background: stats?.embeddings?.chromadb_status === 'connected' ? '#d4edda' : '#f5f5f5',
                  color: stats?.embeddings?.chromadb_status === 'connected' ? '#155724' : '#666',
                }}>
                  {stats?.embeddings?.chromadb_status === 'connected' ? 'Conectado' : 'No iniciado'}
                </span>
              </div>
            </div>

            {/* Categories */}
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Por Categoria</h2>
              {stats?.categories && stats.categories.length > 0 ? (
                stats.categories.slice(0, 5).map((cat, idx) => (
                  <div key={idx} style={styles.categoryRow}>
                    <span>{cat.category}</span>
                    <span style={styles.badge}>{cat.count}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '14px' }}>Sin datos de categorias</div>
              )}
            </div>

            {/* Intents */}
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Por Intencion</h2>
              {stats?.intents && stats.intents.length > 0 ? (
                stats.intents.slice(0, 5).map((intent, idx) => (
                  <div key={idx} style={styles.categoryRow}>
                    <span>{intent.intent}</span>
                    <span style={styles.badge}>{intent.count}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: '#888', fontSize: '14px' }}>Sin datos de intenciones</div>
              )}
            </div>

            {/* Feedback Summary */}
            <div style={styles.panel}>
              <h2 style={styles.panelTitle}>Feedback</h2>
              <div style={styles.feedbackGrid}>
                <div style={styles.feedbackItem}>
                  <div style={{ fontSize: '28px' }}>+</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.feedback?.thumbs_up || 0}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Positivos</div>
                </div>
                <div style={styles.feedbackItem}>
                  <div style={{ fontSize: '28px' }}>-</div>
                  <div style={{ fontSize: '24px', fontWeight: 'bold' }}>{stats?.feedback?.thumbs_down || 0}</div>
                  <div style={{ fontSize: '12px', color: '#888' }}>Negativos</div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {selectedTab === 'recent' && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Conversaciones Recientes</h2>
          {stats?.recent && stats.recent.length > 0 ? (
            <div style={styles.recentList}>
              {stats.recent.map((conv) => (
                <div key={conv.id} style={styles.recentItem}>
                  <div style={styles.recentHeader}>
                    <span style={{
                      padding: '2px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      background: conv.wasHelpful === true ? '#d4edda' : conv.wasHelpful === false ? '#f8d7da' : '#fff3cd',
                      color: conv.wasHelpful === true ? '#155724' : conv.wasHelpful === false ? '#721c24' : '#856404',
                    }}>
                      {conv.wasHelpful === true ? 'Util' : conv.wasHelpful === false ? 'No util' : 'Pendiente'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#888' }}>
                      {new Date(conv.createdAt).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div style={styles.recentMessage}>
                    <strong>Usuario:</strong> {conv.userMessage.substring(0, 100)}...
                  </div>
                  <div style={styles.recentResponse}>
                    <strong>Bot:</strong> {conv.botResponse.substring(0, 150)}...
                  </div>
                  <div style={styles.recentMeta}>
                    {conv.intent && <span style={styles.tag}>{conv.intent}</span>}
                    {conv.category && <span style={styles.tag}>{conv.category}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
              No hay conversaciones recientes
            </div>
          )}
        </div>
      )}

      {selectedTab === 'patterns' && (
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Patrones Frecuentes (Top 10)</h2>
          {stats?.topPatterns && stats.topPatterns.length > 0 ? (
            <div style={styles.patternList}>
              {stats.topPatterns.map((pattern) => (
                <div key={pattern.id} style={styles.patternItem}>
                  <div style={styles.patternHeader}>
                    <span style={styles.patternBadge}>{pattern.frequency}x</span>
                    <span style={styles.patternName}>{pattern.pattern}</span>
                  </div>
                  <div style={styles.patternExample}>
                    <strong>Ejemplo:</strong> &quot;{pattern.exampleQuery}&quot;
                  </div>
                  <div style={styles.patternResponse}>
                    <strong>Mejor respuesta:</strong> {pattern.bestResponse.substring(0, 100)}...
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
              No hay patrones identificados aun
            </div>
          )}
        </div>
      )}

      {/* Help Section */}
      <div style={styles.helpPanel}>
        <h3 style={{ margin: '0 0 15px 0' }}>Como funciona el Sistema RAG</h3>
        <div style={styles.helpGrid}>
          <div style={styles.helpItem}>
            <div style={styles.helpIcon}>1</div>
            <div>
              <strong>Captura</strong>
              <p style={styles.helpText}>Cada conversacion se guarda automaticamente con su embedding vectorial</p>
            </div>
          </div>
          <div style={styles.helpItem}>
            <div style={styles.helpIcon}>2</div>
            <div>
              <strong>Busqueda</strong>
              <p style={styles.helpText}>Cuando llega un mensaje, buscamos conversaciones similares exitosas</p>
            </div>
          </div>
          <div style={styles.helpItem}>
            <div style={styles.helpIcon}>3</div>
            <div>
              <strong>Contexto</strong>
              <p style={styles.helpText}>Las respuestas exitosas se usan como ejemplos para mejorar la IA</p>
            </div>
          </div>
          <div style={styles.helpItem}>
            <div style={styles.helpIcon}>4</div>
            <div>
              <strong>Feedback</strong>
              <p style={styles.helpText}>El feedback de usuarios ayuda a identificar las mejores respuestas</p>
            </div>
          </div>
        </div>

        <div style={styles.commandSection}>
          <h4>Iniciar Servicio de Embeddings:</h4>
          <div style={styles.commandBox}>
            <code>cd embeddings-service && uvicorn main:app --host 0.0.0.0 --port 8001</code>
          </div>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
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
  refreshBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  message: {
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  tabs: {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  },
  tab: {
    padding: '10px 20px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '15px',
    marginBottom: '20px',
  },
  statCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    borderTop: '4px solid #667eea',
  },
  statIcon: {
    fontSize: '14px',
    color: '#888',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#333',
    marginBottom: '5px',
  },
  statLabel: {
    fontSize: '12px',
    color: '#888',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  panel: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  panelTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
    paddingBottom: '15px',
    borderBottom: '1px solid #eee',
  },
  serviceRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  categoryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  badge: {
    background: '#667eea',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  feedbackGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  feedbackItem: {
    textAlign: 'center',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  recentList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  recentItem: {
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '4px solid #667eea',
  },
  recentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  recentMessage: {
    fontSize: '14px',
    color: '#333',
    marginBottom: '8px',
  },
  recentResponse: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '8px',
  },
  recentMeta: {
    display: 'flex',
    gap: '8px',
  },
  tag: {
    background: '#e9ecef',
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    color: '#666',
  },
  patternList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px',
  },
  patternItem: {
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '8px',
  },
  patternHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '10px',
  },
  patternBadge: {
    background: '#667eea',
    color: 'white',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  patternName: {
    fontWeight: 'bold',
    color: '#333',
  },
  patternExample: {
    fontSize: '13px',
    color: '#666',
    marginBottom: '5px',
    fontStyle: 'italic',
  },
  patternResponse: {
    fontSize: '13px',
    color: '#888',
  },
  helpPanel: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  helpGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '20px',
  },
  helpItem: {
    display: 'flex',
    gap: '15px',
    alignItems: 'flex-start',
  },
  helpIcon: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    background: '#667eea',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    flexShrink: 0,
  },
  helpText: {
    margin: '5px 0 0 0',
    fontSize: '13px',
    color: '#666',
  },
  commandSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #eee',
  },
  commandBox: {
    background: '#1a1a2e',
    color: '#4ECDC4',
    padding: '12px 15px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '13px',
    overflowX: 'auto',
  },
};
