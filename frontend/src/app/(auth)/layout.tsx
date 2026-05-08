export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">M</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Grainola</span>
          </div>
          <p className="text-sm text-muted-foreground">Record, transcribe & summarize meetings</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-border p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
