'use client';
import { Upload, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { NewMeetingDialog } from '@/components/meetings/NewMeetingDialog';
import { useUIStore } from '@/store/ui.store';

export function Topbar({ title }: { title?: string }) {
  const [showNewMeeting, setShowNewMeeting] = useState(false);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  return (
    <header className="h-14 border-b border-border bg-white px-4 sm:px-6 flex items-center justify-between sticky top-0 z-10">
      <div className="flex items-center gap-2 min-w-0">
        {/* Hamburger — opens the sidebar drawer on mobile. Hidden on md+. */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 md:hidden flex-shrink-0"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-gray-900 truncate">{title ?? 'Dashboard'}</h1>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <Button size="sm" onClick={() => setShowNewMeeting(true)}>
          <Upload className="h-4 w-4" />
          <span className="hidden sm:inline">New Meeting</span>
        </Button>
      </div>

      {showNewMeeting && <NewMeetingDialog onClose={() => setShowNewMeeting(false)} />}
    </header>
  );
}
