import React from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { 
  Star, 
  StarOff, 
  Check, 
  X, 
  MessageSquare, 
  Pin, 
  MoreHorizontal,
  Trash2,
  Edit
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { Review } from '../types';

interface ReviewCardProps {
  review: Review;
  onApprove?: (review: Review) => void;
  onReject?: (review: Review) => void;
  onRespond?: (review: Review) => void;
  onToggleFeatured?: (review: Review) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  showActions?: boolean;
}

const statusLabels: Record<string, string> = {
  pending: 'На модерации',
  approved: 'Одобрен',
  rejected: 'Отклонён',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  approved: 'default',
  rejected: 'destructive',
};

export default function ReviewCard({
  review,
  onApprove,
  onReject,
  onRespond,
  onToggleFeatured,
  onEdit,
  onDelete,
  showActions = true,
}: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-4 w-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-muted-foreground'
            }`}
          />
        ))}
      </div>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card className={review.is_featured ? 'border-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{getInitials(review.author_name)}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{review.author_name}</span>
                {review.is_verified && (
                  <Badge variant="outline" className="text-xs">
                    <Check className="h-3 w-3 mr-1" />
                    Клиент
                  </Badge>
                )}
                {review.is_featured && (
                  <Badge variant="default" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    Закреплён
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                {renderStars(review.rating)}
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.created_at), {
                    addSuffix: true,
                    locale: ru,
                  })}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={statusVariants[review.status]}>
              {statusLabels[review.status]}
            </Badge>
            {showActions && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {review.status === 'pending' && (
                    <>
                      <DropdownMenuItem onClick={() => onApprove?.(review)}>
                        <Check className="h-4 w-4 mr-2" />
                        Одобрить
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onReject?.(review)}>
                        <X className="h-4 w-4 mr-2" />
                        Отклонить
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem onClick={() => onRespond?.(review)}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Ответить
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleFeatured?.(review)}>
                    <Pin className="h-4 w-4 mr-2" />
                    {review.is_featured ? 'Открепить' : 'Закрепить'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => onEdit?.(review)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Редактировать
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete?.(review)}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {review.text ? (
          <p className="text-sm">{review.text}</p>
        ) : (
          <p className="text-sm text-muted-foreground italic">Без текста</p>
        )}
        {review.response && (
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Ваш ответ:
            </p>
            <p className="text-sm">{review.response}</p>
          </div>
        )}
      </CardContent>
      {review.client && (
        <CardFooter className="pt-0">
          <p className="text-xs text-muted-foreground">
            Клиент: {review.client.name}
            {review.appointment && ` • ${review.appointment.service_name}`}
          </p>
        </CardFooter>
      )}
    </Card>
  );
}
