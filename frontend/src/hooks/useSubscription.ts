'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

// ── Types (mirror backend Plan shape) ────────────────────────────────────────

export type SubscriptionPlan = 'free' | 'basic' | 'premium';

export interface PlanLimits {
  maxMeetingDurationMinutes: number;
  storageGb: number | null;
  aiOpsPerMonth: number | null;
}

export interface Plan {
  id: SubscriptionPlan;
  name: string;
  price: number;
  description: string;
  limits: PlanLimits;
  features: string[];
  popular?: boolean;
}

export interface MySubscription {
  subscription: {
    plan: SubscriptionPlan;
    startedAt: string;
    expiresAt: string | null;
  };
  plan: Plan;
}

// ── Hooks ─────────────────────────────────────────────────────────────────────

/** Fetch all available plans (public, no auth required). */
export const usePlans = () =>
  useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      const { data } = await api.get('/subscription/plans');
      return data.data as Plan[];
    },
    staleTime: 5 * 60 * 1000,
  });

/** Fetch the current user's active subscription + plan. */
export const useMySubscription = () =>
  useQuery<MySubscription>({
    queryKey: ['my-subscription'],
    queryFn: async () => {
      const { data } = await api.get('/subscription/my-plan');
      return data.data as MySubscription;
    },
  });

/** Subscribe to a plan (first time). */
export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const { data } = await api.post('/subscription/subscribe', { plan });
      return data.data as MySubscription;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
  });
};

/** Change to a different plan. */
export const useChangePlan = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const { data } = await api.post('/subscription/change-plan', { plan });
      return data.data as MySubscription;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-subscription'] });
    },
  });
};
