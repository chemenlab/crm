import { Head, Link, router, usePage } from '@inertiajs/react';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';

interface Payment {
    id: number;
    yookassa_payment_id: string;
    status: string;
    amount: number;
    currency: string;
    description: string;
    payment_method: string | null;
    created_at: string;
    paid_at: string | null;
    cancelled_at: string | null;
    subscription: {
        plan: {
            name: string;
        };
    } | null;
}

interface Props {
    payment: Payment;
}

const statusLabels: Record<string, string> = {
    pending: 'Ожидает оплаты',
    waiting_for_capture: 'Ожидает подтверждения',
    succeeded: 'Успешно',
    cancelled: 'Отменен',
    failed: 'Ошибка',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
    pending: 'secondary',
    waiting_for_capture: 'secondary',
    succeeded: 'default',
    cancelled: 'destructive',
    failed: 'destructive',
};

export default function Show({ payment }: Props) {
    return (
        <AppSidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                <Head title={`Платеж #${payment.id}`} />

            <div className="py-12">
                <div className="max-w-3xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Button variant="outline" asChild>
                            <Link href="/payments">
                                ← Назад к платежам
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div>
                                    <CardTitle>Платеж #{payment.id}</CardTitle>
                                    <CardDescription>
                                        {payment.description}
                                    </CardDescription>
                                </div>
                                <Badge variant={statusVariants[payment.status]}>
                                    {statusLabels[payment.status] || payment.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Payment Details */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Детали платежа</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Сумма</p>
                                        <p className="text-lg font-semibold">
                                            {payment.amount} {payment.currency}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Статус</p>
                                        <p className="text-lg">
                                            {statusLabels[payment.status] || payment.status}
                                        </p>
                                    </div>
                                    {payment.payment_method && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Способ оплаты</p>
                                            <p className="text-lg">{payment.payment_method}</p>
                                        </div>
                                    )}
                                    {payment.subscription && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Тариф</p>
                                            <p className="text-lg">{payment.subscription.plan.name}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Dates */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Даты</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Создан</p>
                                        <p>{new Date(payment.created_at).toLocaleString('ru-RU')}</p>
                                    </div>
                                    {payment.paid_at && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Оплачен</p>
                                            <p>{new Date(payment.paid_at).toLocaleString('ru-RU')}</p>
                                        </div>
                                    )}
                                    {payment.cancelled_at && (
                                        <div>
                                            <p className="text-sm text-muted-foreground">Отменен</p>
                                            <p>{new Date(payment.cancelled_at).toLocaleString('ru-RU')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* Technical Info */}
                            <div className="space-y-4">
                                <h3 className="font-semibold">Техническая информация</h3>
                                <div className="bg-muted p-4 rounded-lg">
                                    <p className="text-sm">
                                        <span className="text-muted-foreground">ID платежа YooKassa:</span>
                                        <br />
                                        <code className="text-xs">{payment.yookassa_payment_id}</code>
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            {payment.status === 'succeeded' && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => router.get(`/payments/${payment.id}/receipt`)}
                                    >
                                        Скачать квитанцию
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
            </SidebarInset>
        </AppSidebarProvider>
    );
}
