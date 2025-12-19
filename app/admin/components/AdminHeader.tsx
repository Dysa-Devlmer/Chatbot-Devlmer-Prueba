'use client';

import { useState, useRef, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

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

interface SearchResult {
  id: string;
  type: string;
  icon: string;
  title: string;
  subtitle: string;
  link: string;
  time: string;
}

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
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

  // Load notifications from database
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

    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Search effect
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setSearching(true);
        try {
          const response = await fetch(`/api/admin/search?q=${encodeURIComponent(searchQuery)}`);
          if (response.ok) {
            const data = await response.json();
            setSearchResults(data.results || []);
          }
        } catch (error) {
          console.error('Error searching:', error);
        } finally {
          setSearching(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [searchQuery]);

  // Keyboard shortcut for search (Ctrl/Cmd + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
        setTimeout(() => searchInputRef.current?.focus(), 100);
      }
      if (e.key === 'Escape') {
        setShowSearch(false);
        setSearchQuery('');
        setSearchResults([]);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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
    { href: '/admin/inbox', label: 'Inbox', icon: '💬' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/ai', label: 'IA Config', icon: '🤖' },
    { href: '/admin/tags', label: 'Tags', icon: '🏷️' },
    { href: '/admin/scheduled', label: 'Programados', icon: '⏰' },
  ];

  const userMenuItems = [
    { href: '/admin/settings', label: 'Mi Perfil', icon: '👤', description: 'Información personal' },
    { href: '/admin/settings?tab=security', label: 'Seguridad', icon: '🔒', description: 'Contraseña y acceso' },
    { href: '/admin/settings?tab=notifications', label: 'Notificaciones', icon: '🔔', description: 'Preferencias de alertas' },
    { href: '/admin/settings?tab=appearance', label: 'Apariencia', icon: '🎨', description: 'Tema y personalización' },
  ];

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <Link href="/admin" style={styles.logoLink}>
            <div style={styles.logoIcon}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect width="32" height="32" rx="8" fill="url(#gradient)" />
                <path d="M10 12C10 10.8954 10.8954 10 12 10H20C21.1046 10 22 10.8954 22 12V20C22 21.1046 21.1046 22 20 22H12C10.8954 22 10 21.1046 10 20V12Z" fill="white" fillOpacity="0.9" />
                <circle cx="14" cy="15" r="1.5" fill="#667eea" />
                <circle cx="18" cy="15" r="1.5" fill="#667eea" />
                <path d="M13 18.5C13.8284 19.3284 15.1716 19.3284 16 18.5" stroke="#667eea" strokeWidth="1.5" strokeLinecap="round" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="32" y2="32">
                    <stop stopColor="#667eea" />
                    <stop offset="1" stopColor="#764ba2" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div style={styles.logoText}>
              <span style={styles.logoTitle}>PITHY</span>
              <span style={styles.logoSubtitle}>Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== '/admin' && pathname?.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  ...styles.navLink,
                  ...(isActive ? styles.navLinkActive : {}),
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span style={styles.navLabel}>{item.label}</span>
                {isActive && <div style={styles.activeIndicator} />}
              </Link>
            );
          })}
        </nav>

        {/* Right Section */}
        <div style={styles.rightSection}>
          {/* Quick Actions */}
          <div style={styles.quickActions}>
            <button
              style={styles.iconButton}
              title="Buscar (Ctrl+K)"
              onClick={() => {
                setShowSearch(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            {/* Notifications */}
            <div ref={notifRef} style={{ position: 'relative' }}>
              <button
                style={styles.iconButton}
                title="Notificaciones"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span style={styles.notifBadge}>{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </button>

              {showNotifications && (
                <div style={styles.notifDropdown}>
                  <div style={styles.dropdownHeader}>
                    <span style={styles.dropdownTitle}>Notificaciones</span>
                    {unreadCount > 0 && (
                      <Link href="/admin/inbox" style={styles.markAllRead}>
                        Ver en inbox
                      </Link>
                    )}
                  </div>
                  <div style={styles.notifList}>
                    {notifications.length === 0 ? (
                      <div style={styles.emptyNotif}>
                        <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔔</span>
                        <span style={{ color: '#64748b', fontSize: '13px' }}>No hay notificaciones</span>
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div key={notif.id} style={{
                          ...styles.notifItem,
                          background: notif.isUnread ? 'rgba(102, 126, 234, 0.1)' : 'transparent',
                        }}>
                          <div style={styles.notifIcon}>{notif.icon}</div>
                          <div style={styles.notifContent}>
                            <div style={styles.notifText}>{notif.text}</div>
                            <div style={styles.notifTime}>{notif.relativeTime}</div>
                          </div>
                          {notif.isUnread && <div style={styles.unreadDot} />}
                        </div>
                      ))
                    )}
                  </div>
                  <Link href="/admin/inbox" style={styles.viewAllLink} onClick={() => setShowNotifications(false)}>
                    Ver todas las conversaciones
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div ref={menuRef} style={styles.userMenuContainer}>
            <button
              style={styles.userButton}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <div style={styles.avatar}>
                {profile?.avatar ? (
                  <img src={profile.avatar} alt="Avatar" style={styles.avatarImage} />
                ) : (
                  <span>{profile?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
                <div style={styles.onlineIndicator} />
              </div>
              <div style={styles.userInfo}>
                <span style={styles.userName}>{profile?.name || session?.user?.name || 'Admin'}</span>
                <span style={styles.userRole}>{profile?.role || 'Administrador'}</span>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{
                  transform: showUserMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                  color: '#94a3b8',
                }}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>

            {showUserMenu && (
              <div style={styles.userDropdown}>
                {/* User Header in Dropdown */}
                <div style={styles.dropdownUserHeader}>
                  <div style={styles.dropdownAvatar}>
                    {profile?.avatar ? (
                      <img src={profile.avatar} alt="Avatar" style={styles.avatarImage} />
                    ) : (
                      <span>{profile?.name?.charAt(0).toUpperCase() || session?.user?.name?.charAt(0).toUpperCase() || 'A'}</span>
                    )}
                  </div>
                  <div style={styles.dropdownUserInfo}>
                    <span style={styles.dropdownUserName}>{profile?.name || session?.user?.name || 'Admin'}</span>
                    <span style={styles.dropdownUserEmail}>{profile?.email || session?.user?.email || 'bpier@zgamersa.com'}</span>
                  </div>
                </div>

                <div style={styles.dropdownDivider} />

                {/* Menu Items */}
                <div style={styles.menuItems}>
                  {userMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      style={styles.menuItem}
                      onClick={() => setShowUserMenu(false)}
                    >
                      <span style={styles.menuItemIcon}>{item.icon}</span>
                      <div style={styles.menuItemContent}>
                        <span style={styles.menuItemLabel}>{item.label}</span>
                        <span style={styles.menuItemDescription}>{item.description}</span>
                      </div>
                    </Link>
                  ))}
                </div>

                <div style={styles.dropdownDivider} />

                {/* Quick Settings */}
                <div style={styles.quickSettings}>
                  <div style={styles.quickSettingItem}>
                    <span>Modo Oscuro</span>
                    <div style={styles.toggle}>
                      <div style={styles.toggleKnob} />
                    </div>
                  </div>
                </div>

                <div style={styles.dropdownDivider} />

                {/* Logout */}
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  style={styles.logoutButton}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <div style={styles.searchOverlay} onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}>
          <div style={styles.searchModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.searchHeader}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversaciones, usuarios, mensajes..."
                style={styles.searchInput}
                autoFocus
              />
              <span style={styles.searchShortcut}>ESC</span>
            </div>

            <div style={styles.searchResults}>
              {searching ? (
                <div style={styles.searchLoading}>
                  <span>Buscando...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults.map((result) => (
                  <Link
                    key={result.id}
                    href={result.link}
                    style={styles.searchResultItem}
                    onClick={() => { setShowSearch(false); setSearchQuery(''); setSearchResults([]); }}
                  >
                    <span style={styles.searchResultIcon}>{result.icon}</span>
                    <div style={styles.searchResultContent}>
                      <span style={styles.searchResultTitle}>{result.title}</span>
                      <span style={styles.searchResultSubtitle}>{result.subtitle}</span>
                    </div>
                    <span style={styles.searchResultType}>
                      {result.type === 'user' ? 'Usuario' : 'Mensaje'}
                    </span>
                  </Link>
                ))
              ) : searchQuery.length >= 2 ? (
                <div style={styles.searchEmpty}>
                  <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</span>
                  <span>No se encontraron resultados para "{searchQuery}"</span>
                </div>
              ) : (
                <div style={styles.searchEmpty}>
                  <span style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</span>
                  <span>Escribe para buscar...</span>
                </div>
              )}
            </div>

            <div style={styles.searchFooter}>
              <span>Usa <kbd style={styles.kbd}>↑</kbd><kbd style={styles.kbd}>↓</kbd> para navegar</span>
              <span>Presiona <kbd style={styles.kbd}>Enter</kbd> para seleccionar</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 1000,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '70px',
    maxWidth: '1600px',
    margin: '0 auto',
  },
  logoSection: {
    display: 'flex',
    alignItems: 'center',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    textDecoration: 'none',
  },
  logoIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    display: 'flex',
    flexDirection: 'column',
  },
  logoTitle: {
    color: '#f1f5f9',
    fontSize: '20px',
    fontWeight: 'bold',
    letterSpacing: '1px',
  },
  logoSubtitle: {
    color: '#64748b',
    fontSize: '11px',
    letterSpacing: '0.5px',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'rgba(30, 41, 59, 0.5)',
    padding: '6px',
    borderRadius: '12px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    borderRadius: '8px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    position: 'relative',
  },
  navLinkActive: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
  },
  navIcon: {
    fontSize: '16px',
  },
  navLabel: {
    fontSize: '13px',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: '-6px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '20px',
    height: '3px',
    background: '#667eea',
    borderRadius: '2px',
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  quickActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  iconButton: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    border: 'none',
    background: 'rgba(148, 163, 184, 0.1)',
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  notifBadge: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    background: '#ef4444',
    color: 'white',
    fontSize: '10px',
    fontWeight: 'bold',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDropdown: {
    position: 'absolute',
    top: '50px',
    right: 0,
    width: '360px',
    background: '#1e293b',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  dropdownHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  dropdownTitle: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
  },
  markAllRead: {
    background: 'none',
    border: 'none',
    color: '#667eea',
    fontSize: '12px',
    cursor: 'pointer',
  },
  notifList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  notifItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  notifIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(102, 126, 234, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  notifContent: {
    flex: 1,
  },
  notifText: {
    color: '#e2e8f0',
    fontSize: '13px',
    marginBottom: '4px',
  },
  notifTime: {
    color: '#64748b',
    fontSize: '11px',
  },
  viewAllLink: {
    display: 'block',
    textAlign: 'center',
    padding: '12px',
    color: '#667eea',
    fontSize: '13px',
    textDecoration: 'none',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
  },
  emptyNotif: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px 16px',
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    background: '#667eea',
    flexShrink: 0,
  },
  searchOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingTop: '100px',
    zIndex: 2000,
  },
  searchModal: {
    width: '600px',
    maxWidth: '90vw',
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },
  searchHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px 20px',
    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
  },
  searchInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    color: '#f1f5f9',
    fontSize: '16px',
    outline: 'none',
  },
  searchShortcut: {
    padding: '4px 8px',
    borderRadius: '6px',
    background: 'rgba(148, 163, 184, 0.1)',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: '500',
  },
  searchResults: {
    maxHeight: '400px',
    overflowY: 'auto',
  },
  searchLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    color: '#64748b',
    fontSize: '14px',
  },
  searchEmpty: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '32px',
    color: '#64748b',
    fontSize: '14px',
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px 20px',
    textDecoration: 'none',
    borderBottom: '1px solid rgba(148, 163, 184, 0.05)',
    transition: 'background 0.2s',
  },
  searchResultIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(102, 126, 234, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  searchResultContent: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  searchResultTitle: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '500',
  },
  searchResultSubtitle: {
    color: '#64748b',
    fontSize: '12px',
  },
  searchResultType: {
    padding: '4px 10px',
    borderRadius: '20px',
    background: 'rgba(102, 126, 234, 0.1)',
    color: '#667eea',
    fontSize: '11px',
    fontWeight: '500',
  },
  searchFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 20px',
    borderTop: '1px solid rgba(148, 163, 184, 0.1)',
    color: '#64748b',
    fontSize: '12px',
  },
  kbd: {
    display: 'inline-block',
    padding: '2px 6px',
    margin: '0 4px',
    borderRadius: '4px',
    background: 'rgba(148, 163, 184, 0.1)',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  userMenuContainer: {
    position: 'relative',
  },
  userButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 12px',
    borderRadius: '12px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    background: 'rgba(30, 41, 59, 0.5)',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  avatar: {
    position: 'relative',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: '12px',
    objectFit: 'cover',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: '-2px',
    right: '-2px',
    width: '12px',
    height: '12px',
    borderRadius: '50%',
    background: '#22c55e',
    border: '2px solid #1e293b',
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  userName: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '600',
  },
  userRole: {
    color: '#64748b',
    fontSize: '11px',
  },
  userDropdown: {
    position: 'absolute',
    top: '60px',
    right: 0,
    width: '300px',
    background: '#1e293b',
    borderRadius: '16px',
    border: '1px solid rgba(148, 163, 184, 0.1)',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
    overflow: 'hidden',
  },
  dropdownUserHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
  },
  dropdownAvatar: {
    width: '50px',
    height: '50px',
    borderRadius: '14px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    fontWeight: 'bold',
  },
  dropdownUserInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  dropdownUserName: {
    color: '#f1f5f9',
    fontSize: '16px',
    fontWeight: '600',
  },
  dropdownUserEmail: {
    color: '#64748b',
    fontSize: '12px',
  },
  dropdownDivider: {
    height: '1px',
    background: 'rgba(148, 163, 184, 0.1)',
    margin: '0',
  },
  menuItems: {
    padding: '8px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '12px',
    borderRadius: '10px',
    textDecoration: 'none',
    transition: 'background 0.2s',
  },
  menuItemIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    background: 'rgba(102, 126, 234, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
  },
  menuItemContent: {
    display: 'flex',
    flexDirection: 'column',
  },
  menuItemLabel: {
    color: '#e2e8f0',
    fontSize: '14px',
    fontWeight: '500',
  },
  menuItemDescription: {
    color: '#64748b',
    fontSize: '11px',
  },
  quickSettings: {
    padding: '12px 16px',
  },
  quickSettingItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#94a3b8',
    fontSize: '13px',
  },
  toggle: {
    width: '40px',
    height: '22px',
    borderRadius: '11px',
    background: 'rgba(148, 163, 184, 0.2)',
    position: 'relative',
    cursor: 'pointer',
  },
  toggleKnob: {
    position: 'absolute',
    top: '2px',
    left: '2px',
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: '#64748b',
    transition: 'transform 0.2s',
  },
  logoutButton: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    padding: '14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: 'none',
    color: '#ef4444',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
};
