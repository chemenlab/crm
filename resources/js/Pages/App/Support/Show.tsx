import { Head, Link, useForm, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { ArrowLeft, Send, Star, Upload, X, Download } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import {
  SidebarInset,
} from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface Message {
  id: number;
  author?: { id: number; name: string; avatar?: string };
  message: string;
  created_at: string;
  attachments?: Array<{
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
  }>;
}

interface Ticket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  rating?: number;
  rating_comment?: string;
  created_at: string;
  public_messages: Message[];
  assigned_admin?: { id: number; name: string };
}

export default function Show({ ticket }: { ticket: Ticket }) {
  const { data, setData, post, processing, reset } = useForm({
    message: '',
    attachments: [] as File[],
  });

  const [fileNames, setFileNames] = useState<string[]>([]);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [closeConfirm, setCloseConfirm] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setData('attachments', files);
      setFileNames(files.map((f) => f.name));
    }
  };

  const submitMessage: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('app.support.messages.store', ticket.id), {
      onSuccess: () => {
        reset();
        setFileNames([]);
      },
    });
  };

  const handleClose = () => {
    setCloseConfirm(true);
  };

  const confirmClose = () => {
    router.post(route('app.support.close', ticket.id), {}, {
      onSuccess: () => setCloseConfirm(false),
    });
  };

  const handleReopen = () => {
    router.post(route('app.support.reopen', ticket.id));
  };

  const submitRating = () => {
    router.post(route('app.support.rate', ticket.id), {
      rating,
      comment: ratingComment,
    });
  };

  const statusColors: Record<string, string> = {
    new: 'bg-blue-500',
    in_progress: 'bg-yellow-500',
    waiting_for_user: 'bg-orange-500',
    resolved: 'bg-green-500',
    closed: 'bg-gray-500',
  };

  const statusLabels: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    waiting_for_user: 'Ожидает ответа',
    resolved: 'Решен',
    closed: 'Закрыт',
  };

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <Head title={`Тикет ${ticket.ticket_number}`} />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-4xl">
          <Link href={route('app.support.index')}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку
            </Button>
          </Link>

          {/* Ticket Header */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-sm font-mono text-gray-500">
                      {ticket.ticket_number}
                    </span>
                    <Badge className={statusColors[ticket.status]}>
                      {statusLabels[ticket.status]}
                    </Badge>
                  </div>
                  <h1 className="text-2xl font-bold">{ticket.subject}</h1>
                </div>
                <div className="flex gap-2">
                  {ticket.status === 'closed' && (
                    <Button onClick={handleReopen} variant="outline">
                      Переоткрыть
                    </Button>
                  )}
                  {ticket.status !== 'closed' && (
                    <Button onClick={handleClose} variant="outline">
                      Закрыть тикет
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <div className="space-y-4 mb-6">
            {ticket.public_messages.map((message) => (
              <Card key={message.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {message.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{message.author?.name || 'Неизвестный автор'}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(message.created_at).toLocaleString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                        {message.message}
                      </p>
                      {message.attachments && message.attachments.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {message.attachments.map((file) => (
                            <a
                              key={file.id}
                              href={`/storage/${file.file_path}`}
                              download
                              className="flex items-center gap-2 text-sm text-blue-600 hover:underline"
                            >
                              <Download className="h-4 w-4" />
                              {file.file_name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Reply Form */}
          {ticket.status !== 'closed' && (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={submitMessage} className="space-y-4">
                  <div>
                    <Label>Ваш ответ</Label>
                    <Textarea
                      value={data.message}
                      onChange={(e) => setData('message', e.target.value)}
                      placeholder="Напишите ваше сообщение..."
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <label htmlFor="reply-files">
                      <Button type="button" variant="outline" size="sm" asChild>
                        <span>
                          <Upload className="h-4 w-4 mr-2" />
                          Прикрепить файлы
                        </span>
                      </Button>
                      <input
                        id="reply-files"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.txt,.log"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                    <Button type="submit" disabled={processing}>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить
                    </Button>
                  </div>

                  {fileNames.length > 0 && (
                    <div className="space-y-2">
                      {fileNames.map((name, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm"
                        >
                          {name}
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newFiles = data.attachments.filter(
                                (_, i) => i !== index
                              );
                              setData('attachments', newFiles);
                              setFileNames(newFiles.map((f) => f.name));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Rating */}
          {ticket.status === 'closed' && !ticket.rating && (
            <Card className="mt-6">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4">Оцените качество поддержки</h3>
                <div className="flex gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= rating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  placeholder="Комментарий (необязательно)"
                  rows={3}
                  className="mb-4"
                />
                <Button onClick={submitRating} disabled={rating === 0}>
                  Отправить оценку
                </Button>
              </CardContent>
            </Card>
          )}
          </div>
          
          <ConfirmDialog
            open={closeConfirm}
            onOpenChange={setCloseConfirm}
            onConfirm={confirmClose}
            title="Закрытие тикета"
            description="Вы уверены, что хотите закрыть этот тикет?"
            confirmText="Да, закрыть"
            variant="default"
          />
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
