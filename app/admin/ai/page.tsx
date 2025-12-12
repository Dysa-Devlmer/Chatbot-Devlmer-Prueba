"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AIConfig {
  aiEnabled: boolean;
  selectedModel: string;
  availableModels: string[];
  temperature: number;
  maxTokens: number;
  autoRespond: boolean;
  sentimentAnalysis: boolean;
  intentDetection: boolean;
}

export default function AIConfigPage() {
  const [config, setConfig] = useState<AIConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form state
  const [aiEnabled, setAiEnabled] = useState(true);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [autoRespond, setAutoRespond] = useState(true);
  const [sentimentAnalysis, setSentimentAnalysis] = useState(true);
  const [intentDetection, setIntentDetection] = useState(true);
  const [ragEnabled, setRagEnabled] = useState(true); // RAG habilitado por defecto para aprendizaje continuo

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/admin/ai');
      const data = await response.json();
      if (data.config) {
        setConfig(data.config);
        setAiEnabled(data.config.aiEnabled);
        setSelectedModel(data.config.selectedModel);
        setTemperature(data.config.temperature);
        setMaxTokens(data.config.maxTokens);
        setAutoRespond(data.config.autoRespond);
        setSentimentAnalysis(data.config.sentimentAnalysis);
        setIntentDetection(data.config.intentDetection);
        setRagEnabled(data.config.ragEnabled || false);
      }
    } catch (error) {
      console.error('Error fetching AI config:', error);
      setMessage({ type: 'error', text: 'Error al cargar configuración' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/ai', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiEnabled,
          selectedModel,
          temperature,
          maxTokens,
          autoRespond,
          sentimentAnalysis,
          intentDetection,
          ragEnabled,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
        await fetchConfig();
      } else {
        setMessage({ type: 'error', text: 'Error al guardar configuración' });
      }
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error de conexión' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '20px', color: '#666' }}>Cargando configuración de IA...</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            <span style={{ cursor: 'pointer' }}>←</span>
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px' }}>🤖 Configuración de IA</h1>
        </div>
        <button onClick={saveConfig} disabled={saving} style={styles.saveBtn}>
          {saving ? 'Guardando...' : '💾 Guardar Cambios'}
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
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      {/* Main Grid */}
      <div style={styles.grid}>
        {/* Panel Principal */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>⚙️ Configuración General</h2>

          {/* AI Enabled Toggle */}
          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>IA Habilitada</div>
              <div style={styles.settingDesc}>
                Activa o desactiva el procesamiento con Inteligencia Artificial
              </div>
            </div>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              style={{
                ...styles.toggle,
                background: aiEnabled ? '#25D366' : '#ccc',
              }}
            >
              <span
                style={{
                  ...styles.toggleKnob,
                  transform: aiEnabled ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Model Selection */}
          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Modelo de IA</div>
              <div style={styles.settingDesc}>
                Selecciona el modelo de Ollama a utilizar
              </div>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              style={styles.select}
              disabled={!aiEnabled}
            >
              {config?.availableModels.map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          </div>

          {/* Temperature */}
          <div style={styles.settingRow}>
            <div style={{ flex: 1 }}>
              <div style={styles.settingLabel}>Temperatura: {temperature}</div>
              <div style={styles.settingDesc}>
                Creatividad de las respuestas (0.1 = preciso, 1.0 = creativo)
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                style={styles.slider}
                disabled={!aiEnabled}
              />
            </div>
          </div>

          {/* Max Tokens */}
          <div style={styles.settingRow}>
            <div style={{ flex: 1 }}>
              <div style={styles.settingLabel}>Máximo de Tokens: {maxTokens}</div>
              <div style={styles.settingDesc}>
                Longitud máxima de las respuestas generadas
              </div>
              <input
                type="range"
                min="256"
                max="4096"
                step="256"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                style={styles.slider}
                disabled={!aiEnabled}
              />
            </div>
          </div>
        </div>

        {/* Panel de Características */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>🎯 Características Avanzadas</h2>

          {/* Auto Respond */}
          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Respuesta Automática</div>
              <div style={styles.settingDesc}>
                Responder automáticamente a mensajes entrantes
              </div>
            </div>
            <button
              onClick={() => setAutoRespond(!autoRespond)}
              disabled={!aiEnabled}
              style={{
                ...styles.toggle,
                background: autoRespond && aiEnabled ? '#25D366' : '#ccc',
                opacity: aiEnabled ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  ...styles.toggleKnob,
                  transform: autoRespond ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Sentiment Analysis */}
          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Análisis de Sentimiento</div>
              <div style={styles.settingDesc}>
                Detectar el tono emocional de los mensajes
              </div>
            </div>
            <button
              onClick={() => setSentimentAnalysis(!sentimentAnalysis)}
              disabled={!aiEnabled}
              style={{
                ...styles.toggle,
                background: sentimentAnalysis && aiEnabled ? '#25D366' : '#ccc',
                opacity: aiEnabled ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  ...styles.toggleKnob,
                  transform: sentimentAnalysis ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* Intent Detection */}
          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Deteccion de Intencion</div>
              <div style={styles.settingDesc}>
                Identificar la intencion detras de cada mensaje
              </div>
            </div>
            <button
              onClick={() => setIntentDetection(!intentDetection)}
              disabled={!aiEnabled}
              style={{
                ...styles.toggle,
                background: intentDetection && aiEnabled ? '#25D366' : '#ccc',
                opacity: aiEnabled ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  ...styles.toggleKnob,
                  transform: intentDetection ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>

          {/* RAG Learning System */}
          <div style={styles.settingRow}>
            <div>
              <div style={styles.settingLabel}>Aprendizaje RAG</div>
              <div style={styles.settingDesc}>
                Sistema de aprendizaje continuo (puede agregar ~300ms de latencia)
              </div>
            </div>
            <button
              onClick={() => setRagEnabled(!ragEnabled)}
              disabled={!aiEnabled}
              style={{
                ...styles.toggle,
                background: ragEnabled && aiEnabled ? '#6610f2' : '#ccc',
                opacity: aiEnabled ? 1 : 0.5,
              }}
            >
              <span
                style={{
                  ...styles.toggleKnob,
                  transform: ragEnabled ? 'translateX(26px)' : 'translateX(2px)',
                }}
              />
            </button>
          </div>
        </div>

        {/* Panel de Estado */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>📊 Estado del Sistema</h2>

          <div style={styles.statusGrid}>
            <div style={styles.statusCard}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>
                {aiEnabled ? '🟢' : '🔴'}
              </div>
              <div style={{ fontWeight: 'bold' }}>Estado IA</div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {aiEnabled ? 'Activo' : 'Inactivo'}
              </div>
            </div>

            <div style={styles.statusCard}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🧠</div>
              <div style={{ fontWeight: 'bold' }}>Modelo</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{selectedModel}</div>
            </div>

            <div style={styles.statusCard}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>🎚️</div>
              <div style={{ fontWeight: 'bold' }}>Temperatura</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{temperature}</div>
            </div>

            <div style={styles.statusCard}>
              <div style={{ fontSize: '32px', marginBottom: '10px' }}>📝</div>
              <div style={{ fontWeight: 'bold' }}>Max Tokens</div>
              <div style={{ color: '#666', fontSize: '14px' }}>{maxTokens}</div>
            </div>
          </div>
        </div>

        {/* Panel de Ayuda */}
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>💡 Guía de Configuración</h2>

          <div style={styles.helpSection}>
            <h4>🧠 Modelos Recomendados</h4>
            <ul style={styles.helpList}>
              <li><strong>llama3.2</strong> - Excelente equilibrio entre velocidad y calidad</li>
              <li><strong>mistral</strong> - Rápido y eficiente para conversaciones</li>
              <li><strong>qwen2.5</strong> - Bueno para español y múltiples idiomas</li>
            </ul>
          </div>

          <div style={styles.helpSection}>
            <h4>🎚️ Temperatura</h4>
            <ul style={styles.helpList}>
              <li><strong>0.1-0.3</strong> - Respuestas precisas y consistentes</li>
              <li><strong>0.4-0.6</strong> - Balance recomendado</li>
              <li><strong>0.7-1.0</strong> - Respuestas más creativas y variadas</li>
            </ul>
          </div>

          <div style={styles.helpSection}>
            <h4>📝 Tokens</h4>
            <ul style={styles.helpList}>
              <li><strong>256-512</strong> - Respuestas cortas y directas</li>
              <li><strong>1024</strong> - Respuestas de longitud media (recomendado)</li>
              <li><strong>2048+</strong> - Respuestas largas y detalladas</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Ollama Status */}
      <div style={styles.ollamaInfo}>
        <h3 style={{ margin: '0 0 15px 0' }}>🦙 Información de Ollama</h3>
        <p style={{ margin: '0 0 10px 0', color: '#666' }}>
          PITHY utiliza Ollama para procesar mensajes con IA localmente.
        </p>
        <div style={styles.commandBox}>
          <code>ollama serve</code> - Iniciar servidor de Ollama
        </div>
        <div style={styles.commandBox}>
          <code>ollama pull llama3.2</code> - Descargar modelo recomendado
        </div>
        <div style={styles.commandBox}>
          <code>ollama list</code> - Ver modelos instalados
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
  saveBtn: {
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
  message: {
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
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
  settingRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px 0',
    borderBottom: '1px solid #f5f5f5',
  },
  settingLabel: {
    fontWeight: '600',
    color: '#333',
    marginBottom: '4px',
  },
  settingDesc: {
    fontSize: '13px',
    color: '#888',
  },
  toggle: {
    position: 'relative',
    width: '52px',
    height: '28px',
    borderRadius: '14px',
    border: 'none',
    cursor: 'pointer',
    transition: 'background 0.3s',
    padding: '0',
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    width: '24px',
    height: '24px',
    background: 'white',
    borderRadius: '50%',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    transition: 'transform 0.3s',
  },
  select: {
    padding: '10px 15px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    minWidth: '150px',
    cursor: 'pointer',
  },
  slider: {
    width: '100%',
    marginTop: '10px',
    cursor: 'pointer',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '15px',
  },
  statusCard: {
    background: '#f8f9fa',
    padding: '20px',
    borderRadius: '8px',
    textAlign: 'center',
  },
  helpSection: {
    marginBottom: '20px',
  },
  helpList: {
    margin: '10px 0 0 0',
    padding: '0 0 0 20px',
    fontSize: '14px',
    color: '#666',
    lineHeight: '1.8',
  },
  ollamaInfo: {
    background: 'white',
    borderRadius: '12px',
    padding: '25px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  commandBox: {
    background: '#1a1a2e',
    color: '#4ECDC4',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '10px',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
};
