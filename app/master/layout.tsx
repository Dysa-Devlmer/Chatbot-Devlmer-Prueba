'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  Building2, 
  ShieldCheck, 
  LogOut, 
  ExternalLink,
  Layers,
  Activity
} from 'lucide-react';

export default function MasterLayout({ children }: { children: ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950 w-full max-w-full overflow-x-hidden">
      {/* Top SuperAdmin Header with anti-overflow & compact flex layout */}
      <header className="sticky top-0 z-50 bg-[#12161c]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 lg:px-8 min-h-[4rem] py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4 w-full max-w-full min-w-0 transition-all">
        {/* Left Section: Brand & Master Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20 shrink-0">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="font-black text-sm sm:text-base tracking-tight text-white whitespace-nowrap">
                PITHY SAAS
              </span>
              <span className="px-1.5 py-0.5 sm:px-2 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3 h-3" />
                <span className="hidden sm:inline">Master Owner Panel</span>
                <span className="sm:hidden">Master</span>
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-slate-400 font-medium hidden md:block truncate max-w-md">
              Centro de Control Global de Empresas Arrendatarias & Facturación
            </p>
          </div>
        </div>

        {/* Right Section: Status, Demo Switch & Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 flex-shrink-0">
          {/* VPS Infrastructure Live Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">VPS Online</span>
          </div>

          <Link
            href="/admin"
            target="_blank"
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all shrink-0"
            title="Abrir panel operativo del cliente demo Churu's"
          >
            <span className="whitespace-nowrap">Ver Demo</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="h-5 w-px bg-slate-800 hidden lg:block" />

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right hidden lg:block">
              <div className="text-xs font-black text-white truncate max-w-[140px]">{session?.user?.name || 'Master CEO'}</div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Super Admin</div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer shrink-0"
              title="Cerrar sesión maestra"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Master Content with min-w-0 and w-full */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-4 sm:px-6 text-center text-xs text-slate-500 w-full min-w-0 truncate">
        PITHY Multi-Tenant SaaS Engine &bull; Servidor Principal 64.176.21.229 &bull; Todos los derechos reservados
      </footer>
    </div>
  );
}
