import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { Star } from 'lucide-react';
import type { ReviewStats as ReviewStatsType } from '../types';

interface ReviewStatsProps {
  stats: ReviewStatsType;
}

export default function ReviewStats({ stats }: ReviewStatsProps) {
  const ratingDistribution = stats.rating_distribution || {};

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Статистика отзывов</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="text-center">
            <div className="text-4xl font-bold">{stats.average_rating}</div>
            <div className="flex justify-center mt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-4 w-4 ${
                    star <= Math.round(stats.average_rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.total_reviews} отзывов
            </p>
          </div>
          <div className="flex-1 space-y-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = ratingDistribution[rating] || 0;
              const percentage = stats.total_reviews > 0 
                ? (count / stats.total_reviews) * 100 
                : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <span className="text-sm w-3">{rating}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <Progress value={percentage} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground w-8 text-right">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {stats.pending_count > 0 && (
          <div className="text-sm text-muted-foreground border-t pt-3">
            На модерации: <span className="font-medium">{stats.pending_count}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
