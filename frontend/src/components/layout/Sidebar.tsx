'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Plus, Calendar, Search, LayoutDashboard, Zap, LogOut, Settings, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFolders } from '@/hooks/useFolders';
import { useAuthStore } from '@/store/auth.store';
import { useUIStore } from '@/store/ui.store';
import { useLogout } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { CreateFolderDialog } from '@/components/folders/CreateFolderDialog';
import { SortableFolderList } from '@/components/folders/SortableFolderList';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const logout = useLogout();
  const { data: folders = [] } = useFolders();
  const [showCreateFolder, setShowCreateFolder] = useState(false);

  // Mobile drawer state. On md+ the sidebar is always visible via CSS,
  // on mobile it slides in over the content when sidebarOpen is true.
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  // Auto-close the mobile drawer whenever the user navigates to a new page.
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/search',    label: 'Search',    icon: Search },
    { href: '/calendar',  label: 'Calendar',  icon: Calendar },
    { href: '/pricing',   label: 'Upgrade',   icon: Zap },
  ];

  return (
    <>
      {/* Backdrop — only visible when the mobile drawer is open. Tapping it closes the drawer. */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          // Desktop: in-flow flex item, always visible. Mobile: fixed off-canvas drawer.
          'w-64 flex-shrink-0 border-r border-border bg-white flex flex-col h-screen z-40',
          'fixed top-0 left-0 transition-transform duration-200 ease-out',
          'md:sticky md:translate-x-0',
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full md:translate-x-0',
        )}
      >
      {/* Logo */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="font-bold text-gray-900">Grainola</span>
        </div>
        {/* Close button — mobile only */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close menu"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
              pathname === href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      <div className="px-3 py-2">
        <div className="h-px bg-border" />
      </div>

      {/* Folders */}
      <div className="flex-1 overflow-y-auto px-3 pb-2">
        <div className="flex items-center justify-between py-2 px-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Folders
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setShowCreateFolder(true)}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>

        <SortableFolderList folders={folders} />
      </div>

      {/* User profile + settings (sticky bottom) */}
      <div className="border-t border-border p-3 space-y-1">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors',
            pathname === '/settings'
              ? 'bg-primary/10 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>

        <div className="flex items-center gap-2 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground flex-shrink-0"
            onClick={() => logout.mutate()}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {showCreateFolder && (
        <CreateFolderDialog onClose={() => setShowCreateFolder(false)} />
      )}
      </aside>
    </>
  );
}
