import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { ArrowLeft, User, Mail, Calendar, Package, CreditCard, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';

interface UserData {
    id: number;
    name: string;
    email: string;
    created_at: string;
    subscription?: {
        id: number;
        status: string;
        current_period_start: string;
        current_period_end: string;
        plan: {
            name: string;
            price: number;
        };
    };
    payments: Array<{
        id: number;
        amount: number;
        status: string;
        created_at: string;
    }>;
    usage_stats: {
        total_appointments: number;
        total_clients: number;
        total_services: number;
    };
}

export default function Show({ user }: { user: UserData }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = () => {
        router.delete(route('admin.users.destroy', user.id), {
            onSuccess: () => setShowDeleteDialog(false),
        });
    };

    const getSubscriptionBadge = (status?: string) => {
        if (!status) return <Badge variant="outline">Нет подписки</Badge>;

        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            trial: 'secondary',
            cancelled: 'destructive',
            expired: 'outline',
        };

        const labels: Record<string, string> = {
            active: 'Активна',
            trial: 'Пробная',
            cancelled: 'Отменена',
            expired: 'Истекла',
        };

        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    };

    return (
        <AdminLayout>
            <Head title={`Пользователь: ${user.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.users.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">{user.name}</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('admin.users.edit', user.id)}>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                            </Button>
                        </Link>
                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Удалить
                        </Button>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Основная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Основная информация
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email
                                </p>
                                <p className="font-medium">{user.email}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground flex items-center gap-2">
                                    <Calendar className="h-4 w-4" />
                                    Дата регистрации
                                </p>
                                <p className="font-medium">
                                    {format(new Date(user.created_at), 'dd MMMM yyyy', { locale: ru })}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Подписка */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Подписка
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {user.subscription ? (
                                <>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Статус</p>
                                        <div className="mt-1">{getSubscriptionBadge(user.subscription.status)}</div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Тариф</p>
                                        <p className="font-medium">{user.subscription.plan.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Стоимость</p>
                                        <p className="font-medium">{user.subscription.plan.price}₽ / месяц</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Период</p>
                                        <p className="font-medium">
                                            {format(new Date(user.subscription.current_period_start), 'dd.MM.yyyy', { locale: ru })} -{' '}
                                            {format(new Date(user.subscription.current_period_end), 'dd.MM.yyyy', { locale: ru })}
                                        </p>
                                    </div>
                                    <Link href={route('admin.subscriptions.show', user.subscription.id)}>
                                        <Button variant="outline" size="sm" className="w-full mt-2">
                                            Подробнее о подписке
                                        </Button>
                                    </Link>
                                </>
                            ) : (
                                <p className="text-muted-foreground">У пользователя нет активной подписки</p>
                            )}
                        </CardContent>
                    </Card>

                    {/* Статистика использования */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Статистика
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Всего записей</span>
                                <span className="font-medium">{user.usage_stats.total_appointments}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Клиентов</span>
                                <span className="font-medium">{user.usage_stats.total_clients}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Услуг</span>
                                <span className="font-medium">{user.usage_stats.total_services}</span>
                            </div>
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
                            Всего платежей: {user.payments.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {user.payments.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Статус</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {user.payments.map((payment) => (
                                        <TableRow key={payment.id}>
                                            <TableCell>#{payment.id}</TableCell>
                                            <TableCell>
                                                {format(new Date(payment.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                            </TableCell>
                                            <TableCell>{payment.amount}₽</TableCell>
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
            </div>

            {/* Диалог подтверждения удаления */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Удалить пользователя?</DialogTitle>
                        <DialogDescription>
                            Вы уверены, что хотите удалить пользователя {user.name}? Это действие нельзя отменить.
                            Все активные подписки будут отменены.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Отмена
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}>
                            Удалить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
