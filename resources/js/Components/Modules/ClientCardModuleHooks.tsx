import React from 'react';
import { HookRenderer, useHasHooks } from './HookRenderer';
import { Skeleton } from '@/Components/ui/skeleton';
import { TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';

interface Client {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  [key: string]: any;
}

interface ClientCardTabsProps {
  client: Client;
}

interface ModuleTabResult {
  id: string;
  label: string;
  icon?: React.ElementType;
  content: React.ReactNode;
}

/**
 * Renders module tabs in client card
 * Uses the 'client.card.tabs' hook point
 * 
 * Note: This component provides the tab triggers and content.
 * The parent component should wrap this in a Tabs component.
 */
export function ClientCardModuleTabs({ client }: ClientCardTabsProps) {
  const hasHooks = useHasHooks('client.card.tabs');

  if (!hasHooks) {
    return null;
  }

  return (
    <HookRenderer
      hookPoint="client.card.tabs"
      context={{ client }}
      loadingComponent={<Skeleton className="h-10 w-24" />}
    />
  );
}

/**
 * Renders module actions in client card
 * Uses the 'client.card.actions' hook point
 */
export function ClientCardModuleActions({ client }: ClientCardTabsProps) {
  const hasHooks = useHasHooks('client.card.actions');

  if (!hasHooks) {
    return null;
  }

  return (
    <HookRenderer
      hookPoint="client.card.actions"
      context={{ client }}
      className="flex gap-2"
      loadingComponent={<Skeleton className="h-9 w-24" />}
    />
  );
}

/**
 * Hook to check if client card has module tabs
 */
export function useClientCardHasModuleTabs(): boolean {
  return useHasHooks('client.card.tabs');
}

/**
 * Hook to check if client card has module actions
 */
export function useClientCardHasModuleActions(): boolean {
  return useHasHooks('client.card.actions');
}

export default ClientCardModuleTabs;
