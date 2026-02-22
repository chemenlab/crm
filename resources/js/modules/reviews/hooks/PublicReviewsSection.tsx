import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Skeleton } from '@/Components/ui/skeleton';
import { Star, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';
import ReviewForm from '../components/ReviewForm';
import type { Review, ReviewFormData } from '../types';

interface PublicReviewsSectionProps {
  master: {
    username: string;
    name: string;
  };
  moduleSlug: string;
}

export default function PublicReviewsSection({ master }: PublicReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    loadReviews();
  }, [master.username]);

  const loadReviews = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/modules/reviews/public/${master.username}`);
      setReviews(response.data.reviews);
      setAverageRating(response.data.average_rating);
      setTotalReviews(response.data.total_reviews);
    } catch (error) {
      console.error('Failed to load public reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (data: ReviewFormData) => {
    try {
      setIsSubmitting(true);
      await axios.post(`/api/modules/reviews/public/${master.username}`, data);
      setIsDialogOpen(false);
      loadReviews();
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextReview = () => {
    setCurrentIndex((prev) => (prev + 1) % reviews.length);
  };

  const prevReview = () => {
    setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
  };

  if (isLoading) {
    return (
      <section className="py-12">
        <div className="container">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
            <Skeleton className="h-40" />
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Отзывы клиентов</h2>
          <p className="text-muted-foreground mb-6">
            Пока нет отзывов. Будьте первым!
          </p>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Оставить отзыв</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Оставить отзыв о {master.name}</DialogTitle>
              </DialogHeader>
              <ReviewForm
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
                isLoading={isSubmitting}
                submitLabel="Отправить отзыв"
              />
            </DialogContent>
          </Dialog>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold">Отзывы клиентов</h2>
            <div className="flex items-center gap-2 mt-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= Math.round(averageRating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-muted-foreground'
                    }`}
                  />
                ))}
              </div>
              <span className="font-medium">{averageRating}</span>
              <span className="text-muted-foreground">
                ({totalReviews} отзывов)
              </span>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Оставить отзыв</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Оставить отзыв о {master.name}</DialogTitle>
              </DialogHeader>
              <ReviewForm
                onSubmit={handleSubmit}
                onCancel={() => setIsDialogOpen(false)}
                isLoading={isSubmitting}
                submitLabel="Отправить отзыв"
              />
            </DialogContent>
          </Dialog>
        </div>

        {/* Reviews carousel */}
        <div className="relative">
          <div className="grid gap-4 md:grid-cols-3">
            {reviews.slice(0, 3).map((review, index) => (
              <Card key={review.id}>
                <CardContent className="pt-6">
                  <div className="flex mb-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                  {review.text && (
                    <p className="text-sm mb-4 line-clamp-4">{review.text}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">
                        {review.author_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{review.author_name}</p>
                      {review.is_verified && (
                        <p className="text-xs text-muted-foreground">
                          Проверенный клиент
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {reviews.length > 3 && (
            <div className="flex justify-center gap-2 mt-6">
              <Button variant="outline" size="icon" onClick={prevReview}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextReview}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
