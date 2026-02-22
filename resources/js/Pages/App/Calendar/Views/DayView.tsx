import { useRef, useEffect, useState } from 'react';
import { format, differenceInMinutes, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Clock, Plus, Calendar as CalendarIcon } from 'lucide-react';
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

export default function DayView({ currentDate, events, onEventClick }: Props) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isMobile, setIsMobile] = useState(false);
    const hours = Array.from({ length: 24 }, (_, i) => i); // 00:00 - 23:00 (24 hours)

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            const rowHeight = 80; // 80px per hour for day view
            containerRef.current.scrollTop = 7 * rowHeight; // Scroll to 07:00
        }
    }, []);

    const getEventStyle = (event: CalendarEvent) => {
        const start = new Date(event.start);
        const end = new Date(event.end);
        
        // Calculate minutes from 00:00 of the same day
        const dayStart = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
        const startMinutes = differenceInMinutes(start, dayStart);
        const durationMinutes = differenceInMinutes(end, start);

        return {
            top: `${(startMinutes / 60) * 80}px`,
            height: `${(durationMinutes / 60) * 80}px`, // Full height based on duration
            backgroundColor: event.backgroundColor + '15', // 15% opacity like MonthView
            borderColor: event.backgroundColor + '30',
            borderLeftColor: event.backgroundColor,
            color: event.backgroundColor
        };
    };

    // Calculate overlapping events and their positions
    const getEventPosition = (event: CalendarEvent, allEvents: CalendarEvent[]) => {
        const eventStart = new Date(event.start).getTime();
        const eventEnd = new Date(event.end).getTime();
        
        // Find events that overlap in time with this event
        const overlapping = allEvents.filter(e => {
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
                left: '8px',
                width: 'calc(100% - 16px)',
                zIndex: 0
            };
        }
        
        // Calculate position for multiple overlapping events
        const widthPercent = 92 / totalColumns; // Use 92% of available width
        const leftPercent = 8 + (widthPercent * columnIndex); // Start at 8%
        
        return {
            left: `${leftPercent}%`,
            width: `${widthPercent - 1}%`, // -1% for gap between events
            zIndex: columnIndex
        };
    };

    // Filter only today's events (controller returns range, checking again is safe)
    const dayEvents = events;

    // Mobile: List view of events
    if (isMobile) {
        // Group events by hour for better organization
        const eventsByHour = dayEvents.reduce((acc, event) => {
            const hour = new Date(event.start).getHours();
            if (!acc[hour]) acc[hour] = [];
            acc[hour].push(event);
            return acc;
        }, {} as Record<number, typeof dayEvents>);

        return (
            <div className="space-y-3 p-2">
                {/* Day Header */}
                <Card className="overflow-hidden">
                    <div className={cn(
                        "px-4 py-3 text-center",
                        isToday(currentDate) ? "bg-primary/10" : "bg-muted/30"
                    )}>
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="capitalize">{format(currentDate, 'EEEE', { locale: ru })}</span>
                        </div>
                        <div className={cn(
                            "text-3xl font-bold",
                            isToday(currentDate) && "text-primary"
                        )}>
                            {format(currentDate, 'd MMMM yyyy', { locale: ru })}
                        </div>
                    </div>
                </Card>

                {dayEvents.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <div className="mb-2 text-4xl">📅</div>
                            <p className="mb-4">Нет записей на этот день</p>
                            <Link
                                href={route('calendar.create')}
                                data={{ date: format(currentDate, 'yyyy-MM-dd') }}
                            >
                                <Button variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Добавить запись
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {dayEvents
                            .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                            .map(event => {
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
                                        className="flex items-start gap-3 p-4 rounded-lg border bg-card transition-all active:scale-[0.98] cursor-pointer"
                                        style={{
                                            borderLeftColor: event.backgroundColor,
                                            borderLeftWidth: '4px'
                                        }}
                                    >
                                        <div 
                                            className="flex-shrink-0 w-2 h-2 rounded-full mt-1.5"
                                            style={{ backgroundColor: event.backgroundColor }}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Clock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                <span className="text-base font-semibold" style={{ color: event.backgroundColor }}>
                                                    {format(start, 'HH:mm')} - {format(end, 'HH:mm')}
                                                </span>
                                                <Badge variant="outline" className="ml-auto text-xs">
                                                    {duration} мин
                                                </Badge>
                                            </div>
                                            <div className="font-medium text-lg mb-1">{event.title}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {event.extendedProps.service}
                                            </div>
                                        </div>
                                        <Badge variant="secondary" className="flex-shrink-0 text-sm font-semibold">
                                            {new Intl.NumberFormat('ru-RU', { 
                                                style: 'currency', 
                                                currency: 'RUB', 
                                                maximumFractionDigits: 0 
                                            }).format(event.extendedProps.price)}
                                        </Badge>
                                    </div>
                                );
                            })}
                    </div>
                )}

                {/* Quick Add Button */}
                {dayEvents.length > 0 && (
                    <Link
                        href={route('calendar.create')}
                        data={{ date: format(currentDate, 'yyyy-MM-dd') }}
                    >
                        <Button className="w-full" variant="outline">
                            <Plus className="h-4 w-4 mr-2" />
                            Добавить запись
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    // Desktop: Timeline view
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <div className="flex border-b bg-muted/30 p-4 justify-center items-center">
                <div className={cn(
                    "flex flex-col items-center",
                    isToday(currentDate) && "text-primary"
                )}>
                    <span className="text-2xl font-bold">{format(currentDate, 'd', { locale: ru })}</span>
                    <span className="text-lg font-medium capitalize">{format(currentDate, 'EEEE', { locale: ru })}</span>
                </div>
            </div>

            <div ref={containerRef} className="flex-1 overflow-y-auto relative">
                <div className="flex min-h-[1920px]"> {/* 24 hours * 80px */}
                    {/* Time Column */}
                    <div className="w-20 flex-shrink-0 border-r bg-background text-sm text-muted-foreground sticky left-0 z-10 pt-2">
                        {hours.map((hour) => (
                            <div key={hour} className="h-[80px] border-b relative text-right pr-3">
                                <span className="-top-3 relative">
                                    {hour}:00
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Event Area */}
                    <div className="flex-1 relative bg-background">
                        {hours.map((_, i) => (
                            <div key={i} className="absolute inset-x-0 h-[1px] bg-border/40" style={{ top: `${(i + 1) * 80}px` }} />
                        ))}

                        {dayEvents.map(event => {
                            const durationMinutes = differenceInMinutes(new Date(event.end), new Date(event.start));
                            const isShort = durationMinutes < 60;
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

                        {isToday(currentDate) && (
                            <div
                                className="absolute w-full h-0.5 bg-red-500 z-10 pointer-events-none"
                                style={{
                                    top: `${(differenceInMinutes(new Date(), new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate(), 0, 0, 0, 0)) / 60) * 80}px`
                                }}
                            >
                                <div className="absolute -left-1.5 -top-1 w-2.5 h-2.5 rounded-full bg-red-500" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
