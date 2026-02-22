import { useMemo } from 'react';
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ArrowUpRight } from 'lucide-react';

interface ChartData {
    date: string;
    revenue: number;
}

interface RevenueChartProps {
    data: ChartData[];
    className?: string;
}

export function RevenueChart({ data, className }: RevenueChartProps) {
    const chartData = useMemo(() => {
        return [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }, [data]);

    const totalRevenue = useMemo(() => {
        return data.reduce((acc, curr) => acc + curr.revenue, 0);
    }, [data]);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' }).format(date);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className={cn("col-span-1", className)}
        >
            <Card className="h-full border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                {/* Background Glow */}
                <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full bg-emerald-500/10 blur-3xl" />

                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg font-semibold">Динамика доходов</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-1">
                                Общий доход
                                <span className="flex items-center text-xs font-medium text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                                    <ArrowUpRight className="h-3 w-3 mr-1" />
                                    +12.5%
                                </span>
                            </CardDescription>
                        </div>
                        <div className="text-2xl font-bold tracking-tight">
                            {formatCurrency(totalRevenue)}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pl-0">
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="currentColor" className="text-muted/20" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'currentColor', opacity: 0.5, fontSize: 12 }}
                                    dx={-10}
                                />
                                <Tooltip
                                    cursor={{ stroke: '#10b981', strokeWidth: 1, strokeDasharray: '4 4' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="rounded-lg border bg-popover/95 p-3 shadow-xl backdrop-blur-md">
                                                    <div className="text-xs text-muted-foreground mb-1">
                                                        {formatDate(payload[0].payload.date)}
                                                    </div>
                                                    <div className="font-bold text-emerald-500">
                                                        {formatCurrency(payload[0].value as number)}
                                                    </div>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
