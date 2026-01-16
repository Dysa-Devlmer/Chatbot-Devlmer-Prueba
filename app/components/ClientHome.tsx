"use client";

import { useState, useEffect } from 'react';
import AdminAccessButton from './AdminAccessButton';

export default function ClientHome() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; error?: string; data?: any } | null>(null);
  const [mounted, setMounted] = useState(false);

  // Evitar problemas de hidratación con Dark Reader
  useEffect(() => {
    setMounted(true);
  }, []);

  const sendMessage = async () => {
    if (!phoneNumber || !message) {
      setResult({ error: 'Por favor ingresa un número y mensaje' });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace(/\D/g, ''), // Eliminar caracteres no numéricos
          message: message,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, data });
        setMessage(''); // Limpiar el mensaje después de enviar
      } else {
        setResult({ error: data.error || 'Error al enviar mensaje' });
      }
    } catch (error) {
      setResult({ error: 'Error de conexión: ' + (error as Error).message });
    } finally {
      setLoading(false);
    }
  };

  const sendTestMessage = () => {
    // Tu número real de WhatsApp (sin el +)
    setPhoneNumber('56965419765'); // Tu número de WhatsApp Business
    setMessage('Hola! Este es un mensaje de prueba desde mi chatbot JARVIS 🤖');
  };

  // Renderizar un placeholder mientras se monta el componente
  if (!mounted) {
    return (
      <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "800px", margin: "0 auto" }}>
        <h1 style={{ textAlign: "center" }}>🤖 WhatsApp Chatbot JARVIS</h1>
        <p style={{ textAlign: "center", color: "#666" }}>Cargando...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", fontFamily: "Arial", maxWidth: "800px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center" }}>🤖 WhatsApp Chatbot JARVIS</h1>
      <p style={{ textAlign: "center", color: "#666" }}>
        Tu chatbot está activo y funcionando con las credenciales de producción.
      </p>

      <div style={{
        marginTop: "30px",
        padding: "25px",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        borderRadius: "12px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
      }}>
        <h2 style={{ color: "white", marginBottom: "20px" }}>📤 Enviar Mensaje de Prueba</h2>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ color: "white", display: "block", marginBottom: "5px" }}>
            Número de WhatsApp (con código de país, sin +):
          </label>
          <input
            type="text"
            placeholder="Ej: 56912345678"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              fontSize: "16px",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label style={{ color: "white", display: "block", marginBottom: "5px" }}>
            Mensaje:
          </label>
          <textarea
            placeholder="Escribe tu mensaje aquí..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "6px",
              border: "none",
              fontSize: "16px",
              resize: "vertical",
              boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={sendMessage}
            disabled={loading}
            style={{
              flex: 1,
              padding: "12px 24px",
              background: loading ? "#ccc" : "#25D366",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s"
            }}
          >
            {loading ? "⏳ Enviando..." : "📨 Enviar Mensaje"}
          </button>

          <button
            onClick={sendTestMessage}
            style={{
              padding: "12px 24px",
              background: "#0088cc",
              color: "white",
              border: "none",
              borderRadius: "6px",
              fontSize: "16px",
              fontWeight: "bold",
              cursor: "pointer",
              transition: "all 0.3s"
            }}
          >
            🎯 Usar Mi Número
          </button>
        </div>

        {result && (
          <div style={{
            marginTop: "20px",
            padding: "15px",
            background: result.success ? "rgba(255,255,255,0.9)" : "rgba(255,100,100,0.9)",
            borderRadius: "6px",
            color: result.success ? "#333" : "white"
          }}>
            {result.success ? (
              <div>
                <strong>✅ Mensaje enviado exitosamente!</strong>
                <pre style={{ marginTop: "10px", fontSize: "12px", overflow: "auto" }}>
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            ) : (
              <div>
                <strong>❌ Error:</strong> {result.error}
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{
        marginTop: "30px",
        padding: "20px",
        background: "#f8f9fa",
        borderRadius: "8px",
        border: "1px solid #dee2e6"
      }}>
        <h3>📋 Información del Sistema</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li><strong>Número de WhatsApp Business:</strong> +56 9 6541 9765</li>
          <li><strong>Nombre verificado:</strong> Devlmer Apps</li>
          <li><strong>Phone Number ID:</strong> 905984725929536</li>
          <li><strong>Business Account ID:</strong> 779998311756531</li>
        </ul>
      </div>

      <div style={{
        marginTop: "20px",
        padding: "20px",
        background: "#e3f2fd",
        borderRadius: "8px",
        border: "1px solid #90caf9"
      }}>
        <h3>🔧 Endpoints Disponibles</h3>
        <ul style={{ lineHeight: "1.8" }}>
          <li>
            <code style={{ background: "#fff", padding: "2px 6px", borderRadius: "4px" }}>
              POST /api/whatsapp/send
            </code> - Enviar mensajes
          </li>
          <li>
            <code style={{ background: "#fff", padding: "2px 6px", borderRadius: "4px" }}>
              GET/POST /api/whatsapp/webhook
            </code> - Webhook para recibir mensajes
          </li>
        </ul>
      </div>

      <div style={{
        marginTop: "20px",
        padding: "20px",
        background: "#fff3e0",
        borderRadius: "8px",
        border: "1px solid #ffcc80"
      }}>
        <h3>💡 Cómo Probar</h3>
        <ol style={{ lineHeight: "1.8" }}>
          <li>Haz clic en "Usar Mi Número" para autocompletar tu número</li>
          <li>Escribe un mensaje de prueba o usa el predeterminado</li>
          <li>Haz clic en "Enviar Mensaje"</li>
          <li>Revisa tu WhatsApp - deberías recibir el mensaje</li>
          <li>Si respondes al mensaje, el bot te responderá automáticamente</li>
        </ol>
      </div>

      {/* Botón de acceso admin */}
      <AdminAccessButton />
    </div>
  );
}