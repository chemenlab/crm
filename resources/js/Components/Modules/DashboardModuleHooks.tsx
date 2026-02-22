import React from 'react';
import { HookRenderer, useHasHooks } from './HookRenderer';

/**
 * Renders module widgets on the dashboard
 * Uses the 'dashboard.widgets' hook point
 */
export function DashboardModuleWidgets() {
  const hasHooks = useHasHooks('dashboard.widgets');

  if (!hasHooks) {
    return null;
  }

  return (
    <HookRenderer
      hookPoint="dashboard.widgets"
      wrapper={({ children }) => (
        <>
          {children}
        </>
      )}
    />
  );
}

/**
 * Renders module stats on the dashboard
 * Uses the 'dashboard.stats' hook point
 */
export function DashboardModuleStats() {
  const hasHooks = useHasHooks('dashboard.stats');

  if (!hasHooks) {
    return null;
  }

  return (
    <HookRenderer
      hookPoint="dashboard.stats"
      wrapper={({ children }) => (
        <>
          {children}
        </>
      )}
    />
  );
}
