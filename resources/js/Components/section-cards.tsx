import { Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import {
    CalendarCheck,
    Wallet,
    CreditCard,
    Users,
    Clock,
    TrendingUp,
    TrendingDown,
    ArrowRight,
} from 'lucide-react';

interface StatsProps {
    stats: {
        appointments_today: number;
        income_today: number;
        income_month: number;
        income_growth: number;
        tax_estimate: number;
        new_clients: number;
        pending_appointments: number;
    };
    className?: string;
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function SectionCards({ stats, className }: StatsProps) {
    const cards = [
        {
            title: 'Записи сегодня',
            value: String(stats.appointments_today),
            icon: CalendarCheck,
            description: 'Активных на сегодня',
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-950/50',
            href: '/app/calendar',
        },
        {
            title: 'Доход сегодня',
            value: formatCurrency(stats.income_today),
            icon: Wallet,
            description: 'За текущий день',
            color: 'text-emerald-600 dark:text-emerald-400',
            bg: 'bg-emerald-50 dark:bg-emerald-950/50',
            href: '/app/finance',
        },
        {
            title: 'Доход за месяц',
            value: formatCurrency(stats.income_month),
            icon: CreditCard,
            trend: stats.income_growth,
            description: 'по сравнению с пред. мес.',
            color: 'text-violet-600 dark:text-violet-400',
            bg: 'bg-violet-50 dark:bg-violet-950/50',
            href: '/app/finance',
        },
        {
            title: 'Новые клиенты',
            value: String(stats.new_clients),
            icon: Users,
            description: 'За этот месяц',
            color: 'text-amber-600 dark:text-amber-400',
            bg: 'bg-amber-50 dark:bg-amber-950/50',
            href: '/app/clients',
        },
    ];

    return (
        <div className={cn('space-y-4', className)}>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {cards.map((card) => (
                    <Link
                        key={card.title}
                        href={card.href}
                        className="group cursor-pointer focus-visible:outline-none"
                    >
                        <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-border group-focus-visible:ring-2 group-focus-visible:ring-ring group-focus-visible:ring-offset-2">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-muted-foreground">
                                            {card.title}
                                        </p>
                                        <p className="text-2xl font-bold tracking-tight tabular-nums">
                                            {card.value}
                                        </p>
                                    </div>
                                    <div className={cn('rounded-lg p-2.5', card.bg)}>
                                        <card.icon className={cn('h-5 w-5', card.color)} />
                                    </div>
                                </div>
                                <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                                    {card.trend !== undefined ? (
                                        <>
                                            {card.trend >= 0 ? (
                                                <span className="inline-flex items-center gap-0.5 font-medium text-emerald-600 dark:text-emerald-400">
                                                    <TrendingUp className="h-3 w-3" />
                                                    +{card.trend}%
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-0.5 font-medium text-red-600 dark:text-red-400">
                                                    <TrendingDown className="h-3 w-3" />
                                                    {card.trend}%
                                                </span>
                                            )}
                                            <span>{card.description}</span>
                                        </>
                                    ) : (
                                        <span>{card.description}</span>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>

            {/* Pending appointments alert */}
            {stats.pending_appointments > 0 && (
                <Link href="/app/calendar" className="block cursor-pointer">
                    <Card className="border-amber-200 bg-amber-50/50 transition-colors hover:bg-amber-50 dark:border-amber-900 dark:bg-amber-950/20 dark:hover:bg-amber-950/40">
                        <CardContent className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-amber-100 p-2 dark:bg-amber-900/50">
                                    <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    {stats.pending_appointments} неподтвержд.{' '}
                                    {stats.pending_appointments === 1 ? 'запись' :
                                     stats.pending_appointments < 5 ? 'записи' : 'записей'}
                                </p>
                            </div>
                            <ArrowRight className="h-4 w-4 text-amber-600/60 dark:text-amber-400/60" />
                        </CardContent>
                    </Card>
                </Link>
            )}
        </div>
    );
}
