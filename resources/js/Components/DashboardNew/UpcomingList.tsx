import { Link } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { motion } from 'framer-motion';
import { Calendar, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpcomingItem {
    id: number;
    client_name: string;
    service_name: string;
    start_time: string;
    date: string;
    status: string;
}

interface UpcomingListProps {
    items: UpcomingItem[];
    className?: string;
}

const STATUS_Styles: Record<string, string> = {
    scheduled: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20',
    confirmed: 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20',
    cancelled: 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20',
};

const STATUS_LABELS: Record<string, string> = {
    scheduled: 'Запланировано',
    confirmed: 'Подтверждено',
    pending: 'Ожидает',
    cancelled: 'Отменено',
};

function getInitials(name: string) {
    return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export function UpcomingList({ items, className }: UpcomingListProps) {
    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className={className}
        >
            <Card className="h-full border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div className="space-y-1">
                        <CardTitle className="text-base font-semibold">Ближайшие записи</CardTitle>
                        <CardDescription>Ваше расписание на сегодня</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full hover:bg-muted">
                        <Link href="/app/calendar">
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardHeader>
                <CardContent className="px-2">
                    {items.length > 0 ? (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-4 pt-2">
                                {items.map((item, index) => (
                                    <motion.div
                                        key={item.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 * index }}
                                        className="group flex items-start gap-3 rounded-xl border border-border/40 bg-card/40 p-3 transition-all hover:bg-muted/50 hover:shadow-sm"
                                    >
                                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm transition-transform group-hover:scale-105">
                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
                                                {getInitials(item.client_name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-medium text-sm leading-none">{item.client_name}</p>
                                                <Badge variant="secondary" className={cn("text-[10px] px-1.5 py-0 h-5 font-normal transition-colors", STATUS_Styles[item.status] || STATUS_Styles.scheduled)}>
                                                    {STATUS_LABELS[item.status] || item.status}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-1">{item.service_name}</p>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground/80 pt-1">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="h-3 w-3" />
                                                    <span>{item.date}</span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{item.start_time}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 mb-3">
                                <Calendar className="h-6 w-6 opacity-50" />
                            </div>
                            <p className="text-sm font-medium">Нет записей</p>
                            <p className="text-xs mt-1 max-w-[180px]">На сегодня запланированных встреч нет</p>
                            <Button variant="outline" size="sm" className="mt-4 h-8 text-xs" asChild>
                                <Link href="/app/calendar/create">Добавить запись</Link>
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
    );
}
