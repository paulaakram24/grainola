'use client';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { MOCK_USER } from '@/lib/mockData';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface AuthPayload {
  name?: string;
  email: string;
  password: string;
}

export function useRegister() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: IS_DEMO
      ? (_data: AuthPayload) => Promise.resolve({ user: MOCK_USER, accessToken: 'demo-token', refreshToken: 'demo-refresh' })
      : (data: AuthPayload) => api.post('/auth/register', data).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/dashboard');
    },
  });
}

export function useLogin() {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: IS_DEMO
      ? (_data: Omit<AuthPayload, 'name'>) => Promise.resolve({ user: MOCK_USER, accessToken: 'demo-token', refreshToken: 'demo-refresh' })
      : (data: Omit<AuthPayload, 'name'>) => api.post('/auth/login', data).then((r) => r.data.data),
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken, data.refreshToken);
      router.replace('/dashboard');
    },
  });
}

export function useLogout() {
  const { refreshToken, logout } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      if (IS_DEMO) return;
      await api.post('/auth/logout', { refreshToken });
    },
    onSettled: () => {
      logout();
      router.replace('/login');
    },
  });
}
