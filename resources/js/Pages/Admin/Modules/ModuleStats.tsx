import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from '@/Components/ui/chart';
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Bar,
    BarChart,
} from 'recharts';
import {
    ArrowLeft,
    Download,
    DollarSign,
    Users,
    TrendingUp,
    Activity,
    Star,
    Calendar,
    CreditCard,
} from 'lucide-react';

interface ModuleInfo {
    slug: string;
    name: string;
    category: string | null;
    pricing_type: string;
    price: number;
    rating: number;
}

interface CurrentStats {
    installs: number;
    total_installs: number;
    active_users: number;
    active_subscriptions: number;
}

interface TotalStats {
    purchases: number;
    revenue: number;
}

interface PeriodStats {
    from: string;
    to: string;
    installs: number;
    uninstalls: number;
    purchases: number;
    revenue: number;
    avg_active_users: number;
}

interface ChartDataPoint {
    date: string;
    installs: number;
    uninstalls: number;
    active_users: number;
    purchases: number;
    revenue: number;
}

interface ModuleStats {
    module: ModuleInfo;
    current: CurrentStats;
    totals: TotalStats;
    period: PeriodStats;
    chart: ChartDataPoint[];
}

interface ModuleUser {
    user_id: number;
    user_name: string | null;
    user_email: string | null;
    user_avatar: string | null;
    is_enabled: boolean;
    enabled_at: string | null;
    disabled_at: string | null;
    last_used_at: string | null;
    usage_count: number;
}

