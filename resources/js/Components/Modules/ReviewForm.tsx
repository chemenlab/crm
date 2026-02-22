import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Star, Loader2, Edit2, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewFormProps {
    moduleSlug: string;
    canReview: boolean;
    userReview?: {
        id: number;
        rating: number;
        comment: string | null;
    } | null;
    onSuccess?: () => void;
}

/**
 * ReviewForm component for creating/editing module reviews
 */
export function ReviewForm({ moduleSlug, canReview, userReview, onSuccess }: ReviewFormProps) {
    const [rating, setRating] = useState(userReview?.rating || 0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [comment, setComment] = useState(userReview?.comment || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(!userReview);

    const handleSubmit = () => {
        if (rating === 0) {
            toast.error('Выберите оценку');
            return;
        }

        setIsSubmitting(true);

        const method = userReview ? 'put' : 'post';
        const url = `/app/modules/${moduleSlug}/reviews`;

        router[method](url, { rating, comment }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(userReview ? 'Отзыв обновлён' : 'Отзыв добавлен');
                setIsEditing(false);
                onSuccess?.();
            },
            onError: (errors) => {
                const errorMessage = typeof errors === 'object' && errors.error
                    ? errors.error
                    : 'Не удалось сохранить отзыв';
                toast.error('Ошибка', { description: errorMessage });
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    const handleDelete = () => {
        if (!confirm('Удалить ваш отзыв?')) return;

        setIsSubmitting(true);

        router.delete(`/app/modules/${moduleSlug}/reviews`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Отзыв удалён');
                setRating(0);
                setComment('');
                setIsEditing(true);
                onSuccess?.();
            },
            onError: () => {
                toast.error('Не удалось удалить отзыв');
            },
            onFinish: () => setIsSubmitting(false),
        });
    };

    // If user can't review (hasn't used the module), show a message
    if (!canReview && !userReview) {
        return (
            <Card className="border-dashed">
                <CardContent className="py-6 text-center text-muted-foreground">
                    <p>Установите модуль, чтобы оставить отзыв</p>
                </CardContent>
            </Card>
        );
    }

    // If user already reviewed and not editing, show their review
    if (userReview && !isEditing) {
        return (
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Ваш отзыв</CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditing(true)}
                                disabled={isSubmitting}
                            >
                                <Edit2 className="h-4 w-4 mr-1" />
                                Изменить
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                                className="text-destructive hover:text-destructive"
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Trash2 className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={cn(
                                    'h-5 w-5',
                                    star <= userReview.rating
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'text-muted-foreground'
                                )}
                            />
                        ))}
                    </div>
                    {userReview.comment && (
                        <p className="text-sm text-muted-foreground">{userReview.comment}</p>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Review form
    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">
                    {userReview ? 'Редактировать отзыв' : 'Оставить отзыв'}
                </CardTitle>
                <CardDescription>
                    Поделитесь своим мнением о модуле
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Star Rating */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Оценка</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                onMouseEnter={() => setHoveredRating(star)}
                                onMouseLeave={() => setHoveredRating(0)}
                                className="focus:outline-none transition-transform hover:scale-110"
                                disabled={isSubmitting}
                            >
                                <Star
                                    className={cn(
                                        'h-7 w-7 transition-colors',
                                        star <= (hoveredRating || rating)
                                            ? 'fill-yellow-400 text-yellow-400'
                                            : 'text-muted-foreground hover:text-yellow-200'
                                    )}
                                />
                            </button>
                        ))}
                    </div>
                </div>

                {/* Comment */}
                <div>
                    <label className="text-sm font-medium mb-2 block">Комментарий (необязательно)</label>
                    <Textarea
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Расскажите о своём опыте использования модуля..."
                        rows={3}
                        maxLength={1000}
                        disabled={isSubmitting}
                    />
                    <p className="text-xs text-muted-foreground mt-1 text-right">
                        {comment.length}/1000
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    {userReview && (
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsEditing(false);
                                setRating(userReview.rating);
                                setComment(userReview.comment || '');
                            }}
                            disabled={isSubmitting}
                        >
                            Отмена
                        </Button>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting || rating === 0}
                    >
                        {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {userReview ? 'Сохранить' : 'Отправить'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

export default ReviewForm;
