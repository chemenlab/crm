import { useEffect, useState } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle
} from '@/Components/ui/dialog';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Badge } from '@/Components/ui/badge';
import { Link } from '@inertiajs/react';
import { Button, buttonVariants } from '@/Components/ui/button';
import { Loader2, Calendar, CheckCircle2, Circle, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

// @ts-ignore
declare const route: any;

interface Appointment {
    id: number;
    start_time: string;
    end_time: string;
    client_name: string;
    service_name: string;
    status: string;
    price: number;
    price_formatted: string;
    client_phone?: string;
    notes?: string;
}

interface Props {
    date: Date;
    isOpen: boolean;
    onClose: () => void;
}

export function DayAppointmentsModal({ date, isOpen, onClose }: Props) {
    const [loading, setLoading] = useState(false);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [formattedDate, setFormattedDate] = useState('');

    useEffect(() => {
        if (isOpen && date) {
            fetchAppointments();
        }
    }, [isOpen, date]);

    const fetchAppointments = async () => {
        setLoading(true);
        try {
            const dateStr = format(date, 'yyyy-MM-dd');
            const response = await axios.get('/app/dashboard/day-appointments', {
                params: { date: dateStr }
            });
            setAppointments(response.data.appointments);
            setFormattedDate(response.data.date);
        } catch (error) {
            console.error('Failed to fetch appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'confirmed':
                return <Badge className="bg-sky-500 hover:bg-sky-600 border-none"><CheckCircle2 className="w-3 h-3 mr-1" /> Подтверждена</Badge>;
            case 'scheduled':
                return <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50"><Circle className="w-3 h-3 mr-1" /> Запланирована</Badge>;
            case 'cancelled':
                return <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-200 hover:bg-red-100 border"><XCircle className="w-3 h-3 mr-1" /> Отменена</Badge>;
            case 'completed':
                return <Badge variant="secondary" className="bg-lime-50 text-lime-700 border border-lime-200 hover:bg-lime-100"><CheckCircle2 className="w-3 h-3 mr-1" /> Завершена</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        Записи на {formattedDate || format(date, 'd MMMM', { locale: ru })}
                    </DialogTitle>
                    <DialogDescription>
                        Список всех записей на выбранный день
                    </DialogDescription>
                </DialogHeader>

                <div className="min-h-[200px]">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-muted-foreground text-sm">Загрузка записей...</p>
                        </div>
                    ) : appointments.length > 0 ? (
                        <ScrollArea className="h-[300px] pr-4">
                            <div className="space-y-3">
                                {appointments.map((app) => (
                                    <div
                                        key={app.id}
                                        className="group flex flex-col sm:flex-row items-start justify-between p-4 rounded-xl border bg-card hover:bg-accent/30 transition-all gap-4"
                                    >
                                        <div className="space-y-2 flex-1">
                                            <div className="flex items-center gap-2">
                                                <Badge variant="outline" className="font-mono text-xs">
                                                    {app.start_time} - {app.end_time}
                                                </Badge>
                                                {getStatusBadge(app.status)}
                                            </div>

                                            <div>
                                                <h4 className="font-medium text-base">{app.client_name}</h4>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <span>{app.service_name}</span>
                                                    <span>•</span>
                                                    <span className="font-medium text-foreground">{app.price_formatted}</span>
                                                </div>
                                            </div>

                                            {app.client_phone && (
                                                <div className="text-xs text-muted-foreground">
                                                    {app.client_phone}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex sm:flex-col items-center sm:items-end gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                                            <Link
                                                href={route('calendar.edit', app.id)}
                                                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "w-full sm:w-auto h-8 text-xs")}
                                            >
                                                Редактировать
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-40 space-y-2 text-center">
                            <Calendar className="h-10 w-10 text-muted-foreground/30" />
                            <p className="text-muted-foreground font-medium">Нет записей</p>
                            <p className="text-xs text-muted-foreground">На этот день пока ничего не запланировано</p>
                            <Button variant="outline" size="sm" className="mt-2">
                                Создать запись
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
