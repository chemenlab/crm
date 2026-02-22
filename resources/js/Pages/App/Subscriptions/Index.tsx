import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Progress } from '@/Components/ui/progress';
import {
    Check,
    Zap,
    Crown,
    CreditCard,
    AlertTriangle,
    TrendingUp,
    Calendar,
    Users,
    Briefcase,
    Image,
    Tag,
    Bell,
    BarChart3,
    Palette,
    Shield,
    ArrowRight,
    Sparkles,
    ChevronRight,
    RefreshCw,
    Infinity,
} from 'lucide-react';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SubscriptionPlan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    formatted_price: string;
    billing_period: string;
    billing_period_label: string;
    features: {
        limits: {
            appointments: number;
            clients: number;
            services: number;
            portfolio_images: number;
            tags: number;
            notifications_per_month: number;
        };
        features: {
            analytics: boolean;
            priority_support: boolean;
            custom_branding: boolean;
            portfolio: boolean;
            online_booking: boolean;
            notifications: boolean;
            calendar: boolean;
        };
    };
    is_active: boolean;
    sort_order: number;
}

interface Subscription {
    id: number;
    status: string;
    trial_ends_at: string | null;
    current_period_start: string | null;
    current_period_end: string | null;
    auto_renew: boolean;
    plan: {
        id: number;
        name: string;
        slug: string;
        price: number;
        formatted_price: string;
    };
}

interface UsageStat {
    current: number;
    limit: number;
    remaining: number;
    percentage: number;
    unlimited: boolean;
    limit_reached: boolean;
}

interface Props {
    plans: SubscriptionPlan[];
    currentSubscription: Subscription | null;
    usageStats: Record<string, UsageStat>;
}

const resourceLabels: Record<string, string> = {
    appointments: 'Записи',
    clients: 'Клиенты',
    services: 'Услуги',
    portfolio_images: 'Фото',
    tags: 'Теги',
    notifications_per_month: 'Уведомления',
};

const resourceIcons: Record<string, React.ReactNode> = {
    appointments: <Calendar className="h-3.5 w-3.5" />,
    clients: <Users className="h-3.5 w-3.5" />,
    services: <Briefcase className="h-3.5 w-3.5" />,
    portfolio_images: <Image className="h-3.5 w-3.5" />,
    tags: <Tag className="h-3.5 w-3.5" />,
    notifications_per_month: <Bell className="h-3.5 w-3.5" />,
};

