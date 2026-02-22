import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { ArrowLeft, User, CreditCard, Calendar, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Payment {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
        phone: string | null;
    };
    subscription: {
        id: number;
        status: string;
        plan: {
            id: number;
            name: string;
            price: number;
            billing_period: string;
        };
        current_period_start: string;
        current_period_end: string;
    } | null;
    yookassa_payment_id: string | null;
    status: string;
    amount: number;
    currency: string;
    payment_method: string | null;
    description: string | null;
    metadata: Record<string, any> | null;
    paid_at: string | null;
    cancelled_at: string | null;
    expires_at: string | null;
    created_at: string;
}

export default function Show({ payment }: { payment: Payment }) {
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

    const getBillingPeriodLabel = (period: string) => {
        return period === 'monthly' ? 'в месяц' : 'в год';
    };

    return (
        <AdminLayout>
            <Head title={`Платеж #${payment.id}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.payments.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">Платеж #{payment.id}</h1>
                            <p className="text-muted-foreground">
                                Создан {format(new Date(payment.created_at), 'dd MMMM yyyy в HH:mm', { locale: ru })}
                            </p>
                        </div>
                    </div>
                    {getStatusBadge(payment.status)}
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Информация о платеже */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5" />
                                Информация о платеже
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Сумма</p>
                                <p className="text-2xl font-bold">
                                    {payment.amount.toLocaleString('ru-RU')} {payment.currency}
                                </p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Статус</p>
                                <div className="mt-1">
                                    {getStatusBadge(payment.status)}
                                </div>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Метод оплаты</p>
                                <p className="font-medium">
                                    {getPaymentMethodLabel(payment.payment_method)}
                                </p>
                            </div>

                            {payment.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Описание</p>
                                    <p className="font-medium">{payment.description}</p>
                                </div>
                            )}

                            {payment.yookassa_payment_id && (
                                <div>
                                    <p className="text-sm text-muted-foreground">ID транзакции YooKassa</p>
                                    <p className="font-mono text-sm">{payment.yookassa_payment_id}</p>
                                </div>
                            )}

                            <div className="pt-4 border-t space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Создан:</span>
                                    <span className="font-medium">
                                        {format(new Date(payment.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                    </span>
                                </div>

                                {payment.paid_at && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Оплачен:</span>
                                        <span className="font-medium">
                                            {format(new Date(payment.paid_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                        </span>
                                    </div>
                                )}

                                {payment.cancelled_at && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Отменен:</span>
                                        <span className="font-medium">
                                            {format(new Date(payment.cancelled_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                        </span>
                                    </div>
                                )}

                                {payment.expires_at && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Истекает:</span>
                                        <span className="font-medium">
                                            {format(new Date(payment.expires_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Информация о пользователе */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Информация о пользователе
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">Имя</p>
                                <p className="font-medium">{payment.user.name}</p>
                            </div>

                            <div>
                                <p className="text-sm text-muted-foreground">Email</p>
                                <p className="font-medium">{payment.user.email}</p>
                            </div>

                            {payment.user.phone && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Телефон</p>
                                    <p className="font-medium">{payment.user.phone}</p>
                                </div>
                            )}

                            <div className="pt-4">
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() =>
                                        router.visit(route('admin.users.show', payment.user.id))
                                    }
                                >
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Перейти к профилю
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Информация о подписке */}
                    {payment.subscription && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Информация о подписке</CardTitle>
                                <CardDescription>
                                    Подписка, за которую был произведен платеж
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Тарифный план</p>
                                            <p className="font-medium text-lg">
                                                {payment.subscription.plan.name}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Стоимость тарифа</p>
                                            <p className="font-medium">
                                                {payment.subscription.plan.price.toLocaleString('ru-RU')} ₽{' '}
                                                {getBillingPeriodLabel(payment.subscription.plan.billing_period)}
                                            </p>
                                        </div>

                                        <div>
                                            <p className="text-sm text-muted-foreground">Статус подписки</p>
                                            <div className="mt-1">
                                                <Badge
                                                    variant={
                                                        payment.subscription.status === 'active'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {payment.subscription.status === 'active'
                                                        ? 'Активна'
                                                        : payment.subscription.status === 'trial'
                                                        ? 'Пробная'
                                                        : payment.subscription.status === 'cancelled'
                                                        ? 'Отменена'
                                                        : 'Истекла'}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-sm text-muted-foreground">Период подписки</p>
                                            <p className="font-medium">
                                                {format(
                                                    new Date(payment.subscription.current_period_start),
                                                    'dd.MM.yyyy',
                                                    { locale: ru }
                                                )}{' '}
                                                —{' '}
                                                {format(
                                                    new Date(payment.subscription.current_period_end),
                                                    'dd.MM.yyyy',
                                                    { locale: ru }
                                                )}
                                            </p>
                                        </div>

                                        <div className="pt-4">
                                            <Button
                                                variant="outline"
                                                className="w-full"
                                                onClick={() =>
                                                    router.visit(
                                                        route(
                                                            'admin.subscriptions.show',
                                                            payment.subscription.id
                                                        )
                                                    )
                                                }
                                            >
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Перейти к подписке
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Metadata */}
                    {payment.metadata && Object.keys(payment.metadata).length > 0 && (
                        <Card className="md:col-span-2">
                            <CardHeader>
                                <CardTitle>Дополнительные данные</CardTitle>
                                <CardDescription>
                                    Метаданные, связанные с платежом
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                                    {JSON.stringify(payment.metadata, null, 2)}
                                </pre>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
