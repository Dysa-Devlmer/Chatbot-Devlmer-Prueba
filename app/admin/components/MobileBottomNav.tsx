'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  UtensilsCrossed, 
  MessageSquare, 
  LayoutDashboard, 
  Store 
} from 'lucide-react';

export function MobileBottomNav() {
  const pathname = usePathname();
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);

  // Poll for pending orders count every 15 seconds
  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const res = await fetch('/api/admin/orders?status=pending');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            setPendingOrdersCount(data.orders.length);
          }
        }
      } catch {
        // Silently ignore polling errors
      }
    };

    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      href: '/admin/orders',
      label: 'Pedidos',
      icon: Bell,
      badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
      badgeColor: 'bg-amber-500 animate-pulse text-white',
    },
    {
      href: '/admin/products',
      label: 'Menú',
      icon: UtensilsCrossed,
      badge: null,
    },
    {
      href: '/admin/inbox',
      label: 'WhatsApp',
      icon: MessageSquare,
      badge: null,
    },
    {
      href: '/admin',
      label: 'Resumen',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      href: '/admin/business',
      label: 'Mi Local',
      icon: Store,
      badge: null,
    },
  ];

  return (
    <nav 
      aria-label="Navegación móvil"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_25px_rgba(0,0,0,0.07)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <IconComponent 
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`} 
                />
                {item.badge !== null && (
                  <span
                    className={`absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm ${item.badgeColor}`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight leading-none">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-600 dark:bg-emerald-400" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
