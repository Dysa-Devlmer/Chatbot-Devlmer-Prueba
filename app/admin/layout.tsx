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
  const isOrders = pathname?.startsWith('/admin/orders');

  if (isInbox) {
    return (
      <div className="h-screen w-screen max-w-full overflow-hidden flex flex-col bg-slate-50 dark:bg-[#141312] text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <AdminHeader />
        <main className="flex-1 min-h-0 w-full max-w-full overflow-hidden p-0 md:p-3 pb-16 md:pb-0">
          {children}
        </main>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-50 dark:bg-[#141312] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <AdminHeader />
      <main className={`flex-1 w-full max-w-full overflow-x-hidden ${isOrders ? 'px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-5' : 'max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6'} pb-20 md:pb-10`}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  );
}
