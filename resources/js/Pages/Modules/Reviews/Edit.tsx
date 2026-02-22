import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useState } from 'react';
import ReviewForm from '@/modules/reviews/components/ReviewForm';
import type { Review, ReviewFormData } from '@/modules/reviews/types';

interface Props {
  review: Review;
}

export default function ReviewsEdit({ review }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (data: ReviewFormData) => {
    setIsSubmitting(true);
    router.put(`/app/modules/reviews/${review.id}`, data, {
      onSuccess: () => {
        toast.success('Отзыв обновлён');
      },
      onError: () => {
        toast.error('Не удалось обновить отзыв');
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleCancel = () => {
    router.get('/app/modules/reviews');
  };

  return (
    <AppSidebarProvider>
      <Head title="Редактирование отзыва" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6">
            <h1 className="text-2xl md:text-3xl font-bold">Редактирование отзыва</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Измените информацию об отзыве
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Информация об отзыве</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                initialData={{
                  author_name: review.author_name,
                  author_email: review.author_email || undefined,
                  author_phone: review.author_phone || undefined,
                  rating: review.rating,
                  text: review.text || undefined,
                }}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isSubmitting}
                submitLabel="Сохранить изменения"
              />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
