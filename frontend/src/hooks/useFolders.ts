'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { MOCK_FOLDERS } from '@/lib/mockData';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export interface Folder {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  position: number;
  _count: { meetings: number };
}

const FOLDERS_KEY = ['folders'];

export function useFolders() {
  return useQuery<Folder[]>({
    queryKey: FOLDERS_KEY,
    queryFn: IS_DEMO
      ? () => Promise.resolve(MOCK_FOLDERS as Folder[])
      : () => api.get('/folders').then((r) => r.data.data),
  });
}

export function useCreateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? (data: { name: string; color?: string }) =>
          Promise.resolve({ id: Math.random().toString(36).slice(2), isDefault: false, position: 99, _count: { meetings: 0 }, ...data, color: data.color ?? '#6366f1' } as Folder)
      : (data: { name: string; color?: string }) =>
          api.post('/folders', data).then((r) => r.data.data),
    onSuccess: (folder) => {
      if (IS_DEMO) {
        qc.setQueryData<Folder[]>(FOLDERS_KEY, (old = []) => [...old, folder]);
      } else {
        qc.invalidateQueries({ queryKey: FOLDERS_KEY });
      }
    },
  });
}

export function useUpdateFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? ({ id, ...data }: { id: string; name?: string; color?: string }) => Promise.resolve({ id, ...data } as Folder)
      : ({ id, ...data }: { id: string; name?: string; color?: string }) =>
          api.put(`/folders/${id}`, data).then((r) => r.data.data),
    onSuccess: (updated) => {
      if (IS_DEMO) {
        qc.setQueryData<Folder[]>(FOLDERS_KEY, (old = []) =>
          old.map((f) => (f.id === updated.id ? { ...f, ...updated } : f))
        );
      } else {
        qc.invalidateQueries({ queryKey: FOLDERS_KEY });
      }
    },
  });
}

export function useDeleteFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? (id: string) => Promise.resolve(id)
      : (id: string) => api.delete(`/folders/${id}`),
    onSuccess: (id) => {
      if (IS_DEMO) {
        qc.setQueryData<Folder[]>(FOLDERS_KEY, (old = []) => old.filter((f) => f.id !== id));
      } else {
        qc.invalidateQueries({ queryKey: FOLDERS_KEY });
      }
    },
  });
}

export function useReorderFolders() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: IS_DEMO
      ? (orderedIds: string[]) => Promise.resolve(orderedIds)
      : (orderedIds: string[]) => api.put('/folders/reorder', { orderedIds }),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: FOLDERS_KEY });
      const prev = qc.getQueryData<Folder[]>(FOLDERS_KEY);
      qc.setQueryData<Folder[]>(FOLDERS_KEY, (old) =>
        orderedIds.map((id, i) => ({ ...old?.find((f) => f.id === id)!, position: i }))
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(FOLDERS_KEY, ctx.prev);
    },
    onSettled: () => {
      if (!IS_DEMO) qc.invalidateQueries({ queryKey: FOLDERS_KEY });
    },
  });
}
