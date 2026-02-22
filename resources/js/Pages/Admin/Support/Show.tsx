import { Head, Link, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { ArrowLeft, Send, Upload, X, Download, User, Mail, Calendar, CreditCard, ExternalLink } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

interface Message {
  id: number;
  author?: { id: number; name: string; avatar?: string };
  author_type?: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  attachments?: Array<{
    id: number;
    file_name: string;
    file_path: string;
    file_size: number;
  }>;
}

interface Admin {
  id: number;
  name: string;
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
  user: { 
    id: number; 
    name: string;
    email: string;
    created_at: string;
    current_subscription?: {
      id: number;
      status: string;
      plan: {
        name: string;
      };
    };
  };
  messages: Message[];
  assigned_admin?: { id: number; name: string };
}

interface Props {
  ticket: Ticket;
  admins: Admin[];
}

export default function Show({ ticket, admins }: Props) {
  const { data, setData, post, processing, reset } = useForm({
    message: '',
    is_internal: false,
    attachments: [] as File[],
  });

  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setData('attachments', files);
      setFileNames(files.map((f) => f.name));
    }
  };

  const submitMessage: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('admin.support.messages.store', ticket.id), {
      onSuccess: () => {
        reset();
        setFileNames([]);
      },
    });
  };

  const handleStatusChange = (status: string) => {
    router.post(route('admin.support.update-status', ticket.id), { status });
  };

  const handlePriorityChange = (priority: string) => {
    router.post(route('admin.support.update-priority', ticket.id), { priority });
  };

  const handleAssign = (adminId: string) => {
    router.post(route('admin.support.assign', ticket.id), {
      admin_id: adminId === 'unassign' ? null : adminId,
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
    <AdminLayout>
      <Head title={`Тикет ${ticket.ticket_number}`} />

      <div className="p-6">
        <Link href={route('admin.support.index')}>
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
                <h1 className="text-2xl font-bold mb-2">{ticket.subject}</h1>
                <p className="text-sm text-gray-600">
                  От: {ticket.user.name} • {new Date(ticket.created_at).toLocaleString('ru-RU')}
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label>Статус</Label>
                <Select value={ticket.status} onValueChange={handleStatusChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Новый</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="waiting_for_user">Ожидает ответа</SelectItem>
                    <SelectItem value="resolved">Решен</SelectItem>
                    <SelectItem value="closed">Закрыт</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Приоритет</Label>
                <Select value={ticket.priority} onValueChange={handlePriorityChange}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критический</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Назначить</Label>
                <Select
                  value={ticket.assigned_admin?.id.toString() || 'unassign'}
                  onValueChange={handleAssign}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassign">Не назначен</SelectItem>
                    {admins.map((admin) => (
                      <SelectItem key={admin.id} value={admin.id.toString()}>
                        {admin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Information Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Информация о пользователе
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Имя</p>
                    <p className="font-medium">{ticket.user.name}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{ticket.user.email}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Зарегистрирован</p>
                    <p className="font-medium">
                      {new Date(ticket.user.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CreditCard className="h-4 w-4 mt-1 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Подписка</p>
                    <p className="font-medium">
                      {ticket.user.current_subscription 
                        ? ticket.user.current_subscription.plan.name 
                        : 'Нет активной подписки'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t">
              <Link href={route('admin.users.show', ticket.user.id)}>
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Открыть профиль пользователя
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Messages */}
        <div className="space-y-4 mb-6">
          {ticket.messages.map((message) => {
            const isAdmin = message.author_type === 'App\\Models\\Administrator';
            const authorLabel = isAdmin ? 'Администратор' : 'Пользователь';
            
            return (
              <Card
                key={message.id}
                className={message.is_internal ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/10' : ''}
              >
                <CardContent className="pt-6">
                  {message.is_internal && (
                    <Badge variant="outline" className="mb-2 bg-yellow-100 text-yellow-800">
                      Внутреннее сообщение
                    </Badge>
                  )}
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        isAdmin ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'
                      }`}>
                        {message.author?.name?.[0]?.toUpperCase() || '?'}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{message.author?.name || 'Неизвестный автор'}</span>
                        <Badge variant="outline" className={isAdmin ? 'bg-blue-50 text-blue-700' : 'bg-gray-50'}>
                          {authorLabel}
                        </Badge>
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
            );
          })}
        </div>

        {/* Reply Form */}
        {ticket.status !== 'closed' && (
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={submitMessage} className="space-y-4">
                <div>
                  <Label>Ответ</Label>
                  <Textarea
                    value={data.message}
                    onChange={(e) => setData('message', e.target.value)}
                    placeholder="Напишите ваше сообщение..."
                    rows={4}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_internal"
                    checked={data.is_internal}
                    onChange={(e) => setData('is_internal', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="is_internal" className="cursor-pointer">
                    Внутреннее сообщение (не видно пользователю)
                  </Label>
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
        {ticket.rating && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Оценка пользователя</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold">{ticket.rating}</span>
                <span className="text-gray-600">/ 5</span>
              </div>
              {ticket.rating_comment && (
                <p className="text-gray-700 dark:text-gray-300">
                  {ticket.rating_comment}
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
