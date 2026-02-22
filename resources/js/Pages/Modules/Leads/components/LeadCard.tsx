import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { cn } from '@/lib/utils';
import { Phone, Calendar, Briefcase, GripVertical, Bell } from 'lucide-react';
import type { Lead } from '../Index';

interface LeadCardProps {
  lead: Lead;
  onClick: () => void;
  isDragging?: boolean;
}

const priorityConfig: Record<string, { color: string; label: string }> = {
  low: { color: 'bg-gray-400', label: 'Низкий' },
  normal: { color: 'bg-blue-500', label: 'Обычный' },
  high: { color: 'bg-orange-500', label: 'Высокий' },
  urgent: { color: 'bg-red-500', label: 'Срочный' },
};

export default function LeadCard({ lead, onClick, isDragging = false }: LeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11 && phone.startsWith('7')) {
      return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  const priority = lead.priority || 'normal';
  const priorityInfo = priorityConfig[priority] || priorityConfig.normal;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'cursor-pointer hover:shadow-md transition-shadow',
        (isDragging || isSortableDragging) && 'opacity-50 shadow-lg rotate-2',
        isDragging && 'shadow-xl',
        priority === 'urgent' && 'border-red-300 dark:border-red-800'
      )}
      onClick={onClick}
    >
      <CardContent className="p-3">
        {/* Priority indicator & Drag Handle & Name */}
        <div className="flex items-start gap-2">
          <div className={cn('w-1 h-full min-h-[40px] rounded-full', priorityInfo.color)} />
          <button
            {...attributes}
            {...listeners}
            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate">{lead.name}</h4>
              {lead.reminder_at && (
                <Bell className="h-3 w-3 text-orange-500" />
              )}
            </div>
          </div>
        </div>

        {/* Service Badge & Priority */}
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.service && (
            <Badge
              variant="secondary"
              className="text-xs"
              style={{
                backgroundColor: lead.service.color ? `${lead.service.color}20` : undefined,
                color: lead.service.color || undefined,
              }}
            >
              <Briefcase className="h-3 w-3 mr-1" />
              {lead.service.name}
            </Badge>
          )}
          {priority !== 'normal' && (
            <Badge variant="outline" className={cn('text-xs', {
              'border-gray-400 text-gray-600': priority === 'low',
              'border-orange-400 text-orange-600': priority === 'high',
              'border-red-400 text-red-600 bg-red-50': priority === 'urgent',
            })}>
              {priorityInfo.label}
            </Badge>
          )}
        </div>

        {/* Tags */}
        {lead.tags && lead.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {lead.tags.slice(0, 3).map((tag, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-muted">
                {tag}
              </Badge>
            ))}
            {lead.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{lead.tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Phone & Date */}
        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Phone className="h-3 w-3" />
            <span>{formatPhone(lead.phone)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(lead.created_at)}</span>
          </div>
        </div>

        {/* Message Preview */}
        {lead.message && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
            {lead.message}
          </p>
        )}

        {/* Converted Badge */}
        {lead.converted_appointment_id && (
          <Badge variant="outline" className="mt-2 text-xs text-green-600 border-green-600">
            Конвертирована
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
