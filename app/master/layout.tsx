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
    <div className="min-h-screen bg-[#0d0f12] text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-stone-950">
      {/* Top SuperAdmin Header */}
      <header className="sticky top-0 z-50 bg-[#12161c]/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-stone-950 font-black shadow-lg shadow-amber-500/20">
            <Building2 className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base tracking-tight text-white">
                PITHY SAAS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                Master Owner Panel
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Centro de Control Global de Empresas Arrendatarias & Facturación
            </p>
          </div>
        </div>

        {/* Right Section: Status, Demo switch & Logout */}
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Infraestructura VPS Online</span>
          </div>

          <Link
            href="/admin"
            target="_blank"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 transition-all"
            title="Abrir panel operativo del cliente demo Churu's"
          >
            <span>Ver Local Demo</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </Link>

          <div className="h-6 w-px bg-slate-800" />

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-black text-white">{session?.user?.name || 'Master CEO'}</div>
              <div className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">Super Administrador</div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              title="Cerrar sesión maestra"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Master Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 py-4 px-6 text-center text-xs text-slate-500">
        PITHY Multi-Tenant SaaS Engine &bull; Servidor Principal 64.176.21.229 &bull; Todos los derechos reservados
      </footer>
    </div>
  );
}
