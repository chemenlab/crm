import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

interface FeatureAccessData {
  features: Record<string, boolean>;
  resources: Record<string, {
    can_access: boolean;
    plan_name: string | null;
    plan_slug: string | null;
    subscription_status: string | null;
    limit: number | null;
    current_usage: number;
    remaining: number;
    unlimited: boolean;
    percentage: number;
  }>;
  subscription: {
    has_active: boolean;
    is_trial: boolean;
    trial_days_remaining: number | null;
    plan: {
      name: string;
      slug: string;
      price: number;
    } | null;
    status: string | null;
  };
}

export function useFeatureAccess() {
  const { data, isLoading, error, refetch } = useQuery<FeatureAccessData>({
    queryKey: ['feature-access'],
    queryFn: async () => {
      const response = await axios.get('/api/feature-access');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 минут
    refetchOnWindowFocus: true,
  });

  const hasFeature = (feature: string): boolean => {
    return data?.features[feature] ?? false;
  };

  const canAccessResource = (resource: string): boolean => {
    return data?.resources[resource]?.can_access ?? false;
  };

  const getResourceUsage = (resource: string) => {
    return data?.resources[resource] ?? null;
  };

  const hasActiveSubscription = (): boolean => {
    return data?.subscription.has_active ?? false;
  };

  const isInTrial = (): boolean => {
    return data?.subscription.is_trial ?? false;
  };

  const getTrialDaysRemaining = (): number | null => {
    return data?.subscription.trial_days_remaining ?? null;
  };

  const getCurrentPlan = () => {
    return data?.subscription.plan ?? null;
  };

  return {
    data,
    isLoading,
    error,
    refetch,
    hasFeature,
    canAccessResource,
    getResourceUsage,
    hasActiveSubscription,
    isInTrial,
    getTrialDaysRemaining,
    getCurrentPlan,
  };
}
