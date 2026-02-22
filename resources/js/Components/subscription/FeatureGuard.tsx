import React from 'react';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { LockedFeature } from './LockedFeature';

interface FeatureGuardProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgradeModal?: boolean;
}

export function FeatureGuard({
  feature,
  children,
  fallback,
  showUpgradeModal = true,
}: FeatureGuardProps) {
  const { hasFeature, isLoading } = useFeatureAccess();

  if (isLoading) {
    return null;
  }

  const hasAccess = hasFeature(feature);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    if (showUpgradeModal) {
      return <LockedFeature feature={feature} />;
    }

    return null;
  }

  return <>{children}</>;
}
