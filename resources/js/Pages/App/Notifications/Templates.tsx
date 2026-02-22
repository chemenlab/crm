import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import { Input } from '@/Components/ui/input';
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
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

// @ts-ignore
declare const route: any;

interface NotificationTemplate {
  id: number;
  name: string;
  type: string;
  channel: string;
  subject: string | null;
  is_system: boolean;
  is_active: boolean;
  created_at: string;
}

interface Props {
  templates: NotificationTemplate[];
}

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
  master_new_appointment: 'Новая запись (мастеру)',
  master_appointment_cancelled: 'Отмена записи (мастеру)',
};

export default function Templates({ templates }: Props) {
  const { props } = usePage<any>();
  const hasActiveSubscription = props.auth?.user?.currentSubscription?.status === 'active' || props.auth?.user?.currentSubscription?.status === 'trial';
  
  const [search, setSearch] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  });

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(search.toLowerCase()) ||
      template.type.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = channelFilter === 'all' || template.channel === channelFilter;
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    return matchesSearch && matchesChannel && matchesType;
  });

  const handleDelete = (template: NotificationTemplate) => {
    setDeleteConfirm({ open: true, id: template.id, name: template.name });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.id) return;
    router.delete(`/app/notifications/templates/${deleteConfirm.id}`, {
      onSuccess: () => setDeleteConfirm({ open: false, id: null, name: '' }),
    });
  };

  return (
    <AppPageLayout title="Шаблоны уведомлений">

      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">Шаблоны уведомлений</h1>
            <Link href="/app/notifications/templates/create">
              <Button disabled={!hasActiveSubscription}>
                <Plus className="w-4 h-4 mr-2" />
                Создать шаблон
              </Button>
            </Link>
          </div>

          {!hasActiveSubscription && <SubscriptionRequired />}

          <div className="bg-white rounded-lg shadow">
            <div className="p-4 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Поиск по названию или типу..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>

                <Select value={channelFilter} onValueChange={setChannelFilter}>
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

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все типы" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все типы</SelectItem>
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Название</TableHead>
                  <TableHead>Тип</TableHead>
                  <TableHead>Канал</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTemplates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      Шаблоны не найдены
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          {template.is_system && (
                            <Badge variant="secondary" className="mt-1">
                              Системный
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{typeLabels[template.type] || template.type}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{channelLabels[template.channel]}</Badge>
                      </TableCell>
                      <TableCell>
                        {template.is_active ? (
                          <Badge variant="default">Активен</Badge>
                        ) : (
                          <Badge variant="secondary">Неактивен</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/app/notifications/templates/${template.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                          </Link>
                          {!template.is_system && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(template)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <ConfirmDialog
            open={deleteConfirm.open}
            onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
            onConfirm={confirmDelete}
            title="Удаление шаблона"
            itemName={deleteConfirm.name}
          />
        </div>
      </div>
    </AppPageLayout>
  );
}
