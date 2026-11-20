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
  Check,
  Clock, 
  Sparkles, 
  Zap, 
  X, 
  Phone, 
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  Pin,
  Plus,
  Volume2, 
  VolumeX, 
  RefreshCw,
  MessageSquare,
  Lock as LockIcon,
  ChevronUp,
  ChevronDown
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
  quotedMessage?: {
    content: string;
    sender: string;
  };
}

interface Conversation {
  id: string;
  status: string;
  botMode: string;
  isUnread: boolean;
  isPinned?: boolean;
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
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'favorites'>('all');
  const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
  const [showQuickReplies, setShowQuickReplies] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [totalUnreadCount, setTotalUnreadCount] = useState(0);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');

  // Buscador de palabras en la conversación activa (In-Chat Search)
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearchQuery, setChatSearchQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const chatSearchInputRef = useRef<HTMLInputElement>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevMessagesRef = useRef<Message[]>([]);
  const isNearBottomRef = useRef(true);
  const prevSelectedConvIdRef = useRef<string | null>(null);
  const userJustSentMessageRef = useRef(false);

  // Notifications hook
  const {
    soundEnabled,
    setSoundEnabled,
    notifyNewMessage,
    setUnreadCount,
  } = useNotifications();

  // Detección precisa de scroll: distancia al fondo < 120px
  const checkIsNearBottom = () => {
    const container = scrollContainerRef.current;
    if (!container) return true;
    const distance = container.scrollHeight - container.scrollTop - container.clientHeight;
    return distance < 120;
  };

  const handleMessagesScroll = () => {
    isNearBottomRef.current = checkIsNearBottom();
  };

