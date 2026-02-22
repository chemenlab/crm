import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { ThumbsUp, ThumbsDown } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';

interface ArticleRatingProps {
  articleId: number;
  currentRating?: boolean;
}

export function ArticleRating({ articleId, currentRating }: ArticleRatingProps) {
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const [selectedRating, setSelectedRating] = useState<boolean | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (isHelpful: boolean) => {
    setSelectedRating(isHelpful);
    if (!isHelpful) {
      // Если статья не полезна, показываем форму обратной связи
      setShowFeedbackDialog(true);
    } else {
      // Если полезна, сразу отправляем
      submitRating(isHelpful, null);
    }
  };

  const submitRating = (isHelpful: boolean, feedbackText: string | null) => {
    setIsSubmitting(true);

    router.post(
      route('knowledge-base.rate', articleId),
      {
        is_helpful: isHelpful,
        feedback: feedbackText,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Спасибо за вашу оценку!');
          setShowFeedbackDialog(false);
          setFeedback('');
        },
        onError: () => {
          toast.error('Не удалось сохранить оценку');
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      }
    );
  };

  const handleFeedbackSubmit = () => {
    if (selectedRating !== null) {
      submitRating(selectedRating, feedback || null);
    }
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Была ли эта статья полезной?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Ваш отзыв поможет нам улучшить базу знаний
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant={currentRating === true ? 'default' : 'outline'}
                size="lg"
                onClick={() => handleRating(true)}
                disabled={currentRating !== undefined || isSubmitting}
              >
                <ThumbsUp className="h-5 w-5 mr-2" />
                Да, полезно
              </Button>
              <Button
                variant={currentRating === false ? 'default' : 'outline'}
                size="lg"
                onClick={() => handleRating(false)}
                disabled={currentRating !== undefined || isSubmitting}
              >
                <ThumbsDown className="h-5 w-5 mr-2" />
                Нет, не помогло
              </Button>
            </div>
            {currentRating !== undefined && (
              <p className="text-sm text-gray-500 mt-4">
                Вы уже оценили эту статью
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Расскажите подробнее</DialogTitle>
            <DialogDescription>
              Что можно улучшить в этой статье? Ваш отзыв поможет нам сделать её лучше.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              placeholder="Опишите, что не помогло или что можно улучшить..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowFeedbackDialog(false);
                  setFeedback('');
                }}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button onClick={handleFeedbackSubmit} disabled={isSubmitting}>
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
