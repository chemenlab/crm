import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
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
    Package,
    Download,
    DollarSign,
    Users,
    TrendingUp,
    TrendingDown,
    Activity,
} from 'lucide-react';

interface OverviewStats {
    total_modules: number;
    active_modules: number;
    total_installs: number;
    total_purchases: number;
    total_revenue: number;
    today: {
        installs: number;
        uninstalls: number;
        purchases: number;
        revenue: number;
    };
    this_month: {
        installs: number;
        uninstalls: number;
        purchases: number;
        revenue: number;
    };
}

interface TopModule {
    slug: string;
    name: string;
    category: string | null;
    installs_count?: number;
    total_revenue?: number;
    purchases_count?: number;
    pricing_type?: string;
    price?: number;
    rating?: number;
}

interface ChartDataPoint {
    date: string;
    installs: number;
    uninstalls: number;
    active_users: number;
    purchases: number;
    revenue: number;
}

interface Props {
    overview: OverviewStats;
    topByInstalls: TopModule[];
    topByRevenue: TopModule[];
    chartData: ChartDataPoint[];
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
    purchases: {
        label: 'Покупки',
        color: 'hsl(var(--chart-4))',
    },
    revenue: {
        label: 'Доход',
        color: 'hsl(var(--chart-5))',
    },
};

export default function ModuleStats({
    overview,
    topByInstalls = [],
    topByRevenue = [],
    chartData = [],
    period,
}: Props) {
    // Ensure nested objects have defaults
    const safeOverview = {
        ...overview,
        today: overview?.today || { installs: 0, uninstalls: 0, purchases: 0, revenue: 0 },
        this_month: overview?.this_month || { installs: 0, uninstalls: 0, purchases: 0, revenue: 0 },
    };
    const handlePeriodChange = (newPeriod: string) => {
        router.get(route('admin.modules.stats'), { period: newPeriod }, {
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

    return (
        <AdminLayout>
            <Head title="Статистика модулей" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Статистика модулей</h1>
                        <p className="text-muted-foreground mt-1">
                            Обзор использования и доходности модулей
                        </p>
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

                {/* Overview Stats Cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Всего модулей
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeOverview.total_modules}</div>
                            <p className="text-xs text-muted-foreground">
                                {safeOverview.active_modules} активных
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Всего установок
                            </CardTitle>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeOverview.total_installs}</div>
                            <div className="flex items-center text-xs">
                                {safeOverview.today.installs > 0 ? (
                                    <>
                                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                        <span className="text-green-500">+{safeOverview.today.installs}</span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">0 сегодня</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Всего покупок
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{safeOverview.total_purchases}</div>
                            <div className="flex items-center text-xs">
                                {safeOverview.this_month.purchases > 0 ? (
                                    <>
                                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                        <span className="text-green-500">+{safeOverview.this_month.purchases} за месяц</span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">0 за месяц</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">
                                Общий доход
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(safeOverview.total_revenue)}</div>
                            <div className="flex items-center text-xs">
                                {safeOverview.this_month.revenue > 0 ? (
                                    <>
                                        <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                        <span className="text-green-500">+{formatCurrency(safeOverview.this_month.revenue)} за месяц</span>
                                    </>
                                ) : (
                                    <span className="text-muted-foreground">0 за месяц</span>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Today Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>Статистика за сегодня</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                                    <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Установки</p>
                                    <p className="text-2xl font-bold">{safeOverview.today.installs}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900">
                                    <TrendingDown className="h-6 w-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Удаления</p>
                                    <p className="text-2xl font-bold">{safeOverview.today.uninstalls}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Покупки</p>
                                    <p className="text-2xl font-bold">{safeOverview.today.purchases}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                                    <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Доход</p>
                                    <p className="text-2xl font-bold">{formatCurrency(safeOverview.today.revenue)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Charts */}
                {chartData.length > 0 && (
                    <div className="grid gap-4 md:grid-cols-2">
                        {/* Installs Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Установки и удаления</CardTitle>
                                <CardDescription>Динамика за выбранный период</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="fillInstalls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-installs)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--color-installs)" stopOpacity={0.1} />
                                            </linearGradient>
                                            <linearGradient id="fillUninstalls" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--color-uninstalls)" stopOpacity={0.8} />
                                                <stop offset="95%" stopColor="var(--color-uninstalls)" stopOpacity={0.1} />
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
                                            fill="url(#fillInstalls)"
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="uninstalls"
                                            stroke="var(--color-uninstalls)"
                                            fill="url(#fillUninstalls)"
                                        />
                                    </AreaChart>
                                </ChartContainer>
                            </CardContent>
                        </Card>

                        {/* Revenue Chart */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Доход</CardTitle>
                                <CardDescription>Динамика дохода за выбранный период</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ChartContainer config={chartConfig} className="h-[250px] w-full">
                                    <BarChart data={chartData}>
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

                {/* Top Modules */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top by Installs */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Топ по установкам</CardTitle>
                            <CardDescription>Самые популярные модули</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topByInstalls.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Нет данных для отображения
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {topByInstalls.map((module, index) => (
                                        <div
                                            key={module.slug}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => router.visit(route('admin.modules.module-stats', module.slug))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{module.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {getCategoryLabel(module.category)}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Download className="h-4 w-4 text-muted-foreground" />
                                                <span className="font-semibold">{module.installs_count}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Top by Revenue */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Топ по доходу</CardTitle>
                            <CardDescription>Самые прибыльные модули</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topByRevenue.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">
                                    Нет данных для отображения
                                </p>
                            ) : (
                                <div className="space-y-4">
                                    {topByRevenue.map((module, index) => (
                                        <div
                                            key={module.slug}
                                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                            onClick={() => router.visit(route('admin.modules.module-stats', module.slug))}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900 font-bold text-green-600 dark:text-green-400 text-sm">
                                                    {index + 1}
                                                </div>
                                                <div>
                                                    <p className="font-medium">{module.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {module.purchases_count} покупок
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="h-4 w-4 text-green-500" />
                                                <span className="font-semibold text-green-600">
                                                    {formatCurrency(module.total_revenue || 0)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AdminLayout>
    );
}
