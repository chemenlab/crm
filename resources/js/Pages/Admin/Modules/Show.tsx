import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Separator } from '@/Components/ui/separator';
import {
    ArrowLeft,
    Edit,
    BarChart3,
    Users,
    Gift,
    AlertTriangle,
    Star,
    Download,
    DollarSign,
} from 'lucide-react';
import { useState } from 'react';

interface Module {
    slug: string;
    name: string;
    description: string | null;
    long_description: string | null;
    version: string;
    author: string | null;
    category: string | null;
    icon: string | null;
    screenshots: string[] | null;
    pricing_type: 'free' | 'subscription' | 'one_time';
    price: number;
    subscription_period: 'monthly' | 'yearly';
    min_plan: string | null;
    is_active: boolean;
    is_featured: boolean;
    installs_count: number;
    rating: number;
    created_at: string;
    updated_at: string;
}

interface ModuleStats {
    total_installs: number;
    active_users: number;
    total_purchases: number;
    total_revenue: number;
}

interface ErrorStats {
    total: number;
    today: number;
    types: Record<string, number>;
}

interface Props {
    module: Module;
    stats: ModuleStats;
    errorStats: ErrorStats;
}

export default function ModuleShow({ module, stats, errorStats = { total: 0, today: 0, types: {} } }: Props) {
    const [togglingStatus, setTogglingStatus] = useState(false);

    const handleToggleStatus = () => {
        setTogglingStatus(true);
        router.post(
            route('admin.modules.toggle-status', module.slug),
            { is_active: !module.is_active },
            {
                preserveState: true,
                onFinish: () => setTogglingStatus(false),
            }
        );
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

    const getPricingLabel = (type: string) => {
        const types: Record<string, string> = {
            free: 'Бесплатный',
            subscription: 'Подписка',
            one_time: 'Разовая покупка',
        };
        return types[type] || type;
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <AdminLayout>
            <Head title={module.name} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(route('admin.modules.index'))}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">{module.name}</h1>
                                {module.is_featured && (
                                    <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                                )}
                                <Badge variant={module.is_active ? 'default' : 'secondary'}>
                                    {module.is_active ? 'Активен' : 'Отключён'}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">
                                {module.slug} • v{module.version}
                                {module.author && ` • ${module.author}`}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Link href={route('admin.modules.edit', module.slug)}>
                            <Button variant="outline">
                                <Edit className="h-4 w-4 mr-2" />
                                Редактировать
                            </Button>
                        </Link>
                        <Link href={route('admin.modules.module-stats', module.slug)}>
                            <Button>
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Статистика
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Установки</CardTitle>
                            <Download className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_installs}</div>
                            <p className="text-xs text-muted-foreground">
                                {stats.active_users} активных
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Покупки</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total_purchases}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Доход</CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatCurrency(stats.total_revenue)}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ошибки</CardTitle>
                            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{errorStats.total}</div>
                            <p className="text-xs text-muted-foreground">
                                {errorStats.today} сегодня
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Module Info */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Информация о модуле</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {module.description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Краткое описание
                                        </h4>
                                        <p>{module.description}</p>
                                    </div>
                                )}

                                {module.long_description && (
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Полное описание
                                        </h4>
                                        <p className="whitespace-pre-wrap">{module.long_description}</p>
                                    </div>
                                )}

                                <Separator />

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Категория
                                        </h4>
                                        <Badge variant="outline">{getCategoryLabel(module.category)}</Badge>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Рейтинг
                                        </h4>
                                        {module.rating > 0 ? (
                                            <div className="flex items-center gap-1">
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                <span className="font-medium">{module.rating.toFixed(1)}</span>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Нет оценок</span>
                                        )}
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Создан
                                        </h4>
                                        <p>{formatDate(module.created_at)}</p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-muted-foreground mb-1">
                                            Обновлён
                                        </h4>
                                        <p>{formatDate(module.updated_at)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Screenshots */}
                        {module.screenshots && module.screenshots.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Скриншоты</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {module.screenshots.map((url, index) => (
                                            <a
                                                key={index}
                                                href={url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="block border rounded-lg overflow-hidden hover:ring-2 ring-primary transition-all"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Screenshot ${index + 1}`}
                                                    className="w-full h-40 object-cover"
                                                />
                                            </a>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Status Control */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Управление</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Глобальный статус</p>
                                        <p className="text-sm text-muted-foreground">
                                            {module.is_active ? 'Модуль доступен' : 'Модуль отключён'}
                                        </p>
                                    </div>
                                    <Switch
                                        checked={module.is_active}
                                        disabled={togglingStatus}
                                        onCheckedChange={handleToggleStatus}
                                    />
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Link href={route('admin.modules.users', module.slug)} className="block">
                                        <Button variant="outline" className="w-full justify-start">
                                            <Users className="h-4 w-4 mr-2" />
                                            Пользователи
                                        </Button>
                                    </Link>
                                    <Link href={route('admin.modules.grants', module.slug)} className="block">
                                        <Button variant="outline" className="w-full justify-start">
                                            <Gift className="h-4 w-4 mr-2" />
                                            Бесплатный доступ
                                        </Button>
                                    </Link>
                                    <Link href={route('admin.modules.module-error-logs', module.slug)} className="block">
                                        <Button variant="outline" className="w-full justify-start">
                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                            Логи ошибок
                                            {errorStats.today > 0 && (
                                                <Badge variant="destructive" className="ml-auto">
                                                    {errorStats.today}
                                                </Badge>
                                            )}
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Pricing Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Цена</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-muted-foreground">Тип</span>
                                    <Badge variant={module.pricing_type === 'free' ? 'secondary' : 'default'}>
                                        {getPricingLabel(module.pricing_type)}
                                    </Badge>
                                </div>

                                {module.pricing_type !== 'free' && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Стоимость</span>
                                        <span className="font-bold text-lg">
                                            {formatCurrency(module.price)}
                                            {module.pricing_type === 'subscription' && (
                                                <span className="text-sm font-normal text-muted-foreground">
                                                    /{module.subscription_period === 'monthly' ? 'мес' : 'год'}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                )}

                                {module.min_plan && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Мин. план</span>
                                        <Badge variant="outline">{module.min_plan}</Badge>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Error Types */}
                        {Object.keys(errorStats?.types || {}).length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle>Типы ошибок</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(errorStats?.types || {}).map(([type, count]) => (
                                            <div key={type} className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">{type}</span>
                                                <Badge variant="outline">{count}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