interface ModulePurchase {
    id: number;
    user_id: number;
    user_name: string | null;
    user_email: string | null;
    price: number;
    currency: string;
    pricing_type: string;
    status: string;
    purchased_at: string | null;
    expires_at: string | null;
    auto_renew: boolean;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Props {
    stats: ModuleStats;
    users: PaginatedData<ModuleUser>;
    purchaseHistory: PaginatedData<ModulePurchase>;
    period: string;
}

const chartConfig: ChartConfig = {
    installs: {
        label: 'Установки',
        color: 'hsl(var(--chart-1))',
    },
    uninstalls: {
        label: 'Удаления',
        color: 'hsl(var(--chart-2))',
    },
    active_users: {
        label: 'Активные',
        color: 'hsl(var(--chart-3))',
    },
    revenue: {
        label: 'Доход',
        color: 'hsl(var(--chart-5))',
    },
};

export default function ModuleStatsPage({
    stats,
    users,
    purchaseHistory,
    period,
}: Props) {
    const handlePeriodChange = (newPeriod: string) => {
        router.get(route('admin.modules.module-stats', stats.module.slug), { period: newPeriod }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '—';
        return new Date(dateString).toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getCategoryLabel = (category: string | null) => {
        const categories: Record<string, string> = {
            finance: 'Финансы',
            marketing: 'Маркетинг',
            communication: 'Коммуникации',
            analytics: 'Аналитика',
            productivity: 'Продуктивность',
            integration: 'Интеграции',
            other: 'Другое',
        };
        return category ? categories[category] || category : 'Без категории';
    };

    const getPricingLabel = (pricingType: string) => {
        const types: Record<string, string> = {
            free: 'Бесплатный',
            subscription: 'Подписка',
            one_time: 'Разовая покупка',
        };
        return types[pricingType] || pricingType;
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            completed: 'default',
            pending: 'secondary',
            failed: 'destructive',
            refunded: 'outline',
            cancelled: 'outline',
        };
        const labels: Record<string, string> = {
            completed: 'Оплачен',
            pending: 'Ожидает',
            failed: 'Ошибка',
            refunded: 'Возврат',
            cancelled: 'Отменён',
        };
        return (
            <Badge variant={variants[status] || 'secondary'}>
                {labels[status] || status}
            </Badge>
        );
    };

    const getUserInitials = (name: string | null, email: string | null) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return '?';
    };

    return (
        <AdminLayout>
            <Head title={`Статистика: ${stats.module.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(route('admin.modules.stats'))}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{stats.module.name}</h1>
                                <Badge variant="outline">{getCategoryLabel(stats.module.category)}</Badge>
                                <Badge variant={stats.module.pricing_type === 'free' ? 'secondary' : 'default'}>
                                    {getPricingLabel(stats.module.pricing_type)}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                {stats.module.pricing_type !== 'free' && (
                                    <span>{formatCurrency(stats.module.price)}</span>
                                )}
                                {stats.module.rating > 0 && (
                                    <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                        {stats.module.rating.toFixed(1)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <Select value={period} onValueChange={handlePeriodChange}>
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Выберите период" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="day">Сегодня</SelectItem>
                            <SelectItem value="week">Неделя</SelectItem>
                            <SelectItem value="month">Месяц</SelectItem>
                            <SelectItem value="year">Год</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Текущие установки</CardTitle>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.current.installs}</div>
                            <p className="text-xs text-muted-foreground">
                                Всего: {stats.current.total_installs}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Активные пользователи</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.current.active_users}</div>
                            <p className="text-xs text-muted-foreground">
                                За последние 7 дней
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Всего покупок</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totals.purchases}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.current.active_subscriptions} активных подписок
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Общий доход</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.totals.revenue)}</div>
                            <p className="text-xs text-muted-foreground">
                                +{formatCurrency(stats.period.revenue)} за период
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Period Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Статистика за период</CardTitle>
                        <CardDescription>
                            {formatDate(stats.period.from)} — {formatDate(stats.period.to)}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                                    <TrendingUp className="h-5 w-5 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Установки</p>
                                    <p className="text-xl font-bold">{stats.period.installs}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                                    <Download className="h-5 w-5 text-red-600 dark:text-red-400 rotate-180" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Удаления</p>
                                    <p className="text-xl font-bold">{stats.period.uninstalls}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                    <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Ср. активных</p>
                                    <p className="text-xl font-bold">{stats.period.avg_active_users}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                                    <CreditCard className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Покупки</p>
                                    <p className="text-xl font-bold">{stats.period.purchases}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900">
                                    <DollarSign className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Доход</p>
                                    <p className="text-xl font-bold">{formatCurrency(stats.period.revenue)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Charts */}
                {stats.chart.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Installs Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Установки</CardTitle>
                                <CardDescription>Динамика установок и удалений</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <AreaChart data={stats.chart}>
                                        <defs>
                                            <linearGradient id="fillModuleInstalls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-installs)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--color-installs)" stopOpacity={0.1} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                                            }}
                                        />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) => {
                                                        return new Date(value).toLocaleDateString('ru-RU', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        });
                                                    }}
                                                />
                                            }
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="installs"
                                            stroke="var(--color-installs)"
                                            fill="url(#fillModuleInstalls)"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Доход</CardTitle>
                                <CardDescription>Динамика дохода за период</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <BarChart data={stats.chart}>
                                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="date"
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tickFormatter={(value) => {
                                                const date = new Date(value);
                                                return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                                            }}
                                        />
                                        <YAxis
                                            tickLine={false}
                                            axisLine={false}
                                            tickMargin={8}
                                            tickFormatter={(value) => `${value}₽`}
                                        />
                                        <ChartTooltip
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) => {
                                                        return new Date(value).toLocaleDateString('ru-RU', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        });
                                                    }}
                                                    formatter={(value) => formatCurrency(value as number)}
                                                />
                                            }
                                        />
                                        <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Users Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Пользователи модуля</CardTitle>
                            <CardDescription>
                                Всего: {users.total} пользователей
                            </CardDescription>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(route('admin.modules.users', stats.module.slug))}
                        >
                            Все пользователи
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {users.data.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Нет пользователей
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Пользователь</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Включён</TableHead>
                                        <TableHead>Последнее использование</TableHead>
                                        <TableHead className="text-right">Использований</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.data.slice(0, 10).map((user) => (
                                        <TableRow key={user.user_id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user.user_avatar || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {getUserInitials(user.user_name, user.user_email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{user.user_name || 'Без имени'}</p>
                                                        <p className="text-xs text-muted-foreground">{user.user_email}</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={user.is_enabled ? 'default' : 'secondary'}>
                                                    {user.is_enabled ? 'Активен' : 'Отключён'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">{formatDate(user.enabled_at)}</TableCell>
                                            <TableCell className="text-sm">{formatDate(user.last_used_at)}</TableCell>
                                            <TableCell className="text-right font-medium">{user.usage_count}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Purchase History Table */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>История покупок</CardTitle>
                            <CardDescription>
                                Всего: {purchaseHistory.total} покупок
                            </CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {purchaseHistory.data.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                Нет покупок
                            </p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Пользователь</TableHead>
                                        <TableHead>Тип</TableHead>
                                        <TableHead>Сумма</TableHead>
                                        <TableHead>Статус</TableHead>
                                        <TableHead>Дата покупки</TableHead>
                                        <TableHead>Истекает</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {purchaseHistory.data.slice(0, 10).map((purchase) => (
                                        <TableRow key={purchase.id}>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium text-sm">{purchase.user_name || 'Без имени'}</p>
                                                    <p className="text-xs text-muted-foreground">{purchase.user_email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getPricingLabel(purchase.pricing_type)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {formatCurrency(purchase.price)}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(purchase.status)}</TableCell>
                                            <TableCell className="text-sm">{formatDateTime(purchase.purchased_at)}</TableCell>
                                            <TableCell className="text-sm">
                                                {purchase.expires_at ? (
                                                    <div className="flex items-center gap-1">
                                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                                        {formatDate(purchase.expires_at)}
                                                        {purchase.auto_renew && (
                                                            <Badge variant="outline" className="ml-1 text-xs">
                                                                Авто
                                                            </Badge>
                                                        )}
                                                    </div>
                                                ) : (
                                                    '—'
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
