import { useState, useEffect } from 'react';
import axios from 'axios';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import { toast } from 'sonner';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { format, addMonths, subMonths, addWeeks, subWeeks, addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import MonthView from './Views/MonthView';
import WeekView from './Views/WeekView';
import DayView from './Views/DayView';
import { AppointmentDetailsModal } from '@/Components/AppointmentDetailsModal';

// @ts-ignore
declare const route: any;

// Types
interface Appointment {
    id: number;
    start_time: string;
    end_time: string;
    client?: any;
    service?: any;
    status: string;
}

interface Service {
    id: number;
    name: string;
    price: string;
    duration: number;
    color: string;
}

interface Props {
    services: Service[];
    customFields: any[];
    availableTags: any[];
}

type ViewType = 'month' | 'week' | 'day';

export default function CalendarIndex({ services, customFields = [], availableTags = [] }: Props) {
    const [view, setView] = useState<ViewType>('month');
    const [date, setDate] = useState(new Date());
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Show flash messages
    const { props } = usePage<any>();
    const { auth } = props;
    const hasActiveSubscription = auth?.user?.currentSubscription?.status === 'active' || auth?.user?.currentSubscription?.status === 'trial';

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    // Check for appointment parameter in URL
    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const appointmentId = urlParams.get('appointment');
        const dateParam = urlParams.get('date');

        if (dateParam) {
            setDate(new Date(dateParam));
        }

        if (appointmentId && events.length > 0) {
            // Find and open the appointment
            const appointment = events.find(e => e.id === parseInt(appointmentId));
            if (appointment) {
                handleEventClick(appointment);

                // Clear URL parameters after opening
                const newUrl = window.location.pathname + (dateParam ? `?date=${dateParam}` : '');
                window.history.replaceState({}, '', newUrl);
            }
        }
    }, [events]);

    // Fetch events when date or view changes
    useEffect(() => {
        fetchEvents();
    }, [date, view]);

    const fetchEvents = async () => {
        setLoading(true);
        let start, end;

        if (view === 'month') {
            start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
            end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });
        } else if (view === 'week') {
            start = startOfWeek(date, { weekStartsOn: 1 });
            end = endOfWeek(date, { weekStartsOn: 1 });
        } else {
            start = startOfDay(date);
            end = endOfDay(date);
        }

        try {
            const response = await axios.get(route('calendar.events'), {
                params: {
                    start: start.toISOString(),
                    end: end.toISOString(),
                }
            });
            setEvents(response.data);
        } catch (error) {
            console.error("Failed to fetch events", error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        if (view === 'month') setDate(subMonths(date, 1));
        else if (view === 'week') setDate(subWeeks(date, 1));
        else setDate(subDays(date, 1));
    };

    const handleNext = () => {
        if (view === 'month') setDate(addMonths(date, 1));
        else if (view === 'week') setDate(addWeeks(date, 1));
        else setDate(addDays(date, 1));
    };

    const handleToday = () => setDate(new Date());

    const handleEventClick = (event: any) => {
        setSelectedAppointment(event);
        setIsDetailsModalOpen(true);
    };

    const handleEditAppointment = () => {
        if (selectedAppointment) {
            setIsDetailsModalOpen(false);
            router.visit(route('calendar.edit', selectedAppointment.id));
        }
    };

    return (
        <AppPageLayout title="Календарь">
            <Head title="Календарь" />

            <div className="flex flex-col gap-6 w-full">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
                    <div className="flex items-center gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                                Календарь
                            </h1>
                            <p className="text-muted-foreground text-sm sm:text-base capitalize">
                                {format(date, view === 'day' ? 'd MMMM yyyy' : 'LLLL yyyy', { locale: ru })}
                            </p>
                        </div>
                        <div className="flex items-center bg-muted/50 rounded-lg p-1 border">
                            <Button variant="ghost" size="icon" onClick={handlePrev} className="h-7 w-7 cursor-pointer">
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" onClick={handleToday} className="h-7 text-xs font-medium px-2 cursor-pointer">
                                Сегодня
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleNext} className="h-7 w-7 cursor-pointer">
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Select value={view} onValueChange={(v: ViewType) => setView(v)}>
                            <SelectTrigger className="w-[130px] h-9 cursor-pointer">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon className="w-4 h-4" />
                                    <SelectValue />
                                </div>
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="month">Месяц</SelectItem>
                                <SelectItem value="week">Неделя</SelectItem>
                                <SelectItem value="day">День</SelectItem>
                            </SelectContent>
                        </Select>

                        <Button size="sm" asChild className="cursor-pointer shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 active:scale-95 h-9" disabled={!hasActiveSubscription}>
                            <Link href={route('calendar.create')}>
                                <Plus className="mr-2 h-4 w-4" />
                                <span className="hidden sm:inline">Новая запись</span>
                                <span className="sm:hidden">Добавить</span>
                            </Link>
                        </Button>
                    </div>
                </div>

                {!hasActiveSubscription && (
                    <SubscriptionRequired
                        title="Требуется подписка"
                        description="Для управления записями необходима активная подписка"
                    />
                )}

                {/* Calendar View Area */}
                <div className="border rounded-xl bg-card shadow-sm overflow-hidden h-[calc(100vh-16rem)]">
                    {view === 'month' && (
                        <MonthView
                            currentDate={date}
                            events={events}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {view === 'week' && (
                        <WeekView
                            currentDate={date}
                            events={events}
                            onEventClick={handleEventClick}
                        />
                    )}
                    {view === 'day' && (
                        <DayView
                            currentDate={date}
                            events={events}
                            onEventClick={handleEventClick}
                        />
                    )}
                </div>
            </div>

            {/* Appointment Details Modal */}
            <AppointmentDetailsModal
                isOpen={isDetailsModalOpen}
                onClose={() => {
                    setIsDetailsModalOpen(false);
                    fetchEvents(); // Refresh events after modal close
                }}
                appointment={selectedAppointment}
                onEdit={handleEditAppointment}
                userFields={customFields}
                availableTags={availableTags}
            />
        </AppPageLayout>
    );
}
