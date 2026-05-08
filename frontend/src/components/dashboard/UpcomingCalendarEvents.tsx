'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Calendar, ExternalLink, Loader2, ChevronRight, Users, Import } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/auth.store';
import { fullDate } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/useToast';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

interface CalendarEvent {
  id: string;
  summary?: string;
  description?: string;
  start?: { dateTime?: string; date?: string };
  attendees?: { email?: string; displayName?: string }[];
}

export function UpcomingCalendarEvents() {
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: events, isLoading, error } = useQuery<CalendarEvent[]>({
    queryKey: ['calendar-events'],
    queryFn: () => api.get('/calendar/events').then((r) => r.data.data),
    retry: false,
    enabled: !IS_DEMO,
  });

  const importOne = useMutation({
    mutationFn: (eventId: string) =>
      api.post('/calendar/import', { eventIds: [eventId] }).then((r) => r.data.data),
    onMutate: (id) => setBusyId(id),
    onSuccess: () => {
      toast({ title: 'Imported as a meeting' });
      qc.invalidateQueries({ queryKey: ['meetings'] });
      qc.invalidateQueries({ queryKey: ['calendar-events'] });
    },
    onError: (err: any) => toast({
      title: 'Import failed',
      description: err?.response?.data?.message ?? 'Please try again.',
      variant: 'destructive',
    }),
    onSettled: () => setBusyId(null),
  });

  // Hide the section entirely if calendar isn't connected (we don't want to nag).
  if (error) return null;

  const connectUrl = `${process.env.NEXT_PUBLIC_API_URL}/calendar/oauth/connect?token=${accessToken}`;

  return (
    <section className="bg-white border border-border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold text-gray-900">Upcoming from Google Calendar</h3>
        </div>
        <Button asChild variant="ghost" size="sm" className="text-xs h-7">
          <Link href="/calendar" className="flex items-center gap-1">
            View all
            <ChevronRight className="h-3 w-3" />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      ) : !events || events.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          No upcoming events.{' '}
          <a href={connectUrl} className="text-primary hover:underline inline-flex items-center gap-1">
            <ExternalLink className="h-3 w-3" />
            Connect calendar
          </a>
        </p>
      ) : (
        <ul className="space-y-1.5">
          {events.slice(0, 5).map((event) => {
            const date = event.start?.dateTime ?? event.start?.date;
            const isBusy = busyId === event.id;
            return (
              <li
                key={event.id}
                className="flex items-center gap-3 px-3 py-2 rounded-md border border-border bg-white hover:bg-gray-50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {event.summary ?? 'Untitled Event'}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                    <span>{date ? fullDate(date) : 'No date'}</span>
                    {event.attendees && event.attendees.length > 0 && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {event.attendees.length}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={isBusy || importOne.isPending}
                  onClick={() => importOne.mutate(event.id)}
                >
                  {isBusy ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <>
                      <Import className="h-3 w-3" />
                      Import
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
