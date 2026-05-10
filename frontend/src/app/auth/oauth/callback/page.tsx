'use client';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const dynamic = 'force-dynamic';

export default function OAuthCallbackPage() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const [status, setStatus] = useState<'working' | 'error'>('working');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const search = typeof window !== 'undefined' ? window.location.search : '';
    const sp = new URLSearchParams(search);

    const error        = sp.get('error');
    const accessToken  = sp.get('accessToken');
    const refreshToken = sp.get('refreshToken');
    const userJson     = sp.get('user');

    if (error) {
      window.location.replace(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (!accessToken || !refreshToken || !userJson) {
      window.location.replace('/login?error=Missing+OAuth+payload');
      return;
    }

    try {
      const user = JSON.parse(userJson);
      setAuth(user, accessToken, refreshToken);

      // Belt-and-braces: write directly to the persisted localStorage key
      // so a hard navigation re-hydrates with the new auth, regardless of
      // whether Zustand's persist middleware has flushed yet.
      const persisted = {
        state: {
          user, accessToken, refreshToken, isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem('auth-storage', JSON.stringify(persisted));

      // Hard navigation forces the dashboard route to re-read auth from
      // localStorage on a fresh app instance — eliminates the in-memory
      // vs persisted state race that router.replace can hit.
      window.location.replace('/dashboard');
    } catch (e: any) {
      setStatus('error');
      setErrorMsg(e?.message ?? 'Invalid OAuth payload');
      setTimeout(() => window.location.replace('/login?error=Invalid+OAuth+payload'), 1500);
    }
  }, [setAuth]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3">
      {status === 'working' ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Signing you in…</p>
        </>
      ) : (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
