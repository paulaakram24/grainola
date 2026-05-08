'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth.store';
import {
  usePlans,
  useMySubscription,
  useSubscribe,
  useChangePlan,
  Plan,
  SubscriptionPlan,
} from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

// ── Plan card ─────────────────────────────────────────────────────────────────

function PlanCard({
  plan,
  currentPlan,
  isAuthenticated,
  onSelect,
  loading,
}: {
  plan: Plan;
  currentPlan?: SubscriptionPlan;
  isAuthenticated: boolean;
  onSelect: (id: SubscriptionPlan) => void;
  loading: boolean;
}) {
  const isCurrent = currentPlan === plan.id;
  const isUpgrade =
    currentPlan &&
    ['free', 'basic', 'premium'].indexOf(plan.id) >
      ['free', 'basic', 'premium'].indexOf(currentPlan);

  const buttonLabel = () => {
    if (!isAuthenticated) return plan.price === 0 ? 'Get started free' : 'Start free trial';
    if (isCurrent) return 'Current plan';
    if (isUpgrade) return `Upgrade to ${plan.name}`;
    return `Switch to ${plan.name}`;
  };

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all',
        plan.popular
          ? 'border-indigo-500 ring-2 ring-indigo-500 shadow-indigo-100'
          : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
      )}
    >
      {plan.popular && (
        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 inline-flex items-center px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-semibold tracking-wide">
          Most popular
        </span>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
        <div className="mt-4 flex items-baseline gap-1">
          <span className="text-5xl font-extrabold text-gray-900">
            {plan.price === 0 ? 'Free' : `$${plan.price}`}
          </span>
          {plan.price > 0 && (
            <span className="text-gray-400 text-sm">/ month</span>
          )}
        </div>
      </div>

      <ul className="flex-1 space-y-3 mb-8">
        {plan.features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-gray-600">
            <CheckIcon className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
            {feat}
          </li>
        ))}
      </ul>

      <Button
        className={cn(
          'w-full',
          plan.popular
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
            : 'variant-outline'
        )}
        variant={plan.popular ? 'default' : 'outline'}
        disabled={isCurrent || loading}
        onClick={() => onSelect(plan.id)}
      >
        {buttonLabel()}
      </Button>

      {isCurrent && (
        <p className="mt-2 text-xs text-center text-gray-400">
          You are on this plan
        </p>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const { isAuthenticated } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Plans are public — always load
  const { data: plans = [], isLoading: plansLoading } = usePlans();

  // My subscription — only load when authenticated
  const { data: mySubData } = useMySubscription();
  const subscribeMutation  = useSubscribe();
  const changePlanMutation = useChangePlan();

  const currentPlan = mySubData?.subscription?.plan;
  const isMutating  = subscribeMutation.isPending || changePlanMutation.isPending;

  useEffect(() => { setMounted(true); }, []);

  const handleSelect = async (planId: SubscriptionPlan) => {
    if (!isAuthenticated) {
      router.push('/register');
      return;
    }
    if (IS_DEMO) {
      alert(`Demo mode: would ${currentPlan ? 'change to' : 'subscribe to'} "${planId}" plan.`);
      return;
    }

    try {
      if (!currentPlan) {
        await subscribeMutation.mutateAsync(planId);
      } else {
        await changePlanMutation.mutateAsync(planId);
      }
    } catch {
      // errors are surfaced via toast in a real app
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Navbar for non-dashboard context */}
      {mounted && !isAuthenticated && (
        <nav className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <span className="text-white text-sm font-bold">G</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Grainola</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link href="/login"><Button variant="ghost" size="sm">Log in</Button></Link>
              <Link href="/register"><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">Get started</Button></Link>
            </div>
          </div>
        </nav>
      )}

      {/* Back link for dashboard users */}
      {mounted && isAuthenticated && (
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1"
          >
            ← Back
          </button>
        </div>
      )}

      {/* Header */}
      <div className="text-center py-16 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-4 text-xl text-gray-500 max-w-2xl mx-auto">
          Start free. Upgrade when you need more power. No hidden fees.
        </p>
        {mounted && isAuthenticated && currentPlan && (
          <p className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-100 text-indigo-700 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            Current plan:{' '}
            <span className="font-semibold capitalize">{currentPlan}</span>
          </p>
        )}
      </div>

      {/* Plan cards */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        {plansLoading ? (
          <div className="grid sm:grid-cols-3 gap-8">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-96 rounded-2xl bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={mounted && isAuthenticated ? currentPlan : undefined}
                isAuthenticated={mounted && isAuthenticated}
                onSelect={handleSelect}
                loading={isMutating}
              />
            ))}
          </div>
        )}

        {/* FAQ / reassurance */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Common questions</h2>
          <div className="grid sm:grid-cols-2 gap-6 text-left max-w-3xl mx-auto">
            {[
              {
                q: 'Can I change my plan later?',
                a: 'Yes — upgrade or downgrade at any time from your account settings. Changes take effect immediately.',
              },
              {
                q: 'Is there a free trial?',
                a: 'The Free plan is yours forever. Paid plans are billed monthly and you can cancel any time.',
              },
              {
                q: 'What counts as an AI operation?',
                a: 'Each transcription or AI summary generation counts as one AI operation.',
              },
              {
                q: 'What happens if I exceed my storage?',
                a: 'You will be notified before hitting the limit and prompted to upgrade or free up space.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="p-5 rounded-xl bg-white border border-gray-100 shadow-sm">
                <p className="font-semibold text-gray-900 mb-2">{q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
