import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { useState } from 'react';
import ReviewForm from '@/modules/reviews/components/ReviewForm';
import type { ReviewFormData } from '@/modules/reviews/types';

export default function ReviewsCreate() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (data: ReviewFormData) => {
    setIsSubmitting(true);
    router.post('/app/modules/reviews', data, {
      onSuccess: () => {
        toast.success('Отзыв добавлен');
      },
      onError: () => {
        toast.error('Не удалось добавить отзыв');
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleCancel = () => {
    router.get('/app/modules/reviews');
  };

  return (
    <AppSidebarProvider>
      <Head title="Новый отзыв" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6">
            <h1 className="text-2xl md:text-3xl font-bold">Новый отзыв</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Добавьте отзыв от клиента вручную
            </p>
          </div>

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle>Информация об отзыве</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                isLoading={isSubmitting}
                submitLabel="Добавить отзыв"
              />
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
