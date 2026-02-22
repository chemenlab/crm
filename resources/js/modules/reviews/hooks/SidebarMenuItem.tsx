import React from 'react';
import { Link } from '@inertiajs/react';
import { Star } from 'lucide-react';
import { Badge } from '@/Components/ui/badge';

interface SidebarMenuItemProps {
  user?: {
    id: number;
  };
  badge?: number | null;
  moduleSlug: string;
}

export default function SidebarMenuItem({ badge }: SidebarMenuItemProps) {
  return (
    <Link
      href="/app/modules/reviews"
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
    >
      <Star className="h-4 w-4" />
      <span>Отзывы</span>
      {badge && badge > 0 && (
        <Badge variant="secondary" className="ml-auto">
          {badge}
        </Badge>
      )}
    </Link>
  );
}
