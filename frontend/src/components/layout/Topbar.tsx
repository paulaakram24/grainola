'use client';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { NewMeetingDialog } from '@/components/meetings/NewMeetingDialog';

export function Topbar({ title }: { title?: string }) {
  const [showNewMeeting, setShowNewMeeting] = useState(false);

  return (
    <header className="h-14 border-b border-border bg-white px-6 flex items-center justify-between sticky top-0 z-10">
      <h1 className="font-semibold text-gray-900">{title ?? 'Dashboard'}</h1>

      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => setShowNewMeeting(true)}>
          <Upload className="h-4 w-4" />
          New Meeting
        </Button>
      </div>

      {showNewMeeting && <NewMeetingDialog onClose={() => setShowNewMeeting(false)} />}
    </header>
  );
}
