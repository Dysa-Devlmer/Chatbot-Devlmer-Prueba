'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AIIndicator from './AIIndicator';
import { 
  Building2,
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Lock,
  Sun,
  Moon,
  ExternalLink,
  Flame,
  MessageSquare,
  UtensilsCrossed,
  Store,
  TrendingUp,
  LayoutDashboard
} from 'lucide-react';

interface AdminProfile {
  name: string;
  email: string;
  avatar: string | null;
  role: string;
}

interface Notification {
  id: string;
  type: string;
  icon: string;
  title: string;
  text: string;
  time: string;
  relativeTime: string;
  isUnread: boolean;
  url?: string;
}

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const [businessName, setBusinessName] = useState("Churu's");
  const [isDark, setIsDark] = useState(true);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Initialize and synchronize Theme (Dark / Light)
  useEffect(() => {
    const saved = localStorage.getItem('pithy_theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const activeDark = saved !== null ? saved === 'dark' : prefersDark;
    setIsDark(activeDark);
    if (activeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    localStorage.setItem('pithy_theme', nextDark ? 'dark' : 'light');
    if (nextDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load profile from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const [response, busRes] = await Promise.all([
          fetch('/api/admin/profile'),
          fetch('/api/admin/business'),
        ]);

        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile({
              name: data.profile.name || 'Admin',
              email: data.profile.email || 'admin@negocio.com',
              avatar: data.profile.avatar || null,
              role: data.profile.role || 'Administrador',
            });
          }
        }

        if (busRes.ok) {
          const busData = await busRes.json();
          if (busData.profile?.name) {
            setBusinessName(busData.profile.name);
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();

    window.addEventListener('admin-profile-updated', loadProfile);
    return () => {
      window.removeEventListener('admin-profile-updated', loadProfile);
    };
  }, []);

  // Poll for notifications and pending orders count
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        // Pending orders for Kitchen
        const ordersRes = await fetch('/api/admin/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success && Array.isArray(ordersData.orders)) {
            const pending = ordersData.orders.filter((o: any) => o.status === 'pending').length;
            setPendingOrdersCount(pending);
          }
        }
      } catch {
        // Silently catch
      }

      try {
        // Notifications & unread messages
        const notifRes = await fetch('/api/admin/notifications');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          setNotifications(notifData.notifications || []);
          setUnreadCount(notifData.unreadCount || 0);
        }
      } catch {
        // Silently catch
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 12000);
    return () => clearInterval(interval);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // The Essential Modules of the Multi-Tenant Platform
  const navItems = [
    { 
      href: '/admin/tenants', 
      label: 'Empresas SaaS', 
      icon: Building2,
      badge: '👑',
      badgeColor: 'bg-amber-400 text-stone-950 font-black'
    },
    { 
      href: '/admin', 
      label: 'Inicio', 
      icon: LayoutDashboard,
      exact: true
    },
    { 
      href: '/admin/orders', 
      label: 'Pedidos', 
      icon: Flame,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-amber-500 text-stone-950 animate-pulse'
    },
    { 
      href: '/admin/inbox', 
      label: 'Inbox WhatsApp', 
      icon: MessageSquare,
      badge: unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : null,
      badgeColor: 'bg-emerald-500 text-stone-950 font-black'
    },
    { 
      href: '/admin/products', 
      label: 'Menú & Platos', 
      icon: UtensilsCrossed 
    },
    { 
      href: '/admin/business', 
      label: 'Mi Local & Horarios', 
      icon: Store 
    },
    { 
      href: '/admin/analytics', 
      label: 'Analytics & Ventas', 
      icon: TrendingUp 
    },
  ];

  const userMenuItems = [
    { href: '/admin/tenants', label: 'Empresas SaaS (Dueño)', icon: Building2 },
    { href: '/admin/settings?tab=profile', label: 'Mi Perfil', icon: User },
    { href: '/admin/settings?tab=security', label: 'Seguridad & Contraseña', icon: Lock },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 w-full bg-white/95 dark:bg-[#141312]/95 backdrop-blur-md border-b border-slate-200 dark:border-stone-800 text-slate-900 dark:text-white shadow-xs transition-colors duration-200">
      <div className="w-full max-w-full px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        
        {/* Left Section: Brand Logo (Links to Inicio /admin) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink min-w-0">
          <Link href="/admin" className="flex items-center gap-2 group min-w-0" title="Ir a Inicio / Panel General">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center font-black text-white text-base sm:text-lg shadow-md group-hover:scale-105 transition-transform shrink-0">
              🍗
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                <span className="font-black text-xs sm:text-base text-slate-900 dark:text-white tracking-tight truncate max-w-[150px] xs:max-w-[180px] sm:max-w-[240px]">
                  {businessName}
                </span>
                <Link 
                  href="/admin/tenants"
                  className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase bg-amber-500 text-stone-950 hover:bg-amber-400 border border-amber-600/30 shrink-0 shadow-xs cursor-pointer transition-transform hover:scale-105 flex items-center gap-0.5"
                  title="Abrir Panel Maestro de Empresas SaaS (Dueño)"
                >
                  <span>SaaS</span>
                  <span className="text-[10px]">👑</span>
                </Link>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-stone-400 -mt-0.5 font-medium hidden sm:block">
                WhatsApp Business Platform
              </p>
            </div>
          </Link>
        </div>

        {/* Center: The Essential Horizontal Navigation Tabs */}
        <nav 
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-1 bg-slate-100 dark:bg-stone-900/90 p-1.5 rounded-2xl border border-slate-200 dark:border-stone-800 shadow-inner"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = (item as any).exact 
              ? pathname === item.href 
              : (pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href)));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all relative ${
                  isActive
                    ? 'bg-orange-500 text-stone-950 shadow-md shadow-orange-500/20 font-black'
                    : 'text-slate-600 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/70 dark:hover:bg-stone-800'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                    isActive ? 'bg-stone-950 text-amber-400' : item.badgeColor
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Direct Menu Link, AI Indicator, Theme, Notifications & Profile */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          
          {/* Public Menu Direct Link */}
          <Link
            href="/menu"
            target="_blank"
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 transition-all hover:scale-105"
            title="Abrir menú digital público de comensales"
          >
            <span>Ver Carta</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          {/* Official AI Indicator (Gemini Flash 🟢) */}
          <div className="hidden sm:block">
            <AIIndicator />
          </div>

          {/* Theme Switcher Button (Dark / Light) */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-stone-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
            title={isDark ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
            aria-label="Cambiar tema"
          >
            {isDark ? (
              <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 animate-in spin-in-180 duration-200" />
            ) : (
              <Moon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-500 animate-in spin-in-180 duration-200" />
            )}
          </button>

          {/* Notifications Button & Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-1.5 sm:p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-stone-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors relative"
              title="Notificaciones"
              aria-label="Notificaciones"
            >
              <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-amber-500 text-stone-950 text-[9px] sm:text-[10px] font-black rounded-full flex items-center justify-center animate-pulse shadow-xs">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white dark:bg-[#141312] border border-slate-200 dark:border-stone-800 rounded-2xl shadow-2xl p-3 z-[100] text-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-stone-800 mb-2 font-bold text-slate-900 dark:text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <span>Notificaciones</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-stone-950 font-black">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <Link 
                    href="/admin/inbox" 
                    onClick={() => setShowNotifications(false)}
                    className="text-orange-600 dark:text-orange-400 font-extrabold hover:underline text-[11px]"
                  >
                    Ver en inbox →
                  </Link>
                </div>
                <div className="max-h-72 overflow-y-auto space-y-1.5 no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-slate-400 dark:text-stone-500 font-medium">
                      No tienes notificaciones pendientes
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <Link
                        key={n.id}
                        href={n.url || '/admin/inbox'}
                        onClick={() => setShowNotifications(false)}
                        className="flex items-start gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-stone-900/60 hover:bg-orange-50 dark:hover:bg-stone-800 transition-colors group cursor-pointer border border-transparent hover:border-orange-500/20"
                      >
                        <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                          {n.icon || '💬'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-extrabold text-slate-900 dark:text-slate-100 truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 text-xs">
                              {n.title}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-stone-500 shrink-0">
                              {n.relativeTime}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-stone-400 truncate mt-0.5 leading-tight">
                            {n.text}
                          </p>
                        </div>
                      </Link>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar & Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-1.5 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-stone-800 transition-all text-left"
              aria-label="Menú de usuario"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-stone-950 flex items-center justify-center text-xs font-black overflow-hidden shrink-0 shadow-xs">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile?.name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="hidden lg:flex flex-col leading-none">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{profile?.name || 'Admin'}</span>
                <span className="text-[10px] text-slate-500 dark:text-stone-400">{profile?.role || 'CEO'}</span>
              </div>
              <ChevronDown className={`hidden sm:inline w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#141312] border border-slate-200 dark:border-stone-800 rounded-2xl shadow-2xl p-2 z-[100] text-xs animate-in fade-in">
                <div className="p-2 border-b border-slate-100 dark:border-stone-800 mb-1">
                  <div className="font-bold text-slate-900 dark:text-slate-200">{profile?.name || 'Administrador'}</div>
                  <div className="text-[11px] text-slate-500 dark:text-stone-400 truncate">{profile?.email || 'admin@churus.pe'}</div>
                </div>

                <div className="space-y-0.5">
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 dark:text-stone-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-slate-400 dark:text-stone-500" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-1 mt-1 border-t border-slate-100 dark:border-stone-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors font-semibold"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
}
