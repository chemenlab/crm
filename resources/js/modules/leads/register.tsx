/**
 * Leads Module - Hook Registration
 * 
 * This file registers the Leads module hooks with the ModuleContext.
 * It should be imported in the app initialization.
 */

import React, { useEffect } from 'react';
import { useModules } from '@/contexts/ModuleContext';
import SidebarMenuItem from './hooks/SidebarMenuItem';

/**
 * Component that registers Leads module hooks
 * Should be rendered once in the app tree
 */
export function LeadsModuleHooks() {
  const { registerHook, unregisterHook, isModuleActive } = useModules();

  useEffect(() => {
    // Only register hooks if the module is active
    if (isModuleActive('leads')) {
      registerHook('sidebar.menu', {
        moduleSlug: 'leads',
        component: SidebarMenuItem,
        priority: 40,
      });
    }

    return () => {
      unregisterHook('sidebar.menu', 'leads');
    };
  }, [registerHook, unregisterHook, isModuleActive]);

  return null;
}

export default LeadsModuleHooks;