  // Scroll to bottom
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior,
      });
    } else {
      messagesEndRef.current?.scrollIntoView({ behavior });
    }
  };

  // Regla de oro de Scroll:
  // 1. Si se abre una conversación nueva -> ir al fondo de inmediato ('auto')
  // 2. Si el usuario acaba de enviar un mensaje -> ir al fondo suavemente ('smooth')
  // 3. Si el usuario ya estaba en el fondo (< 120px) -> ir al fondo suavemente ('smooth')
  // 4. Si el operador hizo scroll arriba leyendo historial -> scroll completamente congelado!
  useEffect(() => {
    if (!selectedConversation) return;

    const isNewConv = prevSelectedConvIdRef.current !== selectedConversation.id;
    if (isNewConv) {
      prevSelectedConvIdRef.current = selectedConversation.id;
      isNearBottomRef.current = true;
      userJustSentMessageRef.current = false;
      setTimeout(() => scrollToBottom('auto'), 60);
      return;
    }

    if (userJustSentMessageRef.current) {
      userJustSentMessageRef.current = false;
      isNearBottomRef.current = true;
      scrollToBottom('smooth');
    } else if (isNearBottomRef.current) {
      scrollToBottom('smooth');
    }
  }, [messages, selectedConversation?.id]);

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
    setShowChatSearch(false);
    setChatSearchQuery('');
    setCurrentMatchIndex(0);
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

  // Requerimiento 3: En desktop (>= 1024px), si hay conversaciones activas,
  // selecciona automáticamente el primer chat por defecto para que la pantalla nunca quede vacía.
  useEffect(() => {
    if (loading) return;
    if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
      if (!selectedConversation && conversations.length > 0) {
        selectConversation(conversations[0]);
      }
    }
  }, [conversations, loading, selectedConversation]);

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
    userJustSentMessageRef.current = true;
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

  const handleCreateNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChatPhone.trim()) return;

    try {
      const cleanPhone = newChatPhone.replace(/\D/g, '');
      const res = await fetch('/api/admin/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          name: newChatName.trim() || null,
        }),
      });

      if (res.ok) {
        setShowNewChatModal(false);
        setNewChatPhone('');
        setNewChatName('');
        await fetchConversations();
      }
    } catch (err) {
      console.error('Error creating chat:', err);
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

  // Requerimiento 2: Lógica del Buscador en la conversación activa (In-Chat Search)
  const matchingMessages = chatSearchQuery.trim()
    ? messages.filter((m) => m.content.toLowerCase().includes(chatSearchQuery.toLowerCase()))
    : [];

  const scrollToMatch = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const goToNextMatch = () => {
    if (matchingMessages.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % matchingMessages.length;
    setCurrentMatchIndex(nextIdx);
    scrollToMatch(matchingMessages[nextIdx].id);
  };

  const goToPrevMatch = () => {
    if (matchingMessages.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + matchingMessages.length) % matchingMessages.length;
    setCurrentMatchIndex(prevIdx);
    scrollToMatch(matchingMessages[prevIdx].id);
  };

  useEffect(() => {
    if (chatSearchQuery.trim() && matchingMessages.length > 0) {
      setCurrentMatchIndex(0);
      scrollToMatch(matchingMessages[0].id);
    }
  }, [chatSearchQuery]);

  const renderMessageContent = (text: string, highlightQuery?: string) => {
    if (!text) return null;

    const highlightText = (segment: string) => {
      if (!highlightQuery || !highlightQuery.trim()) return segment;
      const escaped = highlightQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escaped})`, 'gi');
      const subParts = segment.split(regex);
      return subParts.map((sub, i) =>
        sub.toLowerCase() === highlightQuery.toLowerCase() ? (
          <mark key={i} className="bg-amber-300 dark:bg-amber-500/70 text-slate-950 dark:text-white px-0.5 rounded font-bold">
            {sub}
          </mark>
        ) : (
          sub
        )
      );
    };

    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, index) => {
      if ((part.startsWith('**') && part.endsWith('**')) || (part.startsWith('*') && part.endsWith('*'))) {
        const clean = part.replace(/^\*+|\*+$/g, '');
        return <strong key={index} className="font-bold text-inherit">{highlightText(clean)}</strong>;
      }
      return <span key={index}>{highlightText(part)}</span>;
    });
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesSearch = 
      (c.user.name && c.user.name.toLowerCase().includes(search.toLowerCase())) ||
      c.user.phoneNumber.includes(search) ||
      (c.messages[0] && c.messages[0].content.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterTab === 'unread') return c.isUnread;
    if (filterTab === 'favorites') return c.user.isVIP;
    return true;
  });

  return (
    <div className="w-full h-full flex overflow-hidden rounded-none md:rounded-2xl border-0 md:border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] md:shadow-xl relative">
      
      {/* =========================================================================
          COLUMNA IZQUIERDA: LISTA DE CHATS (320px - 380px)
          Desktop: Visible siempre (WhatsApp Web 2 columnas)
          Móvil: Visible cuando selectedConversation === null
         ========================================================================= */}
      <aside 
        className={`w-full md:w-80 lg:w-[380px] shrink-0 flex flex-col h-full border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111b21] ${
          selectedConversation !== null ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header Superior: Título Chats, Menú (3 puntos) y Botón + Nuevo Chat */}
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

          <div className="flex items-center gap-1.5">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Silenciar alertas' : 'Activar sonido'}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Botón "+ Nuevo chat" con estilo propio PITHY */}
            <button
              onClick={() => setShowNewChatModal(true)}
              title="Iniciar nuevo chat"
              className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white shadow-sm transition-all flex items-center justify-center"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
            </button>

            {/* Menú de 3 puntos */}
            <button
              onClick={markAllAsRead}
              title="Marcar todos como leídos"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda con estilo PITHY */}
        <div className="p-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar un chat o iniciar uno nuevo"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 border-none transition-all"
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

          {/* Filtros de píldora deslizables */}
          <div className="flex items-center gap-1.5 mt-2.5 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Todos ({conversations.length})
            </button>
            <button
              onClick={() => setFilterTab('unread')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1 transition-all ${
                filterTab === 'unread'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>No leídos</span>
              {totalUnreadCount > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  filterTab === 'unread' ? 'bg-white text-indigo-600' : 'bg-indigo-500 text-white'
                }`}>
                  {totalUnreadCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilterTab('favorites')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                filterTab === 'favorites'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              ⭐ Favoritos
            </button>
          </div>
        </div>

        {/* Tarjetas de conversación */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 scrollbar-thin">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs">Cargando conversaciones...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">No hay chats en esta vista</p>
              <p className="text-[11px] text-slate-400 mt-1">Los mensajes entrantes de clientes aparecerán aquí automáticamente en tiempo real.</p>
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
                  className={`w-full p-3 sm:p-3.5 flex items-center gap-3 cursor-pointer transition-colors active:bg-slate-200 dark:active:bg-slate-800 ${
                    isSelected
                      ? 'bg-emerald-50/80 dark:bg-[#202c33] border-l-4 border-[#00a884]'
                      : 'hover:bg-slate-50 dark:hover:bg-[#182229]'
                  }`}
                >
                  {/* Avatar circular con foto o iniciales */}
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

                  {/* Datos del chat */}
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
                        {conv.isPinned && (
                          <Pin className="w-3 h-3 text-slate-400 rotate-45 shrink-0" />
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

                      {/* Badge circular verde con no leídos */}
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
          ÁREA DE CHAT PRINCIPAL (CONVERSACIÓN ACTIVA)
          Desktop (>= md): Columna derecha tipo WhatsApp Web
          Móvil (< md): Ocupa la pantalla dejando visible la MobileBottomNav (bottom-16)
         ========================================================================= */}
      <section 
        className={`${
          selectedConversation === null
            ? 'hidden md:flex md:flex-1 md:flex-col md:h-full bg-slate-50 dark:bg-[#111b21]'
            : 'fixed inset-0 bottom-16 z-40 md:static md:bottom-auto md:z-auto md:flex-1 flex flex-col h-[calc(100dvh-4rem)] md:h-full w-full bg-[#efeae2] dark:bg-[#0b141a]'
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
            
            {/* Header del Chat: Avatar, Nombre, Estado ("en línea"), y botones de acción */}
            <div className="h-14 sm:h-16 px-2.5 sm:px-4 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 shadow-sm z-10 w-full">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                {/* Botón Atrás (←) en móvil para volver a la lista */}
                <button
                  onClick={() => setSelectedConversation(null)}
                  className="p-2 -ml-1 rounded-full text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-90 transition-all shrink-0 md:hidden"
                  title="Volver a los chats"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* Avatar del contacto */}
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

                {/* Nombre y Estado ("en línea" / "Bot activo") */}
                <div className="min-w-0 flex-1 pr-1">
                  <div className="flex items-center gap-1 truncate">
                    <span className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                      {selectedConversation.user.name || `+${selectedConversation.user.phoneNumber}`}
                    </span>
                    {selectedConversation.user.isVIP && <span className="text-xs">⭐</span>}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">en línea</span>
                    <span>•</span>
                    <span className="font-mono">+{selectedConversation.user.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* Botones de acción derecha: Bot Toggle, Buscador en Chat, Cámara, Llamada, Menú */}
              <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
                {/* Toggle Bot Mode */}
                <button
                  onClick={toggleBotMode}
                  disabled={isChangingMode}
                  className={`px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all active:scale-95 border shadow-sm ${
                    selectedConversation.botMode === 'auto'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
                  }`}
                  title={selectedConversation.botMode === 'auto' ? 'Cambiar a atención humana' : 'Reactivar IA automática'}
                >
                  {selectedConversation.botMode === 'auto' ? (
                    <>
                      <Bot className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-[11px] hidden sm:inline">Bot</span>
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span className="text-[11px] hidden sm:inline">Manual</span>
                    </>
                  )}
                </button>

                {/* Requerimiento 2: Botón de Lupa para búsqueda dentro de la conversación */}
                <button
                  onClick={() => {
                    setShowChatSearch(!showChatSearch);
                    if (!showChatSearch) {
                      setTimeout(() => chatSearchInputRef.current?.focus(), 100);
                    } else {
                      setChatSearchQuery('');
                      setCurrentMatchIndex(0);
                    }
                  }}
                  className={`p-2 rounded-xl transition-colors ${
                    showChatSearch
                      ? 'bg-[#00a884]/15 text-[#00a884] dark:bg-[#00a884]/25 dark:text-[#25d366]'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                  title="Buscar en esta conversación"
                >
                  <Search className="w-4 h-4" />
                </button>

                {/* Videollamada */}
                <button
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors hidden sm:block"
                  title="Videollamada"
                >
                  <Video className="w-4 h-4" />
                </button>

                {/* Llamada directa */}
                <a
                  href={`https://wa.me/${selectedConversation.user.phoneNumber.replace(/\+/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
                  title="Llamar o chatear por WhatsApp"
                >
                  <Phone className="w-4 h-4" />
                </a>

                {/* Menú de opciones */}
                <button
                  className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-colors"
                  title="Más opciones"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Requerimiento 2: Barra de búsqueda interna en la conversación (In-Chat Search Bar) */}
            {showChatSearch && (
              <div className="px-3 sm:px-4 py-2 bg-white/95 dark:bg-[#1f2c34]/95 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-sm z-10 shrink-0 animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    ref={chatSearchInputRef}
                    type="text"
                    placeholder="Buscar en este chat (ej: broaster, yape, dirección)..."
                    value={chatSearchQuery}
                    onChange={(e) => setChatSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) goToPrevMatch();
                        else goToNextMatch();
                      } else if (e.key === 'Escape') {
                        setShowChatSearch(false);
                        setChatSearchQuery('');
                      }
                    }}
                    className="w-full text-xs sm:text-sm bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none"
                  />
                  {chatSearchQuery && (
                    <button
                      onClick={() => {
                        setChatSearchQuery('');
                        setCurrentMatchIndex(0);
                      }}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 text-xs">
                  {/* Contador de coincidencias */}
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 min-w-[45px] text-right">
                    {chatSearchQuery.trim()
                      ? matchingMessages.length > 0
                        ? `${currentMatchIndex + 1} de ${matchingMessages.length}`
                        : '0 de 0'
                      : ''}
                  </span>

                  {/* Flechas para navegar */}
                  <button
                    onClick={goToPrevMatch}
                    disabled={matchingMessages.length === 0}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Anterior (Shift + Enter)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={goToNextMatch}
                    disabled={matchingMessages.length === 0}
                    className="p-1 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Siguiente (Enter)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Cerrar barra de búsqueda */}
                  <button
                    onClick={() => {
                      setShowChatSearch(false);
                      setChatSearchQuery('');
                      setCurrentMatchIndex(0);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                    title="Cerrar búsqueda"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Requerimiento 1: Contenedor de mensajes con scrollContainerRef y listener onScroll */}
            <div 
              ref={scrollContainerRef}
              onScroll={handleMessagesScroll}
              className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-3 scrollbar-thin"
              style={{
                backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.05) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            >
              {/* Separador de fecha flotante redondeado en el centro */}
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
                  const isCurrentMatch = matchingMessages.length > 0 && matchingMessages[currentMatchIndex]?.id === msg.id;

                  return (
                    <div
                      id={`msg-${msg.id}`}
                      key={msg.id}
                      className={`flex flex-col w-full ${isOutbound ? 'items-end' : 'items-start'} transition-all`}
                    >
                      <div
                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-3.5 py-2 shadow-sm text-sm relative transition-all ${
                          isCurrentMatch
                            ? 'ring-2 ring-amber-400 dark:ring-amber-400 ring-offset-2 dark:ring-offset-[#0b141a]'
                            : ''
                        } ${
                          isOutbound
                            ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-slate-900 dark:text-slate-100 rounded-tr-none border border-emerald-200/60 dark:border-transparent'
                            : 'bg-white dark:bg-[#202c33] text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/60 dark:border-transparent'
                        }`}
                      >
                        {/* Soporte visual para respuestas citadas */}
                        {msg.quotedMessage && (
                          <div className="mb-2 p-2 rounded-lg bg-black/5 dark:bg-black/20 border-l-4 border-[#00a884] text-xs">
                            <span className="font-bold text-[#00a884] block">{msg.quotedMessage.sender}</span>
                            <span className="text-slate-600 dark:text-slate-300 line-clamp-1">{msg.quotedMessage.content}</span>
                          </div>
                        )}

                        {/* Etiqueta de remitente para mensajes salientes */}
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

                        {/* Contenido con formato y resaltado de búsqueda */}
                        <div className="whitespace-pre-wrap break-words leading-relaxed text-[13px] sm:text-sm">
                          {renderMessageContent(msg.content, chatSearchQuery)}
                        </div>

                        {/* Marca de hora y doble check en la esquina inferior derecha */}
                        <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-300">
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

            {/* Sugerencias de IA */}
            {aiSuggestions.length > 0 && (
              <div className="px-3 py-1.5 bg-slate-100/95 dark:bg-[#182229]/95 border-t border-slate-200/80 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
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

            {/* Respuestas Rápidas */}
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

            {/* Barra Inferior de Entrada: Botón clip, emojis, input píldora y botón círculo verde */}
            <div className="p-2 sm:p-2.5 bg-[#f0f2f5] dark:bg-[#202c33] border-t border-slate-200 dark:border-slate-800 flex items-center gap-1.5 shrink-0 w-full">
              {/* Botón de emojis */}
              <button
                type="button"
                onClick={() => setShowQuickReplies(!showQuickReplies)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Emojis y plantillas"
              >
                <Smile className="w-5 h-5" />
              </button>

              {/* Botón de adjuntos (clip) */}
              <button
                type="button"
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors shrink-0"
                title="Adjuntar archivo o imagen"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              {/* Input de texto tipo píldora oscura ("Escribe un mensaje") */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  sendMessage();
                }}
                className="flex-1 flex items-center gap-1.5 min-w-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Escribe un mensaje"
                  value={messageInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMessageInput(val);
                    if (val.startsWith('/')) setShowQuickReplies(true);
                  }}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-full bg-white dark:bg-[#2a3942] text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none border border-slate-200 dark:border-transparent focus:ring-2 focus:ring-[#00a884]/40 shadow-inner min-w-0"
                />

                {/* Botón de micrófono / enviar en círculo verde */}
                {messageInput.trim() ? (
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white shadow-md flex items-center justify-center transition-all shrink-0"
                    title="Enviar mensaje"
                  >
                    <Send className="w-4 h-4 stroke-[2.2] translate-x-0.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#008f6f] active:scale-95 text-white shadow-md flex items-center justify-center transition-all shrink-0"
                    title="Grabar mensaje de voz"
                  >
                    <Mic className="w-4 h-4 stroke-[2.2]" />
                  </button>
                )}
              </form>
            </div>
          </div>
        )}
      </section>

      {/* Modal: + Nuevo Chat */}
      {showNewChatModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowNewChatModal(false)}
        >
          <div 
            className="w-full max-w-sm bg-white dark:bg-[#202c33] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Iniciar nuevo chat de WhatsApp
              </h3>
              <button onClick={() => setShowNewChatModal(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewChat} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Número de WhatsApp (con código de país) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="ej: 51987654321 o 56912345678"
                  value={newChatPhone}
                  onChange={(e) => setNewChatPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nombre del Cliente (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej: Juan Pérez"
                  value={newChatName}
                  onChange={(e) => setNewChatName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-100 dark:bg-[#111b21] border border-slate-200 dark:border-slate-700 outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewChatModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-[#00a884] text-white hover:bg-[#008f6f] transition-colors"
                >
                  Iniciar Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense fallback={
      <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
        <div className="w-8 h-8 border-3 border-[#00a884] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">Cargando bandeja de entrada...</span>
      </div>
    }>
      <InboxInner />
    </Suspense>
  );
}
