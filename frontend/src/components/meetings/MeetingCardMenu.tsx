'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUpdateMeeting, useDeleteMeeting } from '@/hooks/useMeetings';
import { toast } from '@/hooks/useToast';

export function MeetingCardMenu({
  meetingId,
  currentTitle,
  onAfterDelete,
}: {
  meetingId: string;
  currentTitle: string;
  onAfterDelete?: () => void;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const stop = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <>
      <div ref={wrapperRef} className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 data-[open=true]:opacity-100 flex-shrink-0"
          data-open={open}
          onClick={(e) => {
            stop(e);
            setOpen((s) => !s);
          }}
          aria-label="Meeting actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>

        {open && (
          <div
            onClick={stop}
            className="absolute right-0 mt-1 w-44 rounded-md border border-border bg-white shadow-lg z-20 py-1"
          >
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 text-gray-700"
              onClick={(e) => {
                stop(e);
                setOpen(false);
                setShowRename(true);
              }}
            >
              <Pencil className="h-3.5 w-3.5" />
              Rename
            </button>
            <button
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
              onClick={(e) => {
                stop(e);
                setOpen(false);
                setShowDelete(true);
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        )}
      </div>

      {showRename && (
        <RenameMeetingDialog
          meetingId={meetingId}
          currentTitle={currentTitle}
          onClose={() => setShowRename(false)}
        />
      )}

      {showDelete && (
        <DeleteMeetingDialog
          meetingId={meetingId}
          title={currentTitle}
          onClose={() => setShowDelete(false)}
          onAfterDelete={() => {
            setShowDelete(false);
            onAfterDelete?.();
          }}
        />
      )}
    </>
  );
}

function RenameMeetingDialog({
  meetingId,
  currentTitle,
  onClose,
}: {
  meetingId: string;
  currentTitle: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(currentTitle);
  const update = useUpdateMeeting();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || title.trim() === currentTitle) {
      onClose();
      return;
    }
    try {
      await update.mutateAsync({ id: meetingId, title: title.trim() });
      toast({ title: 'Meeting renamed' });
      onClose();
    } catch (err: any) {
      toast({
        title: 'Could not rename',
        description: err?.response?.data?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
      >
        <h2 className="font-semibold text-gray-900">Rename meeting</h2>
        <div className="space-y-2">
          <Label htmlFor="rename-title">Title</Label>
          <Input
            id="rename-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            maxLength={200}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={update.isPending}>
            {update.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Save
          </Button>
        </div>
      </form>
    </div>
  );
}

function DeleteMeetingDialog({
  meetingId,
  title,
  onClose,
  onAfterDelete,
}: {
  meetingId: string;
  title: string;
  onClose: () => void;
  onAfterDelete: () => void;
}) {
  const del = useDeleteMeeting();

  const handleDelete = async () => {
    try {
      await del.mutateAsync(meetingId);
      toast({ title: 'Meeting deleted' });
      onAfterDelete();
    } catch (err: any) {
      toast({
        title: 'Could not delete',
        description: err?.response?.data?.message ?? 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-xl w-full max-w-md p-5 space-y-4"
      >
        <div>
          <h2 className="font-semibold text-gray-900">Delete meeting?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="font-medium text-gray-700">&ldquo;{title}&rdquo;</span> and all its
            recordings, transcript, and summary will be permanently deleted. This cannot be undone.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            type="button"
            onClick={handleDelete}
            disabled={del.isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {del.isPending && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
}
