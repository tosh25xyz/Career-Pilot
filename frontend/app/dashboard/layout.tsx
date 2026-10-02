import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import { ToastProvider } from '@/components/shared/Toast';
import MobileHeader from '@/components/layout/MobileHeader';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!userId) redirect('/sign-in');

  return (
    <ToastProvider>
      <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: '#0d1025' }}>
        {/* Desktop sidebar — hidden on mobile via CSS */}
        <div className="desktop-sidebar">
          <Sidebar />
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
          {/* Mobile-only top bar with hamburger */}
          <MobileHeader />

          <main style={{ flex: 1, overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </div>

      <style>{`
        .desktop-sidebar { display: block; }
        @media (max-width: 860px) {
          .desktop-sidebar { display: none; }
        }
      `}</style>
    </ToastProvider>
  );
}
