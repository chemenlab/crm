import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import type { Module, UserModule, ModuleAccessStatus, HookPoint, ModuleHookComponent } from '@/types/modules';

interface ModuleContextValue {
  // Module data
  modules: Module[];
  userModules: UserModule[];
  activeModules: string[];
  isLoading: boolean;
  error: string | null;

  // Module checks
  isModuleActive: (slug: string) => boolean;
  isModuleInstalled: (slug: string) => boolean;
  canAccessModule: (slug: string) => boolean;
  getModuleStatus: (slug: string) => ModuleAccessStatus | null;
  getModule: (slug: string) => Module | undefined;

  // Module actions
  enableModule: (slug: string) => Promise<void>;
  disableModule: (slug: string) => Promise<void>;
  purchaseModule: (slug: string, subscriptionPeriod?: 'monthly' | 'yearly') => Promise<void>;

  // Hook system
  registerHook: (hookPoint: HookPoint, component: ModuleHookComponent) => void;
  unregisterHook: (hookPoint: HookPoint, moduleSlug: string) => void;
  getHooksForPoint: (hookPoint: HookPoint) => ModuleHookComponent[];

  // Refresh data
  refreshModules: () => Promise<void>;
}

const ModuleContext = createContext<ModuleContextValue | undefined>(undefined);

interface ModuleProviderProps {
  children: React.ReactNode;
  initialModules?: Module[];
  initialUserModules?: UserModule[];
  autoFetch?: boolean;
}

export function ModuleProvider({ 
  children, 
  initialModules = [], 
  initialUserModules = [],
  autoFetch = true,
}: ModuleProviderProps) {
  const [modules, setModules] = useState<Module[]>(initialModules);
  const [userModules, setUserModules] = useState<UserModule[]>(initialUserModules);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hooks, setHooks] = useState<Map<HookPoint, ModuleHookComponent[]>>(new Map());
  const [hasFetched, setHasFetched] = useState(initialModules.length > 0 || initialUserModules.length > 0);

  // Compute active modules from userModules
  const activeModules = useMemo(() => {
    return userModules
      .filter(m => m.is_enabled)
      .map(m => m.slug);
  }, [userModules]);

  // Check if module is active (enabled for user)
  const isModuleActive = useCallback((slug: string): boolean => {
    return activeModules.includes(slug);
  }, [activeModules]);

  // Check if module is installed (has user_module record)
  const isModuleInstalled = useCallback((slug: string): boolean => {
    return userModules.some(m => m.slug === slug);
  }, [userModules]);

  // Check if user can access module
  const canAccessModule = useCallback((slug: string): boolean => {
    const module = modules.find(m => m.slug === slug);
    return module?.status?.can_access ?? false;
  }, [modules]);

  // Get module status
  const getModuleStatus = useCallback((slug: string): ModuleAccessStatus | null => {
    const module = modules.find(m => m.slug === slug);
    return module?.status ?? null;
  }, [modules]);

  // Get module by slug
  const getModule = useCallback((slug: string): Module | undefined => {
    return modules.find(m => m.slug === slug);
  }, [modules]);

  // Enable module
  const enableModule = useCallback(async (slug: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise<void>((resolve, reject) => {
        router.post(`/app/modules/${slug}/enable`, {}, {
          preserveScroll: true,
          onSuccess: () => {
            // Update local state
            setUserModules(prev => {
              const existing = prev.find(m => m.slug === slug);
              if (existing) {
                return prev.map(m => 
                  m.slug === slug ? { ...m, is_enabled: true, enabled_at: new Date().toISOString() } : m
                );
              }
              // Add new user module
              const module = modules.find(m => m.slug === slug);
              return [...prev, {
                slug,
                name: module?.name ?? slug,
                description: module?.description,
                icon: module?.icon,
                category: module?.category,
                category_label: module?.category_label,
                is_enabled: true,
                enabled_at: new Date().toISOString(),
                usage_count: 0,
                status: module?.status ?? { can_access: true, reason: 'free', is_enabled: true },
              }];
            });
            resolve();
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors.error 
              ? errors.error 
              : 'Не удалось включить модуль';
            reject(new Error(errorMessage));
          },
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось включить модуль';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [modules]);

  // Disable module
  const disableModule = useCallback(async (slug: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      await new Promise<void>((resolve, reject) => {
        router.post(`/app/modules/${slug}/disable`, {}, {
          preserveScroll: true,
          onSuccess: () => {
            // Update local state
            setUserModules(prev => 
              prev.map(m => 
                m.slug === slug ? { ...m, is_enabled: false } : m
              )
            );
            resolve();
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors.error 
              ? errors.error 
              : 'Не удалось отключить модуль';
            reject(new Error(errorMessage));
          },
        });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось отключить модуль';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Purchase module
  const purchaseModule = useCallback(async (
    slug: string, 
    subscriptionPeriod?: 'monthly' | 'yearly'
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      // This will redirect to payment page
      router.post(`/app/modules/${slug}/purchase`, {
        subscription_period: subscriptionPeriod,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось создать платёж';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Register hook component
  const registerHook = useCallback((hookPoint: HookPoint, component: ModuleHookComponent): void => {
    setHooks(prev => {
      const newHooks = new Map(prev);
      const existing = newHooks.get(hookPoint) ?? [];
      
      // Check if already registered
      if (existing.some(h => h.moduleSlug === component.moduleSlug)) {
        return prev;
      }

      // Add and sort by priority
      const updated = [...existing, component].sort((a, b) => 
        (a.priority ?? 10) - (b.priority ?? 10)
      );
      newHooks.set(hookPoint, updated);
      return newHooks;
    });
  }, []);

  // Unregister hook component
  const unregisterHook = useCallback((hookPoint: HookPoint, moduleSlug: string): void => {
    setHooks(prev => {
      const newHooks = new Map(prev);
      const existing = newHooks.get(hookPoint) ?? [];
      newHooks.set(hookPoint, existing.filter(h => h.moduleSlug !== moduleSlug));
      return newHooks;
    });
  }, []);

  // Get hooks for a hook point (only for active modules)
  const getHooksForPoint = useCallback((hookPoint: HookPoint): ModuleHookComponent[] => {
    const allHooks = hooks.get(hookPoint) ?? [];
    return allHooks.filter(h => isModuleActive(h.moduleSlug));
  }, [hooks, isModuleActive]);

  // Refresh modules data
  const refreshModules = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/modules');
      setModules(response.data.modules ?? []);
      setUserModules(response.data.userModules ?? []);
      setHasFetched(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Не удалось загрузить модули';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch modules on mount if enabled and no initial data
  useEffect(() => {
    if (autoFetch && !hasFetched) {
      refreshModules();
    }
  }, [autoFetch, hasFetched, refreshModules]);

  const value: ModuleContextValue = {
    modules,
    userModules,
    activeModules,
    isLoading,
    error,
    isModuleActive,
    isModuleInstalled,
    canAccessModule,
    getModuleStatus,
    getModule,
    enableModule,
    disableModule,
    purchaseModule,
    registerHook,
    unregisterHook,
    getHooksForPoint,
    refreshModules,
  };

  return (
    <ModuleContext.Provider value={value}>
      {children}
    </ModuleContext.Provider>
  );
}

export function useModules(): ModuleContextValue {
  const context = useContext(ModuleContext);
  
  if (context === undefined) {
    throw new Error('useModules must be used within a ModuleProvider');
  }
  
  return context;
}

export { ModuleContext };
