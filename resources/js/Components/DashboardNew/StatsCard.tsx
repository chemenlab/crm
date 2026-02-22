import { ReactNode } from 'react';
import { Card, CardContent } from '@/Components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface StatsCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: ReactNode;
    trend?: number;
    trendLabel?: string;
    className?: string;
    delay?: number;
}

export function StatsCard({
    title,
    value,
    description,
    icon,
    trend,
    trendLabel,
    className,
    delay = 0,
}: StatsCardProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay }}
        >
            <Card className={cn("overflow-hidden border-none shadow-lg transition-all hover:shadow-xl dark:bg-card/50 dark:backdrop-blur-sm", className)}>
                <CardContent className="p-6">
                    <div className="flex items-center justify-between space-y-0 pb-2">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <div className="rounded-full bg-primary/10 p-2 text-primary ring-1 ring-primary/20 transition-transform group-hover:scale-110">
                            {icon}
                        </div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1">
                        <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
                        {(trend !== undefined || description) && (
                            <p className="text-xs text-muted-foreground">
                                {trend !== undefined && (
                                    <span className={cn("mr-2 font-medium", trend > 0 ? "text-emerald-500" : "text-rose-500")}>
                                        {trend > 0 ? "+" : ""}{trend}%
                                    </span>
                                )}
                                {description && <span>{description}</span>}
                            </p>
                        )}
                    </div>
                    {/* Decorative background element for "Pro Max" feel */}
                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
                </CardContent>
            </Card>
        </motion.div>
    );
}
