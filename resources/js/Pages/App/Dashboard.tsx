import { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
// TODO: unhide for production — modules hidden for MVP
// import { DashboardModuleWidgets, DashboardModuleStats } from '@/Components/Modules/DashboardModuleHooks';
import { Button } from '@/Components/ui/button';
import {
    CalendarPlus,
    UserPlus,
    Sparkles,
} from 'lucide-react';

// New Components
import { StatsGrid } from '@/Components/DashboardNew/StatsGrid';
import { RevenueChart } from '@/Components/DashboardNew/RevenueChart';
import { UpcomingList } from '@/Components/DashboardNew/UpcomingList';
import { RecentActivityList } from '@/Components/DashboardNew/RecentActivityList';
import { GoalsCard } from '@/Components/DashboardNew/GoalsCard';

interface RecentItem {
    id: number;
    client_name: string;
    service_name: string;
    status: string;
    price: number;
    date_formatted: string;
}

interface DashboardProps {
    stats: {
        appointments_today: number;
        income_today: number;
        income_month: number;
        income_growth: number;
        tax_estimate: number;
        new_clients: number;
        pending_appointments: number;
    };
    chart_data: { date: string; revenue: number }[];
    occupancy: Record<string, { count: number; level: string }>;
    // @ts-ignore - casting simpler type to more specific one
    occupancyData: Record<string, { count: number; level: 'low' | 'medium' | 'high' }>;
    upcoming: {
        id: number;
        client_name: string;
        service_name: string;
        start_time: string;
        date: string;
        status: string;
    }[];
    recent: RecentItem[];
    monthly_goal: number | null;
}

export default function Dashboard({ stats, chart_data, occupancy, upcoming, recent, monthly_goal }: DashboardProps) {
    const { auth } = usePage<any>().props;
    const user = auth.user;

    const greeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 6) return 'Доброй ночи';
        if (hour < 12) return 'Доброе утро';
        if (hour < 18) return 'Добрый день';
        return 'Добрый вечер';
    }, []);

    const todayFormatted = useMemo(() => {
        return new Intl.DateTimeFormat('ru-RU', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
        }).format(new Date());
    }, []);

    return (
        <AppPageLayout title="Дашборд">
            <Head title="Главная" />

            <div className="flex flex-col gap-6 pb-8 max-w-[1600px] mx-auto w-full">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl flex items-center gap-2">
                            {greeting}, {user.name}! <Sparkles className="h-5 w-5 text-amber-400 animate-pulse" />
                        </h1>
                        <p className="text-muted-foreground capitalize text-sm sm:text-base">
                            {todayFormatted}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" asChild className="cursor-pointer shadow-sm hover:bg-accent/50 transition-colors h-9">
                            <Link href="/app/clients">
                                <UserPlus className="mr-2 h-4 w-4" />
                                Клиент
                            </Link>
                        </Button>
                        <Button size="sm" asChild className="cursor-pointer shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 active:scale-95 h-9">
                            <Link href="/app/calendar/create">
                                <CalendarPlus className="mr-2 h-4 w-4" />
                                Запись
                            </Link>
                        </Button>
                    </div>
                </div>

                {/* ── Stat Grid ── */}
                <StatsGrid stats={stats} />

                {/* TODO: unhide for production — modules hidden for MVP */}
                {/* <DashboardModuleStats /> */}

                {/* ── Main Layout (Split Rows for Full Width) ── */}
                <div className="flex flex-col gap-6">

                    {/* Top Row: Revenue Chart (Left 8) + Goals/Modules (Right 4) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Revenue Chart */}
                        <div className="lg:col-span-8">
                            <RevenueChart data={chart_data} className="h-[350px]" />
                        </div>

                        {/* Right Sidebar Components */}
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <GoalsCard className="h-[350px]" current={stats.income_month} target={monthly_goal} />
                            {/* TODO: unhide for production — modules hidden for MVP */}
                            {/* <DashboardModuleWidgets /> */}
                        </div>
                    </div>

                    {/* Bottom Row: Activity & Upcoming - Full Width 50/50 Split */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <RecentActivityList items={recent} className="h-full min-h-[400px]" />
                        <UpcomingList items={upcoming} className="h-full min-h-[400px]" />
                    </div>

                </div>
            </div>
        </AppPageLayout>
    );
}
