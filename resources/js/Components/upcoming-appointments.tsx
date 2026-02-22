import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';
import { CalendarClock, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Appointment {
    id: number;
    client_name: string;
    service_name: string;
    start_time: string;
    date: string;
    status: string;
}

interface UpcomingAppointmentsProps {
    appointments: Appointment[];
    className?: string;
}

export function UpcomingAppointments({ appointments, className }: UpcomingAppointmentsProps) {

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'confirmed': return 'bg-sky-500/15 text-sky-700 dark:text-sky-400 hover:bg-sky-500/25';
            case 'cancelled': return 'bg-red-500/15 text-red-700 dark:text-red-400 hover:bg-red-500/25';
            case 'pending': return 'bg-amber-500/15 text-amber-700 dark:text-amber-400 hover:bg-amber-500/25';
            default: return 'bg-slate-500/15 text-slate-700 dark:text-slate-400 hover:bg-slate-500/25';
        }
    };

    const formatStatus = (status: string) => {
        const map: Record<string, string> = {
            confirmed: 'Подтверждено',
            scheduled: 'Запланировано',
            cancelled: 'Отменено',
            pending: 'Ожидает',
            completed: 'Завершено'
        };
        return map[status] || status;
    };

    return (
        <Card className={className}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle>Ближайшие записи</CardTitle>
                    <CardDescription>
                        Ваши следующие 5 встреч
                    </CardDescription>
                </div>
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/app/calendar">
                        <CalendarClock className="h-5 w-5 text-muted-foreground" />
                    </Link>
                </Button>
            </CardHeader>
            <CardContent>
                {appointments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                        <p className="text-sm">На ближайшее время записей нет</p>
                        <Button variant="link" asChild className="mt-2">
                            <Link href="/app/calendar">Перейти в календарь</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {appointments.map((app) => (
                            <div key={app.id} className="flex items-center justify-between group">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-9 w-9 border">
                                        <AvatarFallback>{getInitials(app.client_name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{app.client_name}</p>
                                        <p className="text-xs text-muted-foreground">{app.service_name}</p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col items-end gap-1">
                                    <div className="text-sm font-bold">
                                        {app.start_time}
                                    </div>
                                    <Badge variant="secondary" className={`text-[10px] px-1.5 py-0 h-5 ${getStatusColor(app.status)}`}>
                                        {formatStatus(app.status)}
                                    </Badge>
                                </div>
                            </div>
                        ))}

                        <Button variant="outline" className="w-full mt-2" size="sm" asChild>
                            <Link href="/app/calendar">
                                Все записи <ChevronRight className="ml-2 h-3 w-3" />
                            </Link>
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
