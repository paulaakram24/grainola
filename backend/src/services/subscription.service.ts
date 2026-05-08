import { User, SubscriptionPlan } from '../models/User';
import { AppError } from '../middleware/error.middleware';

// ── Plan catalogue ────────────────────────────────────────────────────────────

export interface PlanLimits {
  maxMeetingDurationMinutes: number;
  storageGb: number | null;             // null = unlimited
  aiOpsPerMonth: number | null;         // null = unlimited
  maxRecordingsPerMeeting: number | null; // null = unlimited
}

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;           // USD / month
  description: string;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Perfect for personal use and getting started.',
    limits: {
      maxMeetingDurationMinutes: 30,
      storageGb: 1,
      aiOpsPerMonth: 10,
      maxRecordingsPerMeeting: 1,
    },
    features: [
      '30-minute meeting limit',
      '1 recording per meeting',
      '1 GB storage',
      '10 AI operations / month',
      'Basic transcription',
      'Folder organization',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 9.99,
    description: 'Great for individuals who meet frequently.',
    limits: {
      maxMeetingDurationMinutes: 120,
      storageGb: 10,
      aiOpsPerMonth: 100,
      maxRecordingsPerMeeting: 5,
    },
    features: [
      '2-hour meeting limit',
      'Up to 5 recordings per meeting',
      '10 GB storage',
      '100 AI operations / month',
      'Advanced transcription',
      'AI summaries & action items',
      'Google Calendar sync',
      'Folder organization',
    ],
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 29.99,
    description: 'For teams and power users who need it all.',
    limits: {
      maxMeetingDurationMinutes: 480,
      storageGb: null,
      aiOpsPerMonth: null,
      maxRecordingsPerMeeting: null,
    },
    features: [
      '8-hour meeting limit',
      'Unlimited recordings per meeting',
      'Unlimited storage',
      'Unlimited AI operations',
      'Priority transcription',
      'AI summaries & action items',
      'Speaker diarization',
      'Google Calendar sync',
      'Folder organization',
      'Priority support',
    ],
  },
];

// ── Service ───────────────────────────────────────────────────────────────────

export class SubscriptionService {
  getPlans(): Plan[] {
    return PLANS;
  }

  getPlan(planId: SubscriptionPlan): Plan {
    const plan = PLANS.find((p) => p.id === planId);
    if (!plan) throw new AppError(`Plan "${planId}" not found`, 404);
    return plan;
  }

  async getMySubscription(userId: string) {
    const user = await User.findById(userId).select('subscription');
    if (!user) throw new AppError('User not found', 404);

    const plan = this.getPlan(user.subscription.plan);
    return {
      subscription: user.subscription,
      plan,
    };
  }

  async subscribe(userId: string, planId: SubscriptionPlan) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    const plan = this.getPlan(planId);         // throws if invalid

    const now = new Date();
    const expiresAt = plan.price === 0
      ? null
      : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    user.subscription = {
      plan: planId,
      startedAt: now,
      expiresAt,
    };
    await user.save();

    return { subscription: user.subscription, plan };
  }

  async changePlan(userId: string, newPlanId: SubscriptionPlan) {
    const user = await User.findById(userId);
    if (!user) throw new AppError('User not found', 404);

    if (user.subscription.plan === newPlanId) {
      throw new AppError('You are already on this plan', 400);
    }

    return this.subscribe(userId, newPlanId);
  }

  async enforceLimit(userId: string, limit: keyof PlanLimits): Promise<PlanLimits[keyof PlanLimits]> {
    const user = await User.findById(userId).select('subscription');
    if (!user) throw new AppError('User not found', 404);

    const plan = this.getPlan(user.subscription.plan);
    return plan.limits[limit];
  }
}

export const subscriptionService = new SubscriptionService();
