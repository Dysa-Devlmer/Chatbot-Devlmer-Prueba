'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Search, 
  Send, 
  Bot, 
  UserCheck, 
  ArrowLeft, 
  CheckCheck, 
  Sparkles, 
  Zap, 
  X, 
  Phone, 
  Volume2, 
  VolumeX, 
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';

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
  tags?: string;
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

function InboxInner() {
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isChangingMode, setIsChangingMode] = useState(false);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'vip'>('all');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesRef = useRef<Message[]>([]);

  // Notifications hook
  const {
    soundEnabled,
    setSoundEnabled,
    notifyNewMessage,
    setUnreadCount,
  } = useNotifications();

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages]);

  // Initial loads
  useEffect(() => {
    fetchQuickReplies();
    fetchTotalUnreadCount();
  }, []);

  // Fetch conversations polling (every 10s)
  useEffect(() => {
    fetchConversations();
    fetchTotalUnreadCount();
    const interval = setInterval(() => {
      fetchConversations();
      fetchTotalUnreadCount();
    }, 10000);
    return () => clearInterval(interval);
  }, [searchParams]);

  // Fetch messages when conversation selected + poll every 4s
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      fetchAiSuggestions(selectedConversation.id);
      const interval = setInterval(() => fetchMessages(selectedConversation.id), 4000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation?.id]);

  // Notify on new inbound messages
  useEffect(() => {
    if (messages.length > 0 && prevMessagesRef.current.length > 0) {
      const prevIds = new Set(prevMessagesRef.current.map((m) => m.id));
      const newMessages = messages.filter(
        (m) => !prevIds.has(m.id) && m.direction === 'inbound'
      );
      newMessages.forEach((msg) => notifyNewMessage(msg));
    }
    prevMessagesRef.current = messages;
  }, [messages, notifyNewMessage]);

  const fetchQuickReplies = async () => {
    try {
      const res = await fetch('/api/admin/quick-replies');
      if (res.ok) {
        const data = await res.json();
        setQuickReplies(data.quickReplies || []);
      }
    } catch (err) {
      console.error('Error fetching quick replies:', err);
    }
  };

  const fetchTotalUnreadCount = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setTotalUnreadCount(data.stats?.unreadConversations || 0);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    }
  };

  const fetchAiSuggestions = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/admin/ai?action=suggestions&conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setAiSuggestions(data.suggestions || []);
      }
    } catch {
      setAiSuggestions([]);
    }
  };

  const fetchConversations = async () => {
    try {
      const mode = searchParams?.get('mode');
      const unread = searchParams?.get('unread');

      let url = '/api/admin/conversations?status=active';
      if (mode) url += `&botMode=${mode}`;
      if (unread) url += `&unreadOnly=true`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const convs: Conversation[] = data.conversations || [];
        setConversations(convs);

        if (selectedConversation) {
          const updated = convs.find(c => c.id === selectedConversation.id);
          if (updated) setSelectedConversation(updated);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      const res = await fetch(`/api/admin/messages?conversationId=${conversationId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const selectConversation = async (conversation: Conversation) => {
    setSelectedConversation(conversation);
    setTimeout(() => inputRef.current?.focus(), 150);

    if (conversation.isUnread) {
      try {
        await fetch('/api/admin/conversations', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: conversation.id,
            isUnread: false,
          }),
        });
        setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, isUnread: false } : c));
        setTotalUnreadCount(prev => Math.max(0, prev - 1));
      } catch (err) {
        console.error('Error marking conversation read:', err);
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      if (totalUnreadCount === 0) return;
      await fetch('/api/admin/conversations', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'markAllAsRead' }),
      });
      setConversations(prev => prev.map(c => ({ ...c, isUnread: false })));
      setTotalUnreadCount(0);
      setUnreadCount(0);
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const toggleBotMode = async () => {
    if (!selectedConversation || isChangingMode) return;
    const newMode = selectedConversation.botMode === 'auto' ? 'manual' : 'auto';
    setIsChangingMode(true);

    try {
      await fetch('/api/admin/conversations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          botMode: newMode,
        }),
      });

      setSelectedConversation(prev => prev ? { ...prev, botMode: newMode } : null);
      setConversations(prev => prev.map(c => c.id === selectedConversation.id ? { ...c, botMode: newMode } : c));
    } catch (err) {
      console.error('Error toggling bot mode:', err);
    } finally {
      setIsChangingMode(false);
    }
  };

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || sending) return;
    const contentToSend = messageInput.trim();
    setSending(true);

    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      content: contentToSend,
      direction: 'outbound',
      sentBy: 'human',
      timestamp: new Date().toISOString(),
      type: 'text',
      user: selectedConversation.user,
    };
    setMessages(prev => [...prev, tempMsg]);
    setMessageInput('');
    setShowQuickReplies(false);

    try {
      const res = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          content: contentToSend,
          phoneNumber: selectedConversation.user.phoneNumber,
        }),
      });

      if (res.ok) {
        await fetchMessages(selectedConversation.id);
      }
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error de conexión al enviar el mensaje');
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const formatMessageTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const formatChatListTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const now = new Date();
      const isToday = d.toDateString() === now.toDateString();
      if (isToday) {
        return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
      }
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' });
    } catch {
      return '';
    }
  };

  // Helper to render formatted text with bold highlights like WhatsApp
  const renderMessageContent = (text: string) => {
    // Process **text** or *text* into strong
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
        const clean = part.replace(/^\*+|\*+$/g, '');
        return <strong key={index} className="font-bold text-inherit">{clean}</strong>;
      }
      return part;
    });
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = 
      (c.user.name && c.user.name.toLowerCase().includes(search.toLowerCase())) ||
      c.user.phoneNumber.includes(search) ||
      (c.messages[0] && c.messages[0].content.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTab === 'unread') return c.isUnread;
    if (filterTab === 'vip') return c.user.isVIP;
    return true;
  });

  return (
    <div className="w-full h-[calc(100dvh-5.5rem)] md:h-[calc(100vh-6.5rem)] flex overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] shadow-xl relative">
      
      {/* =========================================================================
          MASTER VIEW: CHAT LIST
          On Mobile (< md): Visible when selectedConversation === null
          On Desktop (>= md): Always visible (360px-380px fixed width)
         ========================================================================= */}
      <aside 
        className={`w-full md:w-80 lg:w-[380px] shrink-0 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] ${
          selectedConversation !== null ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Top Header: WhatsApp Style Title & Quick Actions */}
        <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/80 dark:bg-[#111b21]">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Chats
            </h1>
            {totalUnreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-[#25d366] text-white">
                {totalUnreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {totalUnreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                title="Marcar todos como leídos"
                className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 transition-colors"
              >
                ✓ Todo leído
              </button>
            )}

            <button
              onClick={() => fetchConversations()}
              title="Refrescar chats"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar un chat o mensaje..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#202c33] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00a884]/30 border-none transition-all"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterTab === 'all'
                  ? 'bg-[#00a884] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Todos ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
                filterTab === 'unread'
                  ? 'bg-[#00a884] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              <span>No leídos</span>
              {totalUnreadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterTab === 'unread' ? 'bg-white text-[#00a884]' : 'bg-[#25d366] text-white'
                }`}>
                  {totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('vip')}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                filterTab === 'vip'
                  ? 'bg-[#00a884] text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-[#202c33] text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              ⭐ VIP
            </button>
          </div>
        </div>

        {/* Scrollable Chat List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Cargando conversaciones...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No hay chats en esta vista</p>
              <p className="text-[11px] text-slate-400 mt-1">Los mensajes entrantes de WhatsApp aparecerán aquí automáticamente.</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = selectedConversation?.id === conv.id;
              const lastMsg = conv.messages[0];
              const isOutbound = lastMsg?.direction === 'outbound';
              const displayName = conv.user.name || `+${conv.user.phoneNumber}`;
              const avatarLetter = (conv.user.name?.charAt(0) || conv.user.phoneNumber.charAt(0) || 'U').toUpperCase();

              return (
                <div
                  key={conv.id}
                  onClick={() => selectConversation(conv)}
                  className={`w-full p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer transition-colors active:bg-slate-200 dark:active:bg-[#202c33] ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-[#202c33]'
                      : 'hover:bg-slate-50 dark:hover:bg-[#182229]'
                  }`}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-slate-600 to-slate-400 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-white font-extrabold text-base shadow-sm overflow-hidden">
                      {conv.user.profilePicUrl ? (
                        <img src={conv.user.profilePicUrl} alt={displayName} className="w-full h-full object-cover" />
                      ) : (
                        <span>{avatarLetter}</span>
                      )}
                    </div>
                    <div 
                      title={conv.botMode === 'auto' ? 'IA en modo automático' : 'Atención manual activa'}
                      className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-[#111b21] flex items-center justify-center text-[8px] ${
                        conv.botMode === 'auto' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950 font-bold'
                      }`}
                    >
                      {conv.botMode === 'auto' ? '🤖' : '👤'}
                    </div>
                  </div>

                  {/* Chat Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className={`text-sm truncate ${
                          conv.isUnread ? 'font-extrabold text-slate-900 dark:text-white' : 'font-semibold text-slate-800 dark:text-slate-200'
                        }`}>
                          {displayName}
                        </span>
                        {conv.user.isVIP && (
                          <span className="text-[10px] text-amber-500 shrink-0">⭐</span>
                        )}
                      </div>
                      <span className={`text-[11px] shrink-0 font-medium ${
                        conv.isUnread ? 'text-[#00a884] font-bold' : 'text-slate-400'
                      }`}>
                        {lastMsg ? formatChatListTime(lastMsg.timestamp) : ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 truncate">
                        {isOutbound && (
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500 shrink-0 stroke-[2.5]" />
                        )}
                        <span className={`truncate ${conv.isUnread ? 'font-semibold text-slate-900 dark:text-slate-100' : ''}`}>
                          {lastMsg ? lastMsg.content : 'Sin mensajes'}
                        </span>
                      </div>

                      {conv.isUnread && (
                        <span className="shrink-0 min-w-[20px] h-5 px-1.5 rounded-full bg-[#25d366] text-white text-[11px] font-extrabold flex items-center justify-center shadow-sm">
                          1
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>

      {/* =========================================================================
          DETAIL VIEW: CHAT CONVERSATION
          On Mobile (< md): fixed inset-0 z-[60] h-[100dvh] w-full (covers top and bottom nav)
          On Desktop (>= md): static flex-1 h-full
         ========================================================================= */}
      <section 
        className={`${
          selectedConversation === null
            ? 'hidden md:flex md:flex-1 md:flex-col md:h-full bg-slate-50 dark:bg-[#111b21]'
            : 'fixed inset-0 z-[60] md:static md:z-auto md:flex-1 flex flex-col h-[100dvh] md:h-full w-full bg-[#efeae2] dark:bg-[#0b141a]'
        }`}
      >
        {selectedConversation === null ? (
          /* Desktop Empty State (WhatsApp Web Style) */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-slate-50 dark:bg-[#111b21]">
            <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-sm">
              <MessageSquare className="w-10 h-10 stroke-[1.8]" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
              PITHY WhatsApp Business
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm leading-relaxed">
              Selecciona una conversación de la lista para leer, responder manualmente o activar el asistente de IA para Churu&apos;s Comida Rápida.
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-slate-400">
              <LockIcon className="w-3.5 h-3.5" />
              <span>Conexión cifrada de extremo a extremo</span>
            </div>
          </div>
        ) : (
          /* Active Chat Conversation View */
          <div className="flex-1 flex flex-col h-full w-full overflow-hidden">
            
            {/* Conversation Header */}
            <div className="h-14 sm:h-16 px-2.5 sm:px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm z-10 w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Back button for mobile */}
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 -ml-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all shrink-0 md:hidden"
                  title="Volver a los chats"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Contact Avatar */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-slate-600 to-slate-400 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm overflow-hidden">
                  {selectedConversation.user.profilePicUrl ? (
                    <img 
                      src={selectedConversation.user.profilePicUrl} 
                      alt={selectedConversation.user.name || 'Usuario'} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <span>{(selectedConversation.user.name?.charAt(0) || 'U').toUpperCase()}</span>
                  )}
                </div>

                {/* Name & Subtitle */}
                <div className="min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {selectedConversation.user.name || `+${selectedConversation.user.phoneNumber}`}
                    </span>
                    {selectedConversation.user.isVIP && <span className="text-xs">⭐</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span>+{selectedConversation.user.phoneNumber}</span>
                    <span>•</span>
                    <span className={`font-semibold ${
                      selectedConversation.botMode === 'auto' ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}>
                      {selectedConversation.botMode === 'auto' ? '🤖 Bot Auto' : '👤 Manual'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Header Right Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* Bot Mode Switcher */}
                <button
                  onClick={toggleBotMode}
                  disabled={isChangingMode}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 border shadow-sm ${
                    selectedConversation.botMode === 'auto'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  }`}
                  title={selectedConversation.botMode === 'auto' ? 'Cambiar a atención humana' : 'Reactivar IA automática'}
                >
                  {selectedConversation.botMode === 'auto' ? (
                    <>
                      <Bot className="w-4 h-4 text-emerald-600" />
                      <span className="text-[11px] sm:text-xs">Bot</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4 text-amber-600" />
                      <span className="text-[11px] sm:text-xs">Manual</span>
                    </>
                  )}
                </button>

                {/* Direct WhatsApp Call */}
                <a
                  href={`https://wa.me/${selectedConversation.user.phoneNumber.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 rounded-xl text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                  title="Abrir WhatsApp oficial"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Messages Scroll Area - WITH min-h-0 TO PREVENT OVERFLOWING INPUT BAR */}
            <div 
              className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 scrollbar-thin"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Date banner */}
              <div className="flex justify-center my-1">
                <span className="px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider bg-white/95 dark:bg-[#182229]/95 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200/60 dark:border-slate-700/60">
                  Hoy
                </span>
              </div>

              {messages.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No hay mensajes registrados en este chat.
                </div>
              ) : (
                messages.map((msg) => {
                  const isOutbound = msg.direction === 'outbound';

                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col w-full ${isOutbound ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm relative transition-all ${
                          isOutbound
                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-none border border-emerald-200/60 dark:border-transparent'
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-transparent'
                        }`}
                      >
                        {/* Sender Label for Outbound */}
                        {isOutbound && (
                          <div className="text-[10px] font-bold text-emerald-800 dark:text-emerald-300 mb-1 flex items-center gap-1">
                            {msg.sentBy === 'bot' ? (
                              <>
                                <Bot className="w-3 h-3" />
                                <span>IA Asistente (Churu&apos;s)</span>
                              </>
                            ) : (
                              <>
                                <UserCheck className="w-3 h-3" />
                                <span>Administrador</span>
                              </>
                            )}
                          </div>
                        )}

                        {/* Content text formatted */}
                        <div className="whitespace-pre-wrap break-words leading-relaxed text-[13px] sm:text-sm">
                          {renderMessageContent(msg.content)}
                        </div>

                        {/* Footer: Time & Double Check */}
                        <div className="flex items-center justify-end gap-1 mt-1.5 text-[10px] text-slate-500 dark:text-slate-300">
                          <span>{formatMessageTime(msg.timestamp)}</span>
                          {isOutbound && (
                            <CheckCheck className="w-3.5 h-3.5 text-blue-500 stroke-[2.5]" />
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* AI Response Suggestions Bar (Quick Tap Chips) */}
            {aiSuggestions.length > 0 && (
              <div className="px-3 py-2 bg-slate-100/95 dark:bg-[#182229]/95 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1 shrink-0">
                  <Sparkles className="w-3.5 h-3.5" />
                  Sugerencias:
                </span>
                {aiSuggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => setMessageInput(sug)}
                    className="px-2.5 py-1 rounded-full text-xs bg-white dark:bg-[#202c33] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 whitespace-nowrap active:scale-95 transition-all shrink-0 shadow-sm"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            {/* Quick Replies Drawer */}
            {showQuickReplies && (
              <div className="p-3 bg-white dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto space-y-1.5 shadow-lg animate-in slide-in-from-bottom-2 shrink-0">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Respuestas Rápidas (Escribe / para autocompletar)
                  </span>
                  <button onClick={() => setShowQuickReplies(false)} className="p-1 text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {quickReplies.map((qr) => (
                  <div
                    key={qr.id}
                    onClick={() => {
                      setMessageInput(qr.content);
                      setShowQuickReplies(false);
                      inputRef.current?.focus();
                    }}
                    className="p-2 rounded-xl bg-slate-50 dark:bg-[#111b21] hover:bg-emerald-50 dark:hover:bg-emerald-950/40 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100 mr-2">
                        {qr.emoji} {qr.title}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">{qr.shortcut}</span>
                    </div>
                    <span className="text-emerald-600 font-bold text-[10px]">Usar</span>
                  </div>
                ))}
              </div>
            )}

            {/* Fixed Chat Input Bar - ALWAYS PINNED AT THE BOTTOM */}
            <div className="p-2 sm:p-3 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center gap-2 shrink-0 pb-[max(0.6rem,env(safe-area-inset-bottom))] w-full">
              {/* Quick Replies Button */}
              <button
                type="button"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="w-9 h-9 rounded-full flex items-center justify-center text-slate-500 hover:text-amber-600 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Respuestas Rápidas"
              >
                <Zap className="w-5 h-5" />
              </button>

              {/* Text Input Form */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex-1 flex items-center gap-2 min-w-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Escribe un mensaje..."
                  value={messageInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMessageInput(val);
                    if (val.startsWith('/')) setShowQuickReplies(true);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white dark:bg-[#2a3942] text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none border border-slate-200 dark:border-transparent focus:ring-2 focus:ring-[#00a884]/40 shadow-inner min-w-0"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!messageInput.trim() || sending}
                  className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] disabled:opacity-40 text-white shadow-md flex items-center justify-center transition-all active:scale-95 shrink-0"
                  title="Enviar mensaje"
                >
                  <Send className="w-4 h-4 stroke-[2.2] translate-x-0.5" />
                </button>
              </form>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function LockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Cargando bandeja WhatsApp...</span>
      </div>
    }>
      <InboxInner />
    </Suspense>
  );
}
