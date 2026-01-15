'use client';

import { useState, useEffect } from 'react';

interface AIConfig {
  ai_provider: string;
  ai_model: string;
  perplexity_api_key: string;
  perplexity_model: string;
  perplexity_temperature: string;
  perplexity_max_tokens: string;
  ai_enabled: string;
  rag_enabled: string;
}

interface AIConfigurationProps {
  initialConfig: AIConfig;
  onSave: (config: AIConfig) => void;
  saving: boolean;
}

export default function AIConfiguration({ initialConfig, onSave, saving }: AIConfigurationProps) {
  const [config, setConfig] = useState<AIConfig>(initialConfig);
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const handleChange = (field: keyof AIConfig, value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(config);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.container}>
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Proveedor de IA</h2>
        <p style={styles.sectionDescription}>
          Selecciona el proveedor de inteligencia artificial que deseas utilizar.
        </p>

        <div style={styles.radioGroup}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="ai_provider"
              value="ollama"
              checked={config.ai_provider === 'ollama'}
              onChange={(e) => handleChange('ai_provider', e.target.value)}
              style={styles.radioInput}
            />
            <span style={styles.radioText}>
              <strong>Ollama (Local)</strong>
              <span style={styles.radioDesc}>Modelos locales gratuitos, procesamiento en tu servidor</span>
            </span>
          </label>

          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="ai_provider"
              value="perplexity"
              checked={config.ai_provider === 'perplexity'}
              onChange={(e) => handleChange('ai_provider', e.target.value)}
              style={styles.radioInput}
            />
            <span style={styles.radioText}>
              <strong>Perplexity AI</strong>
              <span style={styles.radioDesc}>Modelos en la nube, respuestas más precisas</span>
            </span>
          </label>
        </div>
      </div>

      {config.ai_provider === 'perplexity' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Configuración de Perplexity</h2>
          <p style={styles.sectionDescription}>
            Ingresa tus credenciales y preferencias para la API de Perplexity.
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>API Key</label>
            <div style={styles.apiKeyContainer}>
              <input
                type={showApiKey ? "text" : "password"}
                value={config.perplexity_api_key}
                onChange={(e) => handleChange('perplexity_api_key', e.target.value)}
                style={styles.input}
                placeholder="Ingresa tu API Key de Perplexity"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                style={styles.toggleVisibilityButton}
              >
                {showApiKey ? '_OCULTAR_' : 'VER'}
              </button>
            </div>
            <p style={styles.hint}>
              Puedes obtener tu API Key en <a href="https://www.perplexity.ai/" target="_blank" rel="noopener noreferrer" style={styles.link}>perplexity.ai</a>
            </p>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Modelo</label>
            <select
              value={config.perplexity_model}
              onChange={(e) => handleChange('perplexity_model', e.target.value)}
              style={styles.select}
            >
              <option value="llama-3.1-sonar-large-128k-chat">Llama 3.1 Sonar Large (128k)</option>
              <option value="llama-3.1-sonar-small-128k-chat">Llama 3.1 Sonar Small (128k)</option>
              <option value="llama-3.1-sonar-huge-128k-online">Llama 3.1 Sonar Huge (Online)</option>
              <option value="llama-3.1-8b-instruct">Llama 3.1 8B Instruct</option>
              <option value="llama-3.1-70b-instruct">Llama 3.1 70B Instruct</option>
            </select>
          </div>

          <div style={styles.formRow}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Temperatura</label>
              <input
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={parseFloat(config.perplexity_temperature).toFixed(1)}
                onChange={(e) => handleChange('perplexity_temperature', e.target.value)}
                style={styles.input}
              />
              <p style={styles.hint}>Valores más altos producen respuestas más creativas</p>
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Máximo de Tokens</label>
              <input
                type="number"
                min="1"
                max="4096"
                value={parseInt(config.perplexity_max_tokens, 10)}
                onChange={(e) => handleChange('perplexity_max_tokens', e.target.value)}
                style={styles.input}
              />
              <p style={styles.hint}>Cantidad máxima de tokens en la respuesta</p>
            </div>
          </div>
        </div>
      )}

      {config.ai_provider === 'ollama' && (
        <div style={styles.section}>
          <h2 style={styles.sectionTitle}>Configuración de Ollama</h2>
          <p style={styles.sectionDescription}>
            Configuración específica para el proveedor de IA local Ollama.
          </p>

          <div style={styles.formGroup}>
            <label style={styles.label}>Modelo</label>
            <select
              value={config.ai_model}
              onChange={(e) => handleChange('ai_model', e.target.value)}
              style={styles.select}
            >
              <option value="llama3.2">Llama 3.2</option>
              <option value="llama3.1">Llama 3.1</option>
              <option value="llama3">Llama 3</option>
              <option value="mistral">Mistral</option>
              <option value="phi3">Phi-3</option>
              <option value="gemma2">Gemma 2</option>
              <option value="qwen2.5">Qwen 2.5</option>
              <option value="">Seleccionar modelo...</option>
            </select>
          </div>
        </div>
      )}

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Opciones Adicionales</h2>

        <div style={styles.toggleList}>
          <div style={styles.toggleItem}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>IA Habilitada</span>
              <span style={styles.toggleDesc}>Activar/desactivar procesamiento con IA</span>
            </div>
            <button
              style={{
                ...styles.toggle,
                background: config.ai_enabled === 'true' ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
              }}
              onClick={(e) => {
                e.preventDefault();
                handleChange('ai_enabled', config.ai_enabled === 'true' ? 'false' : 'true');
              }}
              type="button"
            >
              <div style={{
                ...styles.toggleKnob,
                transform: config.ai_enabled === 'true' ? 'translateX(18px)' : 'translateX(0)',
              }} />
            </button>
          </div>

          <div style={styles.toggleItem}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleLabel}>RAG Habilitado</span>
              <span style={styles.toggleDesc}>Activar/desactivar recuperación aumentada de contexto</span>
            </div>
            <button
              style={{
                ...styles.toggle,
                background: config.rag_enabled === 'true' ? '#667eea' : 'rgba(148, 163, 184, 0.2)',
              }}
              onClick={(e) => {
                e.preventDefault();
                handleChange('rag_enabled', config.rag_enabled === 'true' ? 'false' : 'true');
              }}
              type="button"
            >
              <div style={{
                ...styles.toggleKnob,
                transform: config.rag_enabled === 'true' ? 'translateX(18px)' : 'translateX(0)',
              }} />
            </button>
          </div>
        </div>
      </div>

      <div style={styles.actions}>
        <button type="submit" disabled={saving} style={styles.saveButton}>
          {saving ? 'Guardando...' : 'Guardar configuración de IA'}
        </button>
      </div>
    </form>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
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
  radioGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    padding: '16px',
    borderRadius: '10px',
    background: 'rgba(15, 23, 42, 0.5)',
    cursor: 'pointer',
    border: '2px solid transparent',
  },
  radioInput: {
    marginTop: '4px',
  },
  radioText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  radioDesc: {
    color: '#64748b',
    fontSize: '13px',
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
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
    margin: '4px 0 0 0',
  },
  link: {
    color: '#667eea',
    textDecoration: 'none',
  },
  apiKeyContainer: {
    display: 'flex',
    gap: '8px',
  },
  toggleVisibilityButton: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    background: 'rgba(15, 23, 42, 0.5)',
    color: '#f1f5f9',
    fontSize: '13px',
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
};