import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ClipboardList } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';
import {
  SidebarMenuItem as SidebarMenuItemUI,
  SidebarMenuButton,
} from '@/Components/ui/sidebar';

interface SidebarMenuItemProps {
  user?: {
    id: number;
  };
  badge?: number | null;
  moduleSlug: string;
}

export default function SidebarMenuItem({ badge }: SidebarMenuItemProps) {
  const { url } = usePage();
  const isActive = url.startsWith('/app/modules/leads');

  return (
    <SidebarMenuItemUI>
      <SidebarMenuButton
        tooltip="Заявки"
        asChild
        className="text-[17px] font-semibold"
        isActive={isActive}
      >
        <Link href="/app/modules/leads/list">
          <ClipboardList className={`h-4 w-4 ${isActive ? '!text-primary' : ''}`} />
          <span>Заявки</span>
          {badge && badge > 0 && (
            <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700">
              {badge}
            </Badge>
          )}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItemUI>
  );
}
