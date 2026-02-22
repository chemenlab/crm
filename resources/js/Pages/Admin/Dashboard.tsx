import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Users,
    CreditCard,
    TrendingUp,
    Tag,
    UserPlus,
    DollarSign,
    Activity,
    CheckCircle,
    XCircle,
    Clock,
} from 'lucide-react';

interface DashboardProps {
    subscriptionStats: {
        total: number;
        active: number;
        trial: number;
        cancelled: number;
        expired: number;
    };
    paymentStats: {
        total_payments: number;
        total_revenue: number;
        average_payment: number;
    };
    mrr: number;
    newUsers: number;
    activePromoCodes: number;
    paymentsChart: Array<{
        date: string;
        count: number;
        amount: number;
    }>;
}

export default function AdminDashboard({
    subscriptionStats,
    paymentStats,
    mrr,
    newUsers,
    activePromoCodes,
    paymentsChart,
}: DashboardProps) {
    return (
        <AdminLayout>
            <Head title="Панель администратора" />

            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Панель администратора</h1>
                    <p className="text-muted-foreground mt-1">
                        Обзор системы подписок и платежей
                    </p>
                </div>

                {/* Основная статистика */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                MRR
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{mrr.toLocaleString('ru-RU')} ₽</div>
                            <p className="text-xs text-muted-foreground">
                                Месячный регулярный доход
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Активные подписки
                            </CardTitle>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{subscriptionStats.active}</div>
                            <p className="text-xs text-muted-foreground">
                                Из {subscriptionStats.total} всего
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Доход за 30 дней
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {paymentStats.total_revenue.toLocaleString('ru-RU')} ₽
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {paymentStats.total_payments} платежей
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Новые пользователи
                            </CardTitle>
                            <UserPlus className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{newUsers}</div>
                            <p className="text-xs text-muted-foreground">
                                За последние 30 дней
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Статистика подписок */}
                <div className="grid gap-4 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Статистика подписок</CardTitle>
                            <CardDescription>
                                Распределение по статусам
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                    <span className="text-sm">Активные</span>
                                </div>
                                <span className="font-semibold">{subscriptionStats.active}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm">Триальные</span>
                                </div>
                                <span className="font-semibold">{subscriptionStats.trial}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-orange-500" />
                                    <span className="text-sm">Отменённые</span>
                                </div>
                                <span className="font-semibold">{subscriptionStats.cancelled}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <XCircle className="h-4 w-4 text-red-500" />
                                    <span className="text-sm">Истёкшие</span>
                                </div>
                                <span className="font-semibold">{subscriptionStats.expired}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Быстрые действия</CardTitle>
                            <CardDescription>
                                Управление системой
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.visit(route('admin.subscriptions.index'))}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Управление подписками
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.visit(route('admin.promo-codes.index'))}
                            >
                                <Tag className="mr-2 h-4 w-4" />
                                Промокоды
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => router.visit(route('admin.users.index'))}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                Пользователи
                            </Button>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Активные промокоды</span>
                                    <span className="font-semibold">{activePromoCodes}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