const getStatusConfig = (status: string) => {
    switch (status) {
        case 'active':
            return { label: 'Активна', className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 dark:text-emerald-400' };
        case 'trialing':
        case 'trial':
            return { label: 'Пробный период', className: 'bg-blue-500/10 text-blue-600 border-blue-500/30 dark:text-blue-400' };
        case 'cancelled':
            return { label: 'Отменена', className: 'bg-rose-500/10 text-rose-600 border-rose-500/30 dark:text-rose-400' };
        case 'past_due':
            return { label: 'Просрочена', className: 'bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400' };
        default:
            return { label: status, className: 'bg-muted text-muted-foreground' };
    }
};

const getPlanIcon = (slug: string) => {
    switch (slug) {
        case 'professional':
            return <Zap className="h-5 w-5" />;
        case 'maximum':
            return <Crown className="h-5 w-5" />;
        default:
            return <CreditCard className="h-5 w-5" />;
    }
};

const formatPrice = (price: number) => {
    if (price === 0) return '0';
    return Number.isInteger(price) ? price.toString() : Math.round(price).toString();
};

const formatLimit = (limit: number) => {
    if (limit === -1) return 'Безлимит';
    return limit.toString();
};

export default function Index({ plans, currentSubscription, usageStats }: Props) {
    const [cancelConfirm, setCancelConfirm] = useState(false);

    const statusConfig = currentSubscription ? getStatusConfig(currentSubscription.status) : null;

    const limitReachedCount = Object.values(usageStats).filter(s => s.limit_reached).length;

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <AppPageLayout title="Подписка и тарифы">
            <Head title="Подписка и тарифы" />

            <div className="flex flex-col gap-6 pb-8 max-w-[1400px] mx-auto w-full">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-1 px-1"
                >
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Подписка и тарифы
                    </h1>
                    <p className="text-muted-foreground text-sm sm:text-base">
                        Управляйте своим планом и следите за лимитами ресурсов
                    </p>
                </motion.div>

                {/* Current Subscription Banner */}
                {currentSubscription && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                            <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

                            <CardContent className="p-5 z-10 relative">
                                <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
                                    {/* Plan Info */}
                                    <div className="flex items-center gap-3 lg:min-w-[240px]">
                                        <div className="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20 flex-shrink-0">
                                            {getPlanIcon(currentSubscription.plan.slug)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-lg">{currentSubscription.plan.name}</span>
                                                {statusConfig && (
                                                    <Badge variant="outline" className={cn("text-xs", statusConfig.className)}>
                                                        {statusConfig.label}
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {currentSubscription.plan.price === 0 ? 'Бесплатный тариф' : `${formatPrice(currentSubscription.plan.price)} \u20BD / мес`}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Divider */}
                                    <div className="hidden lg:block w-px h-10 bg-border" />

                                    {/* Period + Details */}
                                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm flex-1">
                                        {currentSubscription.trial_ends_at && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                                                Пробный до <span className="font-medium text-foreground">{formatDate(currentSubscription.trial_ends_at)}</span>
                                            </div>
                                        )}
                                        {currentSubscription.current_period_end && !currentSubscription.trial_ends_at && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                                Списание <span className="font-medium text-foreground">{formatDate(currentSubscription.current_period_end)}</span>
                                            </div>
                                        )}
                                        {currentSubscription.auto_renew && (
                                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                                <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                                                Автопродление
                                            </div>
                                        )}
                                        {limitReachedCount > 0 && (
                                            <div className="flex items-center gap-1.5 text-rose-500 font-medium">
                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                {limitReachedCount} лимит достигнут
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button size="sm" asChild className="h-8 shadow-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all">
                                            <Link href={route('subscriptions.usage')}>
                                                <TrendingUp className="mr-1.5 h-3.5 w-3.5" />
                                                Статистика
                                            </Link>
                                        </Button>
                                        {currentSubscription.status === 'active' && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                                                onClick={() => setCancelConfirm(true)}
                                            >
                                                Отменить
                                            </Button>
                                        )}
                                        {currentSubscription.status === 'cancelled' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 text-emerald-600 hover:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800/30"
                                                onClick={() => router.post(route('subscriptions.resume'))}
                                            >
                                                Возобновить
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Usage Stats Row */}
                {currentSubscription && Object.keys(usageStats).length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                            <div className="absolute -left-4 -bottom-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

                            <CardHeader className="pb-3 pt-4 px-5">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                                        <BarChart3 className="h-4 w-4 text-primary" />
                                        Использование ресурсов
                                    </CardTitle>
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground hover:text-primary" asChild>
                                        <Link href={route('subscriptions.usage')}>
                                            Подробнее
                                            <ChevronRight className="ml-0.5 h-3 w-3" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent className="px-5 pb-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                    {Object.entries(usageStats).map(([resource, stats]) => (
                                        <div key={resource} className="space-y-1.5">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <span className={cn(
                                                    "text-primary",
                                                    stats.limit_reached && "text-rose-500",
                                                    stats.percentage >= 80 && !stats.limit_reached && !stats.unlimited && "text-amber-500"
                                                )}>
                                                    {resourceIcons[resource]}
                                                </span>
                                                {resourceLabels[resource] || resource}
                                            </div>
                                            {stats.unlimited ? (
                                                <div className="flex items-center gap-1 text-sm">
                                                    <Infinity className="h-3.5 w-3.5 text-emerald-500" />
                                                    <span className="font-medium text-emerald-600 text-xs">Безлимит</span>
                                                    {stats.current > 0 && (
                                                        <span className="text-muted-foreground text-xs ml-auto tabular-nums">{stats.current}</span>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="flex items-center justify-between text-xs">
                                                        <span className="font-semibold tabular-nums">{stats.current}</span>
                                                        <span className="text-muted-foreground">/ {stats.limit}</span>
                                                    </div>
                                                    <Progress
                                                        value={stats.percentage}
                                                        className={cn(
                                                            "h-1",
                                                            stats.limit_reached && "[&>div]:bg-rose-500",
                                                            stats.percentage >= 80 && !stats.limit_reached && "[&>div]:bg-amber-500"
                                                        )}
                                                    />
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Plans Section */}
                <div className="space-y-5">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                        className="text-center space-y-1"
                    >
                        <h2 className="text-xl font-bold tracking-tight">Выберите подходящий план</h2>
                        <p className="text-muted-foreground text-sm">Прозрачные тарифы без скрытых платежей</p>
                    </motion.div>

                    <div className="grid md:grid-cols-3 gap-5">
                        {plans.map((plan, index) => {
                            const isCurrent = currentSubscription?.plan.id === plan.id;
                            const isPremium = plan.slug === 'maximum';

                            return (
                                <motion.div
                                    key={plan.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                                    className="h-full"
                                >
                                    <Card className={cn(
                                        "relative flex flex-col h-full border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm transition-all duration-300 hover:shadow-xl",
                                        isCurrent && "ring-2 ring-primary shadow-primary/10",
                                        isPremium && "ring-1 ring-primary/40 shadow-xl bg-gradient-to-b from-primary/[0.03] to-transparent dark:from-primary/[0.07]"
                                    )}>
                                        {/* Decorative blur */}
                                        <div className={cn(
                                            "absolute -right-6 -top-6 h-24 w-24 rounded-full blur-3xl pointer-events-none",
                                            isPremium ? "bg-primary/10" : "bg-primary/5"
                                        )} />

                                        <CardHeader className="pb-4 pt-5">
                                            {/* Top row: icon + badge */}
                                            <div className="flex justify-between items-center mb-2">
                                                <div className={cn(
                                                    "rounded-full p-2 ring-1 ring-primary/20",
                                                    isPremium ? "bg-primary/15 text-primary" : "bg-primary/10 text-primary"
                                                )}>
                                                    {getPlanIcon(plan.slug)}
                                                </div>
                                                {isCurrent && (
                                                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs">
                                                        Текущий
                                                    </Badge>
                                                )}
                                                {isPremium && !isCurrent && (
                                                    <Badge className="bg-gradient-to-r from-primary to-emerald-500 text-white border-0 px-2.5 py-0.5 text-xs">
                                                        Популярный
                                                    </Badge>
                                                )}
                                            </div>

                                            <CardTitle className="text-lg font-bold">{plan.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1 min-h-[32px]">
                                                {plan.description}
                                            </CardDescription>

                                            {/* Price */}
                                            <div className="mt-3 flex items-baseline">
                                                {plan.price === 0 ? (
                                                    <span className="text-2xl font-extrabold tracking-tight">Бесплатно</span>
                                                ) : (
                                                    <>
                                                        <span className="text-2xl font-extrabold tracking-tight">
                                                            {formatPrice(plan.price)}
                                                        </span>
                                                        <span className="text-base font-bold ml-0.5">{'\u20BD'}</span>
                                                        <span className="text-muted-foreground text-xs ml-1">/ мес</span>
                                                    </>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="flex-1 pb-3 pt-0">
                                            {/* Limits - compact */}
                                            <div className="space-y-1.5">
                                                {[
                                                    { key: 'appointments', label: 'записей' },
                                                    { key: 'clients', label: 'клиентов' },
                                                    { key: 'services', label: 'услуг' },
                                                    { key: 'portfolio_images', label: 'фото' },
                                                    { key: 'tags', label: 'тегов' },
                                                    { key: 'notifications_per_month', label: 'уведомлений' },
                                                ].map(({ key, label }) => {
                                                    const val = plan.features.limits[key as keyof typeof plan.features.limits];
                                                    return (
                                                        <div key={key} className="flex items-center gap-2 text-sm">
                                                            <div className={cn(
                                                                "rounded-full p-0.5 flex-shrink-0",
                                                                val === -1
                                                                    ? "bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                                                                    : "bg-muted text-muted-foreground"
                                                            )}>
                                                                <Check className="h-2.5 w-2.5" />
                                                            </div>
                                                            <span className="text-xs">
                                                                <span className={cn("font-semibold", val === -1 && "text-emerald-600 dark:text-emerald-400")}>
                                                                    {formatLimit(val)}
                                                                </span>{' '}
                                                                <span className="text-muted-foreground">{label}</span>
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {/* Feature badges */}
                                            {(plan.features.features.analytics || plan.features.features.notifications || plan.features.features.custom_branding || plan.features.features.priority_support) && (
                                                <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t">
                                                    {plan.features.features.analytics && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                                                            <BarChart3 className="h-3 w-3" /> Аналитика
                                                        </span>
                                                    )}
                                                    {plan.features.features.notifications && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-orange-500/10 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                                                            <Bell className="h-3 w-3" /> Уведомления
                                                        </span>
                                                    )}
                                                    {plan.features.features.custom_branding && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                            <Palette className="h-3 w-3" /> Бренд
                                                        </span>
                                                    )}
                                                    {plan.features.features.priority_support && (
                                                        <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full">
                                                            <Shield className="h-3 w-3" /> Поддержка
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </CardContent>

                                        <CardFooter className="pt-2 pb-5 px-5">
                                            {!isCurrent ? (
                                                <Button
                                                    className={cn(
                                                        "w-full h-9 text-sm transition-all",
                                                        isPremium
                                                            ? "shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary hover:shadow-lg"
                                                            : "hover:bg-primary hover:text-primary-foreground"
                                                    )}
                                                    variant={isPremium ? 'default' : 'outline'}
                                                    asChild
                                                >
                                                    <Link href={route('subscriptions.checkout', plan.id)}>
                                                        Выбрать тариф
                                                        <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                                                    </Link>
                                                </Button>
                                            ) : (
                                                <Button className="w-full h-9 text-sm" variant="outline" disabled>
                                                    <Check className="mr-1.5 h-3.5 w-3.5" />
                                                    Текущий план
                                                </Button>
                                            )}
                                        </CardFooter>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <ConfirmDialog
                    open={cancelConfirm}
                    onOpenChange={setCancelConfirm}
                    onConfirm={() => {
                        router.post(route('subscriptions.cancel'), {}, {
                            onSuccess: () => setCancelConfirm(false),
                        });
                    }}
                    title="Отмена подписки"
                    description="Вы уверены, что хотите отменить подписку? Вы потеряете доступ к премиум функциям после окончания текущего периода."
                    confirmText="Да, отменить"
                />
            </div>
        </AppPageLayout>
    );
}
