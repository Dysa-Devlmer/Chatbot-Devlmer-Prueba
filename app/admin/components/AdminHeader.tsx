'use client';

import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

export function AdminHeader() {
  const { data: session } = useSession();
  const pathname = usePathname();

  const navItems = [
    { href: '/admin', label: 'Dashboard', icon: '📊' },
    { href: '/admin/inbox', label: 'Inbox', icon: '💬' },
    { href: '/admin/analytics', label: 'Analytics', icon: '📈' },
    { href: '/admin/ai', label: 'IA Config', icon: '🤖' },
    { href: '/admin/tags', label: 'Tags', icon: '🏷️' },
    { href: '/admin/scheduled', label: 'Programados', icon: '⏰' },
  ];

  return (
    <header style={styles.header}>
      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logo}>
          <Link href="/admin" style={styles.logoLink}>
            <span style={styles.logoIcon}>🤖</span>
            <span style={styles.logoText}>PITHY Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={styles.nav}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                ...styles.navLink,
                ...(pathname === item.href ? styles.navLinkActive : {}),
              }}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Profile & Logout */}
        <div style={styles.userSection}>
          {session?.user && (
            <>
              <div style={styles.userInfo}>
                <div style={styles.avatar}>
                  {session.user.name?.charAt(0).toUpperCase() || 'A'}
                </div>
                <div style={styles.userDetails}>
                  <span style={styles.userName}>{session.user.name}</span>
                  <span style={styles.userRole}>Administrador</span>
                </div>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                style={styles.logoutButton}
              >
                Cerrar Sesión
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  header: {
    backgroundColor: '#1e293b',
    borderBottom: '1px solid #334155',
    padding: '0 24px',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '64px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    textDecoration: 'none',
  },
  logoIcon: {
    fontSize: '24px',
  },
  logoText: {
    color: '#f1f5f9',
    fontSize: '18px',
    fontWeight: 'bold',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '8px 12px',
    borderRadius: '6px',
    color: '#94a3b8',
    textDecoration: 'none',
    fontSize: '14px',
    transition: 'all 0.2s',
  },
  navLinkActive: {
    backgroundColor: '#334155',
    color: '#f1f5f9',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  avatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
  },
  userName: {
    color: '#f1f5f9',
    fontSize: '14px',
    fontWeight: '500',
  },
  userRole: {
    color: '#64748b',
    fontSize: '12px',
  },
  logoutButton: {
    backgroundColor: 'transparent',
    border: '1px solid #475569',
    borderRadius: '6px',
    padding: '8px 16px',
    color: '#94a3b8',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};
