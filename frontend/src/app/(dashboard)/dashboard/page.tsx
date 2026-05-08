'use client';
import { useMeetings } from '@/hooks/useMeetings';
import { MeetingCard } from '@/components/meetings/MeetingCard';
import { MeetingsEmptyState } from '@/components/meetings/MeetingsEmptyState';
import { MeetingCardSkeleton } from '@/components/meetings/MeetingCardSkeleton';
import { UpcomingCalendarEvents } from '@/components/dashboard/UpcomingCalendarEvents';
import { useUIStore } from '@/store/ui.store';

export default function DashboardPage() {
  const { activeFolderId } = useUIStore();
  const { data: meetings, isLoading } = useMeetings(
    activeFolderId ? { folderId: activeFolderId } : undefined
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Upcoming events from Google Calendar (auto-hides if not connected) */}
      <UpcomingCalendarEvents />

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent Meetings</h2>
          <p className="text-sm text-muted-foreground">
            {meetings?.length ?? 0} meeting{meetings?.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {Array.from({ length: 5 }).map((_, i) => <MeetingCardSkeleton key={i} />)}
        </div>
      ) : !meetings?.length ? (
        <MeetingsEmptyState />
      ) : (
        <div className="grid gap-3">
          {meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} />
          ))}
        </div>
      )}
    </div>
  );
}
