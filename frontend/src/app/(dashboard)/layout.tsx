'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

import { useAuthStore } from '@/store/auth.store';
import { MOCK_USER } from '@/lib/mockData';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, setAuth } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (IS_DEMO && !isAuthenticated) {
      setAuth(MOCK_USER, 'demo-token', 'demo-refresh');
    } else if (!IS_DEMO && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router, setAuth]);

  // Wait for client hydration before deciding to render or redirect
  if (!mounted) return null;
  if (!isAuthenticated && !IS_DEMO) return null;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
