'use client';
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@radix-ui/react-toast';
import { useToast } from '@/hooks/useToast';

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props} className="group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all bg-white border-border">
          <div className="grid gap-1">
            {title && <ToastTitle className="text-sm font-semibold">{title}</ToastTitle>}
            {description && <ToastDescription className="text-sm opacity-90">{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-foreground" />
        </Toast>
      ))}
      <ToastViewport className="fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]" />
    </ToastProvider>
  );
}
