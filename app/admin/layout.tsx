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
      <div className="h-screen w-screen overflow-hidden flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="hidden md:block shrink-0">
          <AdminHeader />
        </div>
        <main className="flex-1 min-h-0 w-full overflow-hidden p-0 md:p-3 pb-16 md:pb-0">
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
