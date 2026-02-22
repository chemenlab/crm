import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Star, ArrowRight } from 'lucide-react';
import { Link } from '@inertiajs/react';
import type { Review, ReviewStats } from '../types';

interface ReviewWidgetProps {
  reviews: Review[];
  stats: ReviewStats;
}

export default function ReviewWidget({ reviews, stats }: ReviewWidgetProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Последние отзывы</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/modules/reviews">
            Все отзывы
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {/* Stats summary */}
        <div className="flex items-center gap-4 mb-4 pb-4 border-b">
          <div className="flex items-center gap-1">
            <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            <span className="text-2xl font-bold">{stats.average_rating}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {stats.total_reviews} отзывов
            {stats.pending_count > 0 && (
              <span className="ml-2 text-orange-500">
                ({stats.pending_count} на модерации)
              </span>
            )}
          </div>
        </div>

        {/* Recent reviews */}
        {reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Отзывов пока нет
          </p>
        ) : (
          <div className="space-y-3">
            {reviews.slice(0, 3).map((review) => (
              <div key={review.id} className="flex gap-3">
                <div className="flex-shrink-0">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-3 w-3 ${
                          star <= review.rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-muted-foreground'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {review.author_name}
                  </p>
                  {review.text && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {review.text}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
