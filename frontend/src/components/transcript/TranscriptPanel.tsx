'use client';
import { useEffect, useRef } from 'react';
import { Loader2, AlertCircle, Download } from 'lucide-react';
import { cn, formatDuration } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { MeetingDetail } from '@/hooks/useMeetings';

type Transcript = NonNullable<MeetingDetail['transcript']>;
type Highlight = MeetingDetail['highlights'][number];

interface TranscriptPanelProps {
  transcript: Transcript | null;
  highlights: Highlight[];
  currentTime: number;
  meetingId: string;
}

export function TranscriptPanel({ transcript, highlights, currentTime, meetingId }: TranscriptPanelProps) {
  const activeRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [currentTime]);

  if (!transcript || transcript.status === 'PENDING' || transcript.status === 'PROCESSING') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="font-medium text-gray-900">Transcribing audio…</p>
        <p className="text-sm text-muted-foreground mt-1">This usually takes 1–3 minutes</p>
      </div>
    );
  }

  if (transcript.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="font-medium">Transcription failed</p>
        <p className="text-sm text-muted-foreground mt-1">Please try re-uploading the recording</p>
      </div>
    );
  }

  const highlightMap = new Map(highlights.map((h) => [h.id, h]));

  const isActive = (start: number, end: number) =>
    currentTime >= start && currentTime <= end;

  const isHighlighted = (start: number, end: number) =>
    highlights.some((h) => h.startTime <= end && h.endTime >= start);

  const exportText = () => {
    const text = transcript.segments
      .map((s) => `[${formatDuration(s.startTime)}] ${s.text}`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transcript-${meetingId}.txt`;
    a.click();
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportText}>
          <Download className="h-3.5 w-3.5" />
          Export TXT
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-border divide-y divide-border max-h-[600px] overflow-y-auto">
        {transcript.segments.map((seg) => {
          const active = isActive(seg.startTime, seg.endTime);
          const highlighted = isHighlighted(seg.startTime, seg.endTime);

          return (
            <div
              key={seg.id}
              ref={active ? activeRef : null}
              className={cn(
                'flex gap-3 p-3 text-sm transition-colors',
                active && 'bg-primary/5',
                highlighted && 'bg-amber-50'
              )}
            >
              <span className="text-xs text-muted-foreground tabular-nums w-12 flex-shrink-0 pt-0.5">
                {formatDuration(seg.startTime)}
              </span>
              <p className={cn('flex-1 leading-relaxed', active && 'text-primary font-medium')}>
                {seg.text}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
