import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Plus, MessageSquare, Clock } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import {
  SidebarInset,
} from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  messages_count?: number;
  has_unread?: boolean;
  assigned_admin?: {
    id: number;
    name: string;
  };
}

interface Props {
  tickets: {
    data: SupportTicket[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  filters: {
    status: string;
    sort_by: string;
    sort_order: string;
  };
}

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

const priorityColors: Record<string, string> = {
  low: 'bg-gray-500',
  medium: 'bg-blue-500',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
};

const priorityLabels: Record<string, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
};

export default function Index({ tickets, filters }: Props) {
  const handleFilterChange = (key: string, value: string) => {
    router.get(
      route('app.support.index'),
      { ...filters, [key]: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <Head title="Техническая поддержка" />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-6xl">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Техническая поддержка
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Управляйте вашими обращениями в службу поддержки
                </p>
              </div>
              <Link href={route('app.support.create')}>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Создать тикет
                </Button>
              </Link>
            </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Статус
                  </label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="new">Новые</SelectItem>
                      <SelectItem value="in_progress">В работе</SelectItem>
                      <SelectItem value="waiting_for_user">
                        Ожидает ответа
                      </SelectItem>
                      <SelectItem value="resolved">Решенные</SelectItem>
                      <SelectItem value="closed">Закрытые</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">
                    Сортировка
                  </label>
                  <Select
                    value={filters.sort_by}
                    onValueChange={(value) => handleFilterChange('sort_by', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="created_at">По дате создания</SelectItem>
                      <SelectItem value="priority">По приоритету</SelectItem>
                      <SelectItem value="status">По статусу</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tickets List */}
          {tickets.data.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Нет тикетов
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  У вас пока нет обращений в службу поддержки
                </p>
                <Link href={route('app.support.create')}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первый тикет
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {tickets.data.map((ticket) => (
                <div key={ticket.id}>
                  <Link href={route('app.support.show', ticket.id)}>
                    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${
                      ticket.has_unread 
                        ? 'border-2 border-blue-500 bg-blue-50/50 dark:bg-blue-950/20' 
                        : ''
                    }`}>
                      <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {ticket.has_unread && (
                              <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                              </span>
                            )}
                            <span className="text-sm font-mono text-gray-500">
                              {ticket.ticket_number}
                            </span>
                            <Badge className={statusColors[ticket.status]}>
                              {statusLabels[ticket.status]}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={priorityColors[ticket.priority]}
                            >
                              {priorityLabels[ticket.priority]}
                            </Badge>
                          </div>

                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            {ticket.subject}
                            {ticket.has_unread && (
                              <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                                • Новый ответ
                              </span>
                            )}
                          </h3>

                          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {new Date(ticket.created_at).toLocaleDateString('ru-RU')}
                            </div>
                            {ticket.messages_count && ticket.messages_count > 0 && (
                              <div className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {ticket.messages_count} сообщений
                              </div>
                            )}
                            {ticket.assigned_admin && (
                              <div>
                                Назначен: {ticket.assigned_admin.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </div>
              ))}
            </div>
          )}

            {/* Pagination */}
            {tickets.last_page > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: tickets.last_page }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={page === tickets.current_page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() =>
                        router.get(route('app.support.index'), {
                          ...filters,
                          page,
                        })
                      }
                    >
                      {page}
                    </Button>
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
