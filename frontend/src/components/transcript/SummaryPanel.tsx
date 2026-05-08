'use client';
import { Loader2, AlertCircle, CheckCircle2, Tag, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MeetingDetail } from '@/hooks/useMeetings';

type Summary = NonNullable<MeetingDetail['summary']>;

const sentimentConfig = {
  positive: { label: 'Positive', color: 'text-green-600 bg-green-50 border-green-200' },
  neutral:  { label: 'Neutral',  color: 'text-gray-600 bg-gray-50 border-gray-200' },
  negative: { label: 'Negative', color: 'text-red-600 bg-red-50 border-red-200' },
};

export function SummaryPanel({ summary }: { summary: Summary | null }) {
  if (!summary || summary.status === 'PENDING' || summary.status === 'PROCESSING') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p className="font-medium text-gray-900">Generating AI summary…</p>
        <p className="text-sm text-muted-foreground mt-1">Analysing the transcript with GPT-4o</p>
      </div>
    );
  }

  if (summary.status === 'FAILED') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <AlertCircle className="h-8 w-8 text-destructive mb-3" />
        <p className="font-medium">Summary generation failed</p>
      </div>
    );
  }

  const sentiment = summary.sentiment as keyof typeof sentimentConfig | undefined;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Short summary */}
      {summary.shortText && (
        <div className="bg-white rounded-lg border border-border p-5">
          <div className="flex items-start justify-between gap-3">
            <p className="text-gray-700 leading-relaxed">{summary.shortText}</p>
            {sentiment && sentimentConfig[sentiment] && (
              <span className={cn('text-xs px-2 py-1 rounded-full border flex-shrink-0 font-medium', sentimentConfig[sentiment].color)}>
                {sentimentConfig[sentiment].label}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Key points */}
      {summary.bulletPoints && summary.bulletPoints.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Key Points</h3>
          <div className="bg-white rounded-lg border border-border divide-y divide-border">
            {summary.bulletPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 p-3 text-sm">
                <ArrowRight className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-gray-700">{point}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Action items */}
      {summary.actionItems && summary.actionItems.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Action Items</h3>
          <div className="bg-white rounded-lg border border-border divide-y divide-border">
            {summary.actionItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-gray-800">{item.text}</p>
                  {(item.owner || item.dueDate) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.owner && <span className="font-medium">{item.owner}</span>}
                      {item.owner && item.dueDate && ' · '}
                      {item.dueDate && <span>{item.dueDate}</span>}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Key topics */}
      {summary.keyTopics && summary.keyTopics.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Topics</h3>
          <div className="flex flex-wrap gap-2">
            {summary.keyTopics.map((topic, i) => (
              <span
                key={i}
                className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
              >
                <Tag className="h-3 w-3" />
                {topic}
              </span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
