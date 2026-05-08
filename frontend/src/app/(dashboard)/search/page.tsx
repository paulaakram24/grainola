'use client';
import { useState } from 'react';
import { Search, Loader2, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { formatDuration, relativeDate } from '@/lib/utils';
import Link from 'next/link';
import { useDebounce } from '@/hooks/useDebounce';
import { MOCK_SEARCH_RESULTS } from '@/lib/mockData';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 400);

  const { data, isLoading } = useQuery({
    queryKey: ['search', debouncedQuery],
    queryFn: IS_DEMO
      ? () => Promise.resolve(
          debouncedQuery.length >= 2
            ? MOCK_SEARCH_RESULTS.filter((r) =>
                r.segment.text.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                r.title.toLowerCase().includes(debouncedQuery.toLowerCase())
              )
            : []
        )
      : () => api.get('/search', { params: { q: debouncedQuery } }).then((r) => r.data.data),
    enabled: debouncedQuery.length >= 2,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9 h-11 text-base"
          placeholder="Search across all transcripts…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {data?.length === 0 && debouncedQuery && (
        <p className="text-center text-muted-foreground py-12">No results for "{debouncedQuery}"</p>
      )}

      {!query && (
        <p className="text-center text-muted-foreground py-12 text-sm">
          Type at least 2 characters to search inside meeting transcripts
        </p>
      )}

      {data && data.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">{data.length} result{data.length !== 1 ? 's' : ''}</p>
          {data.map((result: any) => (
            <Link key={result.id} href={`/meetings/${result.id === 'sr1' || result.id === 'sr2' ? 'm1' : result.id}`}>
              <div className="bg-white border border-border rounded-lg p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                <p className="font-medium text-sm text-gray-900">{result.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                  {relativeDate(result.meetingDate)}
                </p>
                <p className="text-sm text-gray-700 bg-yellow-50 rounded px-2 py-1 border border-yellow-100">
                  <span className="text-xs text-muted-foreground mr-2">
                    <Clock className="inline h-3 w-3 mr-0.5" />
                    {formatDuration(result.segment.startTime)}
                  </span>
                  {result.segment.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
