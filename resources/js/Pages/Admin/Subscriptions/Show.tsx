import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { ArrowLeft, Calendar, CreditCard, User, Package, TrendingUp, Edit } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Subscription {
    id: number;
    status: string;
    trial_ends_at: string | null;
    current_period_start: string;
    current_period_end: string;
    cancelled_at: string | null;
    created_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    plan: {
        id: number;
        name: string;
        price: number;
        billing_period: string;
    };
    payments: Array<{
        id: number;
        amount: number;
        status: string;
        payment_method: string;
        created_at: string;
    }>;
}

interface UsageStats {
    [key: string]: Array<{
        resource_type: string;
        usage_count: number;
        period_start: string;
        period_end: string;
    }>;
}

export default function Show({ subscription, usageStats }: { subscription: Subscription; usageStats: UsageStats }) {
    const [cancelReason, setCancelReason] = useState('');
    const [extendDays, setExtendDays] = useState('30');
    const [extendReason, setExtendReason] = useState('');
    const [newPlanId, setNewPlanId] = useState('');
    const [changePlanReason, setChangePlanReason] = useState('');

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            trial: 'secondary',
            cancelled: 'destructive',
            expired: 'outline',
            past_due: 'destructive',
        };

        const labels: Record<string, string> = {
            active: 'Активна',
            trial: 'Пробная',
            cancelled: 'Отменена',
            expired: 'Истекла',
            past_due: 'Просрочена',
        };

        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    };

    const handleCancel = () => {
        router.post(route('admin.subscriptions.cancel', subscription.id), {
            reason: cancelReason,
        });
    };

    const handleExtend = () => {
        router.post(route('admin.subscriptions.extend', subscription.id), {
            days: parseInt(extendDays),
            reason: extendReason,
        });
    };

    return (
        <AdminLayout>
            <Head title={`Подписка #${subscription.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.subscriptions.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Подписка #{subscription.id}</h1>
                            <p className="text-muted-foreground">
                                Создана {format(new Date(subscription.created_at), 'dd MMMM yyyy', { locale: ru })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {getStatusBadge(subscription.status)}
                        <Link href={route('admin.subscriptions.edit', subscription.id)}>
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                            </Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Информация о пользователе */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Пользователь
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Имя</p>
                                <p className="font-medium">{subscription.user.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{subscription.user.email}</p>
                            </div>
                            <Link href={route('admin.users.show', subscription.user.id)}>
                                <Button variant="outline" size="sm" className="mt-2">
                                    Профиль пользователя
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Информация о тарифе */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Тарифный план
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Название</p>
                                <p className="font-medium">{subscription.plan.name}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Стоимость</p>
                                <p className="font-medium">{subscription.plan.price}₽ / {subscription.plan.billing_period === 'monthly' ? 'месяц' : 'год'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Период подписки */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                Период подписки
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div>
                                <p className="text-sm text-muted-foreground">Начало периода</p>
                                <p className="font-medium">
                                    {format(new Date(subscription.current_period_start), 'dd MMMM yyyy', { locale: ru })}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Конец периода</p>
                                <p className="font-medium">
                                    {format(new Date(subscription.current_period_end), 'dd MMMM yyyy', { locale: ru })}
                                </p>
                            </div>
                            {subscription.trial_ends_at && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Пробный период до</p>
                                    <p className="font-medium">
                                        {format(new Date(subscription.trial_ends_at), 'dd MMMM yyyy', { locale: ru })}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Действия */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Управление</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {subscription.status === 'active' && (
                                <>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" className="w-full">
                                                Продлить подписку
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Продлить подписку</DialogTitle>
                                                <DialogDescription>
                                                    Укажите количество дней для продления
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="space-y-4">
                                                <div>
                                                    <Label htmlFor="days">Количество дней</Label>
                                                    <Input
                                                        id="days"
                                                        type="number"
                                                        value={extendDays}
                                                        onChange={(e) => setExtendDays(e.target.value)}
                                                        min="1"
                                                        max="365"
                                                    />
                                                </div>
                                                <div>
                                                    <Label htmlFor="extend-reason">Причина (необязательно)</Label>
                                                    <Textarea
                                                        id="extend-reason"
                                                        value={extendReason}
                                                        onChange={(e) => setExtendReason(e.target.value)}
                                                        placeholder="Укажите причину продления..."
                                                    />
                                                </div>
                                            </div>
                                            <DialogFooter>
                                                <Button onClick={handleExtend}>Продлить</Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>

                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="destructive" className="w-full">
                                                Отменить подписку
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader>
                                                <DialogTitle>Отменить подписку</DialogTitle>
                                                <DialogDescription>
                                                    Вы уверены, что хотите отменить эту подписку?
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div>
                                                <Label htmlFor="cancel-reason">Причина (необязательно)</Label>
                                                <Textarea
                                                    id="cancel-reason"
                                                    value={cancelReason}
                                                    onChange={(e) => setCancelReason(e.target.value)}
                                                    placeholder="Укажите причину отмены..."
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button variant="destructive" onClick={handleCancel}>
                                                    Отменить подписку
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* История платежей */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5" />
                            История платежей
                        </CardTitle>
                        <CardDescription>
                            Всего платежей: {subscription.payments.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {subscription.payments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Способ оплаты</TableHead>
                                        <TableHead>Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {subscription.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>#{payment.id}</TableCell>
                                            <TableCell>
                                                {format(new Date(payment.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                            </TableCell>
                                            <TableCell>{payment.amount}₽</TableCell>
                                            <TableCell>{payment.payment_method}</TableCell>
                                            <TableCell>
                                                <Badge variant={payment.status === 'succeeded' ? 'default' : 'destructive'}>
                                                    {payment.status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">Платежей пока нет</p>
                        )}
                    </CardContent>
                </Card>

                {/* Статистика использования */}
                {Object.keys(usageStats).length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Статистика использования
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {Object.entries(usageStats).map(([type, stats]) => (
                                    <div key={type}>
                                        <h4 className="font-medium mb-2">{type}</h4>
                                        <div className="grid gap-2">
                                            {stats.map((stat, index) => (
                                                <div key={index} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">
                                                        {format(new Date(stat.period_start), 'dd.MM.yyyy', { locale: ru })} -{' '}
                                                        {format(new Date(stat.period_end), 'dd.MM.yyyy', { locale: ru })}
                                                    </span>
                                                    <span className="font-medium">{stat.usage_count}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
