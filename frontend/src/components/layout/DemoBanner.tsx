export function DemoBanner() {
  return (
    <div className="bg-amber-400 text-amber-900 text-xs font-semibold text-center py-1.5 px-4 flex items-center justify-center gap-2">
      <span className="inline-block w-2 h-2 rounded-full bg-amber-700 animate-pulse" />
      DEMO MODE — all data is simulated, no backend required
    </div>
  );
}
