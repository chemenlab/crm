import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RecentItem {
    id: number;
    client_name: string;
    service_name: string;
    status: string;
    price: number;
    date_formatted: string;
}

interface RecentActivityListProps {
    items: RecentItem[];
    className?: string;
}

const STATUS_ICONS: Record<string, any> = {
    confirmed: CheckCircle,
    completed: CheckCircle,
    cancelled: XCircle,
    pending: Clock,
    no_show: AlertCircle,
};

const STATUS_Styles: Record<string, string> = {
    confirmed: 'text-emerald-500 bg-emerald-500/10',
    completed: 'text-emerald-500 bg-emerald-500/10',
    cancelled: 'text-rose-500 bg-rose-500/10',
    pending: 'text-amber-500 bg-amber-500/10',
    no_show: 'text-rose-500 bg-rose-500/10',
};

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatCurrency(amount: number) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        maximumFractionDigits: 0,
    }).format(amount);
}

export function RecentActivityList({ items, className }: RecentActivityListProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className={className}
        >
            <Card className="h-full border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">Последняя активность</CardTitle>
                        <CardDescription>История ваших записей</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="h-8 text-xs hover:bg-muted">
                        <Link href="/app/calendar">
                            Все записи
                            <ArrowRight className="ml-1 h-3 w-3" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="px-2">
                    {items.length > 0 ? (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="relative border-l border-muted ml-3 space-y-6 pt-2 pb-2">
                                {items.map((item, index) => {
                                    const StatusIcon = STATUS_ICONS[item.status] || Clock;
                                    return (
                                        <motion.div
                                            key={item.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.1 * index }}
                                            className="ml-6 relative"
                                        >
                                            <span className={cn("absolute -left-9 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-background", STATUS_Styles[item.status] || "bg-muted text-muted-foreground")}>
                                                <StatusIcon className="h-3 w-3" />
                                            </span>
                                            <div className="flex flex-col gap-1 rounded-lg border bg-card/50 p-3 hover:bg-muted/50 transition-colors">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium">{item.client_name}</p>
                                                    <span className="text-xs font-semibold tabular-nums text-muted-foreground">
                                                        {formatCurrency(item.price)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <span>{item.service_name}</span>
                                                    <span>{item.date_formatted}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                                <Clock className="h-6 w-6 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">Нет активности</p>
                            <p className="text-xs mt-1 max-w-[180px]">Здесь будет история ваших записей</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
