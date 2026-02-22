import { useState, useEffect } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Link } from '@inertiajs/react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Clock, Plus } from 'lucide-react';
import { Button } from '@/Components/ui/button';

// @ts-ignore
declare const route: any;

// Simple interface matching what we mapped in controller
interface CalendarEvent {
    id: number;
    title: string;
    start: string;
    end: string;
    backgroundColor: string;
    extendedProps: {
        price: number;
        status: string;
        service: string;
    }
}

interface Props {
    currentDate: Date;
    events: CalendarEvent[];
    onEventClick?: (event: CalendarEvent) => void;
}

export default function MonthView({ currentDate, events, onEventClick }: Props) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });
    const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
    const weekDaysFull = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

    const getDayEvents = (day: Date) => {
        return events.filter(event => isSameDay(new Date(event.start), day));
    };

    // Mobile list view: show events grouped by day
    if (isMobile) {
        // Get only current month days with events
        const daysWithEvents = days
            .filter(day => isSameMonth(day, monthStart))
            .map(day => ({
                day,
                events: getDayEvents(day)
            }))
            .filter(item => item.events.length > 0);

        return (
            <div className="space-y-3 p-2">
                {daysWithEvents.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center text-muted-foreground">
                            <div className="mb-2 text-4xl">📅</div>
                            <p>Нет записей в этом месяце</p>
                        </CardContent>
                    </Card>
                ) : (
                    daysWithEvents.map(({ day, events }) => (
                        <Card key={day.toISOString()} className="overflow-hidden">
                            <div className={cn(
                                "px-4 py-2 border-b font-medium flex items-center justify-between",
                                isToday(day) ? "bg-primary/10 text-primary" : "bg-muted/30"
                            )}>
                                <div>
                                    <div className="text-sm text-muted-foreground">
                                        {weekDaysFull[day.getDay() === 0 ? 6 : day.getDay() - 1]}
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
                            <CardContent className="p-3 space-y-2">
                                {events.map(event => (
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
                                                    {format(new Date(event.start), 'HH:mm')}
                                                </span>
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
                                ))}
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        );
    }

    // Desktop grid view
    return (
        <div className="flex flex-col h-full">
            {/* Weekday Headers */}
            <div className="grid grid-cols-7 border-b bg-muted/30">
                {weekDays.map((day) => (
                    <div key={day} className="py-2 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                        {day}
                    </div>
                ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 flex-1 auto-rows-fr">
                {days.map((day, idx) => {
                    const dayEvents = getDayEvents(day);
                    const isCurrentMonth = isSameMonth(day, monthStart);

                    return (
                        <div
                            key={day.toISOString()}
                            className={cn(
                                "min-h-[100px] p-1 border-b border-r last:border-r-0 transition-colors hover:bg-accent/5 relative group", // Added group
                                !isCurrentMonth && "bg-muted/10 text-muted-foreground",
                                idx >= days.length - 7 && "border-b-0" // Remove bottom border for last row
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "text-sm font-medium h-7 w-7 flex items-center justify-center rounded-full ml-1",
                                    isToday(day) && "bg-primary text-primary-foreground"
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {/* Quick Add Button (hidden by default, shown on hover) */}
                                <Link
                                    href={route('calendar.create')}
                                    data={{ date: format(day, 'yyyy-MM-dd') }}
                                    className="opacity-0 group-hover:opacity-100 mr-1 p-1 hover:bg-muted rounded text-xs text-muted-foreground"
                                >
                                    +
                                </Link>
                            </div>

                            <div className="space-y-1 overflow-visible"> {/* Allow some overflow if needed, or stick to hidden */}
                                {dayEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onEventClick?.(event);
                                        }}
                                        className="block truncate text-xs px-1.5 py-1 rounded shadow-sm border transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer"
                                        style={{
                                            backgroundColor: event.backgroundColor + '15', // 15% opacity
                                            borderColor: event.backgroundColor + '30',
                                            borderLeftColor: event.backgroundColor,
                                            borderLeftWidth: '3px',
                                            color: event.backgroundColor
                                        }}
                                    >
                                        <span className="font-semibold">{format(new Date(event.start), 'HH:mm')}</span> {event.title}
                                    </div>
                                ))}
                                {dayEvents.length === 0 && isCurrentMonth && (
                                    <div className="h-full w-full absolute inset-0 -z-10" />
                                    /* Click area for future enhancements */
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
