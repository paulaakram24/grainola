'use client';
import Link from 'next/link';
import { Clock, CheckCircle2, AlertCircle, Loader2, Folder, Star } from 'lucide-react';
import { cn, formatDuration, relativeDate } from '@/lib/utils';
import type { Meeting } from '@/hooks/useMeetings';
import { MeetingCardMenu } from '@/components/meetings/MeetingCardMenu';

const statusConfig = {
  PENDING:    { icon: Clock,         color: 'text-gray-400',  label: 'Pending' },
  PROCESSING: { icon: Loader2,       color: 'text-blue-500',  label: 'Processing' },
  COMPLETED:  { icon: CheckCircle2,  color: 'text-green-500', label: 'Ready' },
  FAILED:     { icon: AlertCircle,   color: 'text-red-500',   label: 'Failed' },
};

export function MeetingCard({ meeting }: { meeting: Meeting }) {
  const status = statusConfig[meeting.status];
  const StatusIcon = status.icon;

  return (
    <Link href={`/meetings/${meeting.id}`}>
      <div className="group bg-white rounded-lg border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer">
        <div className="flex items-start gap-3">
          {/* Color dot from folder */}
          <div
            className="w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0"
            style={{ backgroundColor: meeting.folder?.color ?? '#6366f1' }}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-gray-900 truncate">{meeting.title}</h3>
              <MeetingCardMenu meetingId={meeting.id} currentTitle={meeting.title} />
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Folder className="h-3 w-3" />
                {meeting.folder?.name ?? 'All Meetings'}
              </span>
              {meeting.durationSeconds && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(meeting.durationSeconds)}
                </span>
              )}
              {meeting._count.highlights > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {meeting._count.highlights}
                </span>
              )}
              <span className="ml-auto">{relativeDate(meeting.meetingDate)}</span>
            </div>

            {meeting.summary?.shortText && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                {meeting.summary.shortText}
              </p>
            )}
          </div>

          <div className={cn('flex items-center gap-1 text-xs flex-shrink-0', status.color)}>
            <StatusIcon className={cn('h-3.5 w-3.5', meeting.status === 'PROCESSING' && 'animate-spin')} />
            <span>{status.label}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
