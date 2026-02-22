import * as React from 'react';
import { Calendar } from '@/Components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ru } from 'date-fns/locale';
import { parseISO, format } from 'date-fns';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/Components/ui/tooltip';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/Components/ui/button';

interface OccupancyData {
    [date: string]: {
        count: number;
        level: 'low' | 'medium' | 'high';
    };
}

interface OccupancyWidgetProps {
    data: OccupancyData;
    className?: string;
    onDateSelect?: (date: Date) => void;
}

export default function OccupancyWidgetCalendar({ data, className, onDateSelect }: OccupancyWidgetProps) {
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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={className}
        >
            <Card className="h-full border-none shadow-sm flex flex-col overflow-hidden">
                <CardHeader className="pb-0 pt-5 px-5">
                    <div className="flex items-center justify-between mb-1">
                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <CalendarIcon className="h-4 w-4" />
                            </div>
                            Загруженность
                        </CardTitle>
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="rounded-full p-2 hover:bg-muted transition-colors cursor-help">
                                        <Info className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p className="max-w-xs text-xs">Цвет показывает количество записей на день</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </CardHeader>

                <CardContent className="flex flex-col items-center flex-1 p-0">
                    <div className="w-full flex justify-center p-2">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleSelect}
                            locale={ru}
                            className="p-3 w-full max-w-[340px]"
                            classNames={{
                                months: "flex flex-col w-full space-y-4",
                                month: "space-y-4 w-full",
                                caption: "flex justify-center pt-1 relative items-center mb-2",
                                caption_label: "text-sm font-medium capitalize",
                                nav: "space-x-1 flex items-center",
                                nav_button: cn(
                                    buttonVariants({ variant: "outline" }),
                                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 border-border/50 hover:bg-muted"
                                ),
                                nav_button_previous: "absolute left-1",
                                nav_button_next: "absolute right-1",
                                table: "w-full border-collapse space-y-1",
                                head_row: "flex w-full mb-2",
                                head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] capitalize flex-1",
                                row: "flex w-full mt-2 gap-1",
                                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
                                day: cn(
                                    buttonVariants({ variant: "ghost" }),
                                    "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-muted rounded-md transition-all duration-200"
                                ),
                                day_selected:
                                    "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground shadow-md scale-105 z-10",
                                day_today: "bg-accent text-accent-foreground font-medium",
                                day_outside: "text-muted-foreground opacity-30",
                                day_disabled: "text-muted-foreground opacity-30",
                                day_hidden: "invisible",
                            }}
                            modifiers={{
                                high: highOccupancyDates,
                                medium: mediumOccupancyDates,
                                low: lowOccupancyDates,
                            }}
                            modifiersClassNames={{
                                // High: Solid Lime, dark text for contrast
                                high: "bg-[#bef264] text-black font-semibold hover:bg-[#bef264]/90 hover:scale-105 transition-transform",
                                // Medium: Light Lime background, darkened lime text
                                medium: "bg-[#bef264]/30 text-emerald-900 dark:text-emerald-100 font-medium hover:bg-[#bef264]/40",
                                // Low: Very subtle lime tint
                                low: "bg-[#bef264]/10 text-muted-foreground hover:bg-[#bef264]/20",
                            }}
                            components={{
                                DayContent: (props) => {
                                    const dateStr = format(props.date, 'yyyy-MM-dd');
                                    const count = dayDataMap.get(dateStr);

                                    return (
                                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                                            <span>{props.date.getDate()}</span>
                                            {/* Small dot for any occupancy > 0 */}
                                            {count !== undefined && count > 0 && !props.selected && (
                                                <div className={cn(
                                                    "absolute bottom-1.5 w-1 h-1 rounded-full",
                                                    // If high level (solid bg), dot should be dark to be visible, otherwise lime
                                                    props.modifiers.high ? "bg-black/30" : "bg-[#bef264]"
                                                )} />
                                            )}
                                        </div>
                                    );
                                }
                            }}
                        />
                    </div>

                    <div className="w-full border-t bg-muted/30 px-6 py-3 mt-auto">
                        <div className="flex justify-between items-center text-[11px] font-medium text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#bef264]/10 border border-[#bef264]/20"></div>
                                <span>Свободно</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#bef264]/30 border border-[#bef264]/40"></div>
                                <span>Средне</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-sm bg-[#bef264] shadow-sm"></div>
                                <span className="text-foreground font-semibold">Плотно</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
