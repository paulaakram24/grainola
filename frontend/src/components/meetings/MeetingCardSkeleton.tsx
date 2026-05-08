export function MeetingCardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-border p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <div className="w-2.5 h-2.5 rounded-full bg-gray-200 mt-1.5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-100 rounded w-1/3" />
          <div className="h-3 bg-gray-100 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
