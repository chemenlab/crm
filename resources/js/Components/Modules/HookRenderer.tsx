import React, { Suspense, useMemo } from 'react';
import { useModules } from '@/contexts/ModuleContext';
import type { HookPoint, HookContext } from '@/types/modules';
import { Skeleton } from '@/Components/ui/skeleton';

interface HookRendererProps {
  /** The hook point to render components for */
  hookPoint: HookPoint;
  /** Context data to pass to hook components */
  context?: HookContext;
  /** Fallback content when no hooks are registered or loading */
  fallback?: React.ReactNode;
  /** Custom loading component */
  loadingComponent?: React.ReactNode;
  /** Wrapper component for each hook result */
  wrapper?: React.ComponentType<{ children: React.ReactNode; moduleSlug: string }>;
  /** Container className */
  className?: string;
  /** Render as a specific element type */
  as?: React.ElementType;
}

/**
 * HookRenderer - Renders all registered module components for a specific hook point
 * 
 * Only renders components from modules that are currently active for the user.
 * Components are rendered in priority order (lower priority number = rendered first).
 * 
 * @example
 * // Basic usage
 * <HookRenderer hookPoint="sidebar.menu" />
 * 
 * @example
 * // With context
 * <HookRenderer 
 *   hookPoint="client.card.tabs" 
 *   context={{ client: clientData }} 
 * />
 * 
 * @example
 * // With custom wrapper
 * <HookRenderer 
 *   hookPoint="dashboard.widgets" 
 *   wrapper={({ children, moduleSlug }) => (
 *     <div className="widget" data-module={moduleSlug}>{children}</div>
 *   )}
 * />
 */
export function HookRenderer({
  hookPoint,
  context = {},
  fallback = null,
  loadingComponent,
  wrapper: Wrapper,
  className,
  as: Component = 'div',
}: HookRendererProps) {
  const { getHooksForPoint, isModuleActive } = useModules();

  // Get hooks for this hook point (already filtered by active modules)
  const hooks = useMemo(() => {
    return getHooksForPoint(hookPoint);
  }, [getHooksForPoint, hookPoint]);

  // If no hooks registered, show fallback
  if (hooks.length === 0) {
    return <>{fallback}</>;
  }

  const defaultLoading = loadingComponent ?? (
    <Skeleton className="h-8 w-full" />
  );

  return (
    <Component className={className}>
      {hooks.map((hook) => {
        // Double-check module is active (defensive)
        if (!isModuleActive(hook.moduleSlug)) {
          return null;
        }

        const HookComponent = hook.component;
        const content = (
          <Suspense fallback={defaultLoading} key={hook.moduleSlug}>
            <HookComponent {...context} moduleSlug={hook.moduleSlug} />
          </Suspense>
        );

        if (Wrapper) {
          return (
            <Wrapper key={hook.moduleSlug} moduleSlug={hook.moduleSlug}>
              {content}
            </Wrapper>
          );
        }

        return content;
      })}
    </Component>
  );
}

/**
 * Hook for checking if a hook point has any active hooks
 */
export function useHasHooks(hookPoint: HookPoint): boolean {
  const { getHooksForPoint } = useModules();
  const hooks = getHooksForPoint(hookPoint);
  return hooks.length > 0;
}

/**
 * Higher-order component that only renders children if hook point has active hooks
 */
interface ConditionalHookRendererProps {
  hookPoint: HookPoint;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ConditionalHookRenderer({
  hookPoint,
  children,
  fallback = null,
}: ConditionalHookRendererProps) {
  const hasHooks = useHasHooks(hookPoint);
  
  if (!hasHooks) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default HookRenderer;
