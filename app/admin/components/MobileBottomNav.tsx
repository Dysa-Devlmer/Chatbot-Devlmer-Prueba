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
      label: 'Chats',
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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#141312]/95 backdrop-blur-md border-t border-slate-200 dark:border-stone-800 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-center justify-around h-14 sm:h-16 w-full max-w-lg mx-auto px-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
          const IconComponent = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`relative flex flex-col items-center justify-center flex-1 py-1 px-0.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-orange-500 dark:text-orange-400 font-extrabold'
                  : 'text-slate-500 hover:text-slate-900 dark:text-stone-400 dark:hover:text-stone-200 font-medium'
              }`}
            >
              <div className="relative">
                <IconComponent 
                  className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.8]'
                  }`} 
                />
                {item.badge !== null && (
                  <span
                    className={`absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 text-[9px] font-black rounded-full flex items-center justify-center shadow-xs ${item.badgeColor}`}
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] mt-0.5 tracking-tight leading-none truncate max-w-[56px] text-center">
                {item.label}
              </span>
              {isActive && (
                <span className="absolute bottom-0.5 w-1.5 h-1.5 rounded-full bg-orange-500 dark:bg-orange-400 shadow-xs" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
