import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import ReviewList from '@/modules/reviews/components/ReviewList';
import ReviewStats from '@/modules/reviews/components/ReviewStats';
import ReviewForm from '@/modules/reviews/components/ReviewForm';
import type { Review, ReviewStats as ReviewStatsType, ReviewFormData } from '@/modules/reviews/types';

interface Props {
  reviews: {
    data: Review[];
    current_page: number;
    last_page: number;
    total: number;
  };
  stats: ReviewStatsType;
  currentStatus: string | null;
}

export default function ReviewsIndex({ reviews, stats, currentStatus }: Props) {
  const [activeStatus, setActiveStatus] = useState(currentStatus || 'all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleStatusChange = (status: string) => {
    setActiveStatus(status);
    router.get('/app/modules/reviews', {
      status: status === 'all' ? undefined : status,
    }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleCreate = (data: ReviewFormData) => {
    setIsSubmitting(true);
    router.post('/app/modules/reviews', data, {
      onSuccess: () => {
        setIsCreateDialogOpen(false);
        toast.success('Отзыв добавлен');
      },
      onError: () => {
        toast.error('Не удалось добавить отзыв');
      },
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleApprove = (review: Review) => {
    router.post(`/app/modules/reviews/${review.id}/approve`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Отзыв одобрен'),
      onError: () => toast.error('Не удалось одобрить отзыв'),
    });
  };

  const handleReject = (review: Review) => {
    router.post(`/app/modules/reviews/${review.id}/reject`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Отзыв отклонён'),
      onError: () => toast.error('Не удалось отклонить отзыв'),
    });
  };

  const handleRespond = (review: Review) => {
    setSelectedReview(review);
    setResponseText(review.response || '');
    setIsResponseDialogOpen(true);
  };

  const submitResponse = () => {
    if (!selectedReview) return;
    
    setIsSubmitting(true);
    router.post(`/app/modules/reviews/${selectedReview.id}/respond`, {
      response: responseText,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setIsResponseDialogOpen(false);
        setSelectedReview(null);
        toast.success('Ответ добавлен');
      },
      onError: () => toast.error('Не удалось добавить ответ'),
      onFinish: () => setIsSubmitting(false),
    });
  };

  const handleToggleFeatured = (review: Review) => {
    router.post(`/app/modules/reviews/${review.id}/toggle-featured`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success(review.is_featured ? 'Отзыв откреплён' : 'Отзыв закреплён'),
      onError: () => toast.error('Не удалось изменить статус'),
    });
  };

  const handleEdit = (review: Review) => {
    router.get(`/app/modules/reviews/${review.id}/edit`);
  };

  const handleDelete = (review: Review) => {
    setSelectedReview(review);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedReview) return;
    
    router.delete(`/app/modules/reviews/${selectedReview.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setIsDeleteDialogOpen(false);
        setSelectedReview(null);
        toast.success('Отзыв удалён');
      },
      onError: () => toast.error('Не удалось удалить отзыв'),
    });
  };

  return (
    <AppSidebarProvider>
      <Head title="Отзывы" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="flex items-center justify-between py-4 md:py-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Отзывы</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Управляйте отзывами ваших клиентов
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить отзыв
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новый отзыв</DialogTitle>
                </DialogHeader>
                <ReviewForm
                  onSubmit={handleCreate}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isLoading={isSubmitting}
                  submitLabel="Добавить"
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            {/* Main content */}
            <div>
              {/* Status tabs */}
              <Tabs value={activeStatus} onValueChange={handleStatusChange} className="mb-6">
                <TabsList>
                  <TabsTrigger value="all">Все</TabsTrigger>
                  <TabsTrigger value="pending">
                    На модерации
                    {stats.pending_count > 0 && (
                      <span className="ml-1 text-xs bg-orange-500 text-white rounded-full px-1.5">
                        {stats.pending_count}
                      </span>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="approved">Одобренные</TabsTrigger>
                  <TabsTrigger value="rejected">Отклонённые</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Reviews list */}
              <ReviewList
                reviews={reviews.data}
                onApprove={handleApprove}
                onReject={handleReject}
                onRespond={handleRespond}
                onToggleFeatured={handleToggleFeatured}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <ReviewStats stats={stats} />
            </div>
          </div>
        </div>
      </SidebarInset>

      {/* Response Dialog */}
      <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ответить на отзыв</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedReview && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium">{selectedReview.author_name}</p>
                <p className="text-sm text-muted-foreground">{selectedReview.text}</p>
              </div>
            )}
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Напишите ваш ответ..."
              className="w-full min-h-[100px] p-3 border rounded-lg resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                Отмена
              </Button>
              <Button onClick={submitResponse} disabled={isSubmitting || !responseText.trim()}>
                {isSubmitting ? 'Сохранение...' : 'Ответить'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Удалить отзыв?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя отменить. Отзыв будет удалён навсегда.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppSidebarProvider>
  );
}
