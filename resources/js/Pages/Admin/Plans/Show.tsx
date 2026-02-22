import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { ArrowLeft, Edit, Package, Users, TrendingUp, Check, X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    billing_period: string;
    is_active: boolean;
    max_appointments: number;
    max_clients: number;
    max_services: number;
    max_portfolio_images: number;
    max_tags: number;
    max_notifications_per_month: number;
    has_analytics: boolean;
    has_priority_support: boolean;
    has_custom_branding: boolean;
    trial_days: number | null;
    sort_order: number;
    created_at: string;
    subscriptions: Array<{
        id: number;
        status: string;
        user: {
            id: number;
            name: string;
            email: string;
        };
        created_at: string;
    }>;
}

interface Stats {
    total_subscriptions: number;
    active_subscriptions: number;
    trial_subscriptions: number;
    total_revenue: number;
}

export default function Show({ plan, stats }: { plan: Plan; stats: Stats }) {
    const getLimitLabel = (value: number) => {
        return value === -1 ? 'Безлимит' : value.toString();
    };

    const getBillingPeriodLabel = (period: string) => {
        return period === 'monthly' ? 'в месяц' : 'в год';
    };

    const getStatusBadge = (status: string) => {
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
            <Head title={`Тариф: ${plan.name}`} />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href={route('admin.plans.index')}>
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-bold">{plan.name}</h1>
                            <p className="text-muted-foreground">
                                Создан {format(new Date(plan.created_at), 'dd MMMM yyyy', { locale: ru })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? 'Активен' : 'Неактивен'}
                        </Badge>
                        <Link href={route('admin.plans.edit', plan.id)}>
                            <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Статистика */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Всего подписок
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_subscriptions}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Активных
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.active_subscriptions}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Пробных
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.trial_subscriptions}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Доход (потенциальный)
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_revenue} ₽</div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Основная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Основная информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm text-muted-foreground">Название</p>
                                <p className="font-medium">{plan.name}</p>
                            </div>
                            {plan.description && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Описание</p>
                                    <p className="font-medium">{plan.description}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Цена</p>
                                <p className="font-medium">
                                    {plan.price === 0 ? 'Бесплатно' : `${plan.price} ₽`}{' '}
                                    {getBillingPeriodLabel(plan.billing_period)}
                                </p>
                            </div>
                            {plan.trial_days && plan.trial_days > 0 && (
                                <div>
                                    <p className="text-sm text-muted-foreground">Пробный период</p>
                                    <p className="font-medium">{plan.trial_days} дней</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-muted-foreground">Slug</p>
                                <p className="font-medium font-mono text-sm">{plan.slug}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Порядок сортировки</p>
                                <p className="font-medium">{plan.sort_order}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Лимиты */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Лимиты</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Записи в месяц</span>
                                <span className="font-medium">{getLimitLabel(plan.max_appointments)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Клиенты</span>
                                <span className="font-medium">{getLimitLabel(plan.max_clients)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Услуги</span>
                                <span className="font-medium">{getLimitLabel(plan.max_services)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Изображения портфолио</span>
                                <span className="font-medium">{getLimitLabel(plan.max_portfolio_images)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Теги</span>
                                <span className="font-medium">{getLimitLabel(plan.max_tags)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Уведомления в месяц</span>
                                <span className="font-medium">{getLimitLabel(plan.max_notifications_per_month)}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Функции */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Дополнительные функции</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Аналитика</span>
                                {plan.has_analytics ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <X className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Приоритетная поддержка</span>
                                {plan.has_priority_support ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <X className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm">Кастомный брендинг</span>
                                {plan.has_custom_branding ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                ) : (
                                    <X className="h-5 w-5 text-muted-foreground" />
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Последние подписки */}
                {plan.subscriptions.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Последние подписки</CardTitle>
                            <CardDescription>
                                Показаны последние 10 подписок на этот тариф
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Пользователь</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Дата создания</TableHead>
                                        <TableHead className="text-right">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {plan.subscriptions.map((subscription) => (
                                        <TableRow key={subscription.id}>
                                            <TableCell className="font-medium">
                                                {subscription.user.name}
                                            </TableCell>
                                            <TableCell>{subscription.user.email}</TableCell>
                                            <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                                            <TableCell>
                                                {format(
                                                    new Date(subscription.created_at),
                                                    'dd.MM.yyyy',
                                                    { locale: ru }
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.visit(
                                                            route(
                                                                'admin.subscriptions.show',
                                                                subscription.id
                                                            )
                                                        )
                                                    }
                                                >
                                                    Просмотр
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AdminLayout>
    );
}
