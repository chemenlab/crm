import { Head, Link } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import { Badge } from '@/Components/ui/badge';
import {
    AlertTriangle,
    TrendingUp,
    CheckCircle,
    XCircle,
    ArrowLeft,
    Calendar,
    Users,
    Briefcase,
    Image,
    Tag,
    Bell,
    ArrowRight,
    Infinity,
    ChevronRight,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

declare global {
    function route(name: string, params?: any): string;
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
    subscription: {
        id: number;
        status: string;
        plan: {
            id: number;
            name: string;
            slug: string;
            price: number;
        };
    } | null;
    usageStats: Record<string, UsageStat>;
}

const resourceLabels: Record<string, string> = {
    appointments: 'Записи',
    clients: 'Клиенты',
    services: 'Услуги',
    portfolio_images: 'Фото портфолио',
    tags: 'Теги',
    notifications_per_month: 'Уведомления',
};

const resourceDescriptions: Record<string, string> = {
    appointments: 'Количество записей в текущем месяце',
    clients: 'Общее количество клиентов в базе',
    services: 'Количество созданных услуг',
    portfolio_images: 'Фотографии в портфолио',
    tags: 'Теги для организации данных',
    notifications_per_month: 'Отправленных уведомлений в месяц',
};

const resourceIcons: Record<string, React.ReactNode> = {
    appointments: <Calendar className="h-5 w-5" />,
    clients: <Users className="h-5 w-5" />,
    services: <Briefcase className="h-5 w-5" />,
    portfolio_images: <Image className="h-5 w-5" />,
    tags: <Tag className="h-5 w-5" />,
    notifications_per_month: <Bell className="h-5 w-5" />,
};

const getResourceColor = (resource: string) => {
    const colors: Record<string, string> = {
        appointments: 'text-blue-500',
        clients: 'text-violet-500',
        services: 'text-orange-500',
        portfolio_images: 'text-pink-500',
        tags: 'text-cyan-500',
        notifications_per_month: 'text-amber-500',
    };
    return colors[resource] || 'text-primary';
};

const getResourceBg = (resource: string) => {
    const colors: Record<string, string> = {
        appointments: 'bg-blue-500/10',
        clients: 'bg-violet-500/10',
        services: 'bg-orange-500/10',
        portfolio_images: 'bg-pink-500/10',
        tags: 'bg-cyan-500/10',
        notifications_per_month: 'bg-amber-500/10',
    };
    return colors[resource] || 'bg-primary/10';
};

export default function Usage({ subscription, usageStats }: Props) {
    const limitReachedCount = Object.values(usageStats).filter(s => s.limit_reached).length;
    const warningCount = Object.values(usageStats).filter(s => s.percentage >= 80 && !s.limit_reached && !s.unlimited).length;
    const healthyCount = Object.values(usageStats).filter(s => !s.limit_reached && s.percentage < 80 && !s.unlimited).length;
    const unlimitedCount = Object.values(usageStats).filter(s => s.unlimited).length;

    // Overall usage percentage (excluding unlimited)
    const limitedStats = Object.values(usageStats).filter(s => !s.unlimited);
    const overallPercentage = limitedStats.length > 0
        ? Math.round(limitedStats.reduce((acc, s) => acc + s.percentage, 0) / limitedStats.length)
        : 0;

    const radius = 44;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (overallPercentage / 100) * circumference;

    const getOverallColor = () => {
        if (overallPercentage >= 90) return 'text-rose-500';
        if (overallPercentage >= 70) return 'text-amber-500';
        return 'text-primary';
    };

    const getOverallLabel = () => {
        if (overallPercentage >= 90) return 'Критично';
        if (overallPercentage >= 70) return 'Внимание';
        return 'В норме';
    };

    return (
        <AppPageLayout title="Статистика использования">
            <Head title="Статистика использования" />

            <div className="flex flex-col gap-6 pb-8 max-w-[1400px] mx-auto w-full">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1"
                >
                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="icon" asChild className="rounded-full h-9 w-9 hover:bg-accent/50">
                            <Link href={route('subscriptions.index')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Статистика использования
                            </h1>
                            {subscription && (
                                <p className="text-muted-foreground text-sm sm:text-base">
                                    Тариф: <span className="font-medium text-foreground">{subscription.plan.name}</span>
                                </p>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Summary Row - flat grid */}
                <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
                    {/* Overall Progress Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                        className="col-span-2 lg:col-span-1"
                    >
                        <Card className="h-full border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                            <div className="absolute top-0 right-0 h-24 w-24 bg-primary/5 rounded-bl-full -mr-6 -mt-6 blur-2xl pointer-events-none" />

                            <CardContent className="flex flex-col items-center justify-center p-5 z-10 relative">
                                <div className="relative flex items-center justify-center">
                                    <svg className="transform -rotate-90 w-28 h-28">
                                        <circle
                                            cx="56"
                                            cy="56"
                                            r={radius}
                                            stroke="currentColor"
                                            strokeWidth="7"
                                            fill="transparent"
                                            className="text-muted/20"
                                        />
                                        <circle
                                            cx="56"
                                            cy="56"
                                            r={radius}
                                            stroke="currentColor"
                                            strokeWidth="7"
                                            fill="transparent"
                                            strokeDasharray={circumference}
                                            strokeDashoffset={strokeDashoffset}
                                            strokeLinecap="round"
                                            className={cn("transition-all duration-1000 ease-out", getOverallColor())}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                                        <span className="text-2xl font-bold tracking-tighter">{overallPercentage}%</span>
                                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mt-0.5">
                                            Расход
                                        </span>
                                    </div>
                                </div>
                                <p className={cn("text-xs font-medium mt-1.5", getOverallColor())}>
                                    {getOverallLabel()}
                                </p>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stat Card: Limit Reached */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.15 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative h-full">
                            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Лимит достигнут</p>
                                    <div className="rounded-full bg-rose-500/10 p-2 text-rose-500 ring-1 ring-rose-500/20">
                                        <XCircle className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="text-2xl font-bold tracking-tight text-rose-600">{limitReachedCount}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Требуют внимания</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stat Card: Warning */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.2 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative h-full">
                            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Близко к лимиту</p>
                                    <div className="rounded-full bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
                                        <AlertTriangle className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="text-2xl font-bold tracking-tight text-amber-600">{warningCount}</div>
                                    <p className="text-xs text-muted-foreground mt-1">80%+ использовано</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stat Card: Healthy */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.25 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative h-full">
                            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">В норме</p>
                                    <div className="rounded-full bg-emerald-500/10 p-2 text-emerald-500 ring-1 ring-emerald-500/20">
                                        <CheckCircle className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="text-2xl font-bold tracking-tight text-emerald-600">{healthyCount}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Достаточно ресурсов</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>

                    {/* Stat Card: Unlimited */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative h-full">
                            <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between pb-2">
                                    <p className="text-sm font-medium text-muted-foreground">Безлимит</p>
                                    <div className="rounded-full bg-primary/10 p-2 text-primary ring-1 ring-primary/20">
                                        <Infinity className="h-4 w-4" />
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="text-2xl font-bold tracking-tight">{unlimitedCount}</div>
                                    <p className="text-xs text-muted-foreground mt-1">Без ограничений</p>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>

                {/* Warning Alert */}
                {limitReachedCount > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 }}
                    >
                        <Alert variant="destructive" className="border-rose-200 dark:border-rose-800/30 bg-rose-50/50 dark:bg-rose-950/20">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                Вы достигли лимита по {limitReachedCount} {limitReachedCount === 1 ? 'ресурсу' : 'ресурсам'}.
                                Обновите тариф для увеличения лимитов.
                            </AlertDescription>
                        </Alert>
                    </motion.div>
                )}

                {/* Detailed Usage Stats */}
                <div className="space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.35 }}
                        className="text-lg font-semibold tracking-tight px-1"
                    >
                        Детальная статистика
                    </motion.h2>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {Object.entries(usageStats).map(([resource, stat], index) => {
                            const isDanger = stat.limit_reached;
                            const isWarning = stat.percentage >= 80 && !isDanger;
                            const colorClass = getResourceColor(resource);
                            const bgClass = getResourceBg(resource);

                            return (
                                <motion.div
                                    key={resource}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.4 + index * 0.05 }}
                                >
                                    <Card className={cn(
                                        "border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative transition-all hover:shadow-xl",
                                        isDanger && "ring-1 ring-rose-500/30",
                                        isWarning && "ring-1 ring-amber-500/30"
                                    )}>
                                        {/* Decorative blur */}
                                        <div className={cn(
                                            "absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl pointer-events-none",
                                            isDanger ? "bg-rose-500/5" : isWarning ? "bg-amber-500/5" : "bg-primary/5"
                                        )} />

                                        <CardHeader className="pb-3 z-10 relative">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "rounded-full p-2 ring-1",
                                                        isDanger
                                                            ? "bg-rose-500/10 text-rose-500 ring-rose-500/20"
                                                            : isWarning
                                                                ? "bg-amber-500/10 text-amber-500 ring-amber-500/20"
                                                                : cn(bgClass, colorClass, "ring-current/20")
                                                    )}>
                                                        {resourceIcons[resource] || <TrendingUp className="h-5 w-5" />}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-base font-semibold">
                                                            {resourceLabels[resource] || resource}
                                                        </CardTitle>
                                                        <p className="text-xs text-muted-foreground mt-0.5">
                                                            {resourceDescriptions[resource]}
                                                        </p>
                                                    </div>
                                                </div>
                                                {isDanger && (
                                                    <Badge variant="outline" className="bg-rose-500/10 text-rose-600 border-rose-500/30 text-xs">
                                                        Лимит
                                                    </Badge>
                                                )}
                                                {isWarning && (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-xs">
                                                        Внимание
                                                    </Badge>
                                                )}
                                                {stat.unlimited && (
                                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs">
                                                        Безлимит
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="z-10 relative space-y-3">
                                            {stat.unlimited ? (
                                                <div className="flex items-center justify-between p-3 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                                    <div className="flex items-center gap-2">
                                                        <Infinity className="h-4 w-4 text-emerald-500" />
                                                        <span className="text-sm font-medium text-emerald-600">Безлимитное использование</span>
                                                    </div>
                                                    <span className="text-lg font-bold tabular-nums">{stat.current}</span>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Progress */}
                                                    <div className="space-y-2">
                                                        <div className="flex items-center justify-between text-sm">
                                                            <span className="text-muted-foreground">Использовано</span>
                                                            <span className="font-semibold tabular-nums">
                                                                {stat.current} из {stat.limit}
                                                                <span className={cn(
                                                                    "ml-1.5 text-xs",
                                                                    isDanger ? "text-rose-500" : isWarning ? "text-amber-500" : "text-muted-foreground"
                                                                )}>
                                                                    ({stat.percentage.toFixed(0)}%)
                                                                </span>
                                                            </span>
                                                        </div>
                                                        <Progress
                                                            value={stat.percentage}
                                                            className={cn(
                                                                "h-2.5 rounded-full",
                                                                isDanger && "[&>div]:bg-rose-500",
                                                                isWarning && "[&>div]:bg-amber-500"
                                                            )}
                                                        />
                                                    </div>

                                                    {/* Remaining */}
                                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                        <span className="text-sm text-muted-foreground">Осталось</span>
                                                        <span className={cn(
                                                            "text-lg font-bold tabular-nums",
                                                            isDanger ? "text-rose-500" : isWarning ? "text-amber-500" : "text-emerald-500"
                                                        )}>
                                                            {stat.remaining}
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Upgrade CTA */}
                {(limitReachedCount > 0 || warningCount > 0) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.6 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10">
                            <div className="absolute -right-8 -top-8 h-32 w-32 bg-primary/5 blur-3xl pointer-events-none" />

                            <CardContent className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2.5 text-primary ring-1 ring-primary/20">
                                        <TrendingUp className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold">Нужно больше ресурсов?</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Обновите тариф для увеличения лимитов
                                        </p>
                                    </div>
                                </div>
                                <Button asChild className="shadow-sm bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all hover:scale-[1.02] active:scale-[0.98]">
                                    <Link href={route('subscriptions.index')}>
                                        Посмотреть тарифы
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </AppPageLayout>
    );
}
