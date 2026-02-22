import * as React from 'react';
import { Calendar } from '@/Components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';

interface OccupancyData {
    [date: string]: {
        count: number;
        level: 'low' | 'medium' | 'high';
    };
}

interface OccupancyCalendarInteractiveProps {
    data: OccupancyData;
    className?: string;
    onDateSelect?: (date: Date) => void;
}

export function OccupancyCalendarInteractive({ data, className, onDateSelect }: OccupancyCalendarInteractiveProps) {
    const [date, setDate] = React.useState<Date | undefined>(new Date());

    // Convert string dates to Date objects for matchers
    const highOccupancyDates = Object.keys(data)
        .filter(d => data[d].level === 'high')
        .map(d => parseISO(d));

    const mediumOccupancyDates = Object.keys(data)
        .filter(d => data[d].level === 'medium')
        .map(d => parseISO(d));

    const lowOccupancyDates = Object.keys(data)
        .filter(d => data[d].level === 'low')
        .map(d => parseISO(d));

    // Create a map for quick lookup of specific day data (counts)
    const dayDataMap = React.useMemo(() => {
        const map = new Map<string, number>();
        Object.entries(data).forEach(([key, value]) => {
            map.set(key, value.count);
        });
        return map;
    }, [data]);

    const handleSelect = (newDate: Date | undefined) => {
        setDate(newDate);
        if (newDate && onDateSelect) {
            onDateSelect(newDate);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className={className}
        >
            <Card className="h-full border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <CalendarIcon className="h-4 w-4 text-primary" />
                            Загруженность
                        </CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs">Цветом отмечена плотность записи. Нажмите на день, чтобы посмотреть детали.</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>
                <CardContent className="flex flex-col items-center p-0">
                    <Calendar
                        mode="single"
                        selected={date}
                        onSelect={handleSelect}
                        locale={ru}
                        className="rounded-md w-full max-w-full flex justify-center p-3"
                        modifiers={{
                            high: highOccupancyDates,
                            medium: mediumOccupancyDates,
                            low: lowOccupancyDates,
                            hasData: (d) => dayDataMap.has(format(d, 'yyyy-MM-dd'))
                        }}
                        modifiersClassNames={{
                            high: "bg-red-500/15 text-red-600 font-bold hover:bg-red-500/30 ring-1 ring-red-500/30",
                            medium: "bg-amber-500/15 text-amber-600 font-bold hover:bg-amber-500/30 ring-1 ring-amber-500/30",
                            low: "bg-emerald-500/15 text-emerald-600 font-bold hover:bg-emerald-500/30 ring-1 ring-emerald-500/30",
                            hasData: "font-semibold"
                        }}
                        components={{
                            DayContent: (props) => {
                                const dateStr = format(props.date, 'yyyy-MM-dd');
                                const count = dayDataMap.get(dateStr);

                                return (
                                    <div className="relative flex items-center justify-center w-full h-full">
                                        <span>{props.date.getDate()}</span>
                                        {count !== undefined && count > 0 && (
                                            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-50" />
                                        )}
                                    </div>
                                );
                            }
                        }}
                    />

                    <div className="w-full px-6 pb-4 pt-2">
                        <div className="flex justify-between items-center text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 ring-1 ring-emerald-500/50"></div>
                                <span>Свободно</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 ring-1 ring-amber-500/50"></div>
                                <span>Средне</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 ring-1 ring-red-500/50"></div>
                                <span>Плотно</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
