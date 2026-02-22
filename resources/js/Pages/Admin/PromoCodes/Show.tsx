import { Head, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { ArrowLeft, Tag, TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PromoCode {
    id: number;
    code: string;
    type: string;
    value: number;
    is_active: boolean;
    used_count: number;
    max_uses: number | null;
    valid_from: string | null;
    valid_until: string | null;
    first_payment_only: boolean;
    created_at: string;
    plan?: {
        name: string;
    };
    usages: Array<{
        id: number;
        user: {
            id: number;
            name: string;
            email: string;
        };
        subscription: {
            id: number;
            status: string;
        };
        created_at: string;
    }>;
}

export default function Show({ promoCode }: { promoCode: PromoCode }) {
    const getTypeBadge = (type: string) => {
        const labels: Record<string, string> = {
            percentage: 'Процент',
            fixed: 'Фиксированная',
            trial_extension: 'Продление пробного',
        };

        return <Badge variant="secondary">{labels[type]}</Badge>;
    };

    const getStatusBadge = (isActive: boolean, validUntil: string | null) => {
        if (!isActive) {
            return <Badge variant="destructive">Неактивен</Badge>;
        }

        if (validUntil && new Date(validUntil) < new Date()) {
            return <Badge variant="outline">Истек</Badge>;
        }

        return <Badge variant="default">Активен</Badge>;
    };

    const getValueDisplay = () => {
        if (promoCode.type === 'percentage') {
            return `${promoCode.value}%`;
        } else if (promoCode.type === 'fixed') {
            return `${promoCode.value}₽`;
        } else {
            return `${promoCode.value} дней`;
        }
    };

    return (
        <AdminLayout>
            <Head title={`Промокод: ${promoCode.code}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.promo-codes.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold font-mono">{promoCode.code}</h1>
                            <p className="text-muted-foreground">
                                Создан {format(new Date(promoCode.created_at), 'dd MMMM yyyy', { locale: ru })}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {getStatusBadge(promoCode.is_active, promoCode.valid_until)}
                        <Link href={route('admin.promo-codes.edit', promoCode.id)}>
                            <Button variant="outline">Редактировать</Button>
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Основная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="h-5 w-5" />
                                Основная информация
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Тип скидки</p>
                                <div className="mt-1">{getTypeBadge(promoCode.type)}</div>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Значение</p>
                                <p className="font-medium text-lg">{getValueDisplay()}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Тарифный план</p>
                                <p className="font-medium">{promoCode.plan?.name || 'Все тарифы'}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Только для первого платежа</p>
                                <p className="font-medium">{promoCode.first_payment_only ? 'Да' : 'Нет'}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Статистика использования */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Статистика использования
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Использовано</p>
                                <p className="font-medium text-2xl">
                                    {promoCode.used_count}
                                    {promoCode.max_uses && (
                                        <span className="text-base text-muted-foreground"> / {promoCode.max_uses}</span>
                                    )}
                                </p>
                            </div>
                            {promoCode.max_uses && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Осталось использований</p>
                                    <p className="font-medium text-lg">
                                        {Math.max(0, promoCode.max_uses - promoCode.used_count)}
                                    </p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Действует с</p>
                                <p className="font-medium">
                                    {promoCode.valid_from
                                        ? format(new Date(promoCode.valid_from), 'dd MMMM yyyy', { locale: ru })
                                        : 'Без ограничений'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Действует до</p>
                                <p className="font-medium">
                                    {promoCode.valid_until
                                        ? format(new Date(promoCode.valid_until), 'dd MMMM yyyy', { locale: ru })
                                        : 'Без ограничений'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* История использования */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            История использования
                        </CardTitle>
                        <CardDescription>
                            Всего использований: {promoCode.usages.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {promoCode.usages.length > 0 ? (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Дата</TableHead>
                                        <TableHead>Пользователь</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Статус подписки</TableHead>
                                        <TableHead className="text-right">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {promoCode.usages.map((usage) => (
                                        <TableRow key={usage.id}>
                                            <TableCell>
                                                {format(new Date(usage.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                                            </TableCell>
                                            <TableCell className="font-medium">{usage.user.name}</TableCell>
                                            <TableCell>{usage.user.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={
                                                        usage.subscription.status === 'active'
                                                            ? 'default'
                                                            : 'secondary'
                                                    }
                                                >
                                                    {usage.subscription.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('admin.users.show', usage.user.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            Пользователь
                                                        </Button>
                                                    </Link>
                                                    <Link href={route('admin.subscriptions.show', usage.subscription.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            Подписка
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        ) : (
                            <p className="text-center text-muted-foreground py-8">
                                Промокод еще не использовался
                            </p>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
