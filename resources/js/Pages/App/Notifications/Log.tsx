import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Input } from '@/Components/ui/input';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Search, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  channel: string;
  status: string;
  client_name: string;
  sent_at: string | null;
  delivered_at: string | null;
  failed_at: string | null;
  error_message: string | null;
  created_at: string;
}

interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

interface Props {
  notifications: {
    data: Notification[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
  };
  filters: {
    status?: string;
    channel?: string;
    search?: string;
  };
}

const statusLabels: Record<string, string> = {
  pending: 'Ожидает',
  sent: 'Отправлено',
  delivered: 'Доставлено',
  failed: 'Ошибка',
};

const statusColors: Record<string, string> = {
  pending: 'secondary',
  sent: 'default',
  delivered: 'default',
  failed: 'destructive',
};

const channelLabels: Record<string, string> = {
  vk: 'VK',
  telegram: 'Telegram',
  sms: 'SMS',
  email: 'Email',
};

const typeLabels: Record<string, string> = {
  appointment_created: 'Запись создана',
  appointment_confirmed: 'Запись подтверждена',
  appointment_rescheduled: 'Запись перенесена',
  appointment_cancelled: 'Запись отменена',
  reminder_24h: 'Напоминание за 24ч',
  reminder_2h: 'Напоминание за 2ч',
  master_new_appointment: 'Новая запись',
  master_appointment_cancelled: 'Отмена записи',
};

export default function NotificationLog({ notifications, filters }: Props) {
  const { props } = usePage<any>();
  const hasActiveSubscription = props.auth?.user?.currentSubscription?.status === 'active' || props.auth?.user?.currentSubscription?.status === 'trial';
  
  const [search, setSearch] = useState(filters.search || '');
  const [status, setStatus] = useState(filters.status || 'all');
  const [channel, setChannel] = useState(filters.channel || 'all');

  const handleFilter = () => {
    router.get(
      '/app/notifications/log',
      {
        search: search || undefined,
        status: status !== 'all' ? status : undefined,
        channel: channel !== 'all' ? channel : undefined,
      },
      { preserveState: true }
    );
  };

  const handlePageChange = (url: string | null) => {
    if (url) {
      router.get(url, {}, { preserveState: true });
    }
  };

  return (
    <AppPageLayout title="Журнал уведомлений">

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Журнал уведомлений</h1>

          {!hasActiveSubscription && <div className="mb-6"><SubscriptionRequired /></div>}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Поиск по клиенту..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                    className="pl-10"
                  />
                </div>

                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все статусы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все статусы</SelectItem>
                    <SelectItem value="pending">Ожидает</SelectItem>
                    <SelectItem value="sent">Отправлено</SelectItem>
                    <SelectItem value="delivered">Доставлено</SelectItem>
                    <SelectItem value="failed">Ошибка</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={channel} onValueChange={setChannel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все каналы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все каналы</SelectItem>
                    <SelectItem value="vk">VK</SelectItem>
                    <SelectItem value="telegram">Telegram</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>

                <Button onClick={handleFilter}>Применить</Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Клиент</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      Уведомления не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  notifications.data.map((notification) => (
                    <TableRow key={notification.id}>
                      <TableCell>
                        {new Date(notification.created_at).toLocaleString('ru-RU')}
                      </TableCell>
                      <TableCell>{notification.client_name}</TableCell>
                      <TableCell className="text-sm">
                        {typeLabels[notification.type] || notification.type}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{channelLabels[notification.channel]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusColors[notification.status] as any}>
                          {statusLabels[notification.status]}
                        </Badge>
                        {notification.error_message && (
                          <div className="text-xs text-red-500 mt-1">
                            {notification.error_message}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            router.get(`/app/notifications/log/${notification.id}`)
                          }
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {notifications.last_page > 1 && (
              <div className="p-4 border-t border-gray-200 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Показано {notifications.data.length} из {notifications.total} записей
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(
                        notifications.current_page > 1
                          ? `/app/notifications/log?page=${notifications.current_page - 1}`
                          : null
                      )
                    }
                    disabled={notifications.current_page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="px-4 py-2 text-sm">
                    Страница {notifications.current_page} из {notifications.last_page}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      handlePageChange(
                        notifications.current_page < notifications.last_page
                          ? `/app/notifications/log?page=${notifications.current_page + 1}`
                          : null
                      )
                    }
                    disabled={notifications.current_page === notifications.last_page}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppPageLayout>
  );
}
