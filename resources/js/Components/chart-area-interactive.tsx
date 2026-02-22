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
import { useMemo } from 'react';

interface ChartData {
    date: string;
    revenue: number;
}

interface ChartAreaInteractiveProps {
    data: ChartData[];
    className?: string;
}

export default function ChartAreaInteractive({ data, className }: ChartAreaInteractiveProps) {

    const chartData = useMemo(() => {
        // Ensure data is sorted
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
        <Card className={className}>
            <CardHeader>
                <CardTitle>Динамика доходов</CardTitle>
                <CardDescription>
                    За последние 30 дней: <span className="font-medium text-foreground">{formatCurrency(totalRevenue)}</span>
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    {data.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart
                                data={chartData}
                                margin={{
                                    top: 10,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis
                                    dataKey="date"
                                    tickFormatter={formatDate}
                                    tickLine={false}
                                    axisLine={false}
                                    allowDecimals={false}
                                    tickMargin={10}
                                    fontSize={12}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <YAxis
                                    tickFormatter={(value) => `${value / 1000}k`}
                                    tickLine={false}
                                    axisLine={false}
                                    tickMargin={10}
                                    fontSize={12}
                                    stroke="hsl(var(--muted-foreground))"
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'hsl(var(--popover))',
                                        borderColor: 'hsl(var(--border))',
                                        borderRadius: 'var(--radius)',
                                        color: 'hsl(var(--popover-foreground))'
                                    }}
                                    formatter={(value: number) => [formatCurrency(value), 'Доход']}
                                    labelFormatter={(label) => formatDate(label)}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#10b981"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorRevenue)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
                            Нет данных за выбранный период
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
