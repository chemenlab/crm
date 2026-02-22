import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { useModules } from '@/contexts/ModuleContext';
import { HookRenderer, useHasHooks } from './HookRenderer';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/Components/ui/sidebar';
import { Puzzle } from 'lucide-react';

interface SidebarMenuItem {
  title: string;
  url: string;
  icon?: React.ElementType;
  id?: string;
  badge?: number | string;
}

interface SidebarMenuHookResult {
  items: SidebarMenuItem[];
}

/**
 * Renders module menu items in the sidebar
 * Uses the 'sidebar.menu' hook point
 */
export function SidebarModuleMenuItems() {
  const { url } = usePage();
  const hasHooks = useHasHooks('sidebar.menu');

  if (!hasHooks) {
    return null;
  }

  const isActive = (itemUrl: string) => {
    return url.startsWith(itemUrl);
  };

  return (
    <HookRenderer
      hookPoint="sidebar.menu"
      context={{ currentUrl: url }}
      wrapper={({ children }) => (
        <SidebarMenu>
          {children}
        </SidebarMenu>
      )}
    />
  );
}

/**
 * Renders module menu items at the bottom of sidebar
 * Uses the 'sidebar.menu.bottom' hook point
 */
export function SidebarModuleMenuBottomItems() {
  const { url } = usePage();
  const hasHooks = useHasHooks('sidebar.menu.bottom');

  if (!hasHooks) {
    return null;
  }

  return (
    <HookRenderer
      hookPoint="sidebar.menu.bottom"
      context={{ currentUrl: url }}
      wrapper={({ children }) => (
        <SidebarMenu>
          {children}
        </SidebarMenu>
      )}
    />
  );
}

/**
 * Link to modules catalog in sidebar
 */
export function ModulesCatalogLink() {
  const { url } = usePage();
  const { activeModules } = useModules();
  const isActive = url.startsWith('/app/modules');

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton
          tooltip="Приложения"
          asChild
          className="text-[17px] font-semibold"
          isActive={isActive}
        >
          <Link href="/app/modules">
            <Puzzle className={`h-4 w-4 ${isActive ? '!text-primary' : ''}`} />
            <span>Приложения</span>
            {activeModules.length > 0 && (
              <span className="ml-auto text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                {activeModules.length}
              </span>
            )}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

export default SidebarModuleMenuItems;
