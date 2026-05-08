'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Calendar, Import, Loader2, CheckCircle2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fullDate } from '@/lib/utils';
import { toast } from '@/hooks/useToast';
import { useAuthStore } from '@/store/auth.store';
import { MOCK_CALENDAR_EVENTS } from '@/lib/mockData';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function CalendarPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [imported, setImported] = useState<Set<string>>(new Set());
  const qc = useQueryClient();
  const { accessToken } = useAuthStore();

  const { data: events, isLoading, error } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: IS_DEMO
      ? () => Promise.resolve(MOCK_CALENDAR_EVENTS)
      : () => api.get('/calendar/events').then((r) => r.data.data),
    retry: false,
  });

  const importMutation = useMutation({
    mutationFn: IS_DEMO
      ? (eventIds: string[]) => {
          setImported((prev) => new Set([...prev, ...eventIds]));
          return Promise.resolve(eventIds.map((id) => ({ id })));
        }
      : (eventIds: string[]) =>
          api.post('/calendar/import', { eventIds }).then((r) => r.data.data),
    onSuccess: (data: any[]) => {
      toast({ title: `${data.length} meeting${data.length !== 1 ? 's' : ''} imported` });
      qc.invalidateQueries({ queryKey: ['meetings'] });
      setSelectedIds(new Set());
    },
    onError: (err: any) => toast({
      title: 'Import failed',
      description: err?.response?.data?.message ?? 'Please try again.',
      variant: 'destructive',
    }),
  });

  const toggle = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const connectUrl = `${process.env.NEXT_PUBLIC_API_URL}/calendar/oauth/connect?token=${accessToken}`;

  if (!IS_DEMO && error) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto" />
        <h2 className="font-semibold text-gray-900">Connect Google Calendar</h2>
        <p className="text-sm text-muted-foreground">
          Import your meetings directly from Google Calendar and attach recordings to events.
        </p>
        <Button asChild>
          <a href={connectUrl}>
            <ExternalLink className="h-4 w-4" />
            Connect Google Calendar
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-gray-900">Upcoming Events</h2>
          <p className="text-sm text-muted-foreground">Select events to import as meetings</p>
        </div>
        {selectedIds.size > 0 && (
          <Button onClick={() => importMutation.mutate([...selectedIds])} disabled={importMutation.isPending}>
            {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            <Import className="h-4 w-4" />
            Import {selectedIds.size} event{selectedIds.size !== 1 ? 's' : ''}
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-2">
          {events?.map((event: any) => (
            <div
              key={event.id}
              className={`bg-white border rounded-lg p-4 cursor-pointer transition-all ${
                imported.has(event.id)
                  ? 'border-green-300 bg-green-50 opacity-60'
                  : selectedIds.has(event.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
              onClick={() => !imported.has(event.id) && toggle(event.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                  imported.has(event.id)    ? 'border-green-500 bg-green-500'   :
                  selectedIds.has(event.id) ? 'border-primary bg-primary'       : 'border-gray-300'
                }`}>
                  {(selectedIds.has(event.id) || imported.has(event.id)) &&
                    <CheckCircle2 className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{event.summary ?? 'Untitled Event'}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {event.start?.dateTime ? fullDate(event.start.dateTime) : event.start?.date ?? 'No date'}
                  </p>
                  {event.attendees && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                    </p>
                  )}
                  {imported.has(event.id) && (
                    <p className="text-xs text-green-600 font-medium mt-1">Imported as meeting</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
