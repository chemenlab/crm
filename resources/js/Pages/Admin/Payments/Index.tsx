import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { useState } from 'react';
import { Eye, DollarSign, TrendingUp, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Payment {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    subscription: {
        id: number;
        plan: {
            id: number;
            name: string;
        };
    } | null;
    yookassa_payment_id: string | null;
    status: string;
    amount: number;
    currency: string;
    payment_method: string | null;
    description: string | null;
    paid_at: string | null;
    created_at: string;
}

interface Stats {
    total_amount: number;
    total_count: number;
    succeeded_count: number;
    pending_count: number;
    failed_count: number;
}

interface PaymentsIndexProps {
    payments: {
        data: Payment[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: {
        status?: string;
        payment_method?: string;
        date_from?: string;
        date_to?: string;
        search?: string;
    };
}

export default function PaymentsIndex({ payments, stats, filters }: PaymentsIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [status, setStatus] = useState(filters.status || '');
    const [paymentMethod, setPaymentMethod] = useState(filters.payment_method || '');
    const [dateFrom, setDateFrom] = useState(filters.date_from || '');
    const [dateTo, setDateTo] = useState(filters.date_to || '');

    const handleFilter = () => {
        router.get(
            route('admin.payments.index'),
            { search, status, payment_method: paymentMethod, date_from: dateFrom, date_to: dateTo },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setStatus('');
        setPaymentMethod('');
        setDateFrom('');
        setDateTo('');
        router.get(route('admin.payments.index'));
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            succeeded: 'default',
            pending: 'secondary',
            waiting_for_capture: 'secondary',
            cancelled: 'destructive',
            failed: 'destructive',
        };

        const labels: Record<string, string> = {
            succeeded: 'Успешно',
            pending: 'В ожидании',
            waiting_for_capture: 'Ожидает подтверждения',
            cancelled: 'Отменен',
            failed: 'Ошибка',
        };

        return <Badge variant={variants[status] || 'outline'}>{labels[status] || status}</Badge>;
    };

    const getPaymentMethodLabel = (method: string | null) => {
        if (!method) return '—';

        const labels: Record<string, string> = {
            bank_card: 'Банковская карта',
            yoo_money: 'ЮMoney',
            qiwi: 'QIWI',
            webmoney: 'WebMoney',
            sberbank: 'Сбербанк Онлайн',
            alfabank: 'Альфа-Клик',
            tinkoff_bank: 'Тинькофф',
        };

        return labels[method] || method;
    };

    return (
        <AdminLayout>
            <Head title="Управление платежами" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Платежи</h1>
                        <p className="text-muted-foreground mt-1">
                            Просмотр и управление платежами пользователей
                        </p>
                    </div>
                </div>

                {/* Статистика */}
                <div className="grid gap-4 md:grid-cols-5">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Общая сумма
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_amount.toLocaleString('ru-RU')} ₽
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Всего платежей
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_count}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Успешных
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-600">
                                {stats.succeeded_count}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                В ожидании
                            </CardTitle>
                            <Clock className="h-4 w-4 text-yellow-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-yellow-600">
                                {stats.pending_count}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Неудачных
                            </CardTitle>
                            <XCircle className="h-4 w-4 text-red-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-600">
                                {stats.failed_count}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Фильтры */}
                <Card>
                    <CardHeader>
                        <CardTitle>Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <Input
                                placeholder="Поиск по пользователю..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            />

                            <Select
                                value={status || 'all'}
                                onValueChange={(value) => setStatus(value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Все статусы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="succeeded">Успешно</SelectItem>
                                    <SelectItem value="pending">В ожидании</SelectItem>
                                    <SelectItem value="waiting_for_capture">Ожидает подтверждения</SelectItem>
                                    <SelectItem value="cancelled">Отменен</SelectItem>
                                    <SelectItem value="failed">Ошибка</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={paymentMethod || 'all'}
                                onValueChange={(value) =>
                                    setPaymentMethod(value === 'all' ? '' : value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Все методы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все методы</SelectItem>
                                    <SelectItem value="bank_card">Банковская карта</SelectItem>
                                    <SelectItem value="yoo_money">ЮMoney</SelectItem>
                                    <SelectItem value="qiwi">QIWI</SelectItem>
                                    <SelectItem value="webmoney">WebMoney</SelectItem>
                                    <SelectItem value="sberbank">Сбербанк Онлайн</SelectItem>
                                    <SelectItem value="alfabank">Альфа-Клик</SelectItem>
                                    <SelectItem value="tinkoff_bank">Тинькофф</SelectItem>
                                </SelectContent>
                            </Select>

                            <Input
                                type="date"
                                placeholder="Дата от"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                            />

                            <Input
                                type="date"
                                placeholder="Дата до"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                            />

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

                {/* Таблица платежей */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Пользователь
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Тариф
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Сумма
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Метод
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Статус
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Дата
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {payments.data.map((payment) => (
                                        <tr key={payment.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <span className="font-mono text-sm">
                                                    #{payment.id}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">
                                                        {payment.user.name}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {payment.user.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {payment.subscription?.plan.name || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {payment.amount.toLocaleString('ru-RU')} {payment.currency}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {getPaymentMethodLabel(payment.payment_method)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {getStatusBadge(payment.status)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {format(
                                                    new Date(payment.created_at),
                                                    'dd.MM.yyyy HH:mm',
                                                    { locale: ru }
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(
                                                                route('admin.payments.show', payment.id)
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {payments.data.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground">
                                Платежи не найдены
                            </div>
                        )}

                        {/* Пагинация */}
                        {payments.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Показано {payments.data.length} из {payments.total}
                                </div>
                                <div className="flex gap-2">
                                    {Array.from(
                                        { length: payments.last_page },
                                        (_, i) => i + 1
                                    ).map((page) => (
                                        <Button
                                            key={page}
                                            variant={
                                                page === payments.current_page
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                router.get(
                                                    route('admin.payments.index'),
                                                    { ...filters, page },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
