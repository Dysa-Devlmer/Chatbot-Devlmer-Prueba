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

interface QuickReply {
  id: string;
  title: string;
  shortcut: string;
  content: string;
  category: string;
  emoji: string;
  usageCount: number;
}

function InboxContent() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [filteredReplies, setFilteredReplies] = useState<QuickReply[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch quick replies on mount
  useEffect(() => {
    fetchQuickReplies();
  }, []);

  // Fetch conversations
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [searchParams]);

  // Fetch messages when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      const interval = setInterval(() => fetchMessages(selectedConversation.id), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter quick replies based on input
  useEffect(() => {
    if (messageInput.startsWith('/')) {
      const search = messageInput.toLowerCase();
      const filtered = quickReplies.filter(
        (r) => r.shortcut.toLowerCase().includes(search) || r.title.toLowerCase().includes(search.slice(1))
      );
      setFilteredReplies(filtered);
      setShowQuickReplies(filtered.length > 0);
    } else {
      setShowQuickReplies(false);
    }
  }, [messageInput, quickReplies]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + number to send quick reply
      if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        const visibleReplies = selectedCategory === 'all'
          ? quickReplies.slice(0, 9)
          : quickReplies.filter((r) => r.category === selectedCategory).slice(0, 9);

        if (visibleReplies[index] && selectedConversation) {
          e.preventDefault();
          useQuickReply(visibleReplies[index]);
        }
      }

      // Escape to close quick replies
      if (e.key === 'Escape') {
        setShowQuickReplies(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [quickReplies, selectedCategory, selectedConversation]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchQuickReplies = async () => {
    try {
      const response = await fetch('/api/admin/quick-replies');
      const data = await response.json();
      setQuickReplies(data.quickReplies || []);
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching quick replies:', error);
    }
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
    inputRef.current?.focus();

    if (conversation.isUnread) {
      await fetch('/api/admin/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          isUnread: false,
        }),
      });

      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, isUnread: false } : c))
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

      if (selectedConversation?.id === conversationId) {
        setSelectedConversation({ ...selectedConversation, botMode: newMode });
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, botMode: newMode } : c))
      );
    } catch (error) {
      console.error('Error toggling bot mode:', error);
    }
  };

  const useQuickReply = async (reply: QuickReply) => {
    setMessageInput(reply.content);
    setShowQuickReplies(false);
    inputRef.current?.focus();

    // Incrementar contador de uso
    try {
      await fetch('/api/admin/quick-replies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: reply.id, incrementUsage: true }),
      });
    } catch (error) {
      console.error('Error updating usage:', error);
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

  const getCategoryColor = (category: string): string => {
    const colors: Record<string, string> = {
      general: '#667eea',
      info: '#4ECDC4',
      ventas: '#FF6B6B',
      soporte: '#FFA500',
    };
    return colors[category] || '#666';
  };

  const getCategoryEmoji = (category: string): string => {
    const emojis: Record<string, string> = {
      general: '💬',
      info: 'ℹ️',
      ventas: '💰',
      soporte: '🔧',
    };
    return emojis[category] || '📝';
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={{ fontSize: '20px', color: '#666' }}>⏳ Cargando conversaciones...</div>
      </div>
    );
  }

  const displayedReplies =
    selectedCategory === 'all'
      ? quickReplies
      : quickReplies.filter((r) => r.category === selectedCategory);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <Link href="/admin" style={{ color: 'white', textDecoration: 'none', fontSize: '24px' }}>
            ←
          </Link>
          <h1 style={{ margin: 0, fontSize: '24px' }}>📥 Bandeja de Mensajes - PITHY</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span style={{ fontSize: '14px', opacity: 0.9 }}>
            {conversations.length} conversaciones
          </span>
          <Link href="/admin/quick-replies" style={styles.manageRepliesBtn}>
            ⚙️ Gestionar Respuestas
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>
        {/* Conversation List */}
        <div style={styles.conversationList}>
          {conversations.length === 0 ? (
            <div style={styles.emptyConversations}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>💬</div>
              <div>No hay conversaciones</div>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => selectConversation(conv)}
                style={{
                  ...styles.conversationItem,
                  background: selectedConversation?.id === conv.id ? '#f0f2f5' : 'white',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                  <div style={{ fontWeight: conv.isUnread ? 'bold' : 'normal', fontSize: '16px' }}>
                    {conv.user.name || conv.user.phoneNumber}
                    {conv.user.isVIP && ' ⭐'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{formatDate(conv.startedAt)}</div>
                </div>
                <div style={styles.conversationPreview}>
                  {conv.messages[0]?.content || 'Sin mensajes'}
                </div>
                <div style={{ display: 'flex', gap: '5px', marginTop: '8px' }}>
                  {conv.isUnread && <span style={styles.badgeNew}>Nuevo</span>}
                  <span
                    style={{
                      ...styles.badgeMode,
                      background: conv.botMode === 'auto' ? '#4ECDC4' : '#FF6B6B',
                    }}
                  >
                    {conv.botMode === 'auto' ? '🤖 Auto' : '👤 Manual'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        {selectedConversation ? (
          <div style={styles.chatArea}>
            {/* Chat Header */}
            <div style={styles.chatHeader}>
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
                  ...styles.modeButton,
                  background: selectedConversation.botMode === 'auto' ? '#4ECDC4' : '#FF6B6B',
                }}
              >
                {selectedConversation.botMode === 'auto' ? '🤖 Modo Automático' : '👤 Modo Manual'}
              </button>
            </div>

            {/* Messages */}
            <div style={styles.messagesContainer}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    justifyContent: msg.direction === 'inbound' ? 'flex-start' : 'flex-end',
                    marginBottom: '10px',
                  }}
                >
                  <div
                    style={{
                      ...styles.messageBubble,
                      background: msg.direction === 'inbound' ? 'white' : '#dcf8c6',
                    }}
                  >
                    <div style={{ fontSize: '15px', marginBottom: '5px', whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </div>
                    <div style={styles.messageTime}>
                      {formatTime(msg.timestamp)}
                      {msg.sentBy === 'human' && ' 👤'}
                      {msg.sentBy === 'bot' && ' 🤖'}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Panel */}
            <div style={styles.quickRepliesPanel}>
              <div style={styles.quickRepliesHeader}>
                <span style={styles.quickRepliesTitle}>⚡ Respuestas Rápidas</span>
                <div style={styles.categoryTabs}>
                  <button
                    onClick={() => setSelectedCategory('all')}
                    style={{
                      ...styles.categoryTab,
                      background: selectedCategory === 'all' ? '#667eea' : 'transparent',
                      color: selectedCategory === 'all' ? 'white' : '#666',
                    }}
                  >
                    Todas
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        ...styles.categoryTab,
                        background: selectedCategory === cat ? getCategoryColor(cat) : 'transparent',
                        color: selectedCategory === cat ? 'white' : '#666',
                      }}
                    >
                      {getCategoryEmoji(cat)} {cat}
                    </button>
                  ))}
                </div>
              </div>
              <div style={styles.quickRepliesGrid}>
                {displayedReplies.slice(0, 9).map((reply, index) => (
                  <button
                    key={reply.id}
                    onClick={() => useQuickReply(reply)}
                    style={{
                      ...styles.quickReplyButton,
                      borderLeft: `4px solid ${getCategoryColor(reply.category)}`,
                    }}
                    title={`${reply.content}\n\nAtajo: Ctrl+${index + 1}`}
                  >
                    <span style={styles.quickReplyEmoji}>{reply.emoji}</span>
                    <span style={styles.quickReplyTitle}>{reply.title}</span>
                    <span style={styles.quickReplyShortcut}>{reply.shortcut}</span>
                    <span style={styles.quickReplyHotkey}>⌘{index + 1}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Command suggestions popup */}
            {showQuickReplies && (
              <div style={styles.suggestionsPopup}>
                {filteredReplies.map((reply) => (
                  <div
                    key={reply.id}
                    onClick={() => useQuickReply(reply)}
                    style={styles.suggestionItem}
                  >
                    <span style={{ fontSize: '20px' }}>{reply.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '600' }}>{reply.title}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{reply.shortcut}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div style={styles.inputArea}>
              <input
                ref={inputRef}
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
                placeholder="Escribe un mensaje... (usa / para respuestas rápidas)"
                disabled={sending}
                style={styles.input}
              />
              <button
                onClick={sendMessage}
                disabled={sending || !messageInput.trim()}
                style={{
                  ...styles.sendButton,
                  background: sending ? '#ccc' : '#25D366',
                  cursor: sending ? 'not-allowed' : 'pointer',
                }}
              >
                {sending ? '⏳' : '📤'} Enviar
              </button>
            </div>
          </div>
        ) : (
          <div style={styles.noConversation}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '64px', marginBottom: '20px' }}>💬</div>
              <div style={{ fontSize: '20px' }}>Selecciona una conversación para empezar</div>
              <div style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
                💡 Tip: Usa <kbd style={styles.kbd}>Ctrl+1</kbd> a <kbd style={styles.kbd}>Ctrl+9</kbd>{' '}
                para enviar respuestas rápidas
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div style={styles.loadingContainer}>
          <div style={{ fontSize: '20px', color: '#666' }}>⏳ Cargando...</div>
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: '#f0f2f5',
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
    padding: '15px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  manageRepliesBtn: {
    background: 'rgba(255,255,255,0.2)',
    color: 'white',
    padding: '8px 16px',
    borderRadius: '20px',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'background 0.2s',
  },
  mainContent: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  conversationList: {
    width: '350px',
    background: 'white',
    borderRight: '1px solid #e0e0e0',
    overflowY: 'auto',
  },
  emptyConversations: {
    padding: '40px 20px',
    textAlign: 'center',
    color: '#666',
  },
  conversationItem: {
    padding: '15px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  conversationPreview: {
    fontSize: '14px',
    color: '#666',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  badgeNew: {
    background: '#25D366',
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  badgeMode: {
    color: 'white',
    padding: '2px 8px',
    borderRadius: '10px',
    fontSize: '11px',
  },
  chatArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    background: '#e5ddd5',
  },
  chatHeader: {
    background: 'white',
    padding: '15px 20px',
    borderBottom: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modeButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '20px',
  },
  messageBubble: {
    maxWidth: '65%',
    padding: '10px 15px',
    borderRadius: '10px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
  },
  messageTime: {
    fontSize: '11px',
    color: '#667',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
  },
  quickRepliesPanel: {
    background: 'white',
    borderTop: '1px solid #e0e0e0',
    padding: '15px',
  },
  quickRepliesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
  },
  quickRepliesTitle: {
    fontWeight: '600',
    color: '#333',
    fontSize: '14px',
  },
  categoryTabs: {
    display: 'flex',
    gap: '5px',
  },
  categoryTab: {
    padding: '5px 12px',
    border: 'none',
    borderRadius: '15px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s',
  },
  quickRepliesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '8px',
  },
  quickReplyButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 12px',
    background: '#f8f9fa',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.2s',
    position: 'relative',
  },
  quickReplyEmoji: {
    fontSize: '18px',
  },
  quickReplyTitle: {
    flex: 1,
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
  },
  quickReplyShortcut: {
    fontSize: '11px',
    color: '#999',
  },
  quickReplyHotkey: {
    position: 'absolute',
    top: '5px',
    right: '5px',
    fontSize: '10px',
    color: '#bbb',
    background: '#eee',
    padding: '2px 6px',
    borderRadius: '4px',
  },
  suggestionsPopup: {
    position: 'absolute',
    bottom: '180px',
    left: '370px',
    right: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    padding: '10px',
    maxHeight: '200px',
    overflowY: 'auto',
    zIndex: 1000,
  },
  suggestionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  inputArea: {
    background: 'white',
    padding: '15px 20px',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    gap: '10px',
  },
  input: {
    flex: 1,
    padding: '12px 15px',
    borderRadius: '25px',
    border: '1px solid #e0e0e0',
    fontSize: '15px',
    outline: 'none',
  },
  sendButton: {
    padding: '12px 30px',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    fontSize: '15px',
    fontWeight: 'bold',
    transition: 'opacity 0.2s',
  },
  noConversation: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#666',
  },
  kbd: {
    background: '#eee',
    padding: '3px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontFamily: 'monospace',
  },
};
