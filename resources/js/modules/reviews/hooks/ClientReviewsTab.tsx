import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import { Plus, Star } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';
import ReviewList from '../components/ReviewList';
import ReviewForm from '../components/ReviewForm';
import type { Review, ReviewFormData } from '../types';

interface ClientReviewsTabProps {
  client: {
    id: number;
    name: string;
  };
  moduleSlug: string;
}

export default function ClientReviewsTab({ client }: ClientReviewsTabProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    loadReviews();
  }, [client.id]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/modules/reviews/client/${client.id}`);
      setReviews(response.data);
    } catch (error) {
      console.error('Failed to load client reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: ReviewFormData) => {
    try {
      setIsSubmitting(true);
      await axios.post('/api/modules/reviews', {
        ...data,
        client_id: client.id,
      });
      setIsDialogOpen(false);
      loadReviews();
    } catch (error) {
      console.error('Failed to create review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <h3 className="font-medium">Отзывы клиента</h3>
          <span className="text-sm text-muted-foreground">
            ({reviews.length})
          </span>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Добавить отзыв
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый отзыв от {client.name}</DialogTitle>
            </DialogHeader>
            <ReviewForm
              initialData={{ author_name: client.name }}
              onSubmit={handleSubmit}
              onCancel={() => setIsDialogOpen(false)}
              isLoading={isSubmitting}
              submitLabel="Добавить отзыв"
            />
          </DialogContent>
        </Dialog>
      </div>

      <ReviewList
        reviews={reviews}
        showActions={false}
        emptyMessage="У этого клиента пока нет отзывов"
      />
    </div>
  );
}
