import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { MessageSquare, Clock, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';

interface SupportTicket {
  id: number;
  ticket_number: string;
  subject: string;
  category: string;
  priority: string;
  status: string;
  created_at: string;
  user: {
    id: number;
    name: string;
  };
  messages_count?: number;
  assigned_admin?: {
    id: number;
    name: string;
  };
}

interface Admin {
  id: number;
  name: string;
}

interface Props {
  tickets: {
    data: SupportTicket[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  admins: Admin[];
  filters: {
    status: string;
    priority: string;
    category: string;
    assigned_to: string;
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

const categoryLabels: Record<string, string> = {
  technical: 'Техническая проблема',
  billing: 'Вопрос по оплате',
  feature_request: 'Запрос функции',
  other: 'Другое',
};

export default function Index({ tickets, admins, filters }: Props) {
  const handleFilterChange = (key: string, value: string) => {
    router.get(
      route('admin.support.index'),
      { ...filters, [key]: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  return (
    <AdminLayout>
      <Head title="Тикеты поддержки" />

      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Тикеты поддержки
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Управление обращениями пользователей
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Статус</label>
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
                    <SelectItem value="waiting_for_user">Ожидает ответа</SelectItem>
                    <SelectItem value="resolved">Решенные</SelectItem>
                    <SelectItem value="closed">Закрытые</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Приоритет</label>
                <Select
                  value={filters.priority}
                  onValueChange={(value) => handleFilterChange('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                    <SelectItem value="critical">Критический</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Категория</label>
                <Select
                  value={filters.category}
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="technical">Техническая проблема</SelectItem>
                    <SelectItem value="billing">Вопрос по оплате</SelectItem>
                    <SelectItem value="feature_request">Запрос функции</SelectItem>
                    <SelectItem value="other">Другое</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Назначен</label>
                <Select
                  value={filters.assigned_to}
                  onValueChange={(value) => handleFilterChange('assigned_to', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    <SelectItem value="unassigned">Не назначен</SelectItem>
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

        {/* Tickets List */}
        {tickets.data.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет тикетов
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Нет тикетов, соответствующих выбранным фильтрам
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tickets.data.map((ticket) => (
              <div key={ticket.id}>
                <Link href={route('admin.support.show', ticket.id)}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
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
                          <Badge variant="secondary">
                            {categoryLabels[ticket.category]}
                          </Badge>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {ticket.subject}
                        </h3>

                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            {ticket.user.name}
                          </div>
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
                    router.get(route('admin.support.index'), {
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
    </AdminLayout>
  );
}
