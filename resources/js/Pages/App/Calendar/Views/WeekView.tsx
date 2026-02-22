import { useRef, useEffect, useState } from 'react';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInMinutes, startOfDay, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';

// @ts-ignore
declare const route: any;

interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    extendedProps: {
        service: string;
        price: number;
    }
}

interface Props {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

export default function WeekView({ currentDate, events, onEventClick }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    
    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);
    
    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const endDate = endOfWeek(currentDate, { weekStartsOn: 1 });
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // Time slots from 00:00 to 23:00 (24 hours)
    const hours = Array.from({ length: 24 }, (_, i) => i);

    useEffect(() => {
        // Scroll to 07:00 automatically on mount
        if (containerRef.current) {
            const rowHeight = 60; // 60px per hour
            containerRef.current.scrollTop = 7 * rowHeight; // Scroll to 07:00
        }
    }, []);

    const getDayEvents = (day: Date) => {
        return events.filter(event => isSameDay(new Date(event.start), day));
    };

    // Mobile: Show 3-day sliding view (today, +1, +2)
    if (isMobile) {
        const daysWithEvents = days.map(day => ({
            day,
            events: getDayEvents(day)
        }));

        return (
            <div className="space-y-3 p-2">
                {daysWithEvents.map(({ day, events }) => (
                    <Card key={day.toISOString()} className="overflow-hidden">
                        <div className={cn(
                            "px-4 py-2 border-b font-medium flex items-center justify-between",
                            isToday(day) ? "bg-primary/10 text-primary" : "bg-muted/30"
                        )}>
                            <div>
                                <div className="text-sm text-muted-foreground">
                                    {format(day, 'EEEE', { locale: ru })}
                                </div>
                                <div className="text-lg font-semibold">
                                    {format(day, 'd MMMM', { locale: ru })}
                                </div>
                            </div>
                            <Link
                                href={route('calendar.create')}
                                data={{ date: format(day, 'yyyy-MM-dd') }}
                            >
                                <Button size="sm" variant="outline">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                        {events.length === 0 ? (
                            <CardContent className="p-6 text-center text-sm text-muted-foreground">
                                Нет записей
                            </CardContent>
                        ) : (
                            <CardContent className="p-3 space-y-2">
                                {events.map(event => {
                                    const start = new Date(event.start);
                                    const end = new Date(event.end);
                                    const duration = differenceInMinutes(end, start);
                                    
                                    return (
                                        <div
                                            key={event.id}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                onEventClick?.(event);
                                            }}
                                            className="flex items-start gap-3 p-3 rounded-lg border transition-all active:scale-[0.98] cursor-pointer"
                                            style={{
                                                backgroundColor: event.backgroundColor + '10',
                                                borderLeftColor: event.backgroundColor,
                                                borderLeftWidth: '4px'
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                                    <span className="text-sm font-semibold" style={{ color: event.backgroundColor }}>
                                                        {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                                    </span>
                                                    <Badge variant="outline" className="ml-auto text-xs">
                                                        {duration} мин
                                                    </Badge>
                                                </div>
                                                <div className="font-medium truncate">{event.title}</div>
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    {event.extendedProps.service}
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="flex-shrink-0">
                                                {new Intl.NumberFormat('ru-RU', { 
                                                    style: 'currency', 
                                                    currency: 'RUB', 
                                                    maximumFractionDigits: 0 
                                                }).format(event.extendedProps.price)}
                                            </Badge>
                                        </div>
                                    );
                                })}
                            </CardContent>
                        )}
                    </Card>
                ))}
            </div>
        );
    }

    // Calculate overlapping events and their positions
    const getEventPosition = (event: CalendarEvent, dayEvents: CalendarEvent[]) => {
        const eventStart = new Date(event.start).getTime();
        const eventEnd = new Date(event.end).getTime();
        
        // Find events that overlap in time with this event
        const overlapping = dayEvents.filter(e => {
            const eStart = new Date(e.start).getTime();
            const eEnd = new Date(e.end).getTime();
            // Two events overlap if one starts before the other ends
            return (eStart < eventEnd && eEnd > eventStart);
        });
        
        // Sort overlapping events by start time, then by id for consistency
        overlapping.sort((a, b) => {
            const timeDiff = new Date(a.start).getTime() - new Date(b.start).getTime();
            if (timeDiff !== 0) return timeDiff;
            return a.id - b.id; // Consistent ordering
        });
        
        const totalColumns = overlapping.length;
        const columnIndex = overlapping.findIndex(e => e.id === event.id);
        
        // If only one event, use full width
        if (totalColumns === 1) {
            return {
                left: '2px',
                width: 'calc(100% - 4px)',
                zIndex: 0
            };
        }
        
        // Calculate position for multiple overlapping events
        const widthPercent = 100 / totalColumns;
        const leftPercent = widthPercent * columnIndex;
        
        return {
            left: `${leftPercent}%`,
            width: `${widthPercent - 1}%`, // -1% for gap between events
            zIndex: columnIndex
        };
    };

    const getEventStyle = (event: CalendarEvent) => {
        const start = new Date(event.start);
        const end = new Date(event.end);

        // Calculate minutes from 00:00 of the same day
        const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        const startMinutes = differenceInMinutes(start, dayStart);
        const durationMinutes = differenceInMinutes(end, start);

        return {
            top: `${(startMinutes / 60) * 60}px`, // 60px per hour
            height: `${(durationMinutes / 60) * 60}px`, // Full height based on duration
            backgroundColor: event.backgroundColor + '15', // 15% opacity like MonthView
            borderColor: event.backgroundColor + '30',
            borderLeftColor: event.backgroundColor,
            color: event.backgroundColor
        };
    };

    // Desktop: Grid view with time slots
    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="flex border-b bg-muted/30 pr-4"> {/* pr-4 for scrollbar compensation */}
                <div className="w-16 flex-shrink-0 border-r bg-muted/10"></div>
                <div className="grid grid-cols-7 flex-1">
                    {days.map((day) => (
                        <div key={day.toString()} className={cn(
                            "py-2 text-center text-sm border-r last:border-r-0",
                            isToday(day) && "bg-primary/5"
                        )}>
                            <div className="font-medium text-muted-foreground">{format(day, 'EEE', { locale: ru })}</div>
                            <div className={cn(
                                "inline-flex items-center justify-center w-8 h-8 rounded-full font-bold mt-1",
                                isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                            )}>
                                {format(day, 'd')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scrollable Content */}
            <div ref={containerRef} className="flex-1 overflow-y-auto relative">
                <div className="flex min-h-[1440px]"> {/* 24 hours * 60px */}

                    {/* Time Column */}
                    <div className="w-16 flex-shrink-0 border-r bg-background text-xs text-muted-foreground sticky left-0 z-10">
                        {hours.map((hour) => (
                            <div key={hour} className="h-[60px] border-b relative">
                                <span className="absolute -top-2.5 right-2 bg-background px-1">
                                    {hour}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Days Columns */}
                    <div className="grid grid-cols-7 flex-1 relative">
                        {/* Background Grid */}
                        {hours.map((_, i) => (
                            <div key={i} className="absolute inset-x-0 h-[1px] bg-border/50" style={{ top: `${(i + 1) * 60}px` }} />
                        ))}

                        {days.map((day) => {
                            const dayEvents = getDayEvents(day);
                            return (
                                <div key={day.toString()} className={cn(
                                    "border-r last:border-r-0 relative h-full",
                                    isToday(day) && "bg-primary/5"
                                )}>
                                    {dayEvents.map(event => {
                                        const durationMinutes = differenceInMinutes(new Date(event.end), new Date(event.start));
                                        const isShort = durationMinutes < 45;
                                        const position = getEventPosition(event, dayEvents);
                                        const style = getEventStyle(event);
                                        
                                        return (
                                            <div
                                                key={event.id}
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    onEventClick?.(event);
                                                }}
                                                className="absolute text-xs px-1.5 py-1 rounded shadow-sm border transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer overflow-hidden"
                                                style={{
                                                    top: style.top,
                                                    height: style.height,
                                                    left: position.left,
                                                    width: position.width,
                                                    zIndex: position.zIndex,
                                                    backgroundColor: event.backgroundColor + '15',
                                                    borderColor: event.backgroundColor + '30',
                                                    borderLeftColor: event.backgroundColor,
                                                    borderLeftWidth: '3px',
                                                    color: event.backgroundColor
                                                }}
                                            >
                                                <div className="font-semibold">{format(new Date(event.start), 'HH:mm')}</div>
                                                <div className="truncate">{event.title}</div>
                                            </div>
                                        );
                                    })}

                                    {/* Current Time Indicator (only for today) */}
                                    {isToday(day) && (
                                        <div
                                            className="absolute w-full h-0.5 bg-red-500 z-10 pointer-events-none"
                                            style={{
                                                top: `${(differenceInMinutes(new Date(), new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0)) / 60) * 60}px`
                                            }}
                                        >
                                            <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
