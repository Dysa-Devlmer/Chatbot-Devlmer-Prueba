'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Flame, 
  MessageSquare, 
  UtensilsCrossed, 
  Store, 
  TrendingUp, 
  Settings, 
  Calendar, 
  Tags, 
  Sparkles, 
  PanelLeftClose, 
  PanelLeftOpen, 
  X, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: any;
  badge?: number | string | null;
  badgeColor?: string;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile,
}: AdminSidebarProps) {
  const pathname = usePathname();
  const [pendingOrdersCount, setPendingOrdersCount] = useState<number>(0);
  const [unreadChatsCount, setUnreadChatsCount] = useState<number>(0);

  // Poll for reactive pending orders & unread chats count
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        // Pending orders
        const ordersRes = await fetch('/api/admin/orders');
        if (ordersRes.ok) {
          const ordersData = await ordersRes.json();
          if (ordersData.success && Array.isArray(ordersData.orders)) {
            const count = ordersData.orders.filter((o: any) => o.status === 'pending').length;
            setPendingOrdersCount(count);
          }
        }
      } catch {
        // Silently catch polling errors
      }

      try {
        // Unread notifications / chats
        const notifRes = await fetch('/api/admin/notifications');
        if (notifRes.ok) {
          const notifData = await notifRes.json();
          if (typeof notifData.unreadCount === 'number') {
            setUnreadChatsCount(notifData.unreadCount);
          }
        }
      } catch {
        // Silently catch polling errors
      }
    };

    fetchCounters();
    const interval = setInterval(fetchCounters, 15000);
    return () => clearInterval(interval);
  }, []);

  // 3 Hierarchical Navigation Sections + General Overview
  const navSections: NavSection[] = [
    {
      title: 'GENERAL',
      items: [
        {
          href: '/admin',
          label: 'Dashboard',
          icon: LayoutDashboard,
          exact: true,
        },
      ],
    },
    {
      title: 'OPERACIONES EN VIVO',
      items: [
        {
          href: '/admin/orders',
          label: 'Cocina en Vivo',
          icon: Flame,
          badge: pendingOrdersCount > 0 ? pendingOrdersCount : null,
          badgeColor: 'bg-amber-500 animate-pulse text-stone-950',
        },
        {
          href: '/admin/inbox',
          label: 'Inbox WhatsApp',
          icon: MessageSquare,
          badge: unreadChatsCount > 0 ? (unreadChatsCount > 9 ? '9+' : unreadChatsCount) : null,
          badgeColor: 'bg-emerald-500 text-stone-950 font-black',
        },
      ],
    },
    {
      title: 'CATÁLOGO & RESTAURANTE',
      items: [
        {
          href: '/admin/products',
          label: 'Menú & Platos',
          icon: UtensilsCrossed,
        },
        {
          href: '/admin/business',
          label: 'Datos de Local & Horarios',
          icon: Store,
        },
        {
          href: '/admin/scheduled',
          label: 'Campañas WhatsApp',
          icon: Calendar,
        },
        {
          href: '/admin/tags',
          label: 'Clientes & Tags',
          icon: Tags,
        },
      ],
    },
    {
      title: 'ANALÍTICA & GESTIÓN',
      items: [
        {
          href: '/admin/analytics',
          label: 'Analytics & Ventas',
          icon: TrendingUp,
        },
        {
          href: '/admin/learning',
          label: 'Base Conocimiento IA',
          icon: Sparkles,
        },
        {
          href: '/admin/settings',
          label: 'Configuración & Roles',
          icon: Settings,
        },
      ],
    },
  ];

  const renderContent = (isMobileView = false) => {
    const collapsed = isMobileView ? false : isCollapsed;

    return (
      <div className="flex flex-col h-full select-none">
        {/* Brand / Logo Header */}
        <div className={`h-16 flex items-center px-4 border-b border-slate-200 dark:border-stone-800/80 shrink-0 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}>
          <Link
            href="/admin"
            onClick={isMobileView ? onCloseMobile : undefined}
            className="flex items-center gap-3 overflow-hidden text-slate-900 dark:text-white group"
            title="Churu's Comida Rápida"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center font-black text-stone-950 text-base shadow-md shadow-orange-600/30 shrink-0 group-hover:scale-105 transition-transform">
              C
            </div>
            {!collapsed && (
              <div className="flex flex-col leading-tight min-w-0">
                <span className="font-black text-sm tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 truncate">
                  <span>Churu&apos;s</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-500 dark:text-amber-400 font-mono font-bold">
                    SaaS
                  </span>
                </span>
                <span className="text-[10px] text-slate-500 dark:text-stone-400 font-semibold truncate">
                  Fast Food Platform
                </span>
              </div>
            )}
          </Link>

          {/* Mobile close button */}
          {isMobileView && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
              title="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Desktop collapse toggle button */}
          {!isMobileView && !collapsed && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800/60 transition-colors"
              title="Colapsar barra lateral"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation Blocks Scrollable Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 px-2.5 space-y-5 no-scrollbar">
          {navSections.map((section, sIdx) => (
            <div key={section.title || sIdx} className="space-y-1">
              {/* Section Header (Only visible when expanded) */}
              {!collapsed && (
                <div className="px-2.5 pb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-stone-500">
                    {section.title}
                  </span>
                </div>
              )}

              {/* Section Separator Line when Collapsed */}
              {collapsed && sIdx > 0 && (
                <div className="my-2 border-t border-slate-200 dark:border-stone-800/60 mx-1" />
              )}

              {/* Nav Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const isActive = item.exact
                    ? pathname === item.href
                    : pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href));
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={isMobileView ? onCloseMobile : undefined}
                      title={collapsed ? `${item.label} ${item.badge ? `(${item.badge})` : ''}` : undefined}
                      className={`group relative flex items-center rounded-xl transition-all duration-200 ${
                        collapsed 
                          ? 'justify-center p-2.5' 
                          : 'gap-3 px-3 py-2 text-xs'
                      } ${
                        isActive
                          ? 'bg-amber-500/10 text-amber-500 dark:text-amber-400 font-bold border-l-2 border-amber-500 shadow-xs'
                          : 'text-slate-600 dark:text-stone-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <Icon className={`w-4 h-4 transition-transform duration-200 ${
                          isActive 
                            ? 'text-amber-500 dark:text-amber-400 scale-110' 
                            : 'text-slate-500 dark:text-stone-400 group-hover:scale-105'
                        }`} />
                        {/* Dot indicator when collapsed */}
                        {collapsed && item.badge !== null && item.badge !== undefined && (
                          <span className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ring-2 ring-white dark:ring-[#141312] ${
                            item.badgeColor || 'bg-amber-500'
                          }`} />
                        )}
                      </div>

                      {!collapsed && (
                        <>
                          <span className="flex-1 truncate tracking-tight">
                            {item.label}
                          </span>
                          {item.badge !== null && item.badge !== undefined && (
                            <span className={`px-2 py-0.5 text-[10px] font-black rounded-full shadow-xs ${
                              item.badgeColor || 'bg-amber-500/20 text-amber-500 dark:text-amber-400'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer Widget */}
        <div className="p-2.5 border-t border-slate-200 dark:border-stone-800/80 shrink-0">
          {!collapsed ? (
            <div className="space-y-2">
              {/* Quick Client Menu Link */}
              <Link
                href="/menu"
                target="_blank"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/30 text-orange-600 dark:text-orange-400 text-xs font-bold transition-all group"
              >
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Ver Menú Público
                </span>
                <ExternalLink className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>

              {/* Bot status chip */}
              <div className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-stone-900 flex items-center justify-between text-[11px] text-slate-500 dark:text-stone-400">
                <span className="font-semibold">Bot WhatsApp:</span>
                <span className="text-[#84cc16] font-bold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#84cc16] animate-ping" />
                  En Línea 🤖
                </span>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-stone-800 transition-colors"
              title="Expandir barra lateral"
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* 1. Desktop Collapsible Sidebar */}
      <aside 
        aria-label="Barra lateral administrativa"
        className={`hidden md:flex flex-col shrink-0 h-screen sticky top-0 bg-white dark:bg-[#141312] border-r border-slate-200 dark:border-stone-800 transition-[width] duration-300 ease-in-out z-30 ${
          isCollapsed ? 'w-[72px]' : 'w-[260px]'
        }`}
      >
        {renderContent(false)}
      </aside>

      {/* 2. Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            onClick={onCloseMobile}
            className="fixed inset-0 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[85vw] h-full bg-white dark:bg-[#141312] border-r border-slate-200 dark:border-stone-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-300">
            {renderContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
