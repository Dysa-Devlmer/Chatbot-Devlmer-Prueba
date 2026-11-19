import { AdminHeader } from './components/AdminHeader';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
