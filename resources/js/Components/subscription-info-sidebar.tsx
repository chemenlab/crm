import { Link } from '@inertiajs/react';
import { Card } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';

import { Badge } from '@/Components/ui/badge';
import {
    Crown,
    TrendingUp,
    Calendar,
    Sparkles,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubscriptionInfoSidebarProps {
    subscription?: {
        plan: {
            name: string;
            price: number;
            billing_period: string;
        };
        status: string;
        current_period_end: string;
        trial_ends_at?: string;
    };
    usageStats?: {
        clients?: { current: number; limit: number; unlimited: boolean };
        services?: { current: number; limit: number; unlimited: boolean };
        appointments?: { current: number; limit: number; unlimited: boolean };
    };
    className?: string;
}

export function SubscriptionInfoSidebar({
    subscription,
    usageStats,
    className
}: SubscriptionInfoSidebarProps) {

    if (!subscription) {
        return (
            <Card className={cn("p-3 bg-zinc-900 bg-gradient-to-tl from-[#bef264]/20 to-[#bef264]/5 border-[#bef264]/20", className)}>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-[#bef264]/20">
                            <Sparkles className="h-4 w-4 text-[#bef264]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-zinc-100">Бесплатный план</p>
                            <p className="text-xs text-zinc-400">Базовые возможности</p>
                        </div>
                    </div>

                    <Button
                        asChild
                        size="sm"
                        className="w-full bg-gradient-to-r from-[#bef264] to-[#bef264]/80 hover:from-[#bef264]/90 hover:to-[#bef264]/70 text-zinc-900 font-medium"
                    >
                        <Link href="/app/subscriptions">
                            <Crown className="h-3.5 w-3.5 mr-2" />
                            Улучшить план
                        </Link>
                    </Button>
                </div>
            </Card>
        );
    }

    const isActive = subscription.status === 'active';
    const isTrial = subscription.status === 'trial';
    const isCancelled = subscription.status === 'cancelled';

    const getStatusColor = () => {
        if (isActive) return 'bg-emerald-500/15 text-emerald-400';
        if (isTrial) return 'bg-blue-500/15 text-blue-400';
        if (isCancelled) return 'bg-red-500/15 text-red-400';
        return 'bg-slate-500/15 text-slate-400';
    };

    const getStatusText = () => {
        if (isActive) return 'Активна';
        if (isTrial) return 'Пробная';
        if (isCancelled) return 'Отменена';
        return subscription.status;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getPeriodLabel = (period: string) => {
        return period === 'monthly' ? 'мес' : 'год';
    };

    // Calculate days remaining
    const endDate = new Date(isTrial && subscription.trial_ends_at ? subscription.trial_ends_at : subscription.current_period_end);
    const today = new Date();
    const daysRemaining = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    return (
        <Card className={cn("p-3 bg-zinc-900 bg-gradient-to-tl from-[#bef264]/20 via-[#bef264]/5 to-zinc-900 border-[#bef264]/20 text-zinc-100", className)}>
            <div className="flex flex-col gap-2">

                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="p-1.5 rounded-lg bg-[#bef264]/20 shrink-0">
                            <Crown className="h-4 w-4 text-[#bef264]" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate text-zinc-100">{subscription.plan.name}</p>
                            <p className="text-xs text-zinc-400">
                                {subscription.plan.price.toLocaleString('ru-RU')} ₽/{getPeriodLabel(subscription.plan.billing_period)}
                            </p>
                        </div>
                    </div>
                    <Badge variant="secondary" className={cn("text-[10px] px-2 py-0.5 h-5 shrink-0 border-none", getStatusColor())}>
                        {getStatusText()}
                    </Badge>
                </div>

                {/* Days Remaining */}
                {(isActive || isTrial) && daysRemaining > 0 && (
                    <div className="flex items-center gap-2 text-xs">
                        <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                        <span className="text-zinc-400">
                            {isTrial ? 'Пробный период до' : 'Продлится до'} {formatDate(endDate.toISOString())}
                        </span>
                    </div>
                )}

                {/* Usage Stats - Show one main metric */}
                {usageStats && usageStats.clients && (
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Клиенты</span>
                            <span className="font-medium text-zinc-100">
                                {usageStats.clients.current} / {usageStats.clients.unlimited ? '∞' : usageStats.clients.limit}
                            </span>
                        </div>
                        {!usageStats.clients.unlimited && (
                            <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-[#bef264]/20">
                                <div
                                    className="h-full w-full flex-1 bg-[#bef264] transition-all"
                                    style={{ transform: `translateX(-${100 - ((usageStats.clients.current / usageStats.clients.limit) * 100)}%)` }}
                                />
                            </div>
                        )}
                    </div>
                )}

                {/* Action Button */}
                <Button
                    asChild
                    variant="outline"
                    size="sm"
                    className="w-full group bg-transparent border-zinc-700 text-zinc-100 hover:bg-zinc-800 hover:text-white hover:border-zinc-600"
                >
                    <Link href="/app/subscriptions">
                        <TrendingUp className="h-3.5 w-3.5 mr-2" />
                        Управление
                        <ArrowRight className="h-3 w-3 ml-auto group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                </Button>
            </div>
        </Card>
    );
}
