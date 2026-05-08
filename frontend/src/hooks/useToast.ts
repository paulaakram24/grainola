'use client';
import { useState, useCallback } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  action?: React.ReactNode;
}

let toastId = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let memoryToasts: Toast[] = [];

function dispatch(toast: Toast) {
  memoryToasts = [...memoryToasts, toast];
  listeners.forEach((l) => l(memoryToasts));
  setTimeout(() => {
    memoryToasts = memoryToasts.filter((t) => t.id !== toast.id);
    listeners.forEach((l) => l(memoryToasts));
  }, 4000);
}

export function toast(props: Omit<Toast, 'id'>) {
  dispatch({ ...props, id: String(++toastId) });
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryToasts);

  useState(() => {
    listeners.push(setToasts);
    return () => {
      const idx = listeners.indexOf(setToasts);
      if (idx > -1) listeners.splice(idx, 1);
    };
  });

  return { toasts, toast };
}
