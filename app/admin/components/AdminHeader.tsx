'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import AIIndicator from './AIIndicator';
import { 
  Search, 
  Bell, 
  ChevronDown, 
  LogOut, 
  User, 
  Shield, 
  Sliders, 
  Palette,
  Store
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
}

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load profile from database
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await fetch('/api/admin/profile');
        if (response.ok) {
          const data = await response.json();
          if (data.profile) {
            setProfile({
              name: data.profile.name || 'Admin',
              email: data.profile.email || 'bpier@zgamersa.com',
              avatar: data.profile.avatar || null,
              role: data.profile.role || 'CEO',
            });
          }
        }
      } catch (error) {
        console.error('Error loading profile:', error);
      }
    };
    loadProfile();
  }, []);

  // Load notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const response = await fetch('/api/admin/notifications');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      } catch (error) {
        console.error('Error loading notifications:', error);
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
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

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/orders', label: 'Pedidos', icon: '🔔' },
    { href: '/admin/inbox', label: 'Inbox', icon: '💬' },
    { href: '/admin/products', label: 'Menú', icon: '🍔' },
    { href: '/admin/business', label: 'Local', icon: '🏢' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/ai', label: 'IA Config', icon: '🤖' },
  ];

  const userMenuItems = [
    { href: '/admin/settings', label: 'Mi Perfil', icon: User },
    { href: '/admin/settings?tab=security', label: 'Seguridad', icon: Shield },
    { href: '/admin/settings?tab=notifications', label: 'Notificaciones', icon: Bell },
    { href: '/admin/settings?tab=appearance', label: 'Apariencia', icon: Palette },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 overflow-hidden">
        {/* Brand / Logo Section */}
        <Link 
          href="/admin" 
          className="flex items-center gap-2.5 shrink-0 text-white hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-md shrink-0">
            <Store className="w-5 h-5 text-slate-950" />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-white flex items-center gap-1.5">
              <span>Churu&apos;s</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-mono">SaaS</span>
            </span>
            <span className="text-[10px] text-slate-400 font-medium">WhatsApp Business</span>
          </div>
        </Link>

        {/* Desktop Navigation - Hidden on mobile screen strictly */}
        <nav 
          aria-label="Navegación principal"
          className="hidden md:flex items-center gap-1 bg-slate-800/60 p-1 rounded-xl border border-slate-700/50"
        >
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: AI Status, Notifications & User */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* AI Indicator */}
          <div className="hidden sm:block">
            <AIIndicator />
          </div>

          {/* Notifications Button & Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors relative"
              title="Notificaciones"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-950 text-[10px] font-black rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-3 z-50 text-xs animate-in fade-in">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 font-bold text-slate-200">
                  <span>Notificaciones</span>
                  {unreadCount > 0 && (
                    <Link href="/admin/inbox" className="text-amber-400 hover:underline">
                      Ver en inbox
                    </Link>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1.5">
                  {notifications.length === 0 ? (
                    <div className="py-4 text-center text-slate-500">Sin nuevas notificaciones</div>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div key={n.id} className="p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors">
                        <div className="font-semibold text-slate-200 truncate">{n.title || n.text}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">{n.relativeTime}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Avatar Menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 sm:px-2 sm:py-1 rounded-xl hover:bg-slate-800 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-xs font-bold text-amber-400 overflow-hidden shrink-0">
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{profile?.name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="hidden lg:flex flex-col leading-none">
                <span className="text-xs font-bold text-slate-200">{profile?.name || 'Admin'}</span>
                <span className="text-[10px] text-slate-400">{profile?.role || 'CEO'}</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in">
                <div className="p-2 border-b border-slate-800 mb-1">
                  <div className="font-bold text-slate-200">{profile?.name || 'Administrador'}</div>
                  <div className="text-[11px] text-slate-400 truncate">{profile?.email || 'admin@churus.pe'}</div>
                </div>

                <div className="space-y-0.5">
                  {userMenuItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                      >
                        <Icon className="w-4 h-4 text-slate-400" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>

                <div className="pt-1 mt-1 border-t border-slate-800">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 transition-colors"
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
