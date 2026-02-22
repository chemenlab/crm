import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { Eye } from 'lucide-react';

interface Subscription {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    plan: {
        id: number;
        name: string;
        price: number;
    };
    status: string;
    current_period_start: string;
    current_period_end: string;
    created_at: string;
}

interface SubscriptionsIndexProps {
    subscriptions: {
        data: Subscription[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    plans: Array<{
        id: number;
        name: string;
    }>;
    filters: {
        status?: string;
        plan_id?: string;
        search?: string;
    };
}

const statusColors: Record<string, string> = {
    active: 'bg-green-500',
    trial: 'bg-blue-500',
    cancelled: 'bg-orange-500',
    expired: 'bg-red-500',
    past_due: 'bg-yellow-500',
};

const statusLabels: Record<string, string> = {
    active: 'Активна',
    trial: 'Триал',
    cancelled: 'Отменена',
    expired: 'Истекла',
    past_due: 'Просрочена',
};

export default function SubscriptionsIndex({
    subscriptions,
    plans,
    filters,
}: SubscriptionsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [planId, setPlanId] = useState(filters.plan_id || '');

    const handleFilter = () => {
        router.get(
            route('admin.subscriptions.index'),
            { search, status, plan_id: planId },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPlanId('');
        router.get(route('admin.subscriptions.index'));
    };

    return (
        <AdminLayout>
            <Head title="Управление подписками" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Управление подписками</h1>
                        <p className="text-muted-foreground mt-1">
                            Просмотр и управление подписками пользователей
                        </p>
                    </div>
                    <Link href={route('admin.subscriptions.create')}>
                        <Button>Создать подписку</Button>
                    </Link>
                </div>

                {/* Фильтры */}
                <Card>
                    <CardHeader>
                        <CardTitle>Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <Input
                                placeholder="Поиск по email или имени..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            />

                            <Select value={status || 'all'} onValueChange={(value) => setStatus(value === 'all' ? '' : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Все статусы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="active">Активные</SelectItem>
                                    <SelectItem value="trial">Триальные</SelectItem>
                                    <SelectItem value="cancelled">Отменённые</SelectItem>
                                    <SelectItem value="expired">Истёкшие</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={planId || 'all'} onValueChange={(value) => setPlanId(value === 'all' ? '' : value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Все тарифы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все тарифы</SelectItem>
                                    {plans.map((plan) => (
                                        <SelectItem key={plan.id} value={plan.id.toString()}>
                                            {plan.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button onClick={handleFilter} className="flex-1">
                                    Применить
                                </Button>
                                <Button onClick={handleReset} variant="outline">
                                    Сбросить
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Таблица подписок */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Пользователь
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Тариф
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Статус
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Период
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Создана
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {subscriptions.data.map((subscription) => (
                                        <tr key={subscription.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">
                                                        {subscription.user.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {subscription.user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">
                                                        {subscription.plan.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {subscription.plan.price} ₽/мес
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge className={statusColors[subscription.status]}>
                                                    {statusLabels[subscription.status]}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div>
                                                    {new Date(
                                                        subscription.current_period_start
                                                    ).toLocaleDateString('ru-RU')}
                                                </div>
                                                <div className="text-muted-foreground">
                                                    до{' '}
                                                    {new Date(
                                                        subscription.current_period_end
                                                    ).toLocaleDateString('ru-RU')}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {new Date(subscription.created_at).toLocaleDateString(
                                                    'ru-RU'
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.visit(
                                                            route('admin.subscriptions.show', subscription.id)
                                                        )
                                                    }
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Пагинация */}
                        {subscriptions.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Показано {subscriptions.data.length} из {subscriptions.total}
                                </div>
                                <div className="flex gap-2">
                                    {Array.from({ length: subscriptions.last_page }, (_, i) => i + 1).map(
                                        (page) => (
                                            <Button
                                                key={page}
                                                variant={
                                                    page === subscriptions.current_page
                                                        ? 'default'
                                                        : 'outline'
                                                }
                                                size="sm"
                                                onClick={() =>
                                                    router.get(
                                                        route('admin.subscriptions.index'),
                                                        { ...filters, page },
                                                        { preserveState: true }
                                                    )
                                                }
                                            >
                                                {page}
                                            </Button>
                                        )
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
