'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { Button } from '@/components/ui/button';

// ── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col gap-3 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-900 text-lg">{title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold text-indigo-600">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{label}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function RootPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [mounted, isAuthenticated, router]);

  // Prevent flash of landing page for authenticated users
  if (!mounted || isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col">
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <span className="text-white text-sm font-bold">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900">Grainola</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Log in</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                Get started free
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24 sm:py-32">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold mb-6 tracking-wide uppercase">
          AI-powered meeting intelligence
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight max-w-3xl">
          Record, transcribe &amp;{' '}
          <span className="text-indigo-600">summarize</span> every meeting
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-xl leading-relaxed">
          Grainola turns your meetings into searchable transcripts, smart
          summaries, and action items — automatically, so you can stay present
          and never miss a thing.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-base px-8 py-6">
              Start for free — no credit card
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="outline" className="text-base px-8 py-6">
              Sign in
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="py-16 bg-white border-y border-gray-100">
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 sm:grid-cols-4 gap-8">
          <Stat value="99%" label="Transcription accuracy" />
          <Stat value="10×"  label="Faster meeting notes"  />
          <Stat value="30s"  label="Avg. summary time"     />
          <Stat value="Free" label="To get started"        />
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 max-w-6xl mx-auto w-full">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
            Everything you need from a meeting tool
          </h2>
          <p className="mt-4 text-gray-500 text-lg">
            One workspace for recording, transcripts, summaries, and calendar
            events.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            }
            title="AI Transcription"
            description="Powered by Whisper. Accurate, speaker-labelled, timestamped transcripts ready in seconds."
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Smart Summaries"
            description="Get bullet-point summaries, key topics, and action items extracted from every meeting automatically."
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            }
            title="Folder Organization"
            description="Organize meetings with a Google Drive-style folder system. Move, rename, and sort with ease."
          />
          <FeatureCard
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            }
            title="Calendar Integration"
            description="Sync with Google Calendar. Import events, attach recordings, and auto-create meeting records."
          />
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 text-center bg-indigo-600">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to make meetings matter?
        </h2>
        <p className="text-indigo-200 text-lg mb-10 max-w-xl mx-auto">
          Join thousands of teams who never write meeting notes manually again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="bg-white text-indigo-700 hover:bg-indigo-50 text-base px-8 py-6 font-semibold">
              Create free account
            </Button>
          </Link>
          <Link href="/pricing">
            <Button size="lg" variant="ghost" className="text-white border border-white/40 hover:bg-white/10 text-base px-8 py-6">
              View pricing
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-4 bg-gray-900 text-center text-gray-400 text-sm">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
            <span className="text-white text-xs font-bold">G</span>
          </div>
          <span className="text-white font-semibold">Grainola</span>
        </div>
        <p>© {new Date().getFullYear()} Grainola. Built for smarter meetings.</p>
        <div className="mt-3 flex justify-center gap-6">
          <Link href="/login"    className="hover:text-white transition-colors">Log in</Link>
          <Link href="/register" className="hover:text-white transition-colors">Sign up</Link>
          <Link href="/pricing"  className="hover:text-white transition-colors">Pricing</Link>
        </div>
      </footer>
    </div>
  );
}
