import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import { Star, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Review {
    id: number;
    user_name: string;
    user_initials?: string;
    rating: number;
    comment: string | null;
    is_verified: boolean;
    created_at: string;
}

interface RatingStats {
    average: number;
    total: number;
    distribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

interface ReviewsListProps {
    reviews: Review[];
    ratingStats: RatingStats;
    className?: string;
}

/**
 * Component to display module reviews with rating statistics
 */
export function ReviewsList({ reviews, ratingStats, className }: ReviewsListProps) {
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <div className={cn('space-y-6', className)}>
            {/* Rating Summary */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Отзывы и рейтинг</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-6">
                        {/* Average Rating */}
                        <div className="flex flex-col items-center justify-center text-center min-w-[140px]">
                            <div className="text-4xl font-bold mb-1">
                                {ratingStats.average.toFixed(1)}
                            </div>
                            <div className="flex gap-0.5 mb-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                    <Star
                                        key={star}
                                        className={cn(
                                            'h-5 w-5',
                                            star <= Math.round(ratingStats.average)
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-muted-foreground'
                                        )}
                                    />
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {ratingStats.total} {ratingStats.total === 1 ? 'отзыв' :
                                    ratingStats.total >= 2 && ratingStats.total <= 4 ? 'отзыва' : 'отзывов'}
                            </p>
                        </div>

                        {/* Rating Distribution */}
                        <div className="flex-1 space-y-2">
                            {[5, 4, 3, 2, 1].map((rating) => {
                                const count = ratingStats.distribution[rating as keyof typeof ratingStats.distribution];
                                const percentage = ratingStats.total > 0
                                    ? (count / ratingStats.total) * 100
                                    : 0;

                                return (
                                    <div key={rating} className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 w-12">
                                            <span className="text-sm font-medium">{rating}</span>
                                            <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                        </div>
                                        <Progress value={percentage} className="flex-1 h-2" />
                                        <span className="text-sm text-muted-foreground w-8 text-right">
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Reviews List */}
            {reviews.length > 0 ? (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <Card key={review.id}>
                            <CardContent className="pt-4">
                                <div className="flex items-start gap-3">
                                    <Avatar className="h-10 w-10">
                                        <AvatarFallback className="text-xs font-medium">
                                            {review.user_initials || review.user_name.slice(0, 2).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap mb-1">
                                            <span className="font-medium text-sm">{review.user_name}</span>
                                            {review.is_verified && (
                                                <Badge variant="secondary" className="text-xs px-1.5 py-0">
                                                    <CheckCircle className="h-3 w-3 mr-1" />
                                                    Проверенная покупка
                                                </Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="flex gap-0.5">
                                                {[1, 2, 3, 4, 5].map((star) => (
                                                    <Star
                                                        key={star}
                                                        className={cn(
                                                            'h-3.5 w-3.5',
                                                            star <= review.rating
                                                                ? 'fill-yellow-400 text-yellow-400'
                                                                : 'text-muted-foreground'
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDate(review.created_at)}
                                            </span>
                                        </div>
                                        {review.comment && (
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {review.comment}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-8 text-center">
                        <Star className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground">
                            Отзывов пока нет. Будьте первым!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

export default ReviewsList;
