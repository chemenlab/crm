import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { cn } from '@/lib/utils';
import LeadCard from './LeadCard';
import type { KanbanColumn as KanbanColumnType, Lead } from '../Index';

interface KanbanColumnProps {
  column: KanbanColumnType;
  statusColors: Record<string, string>;
  onLeadClick: (lead: Lead) => void;
}

export default function KanbanColumn({ column, statusColors, onLeadClick }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex-1 min-w-[280px] bg-muted/50 rounded-lg',
        isOver && 'ring-2 ring-primary ring-offset-2'
      )}
    >
      {/* Column Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <span className={cn('w-3 h-3 rounded-full', statusColors[column.color])} />
          <h3 className="font-semibold">{column.title}</h3>
          <span className="ml-auto text-sm text-muted-foreground bg-background px-2 py-0.5 rounded-full">
            {column.leads.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <ScrollArea className="h-[calc(100vh-350px)] min-h-[400px]">
        <div className="p-2 space-y-2">
          <SortableContext
            items={column.leads.map(l => l.id)}
            strategy={verticalListSortingStrategy}
          >
            {column.leads.length === 0 ? (
              <div className="flex items-center justify-center h-24 text-sm text-muted-foreground">
                Перетащите заявку сюда
              </div>
            ) : (
              column.leads.map(lead => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  onClick={() => onLeadClick(lead)}
                />
              ))
            )}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
