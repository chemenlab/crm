import {
    Calendar,
    CreditCard,
    TrendingUp,
    Users,
    Clock,
    Activity
} from 'lucide-react';
import { StatsCard } from './StatsCard';

interface DashboardStats {
    appointments_today: number;
    income_today: number;
    income_month: number;
    income_growth: number;
    tax_estimate: number;
    new_clients: number;
    pending_appointments: number;
}

interface StatsGridProps {
    stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
                title="Доход за сегодня"
                value={formatCurrency(stats.income_today)}
                icon={<CreditCard className="h-4 w-4" />}
                trend={stats.income_growth}
                trendLabel="от прошлого месяца"
                delay={0.1}
            />
            <StatsCard
                title="Записи сегодня"
                value={stats.appointments_today}
                icon={<Calendar className="h-4 w-4" />}
                description={stats.appointments_today === 0 ? "На сегодня нет записей" : "Все записи подтверждены"}
                delay={0.2}
            />
            <StatsCard
                title="Новые клиенты"
                value={stats.new_clients}
                icon={<Users className="h-4 w-4" />}
                description="+12% с прошлой недели"
                delay={0.3}
            />
            <StatsCard
                title="Ожидают подтверждения"
                value={stats.pending_appointments}
                icon={<Clock className="h-4 w-4" />}
                description="Требуют вашего внимания"
                className={stats.pending_appointments > 0 ? "border-amber-500/50 bg-amber-500/5" : ""}
                delay={0.4}
            />
        </div>
    );
}
