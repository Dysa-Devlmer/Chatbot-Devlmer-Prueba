'use client';

import { usePathname } from 'next/navigation';
import { AdminHeader } from './components/AdminHeader';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isInbox = pathname?.startsWith('/admin/inbox');

  if (isInbox) {
    return (
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-900 text-slate-100">
        <main className="flex-1 h-full w-full overflow-hidden pb-16 md:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <AdminHeader />
      <main className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 pt-4 pb-24 md:pb-10">
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
