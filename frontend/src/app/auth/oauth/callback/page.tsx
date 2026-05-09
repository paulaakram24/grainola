'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const dynamic = 'force-dynamic';

function OAuthCallbackInner() {
  const router = useRouter();
  const params = useSearchParams();
  const setAuth = useAuthStore((s) => s.setAuth);

  useEffect(() => {
    const accessToken  = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    const userJson     = params.get('user');
    const error        = params.get('error');

    if (error) {
      router.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!accessToken || !refreshToken || !userJson) {
      router.replace('/login?error=Missing+OAuth+payload');
      return;
    }

    try {
      const user = JSON.parse(userJson);
      setAuth(user, accessToken, refreshToken);
      router.replace('/dashboard');
    } catch {
      router.replace('/login?error=Invalid+OAuth+payload');
    }
  }, [params, router, setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">Signing you in…</p>
    </div>
  );
}

export default function OAuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <OAuthCallbackInner />
    </Suspense>
  );
}
