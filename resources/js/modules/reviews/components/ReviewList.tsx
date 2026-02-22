import React from 'react';
import ReviewCard from './ReviewCard';
import type { Review } from '../types';

interface ReviewListProps {
  reviews: Review[];
  onApprove?: (review: Review) => void;
  onReject?: (review: Review) => void;
  onRespond?: (review: Review) => void;
  onToggleFeatured?: (review: Review) => void;
  onEdit?: (review: Review) => void;
  onDelete?: (review: Review) => void;
  showActions?: boolean;
  emptyMessage?: string;
}

export default function ReviewList({
  reviews,
  onApprove,
  onReject,
  onRespond,
  onToggleFeatured,
  onEdit,
  onDelete,
  showActions = true,
  emptyMessage = 'Отзывов пока нет',
}: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewCard
          key={review.id}
          review={review}
          onApprove={onApprove}
          onReject={onReject}
          onRespond={onRespond}
          onToggleFeatured={onToggleFeatured}
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={showActions}
        />
      ))}
    </div>
  );
}
