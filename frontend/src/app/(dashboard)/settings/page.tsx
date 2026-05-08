'use client';
import Link from 'next/link';
import { User as UserIcon, Zap, Calendar, LogOut } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useMySubscription } from '@/hooks/useSubscription';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const { user } = useAuthStore();
  const { data: sub } = useMySubscription();
  const logout = useLogout();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
        <p className="text-sm text-muted-foreground">Manage your account and preferences.</p>
      </div>

      {/* Profile */}
      <section className="bg-white border border-border rounded-lg p-5 space-y-4">
        <div className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Profile</h3>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-xl">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="space-y-0.5">
            <p className="font-medium text-gray-900">{user?.name ?? 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
          </div>
        </div>
      </section>

      {/* Plan */}
      <section className="bg-white border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Subscription</h3>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-900">
              Current plan: <span className="font-semibold">{sub?.plan?.name ?? 'Free'}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sub?.plan?.description}
            </p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href="/pricing">Manage plan</Link>
          </Button>
        </div>
      </section>

      {/* Integrations */}
      <section className="bg-white border border-border rounded-lg p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Integrations</h3>
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">Google Calendar</p>
          <Button asChild variant="outline" size="sm">
            <Link href="/calendar">Configure</Link>
          </Button>
        </div>
      </section>

      {/* Sign out */}
      <section className="bg-white border border-border rounded-lg p-5 flex items-center justify-between">
        <div>
          <p className="font-medium text-gray-900">Sign out</p>
          <p className="text-sm text-muted-foreground">End your current session.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => logout.mutate()}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </section>
    </div>
  );
}
