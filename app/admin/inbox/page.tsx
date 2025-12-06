"use client";

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface User {
  id: string;
  phoneNumber: string;
  name: string | null;
  profilePicUrl: string | null;
  isVIP: boolean;
}

interface Message {
  id: string;
  content: string;
  direction: string;
  sentBy: string | null;
  timestamp: string;
  type: string;
  user: User;
}

interface Conversation {
  id: string;
  status: string;
  botMode: string;
  isUnread: boolean;
  startedAt: string;
  user: User;
  messages: Message[];
}

function InboxPageContent() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000); // Actualizar cada 10 segundos
    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      const interval = setInterval(() => fetchMessages(selectedConversation.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async () => {
    try {
      const mode = searchParams?.get('mode');
      const unread = searchParams?.get('unread');

      let url = '/api/admin/conversations?status=active';
      if (mode) url += `&botMode=${mode}`;
      if (unread) url += `&unreadOnly=true`;

      const response = await fetch(url);
      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/admin/messages?conversationId=${conversationId}`);
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);

    // Marcar como leído
    if (conversation.isUnread) {
      await fetch('/api/admin/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          isUnread: false,
        }),
      });

      // Actualizar la lista
      setConversations(prev =>
        prev.map(c => c.id === conversation.id ? { ...c, isUnread: false } : c)
      );
    }
  };

  const toggleBotMode = async (conversationId: string, currentMode: string) => {
    const newMode = currentMode === 'auto' ? 'manual' : 'auto';

    try {
      await fetch('/api/admin/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          botMode: newMode,
        }),
      });

      // Actualizar la conversación seleccionada
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, botMode: newMode });
      }

      // Actualizar la lista
      setConversations(prev =>
        prev.map(c => c.id === conversationId ? { ...c, botMode: newMode } : c)
      );
    } catch (error) {
      console.error('Error toggling bot mode:', error);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: messageInput,
          phoneNumber: selectedConversation.user.phoneNumber,
        }),
      });

      if (response.ok) {
        setMessageInput('');
        await fetchMessages(selectedConversation.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error al enviar mensaje');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Hoy';
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === yesterday.toDateString()) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}>
        <div style={{ fontSize: '20px', color: '#666' }}>⏳ Cargando conversaciones...</div>
      </div>
    );
  }

  return (
    <div style={{
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: '#f0f2f5',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            ←
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📥 Bandeja de Mensajes - PITHY</h1>
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {conversations.length} conversaciones
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Conversation List */}
        <div style={{
          width: '350px',
          background: 'white',
          borderRight: '1px solid #e0e0e0',
          overflowY: 'auto',
        }}>
          {conversations.length === 0 ? (
            <div style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: '#666',
            }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
              <div>No hay conversaciones</div>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                style={{
                  padding: '15px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                  background: selectedConversation?.id === conv.id ? '#f0f2f5' : 'white',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.currentTarget.style.background = '#f9f9f9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedConversation?.id !== conv.id) {
                    e.currentTarget.style.background = 'white';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div style={{ fontWeight: conv.isUnread ? 'bold' : 'normal', fontSize: '16px' }}>
                    {conv.user.name || conv.user.phoneNumber}
                    {conv.user.isVIP && ' ⭐'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatDate(conv.startedAt)}
                  </div>
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#666',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {conv.messages[0]?.content || 'Sin mensajes'}
                </div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                  {conv.isUnread && (
                    <span style={{
                      background: '#25D366',
                      color: 'white',
                      padding: '2px 8px',
                      borderRadius: '10px',
                      fontSize: '11px',
                    }}>
                      Nuevo
                    </span>
                  )}
                  <span style={{
                    background: conv.botMode === 'auto' ? '#4ECDC4' : '#FF6B6B',
                    color: 'white',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}>
                    {conv.botMode === 'auto' ? '🤖 Auto' : '👤 Manual'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            background: '#e5ddd5',
          }}>
            {/* Chat Header */}
            <div style={{
              background: 'white',
              padding: '15px 20px',
              borderBottom: '1px solid #e0e0e0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>
                  {selectedConversation.user.name || selectedConversation.user.phoneNumber}
                </div>
                <div style={{ fontSize: '14px', color: '#666' }}>
                  {selectedConversation.user.phoneNumber}
                </div>
              </div>
              <button
                onClick={() => toggleBotMode(selectedConversation.id, selectedConversation.botMode)}
                style={{
                  padding: '10px 20px',
                  background: selectedConversation.botMode === 'auto' ? '#4ECDC4' : '#FF6B6B',
                  color: 'white',
                  border: 'none',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                {selectedConversation.botMode === 'auto' ? '🤖 Modo Automático' : '👤 Modo Manual'}
              </button>
            </div>

            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '20px',
            }}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.direction === 'inbound' ? 'flex-start' : 'flex-end',
                    marginBottom: '10px',
                  }}
                >
                  <div style={{
                    maxWidth: '65%',
                    padding: '10px 15px',
                    borderRadius: '10px',
                    background: msg.direction === 'inbound' ? 'white' : '#dcf8c6',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{ fontSize: '15px', marginBottom: '5px' }}>
                      {msg.content}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      color: '#667',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                    }}>
                      {formatTime(msg.timestamp)}
                      {msg.sentBy === 'human' && ' 👤'}
                      {msg.sentBy === 'bot' && ' 🤖'}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
              background: 'white',
              padding: '15px 20px',
              borderTop: '1px solid #e0e0e0',
              display: 'flex',
              gap: '10px',
            }}>
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                placeholder="Escribe un mensaje..."
                disabled={sending}
                style={{
                  flex: 1,
                  padding: '12px 15px',
                  borderRadius: '25px',
                  border: '1px solid #e0e0e0',
                  fontSize: '15px',
                  outline: 'none',
                }}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !messageInput.trim()}
                style={{
                  padding: '12px 30px',
                  background: sending ? '#ccc' : '#25D366',
                  color: 'white',
                  border: 'none',
                  borderRadius: '25px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  fontSize: '15px',
                  fontWeight: 'bold',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={(e) => !sending && (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => !sending && (e.currentTarget.style.opacity = '1')}
              >
                {sending ? '⏳' : '📤'} Enviar
              </button>
            </div>
          </div>
        ) : (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#666',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <div style={{ fontSize: '20px' }}>Selecciona una conversación para empezar</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}>
        <div style={{ fontSize: '20px', color: '#666' }}>⏳ Cargando...</div>
      </div>
    }>
      <InboxPageContent />
    </Suspense>
  );
}
