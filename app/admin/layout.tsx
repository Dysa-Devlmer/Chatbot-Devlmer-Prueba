import { AdminHeader } from './components/AdminHeader';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a' }}>
      <AdminHeader />
      <main style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
        {children}
      </main>
    </div>
  );
}
