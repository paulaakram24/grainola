'use client';
import { Mic, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { NewMeetingDialog } from './NewMeetingDialog';

export function MeetingsEmptyState() {
  const [show, setShow] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
        <Mic className="h-8 w-8 text-primary" />
      </div>
      <h3 className="font-semibold text-gray-900 mb-1">No meetings yet</h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-xs">
        Upload a recording to get an AI-generated transcript and summary instantly.
      </p>
      <Button onClick={() => setShow(true)}>
        <Upload className="h-4 w-4" />
        Upload your first meeting
      </Button>
      {show && <NewMeetingDialog onClose={() => setShow(false)} />}
    </div>
  );
}
