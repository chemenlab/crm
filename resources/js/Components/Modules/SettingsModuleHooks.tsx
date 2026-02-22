import React from 'react';
import { HookRenderer, useHasHooks } from './HookRenderer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Skeleton } from '@/Components/ui/skeleton';

interface SettingsSectionWrapperProps {
  children: React.ReactNode;
  moduleSlug: string;
}

/**
 * Wrapper for settings section hooks
 */
function SettingsSectionWrapper({ children, moduleSlug }: SettingsSectionWrapperProps) {
  return (
    <div className="module-settings-section" data-module={moduleSlug}>
      {children}
    </div>
  );
}

/**
 * Loading skeleton for settings sections
 */
function SettingsSectionSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-64 mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-32 w-full" />
      </CardContent>
    </Card>
  );
}

interface SettingsModuleSectionsProps {
  user?: any;
}

/**
 * Renders module sections in settings page
 * Uses the 'settings.sections' hook point
 */
export function SettingsModuleSections({ user }: SettingsModuleSectionsProps) {
  const hasHooks = useHasHooks('settings.sections');

  if (!hasHooks) {
    return null;
  }

  return (
    <div className="space-y-6">
      <HookRenderer
        hookPoint="settings.sections"
        context={{ user }}
        wrapper={SettingsSectionWrapper}
        loadingComponent={<SettingsSectionSkeleton />}
        className="space-y-6"
      />
    </div>
  );
}

/**
 * Hook to check if settings has module sections
 */
export function useSettingsHasModuleSections(): boolean {
  return useHasHooks('settings.sections');
}

/**
 * Returns module settings tabs for integration into settings navigation
 */
export interface ModuleSettingsTab {
  value: string;
  label: string;
  icon?: React.ElementType;
  moduleSlug: string;
}

export function useModuleSettingsTabs(): ModuleSettingsTab[] {
  // This would be populated by modules registering their settings tabs
  // For now, return empty array - modules will register their tabs via hooks
  return [];
}

export default SettingsModuleSections;
