'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Clock, Calendar, Folder, Loader2,
  FileText, Lightbulb, Mic, Plus, Music2, Trash2,
} from 'lucide-react';
import { useMeeting, useMoveMeeting, useDeleteRecording } from '@/hooks/useMeetings';
import { useFolders } from '@/hooks/useFolders';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from '@/components/transcript/AudioPlayer';
import { TranscriptPanel } from '@/components/transcript/TranscriptPanel';
import { SummaryPanel } from '@/components/transcript/SummaryPanel';
import { AddRecordingDialog } from '@/components/meetings/AddRecordingDialog';
import { mediaUrl } from '@/lib/api';
import { formatDuration, fullDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/useToast';

type Tab = 'transcript' | 'summary';

export default function MeetingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: meeting, isLoading } = useMeeting(id);
  const { data: folders = [] } = useFolders();
  const moveMeeting = useMoveMeeting();
  const deleteRecording = useDeleteRecording();

  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<Tab>('transcript');
  const [activeRecordingIdx, setActiveRecordingIdx] = useState(0);
  const [showAddRecording, setShowAddRecording] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!meeting) return null;

  const recordings = meeting.recordings ?? [];
  const safeIdx = recordings.length === 0 ? 0 : Math.min(activeRecordingIdx, recordings.length - 1);
  const activeRecording = recordings[safeIdx];

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'transcript', label: 'Transcript', icon: FileText },
    { id: 'summary',    label: 'AI Summary', icon: Lightbulb },
  ];

  const handleFolderChange = (newFolderId: string) => {
    if (newFolderId === meeting.folder?.id) return;
    moveMeeting.mutate(
      { meetingId: id, folderId: newFolderId },
      {
        onSuccess: () => toast({ title: 'Meeting moved' }),
        onError:   (err: any) => toast({
          title: 'Could not move meeting',
          description: err?.response?.data?.message ?? 'Please try again.',
          variant: 'destructive',
        }),
      },
    );
  };

  const handleDeleteRecording = (recordingId: string) => {
    deleteRecording.mutate(
      { meetingId: id, recordingId },
      {
        onSuccess: () => {
          toast({ title: 'Recording deleted' });
          setPendingDeleteId(null);
          if (activeRecordingIdx > 0) setActiveRecordingIdx((i) => i - 1);
        },
        onError: (err: any) => toast({
          title: 'Could not delete recording',
          description: err?.response?.data?.message ?? 'Please try again.',
          variant: 'destructive',
        }),
      },
    );
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Back + header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 mt-0.5" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-gray-900 truncate">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {fullDate(meeting.meetingDate)}
            </span>
            {meeting.durationSeconds && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(meeting.durationSeconds)}
              </span>
            )}

            {/* Folder selector — moves the meeting */}
            <span
              className="flex items-center gap-1.5"
              style={{ color: meeting.folder?.color ?? '#6366f1' }}
            >
              <Folder className="h-3 w-3" />
              <select
                value={meeting.folder?.id ?? ''}
                onChange={(e) => handleFolderChange(e.target.value)}
                disabled={moveMeeting.isPending}
                className="bg-transparent border-0 outline-none cursor-pointer text-xs font-medium hover:underline focus:underline disabled:opacity-50"
                style={{ color: meeting.folder?.color ?? '#6366f1' }}
                aria-label="Move meeting to folder"
              >
                {!meeting.folder && <option value="">All Meetings</option>}
                {folders.map((f) => (
                  <option key={f.id} value={f.id} className="text-gray-900">
                    {f.name}
                  </option>
                ))}
              </select>
              {moveMeeting.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            </span>
          </div>
        </div>
      </div>

      {/* Active player */}
      {activeRecording && (
        <AudioPlayer
          key={activeRecording.id}
          src={mediaUrl(activeRecording.s3Url)}
          mimeType={activeRecording.mimeType}
          onTimeUpdate={setCurrentTime}
        />
      )}

      {/* Recordings list */}
      <div className="bg-white rounded-lg border border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mic className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-gray-900">
              Recordings <span className="text-muted-foreground font-normal">({recordings.length})</span>
            </h2>
          </div>
          <Button size="sm" onClick={() => setShowAddRecording(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Recording
          </Button>
        </div>

        {recordings.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recordings yet. Click <span className="font-medium">Add Recording</span> to capture one.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {recordings.map((rec, idx) => {
              const isActive = idx === safeIdx;
              const isDeleting = deleteRecording.isPending && deleteRecording.variables?.recordingId === rec.id;
              const label = rec.fileName ?? `Recording ${idx + 1}`;
              return (
                <li
                  key={rec.id}
                  className={cn(
                    'flex items-center gap-2 pr-1.5 rounded-md border transition-colors',
                    isActive
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-white hover:bg-gray-50',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveRecordingIdx(idx)}
                    className="flex-1 min-w-0 flex items-center gap-3 px-3 py-2 text-sm text-left"
                  >
                    <Music2 className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-primary' : 'text-muted-foreground')} />
                    <span className={cn('flex-1 truncate', isActive ? 'text-primary' : 'text-gray-700')}>{label}</span>
                    {rec.createdAt && (
                      <span className="text-xs text-muted-foreground hidden sm:inline">
                        {new Date(rec.createdAt).toLocaleString()}
                      </span>
                    )}
                    {isActive && (
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">
                        Playing
                      </span>
                    )}
                  </button>

                  {pendingDeleteId === rec.id ? (
                    <div className="flex items-center gap-1.5 pr-1">
                      <span className="text-xs text-red-600 hidden sm:inline">Delete this recording?</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={() => setPendingDeleteId(null)}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDeleteRecording(rec.id)}
                        disabled={isDeleting}
                      >
                        {isDeleting && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                        Delete
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-red-600 flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPendingDeleteId(rec.id);
                      }}
                      aria-label="Delete recording"
                      title="Delete recording"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-1">
        {tabs.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm border-b-2 transition-colors',
              activeTab === tabId
                ? 'border-primary text-primary font-medium'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'transcript' && (
          <TranscriptPanel
            transcript={meeting.transcript ?? null}
            highlights={meeting.highlights}
            currentTime={currentTime}
            meetingId={id}
          />
        )}
        {activeTab === 'summary' && (
          <SummaryPanel summary={meeting.summary ?? null} />
        )}
      </div>

      {showAddRecording && (
        <AddRecordingDialog meetingId={id} onClose={() => setShowAddRecording(false)} />
      )}
    </div>
  );
}
