import { Head, Link, usePage, router } from '@inertiajs/react';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';

declare global {
    function route(name: string, params?: any): string;
}

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
    subscription: {
        plan: {
            name: string;
        };
    } | null;
}

interface Props {
    payments: {
        data: Payment[];
        links: any[];
        meta: any;
    };
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

export default function Index({ payments }: Props) {
    return (
        <AppSidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                <Head title="История платежей" />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <h1 className="text-2xl font-bold">История платежей</h1>
                        <Button variant="outline" asChild>
                            <Link href={route('subscriptions.index')}>
                                Управление подпиской
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Все платежи</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {payments.data.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    У вас пока нет платежей
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Дата</TableHead>
                                            <TableHead>Описание</TableHead>
                                            <TableHead>Сумма</TableHead>
                                            <TableHead>Статус</TableHead>
                                            <TableHead>Действия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.data.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell>
                                                    {new Date(payment.created_at).toLocaleDateString('ru-RU')}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">{payment.description}</div>
                                                        {payment.subscription && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {payment.subscription.plan.name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold">
                                                    {payment.amount} {payment.currency}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={statusVariants[payment.status]}>
                                                        {statusLabels[payment.status] || payment.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <Button variant="ghost" size="sm" asChild>
                                                        <Link href={`/payments/${payment.id}`}>
                                                            Детали
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}

                            {/* Pagination */}
                            {payments.links.length > 3 && (
                                <div className="flex justify-center gap-2 mt-4">
                                    {payments.links.map((link, index) => (
                                        <Button
                                            key={index}
                                            variant={link.active ? 'default' : 'outline'}
                                            size="sm"
                                            disabled={!link.url}
                                            asChild={!!link.url}
                                        >
                                            {link.url ? (
                                                <Link href={link.url}>
                                                    <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                                </Link>
                                            ) : (
                                                <span dangerouslySetInnerHTML={{ __html: link.label }} />
                                            )}
                                        </Button>
                                    ))}
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
