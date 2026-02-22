import { useState, FormEvent } from 'react';
import { router, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    Phone,
    Mail,
    MessageSquare,
    Calendar,
    TrendingUp,
    Clock,
    CreditCard,
    Banknote,
    Pencil,
    Tag as TagIcon,
    MoreVertical,
    Wallet
} from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import {
    SidebarInset,
} from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Button } from '@/Components/ui/button';
import {
    ResponsiveTable,
    ResponsiveTableBody,
    ResponsiveTableCell,
    ResponsiveTableHead,
    ResponsiveTableHeader,
    ResponsiveTableRow,
} from '@/Components/ui/responsive-table';
import { Badge } from '@/Components/ui/badge';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { AppointmentDetailsModal } from '@/Components/AppointmentDetailsModal';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Separator } from '@/Components/ui/separator';

interface Client {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    telegram_id?: string;
    notes?: string;
    tags?: Array<{
        id: number;
        name: string;
        color: string;
    }>;
}

interface Appointment {
    id: number;
    start_time: string;
    end_time: string;
    status: string;
    payment_method?: string;
    price: number;
    service?: {
        id: number;
        name: string;
    };
    options: Array<{
        id: number;
        name: string;
    }>;
}

interface Stats {
    total_visits: number;
    total_spent: number;
    upcoming_appointments: number;
    last_visit?: string;
}

interface Props {
    client: Client;
    appointments: Appointment[];
    stats: Stats;
    customFields?: any[];
    availableTags?: any[];
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
    scheduled: { label: 'Запланировано', variant: 'outline' },
    confirmed: { label: 'Подтверждено', variant: 'default' }, // Используем default (черный/белый) для подтвержденных
    completed: { label: 'Завершено', variant: 'secondary' },    // Серый для завершенных
    cancelled: { label: 'Отменено', variant: 'destructive' },
    no_show: { label: 'Не пришёл', variant: 'destructive' },
};

export default function Show({ client, appointments, stats, customFields = [], availableTags = [] }: Props) {
    const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name: client.name,
        phone: client.phone || '',
        email: client.email || '',
        telegram_id: client.telegram_id || '',
        notes: client.notes || '',
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'd MMMM yyyy, HH:mm', { locale: ru });
    };

    const formatShortDate = (dateString: string) => {
        return format(new Date(dateString), 'd MMM yyyy', { locale: ru });
    };

    const handleAppointmentClick = (appointment: Appointment) => {
        const modalAppointment = {
            id: appointment.id,
            title: appointment.service?.name || 'Без услуги',
            start: appointment.start_time,
            end: appointment.end_time,
            extendedProps: {
                client_id: client.id,
                client_name: client.name,
                client_phone: client.phone,
                client: client,
                service_id: appointment.service?.id,
                service_name: appointment.service?.name,
                service_price: appointment.price || 0,
                service_duration: 0,
                total_price: appointment.price,
                price: appointment.price,
                status: appointment.status,
                payment_method: appointment.payment_method,
                options: appointment.options || [],
                custom_fields: [],
                tags: client.tags || [],
            },
        };
        setSelectedAppointment(modalAppointment);
        setIsDetailsModalOpen(true);
    };

    const handleEditAppointment = () => {
        if (selectedAppointment) {
            router.visit(`/app/calendar/${selectedAppointment.id}/edit`);
        }
    };

    const handleCloseModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedAppointment(null);
        router.reload();
    };

    const handleEditClient = () => {
        setIsEditDialogOpen(true);
    };

    const handleSaveClient = (e: FormEvent) => {
        e.preventDefault();
        put(`/app/clients/${client.id}`, {
            onSuccess: () => {
                setIsEditDialogOpen(false);
                router.reload();
            },
        });
    };

    return (
        <AppSidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-6 p-4 pt-0">

                    {/* Header Controls */}
                    <div className="flex items-center gap-4 py-4">
                        <Button
                            variant="outline"
                            size="icon"
                            className="h-9 w-9"
                            onClick={() => router.visit('/app/clients')}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex-1">
                            <h1 className="text-xl font-semibold tracking-tight">Профиль клиента</h1>
                        </div>
                        <Button onClick={handleEditClient} variant="outline" size="sm">
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Редактировать
                        </Button>
                    </div>

                    {/* Main Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        {/* Left Column: Info & Stats - 4 cols */}
                        <div className="lg:col-span-4 space-y-6">
                            {/* Client Card */}
                            <Card className="overflow-hidden">
                                <div className="h-24 bg-gradient-to-r from-muted/50 to-muted w-full"></div>
                                <CardContent className="pt-0 -mt-12 relative px-6 pb-6">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="p-1.5 bg-background rounded-full mb-3 shadow-sm">
                                            <Avatar className="h-24 w-24">
                                                <AvatarFallback className="text-3xl font-light bg-primary/5 text-primary">
                                                    {getInitials(client.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <h2 className="text-2xl font-bold tracking-tight mb-1">{client.name}</h2>

                                        {client.tags && client.tags.length > 0 && (
                                            <div className="flex flex-wrap justify-center gap-1.5 mt-3 mb-4">
                                                {client.tags.map((tag) => (
                                                    <Badge
                                                        key={tag.id}
                                                        variant="secondary"
                                                        className="font-normal px-2.5"
                                                        style={{
                                                            backgroundColor: `${tag.color}15`,
                                                            color: tag.color,
                                                        }}
                                                    >
                                                        {tag.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 space-y-3">
                                        {client.phone && (
                                            <div className="flex items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group">
                                                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mr-3 shadow-sm">
                                                    <Phone size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-muted-foreground font-medium mb-0.5">Телефон</div>
                                                    <div className="text-sm font-medium">{client.phone}</div>
                                                </div>
                                            </div>
                                        )}
                                        {client.email && (
                                            <div className="flex items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group">
                                                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors mr-3 shadow-sm">
                                                    <Mail size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-muted-foreground font-medium mb-0.5">Email</div>
                                                    <div className="text-sm font-medium">{client.email}</div>
                                                </div>
                                            </div>
                                        )}
                                        {client.telegram_id && (
                                            <div className="flex items-center p-3 rounded-lg bg-muted/40 hover:bg-muted/60 transition-colors group">
                                                <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center text-blue-500/80 group-hover:text-blue-600 transition-colors mr-3 shadow-sm">
                                                    <MessageSquare size={14} />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="text-xs text-muted-foreground font-medium mb-0.5">Telegram</div>
                                                    <div className="text-sm font-medium">{client.telegram_id}</div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {client.notes && (
                                        <div className="mt-6">
                                            <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-bold mb-3 pl-1">Заметки</h3>
                                            <div className="p-4 rounded-xl bg-yellow-50/50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 text-sm">
                                                {client.notes}
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Stats Grid - Vertical in left column */}
                            <div className="grid grid-cols-2 gap-3">
                                <Card className="shadow-sm border-none bg-muted/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-background shadow-sm text-primary">
                                                <Calendar size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">Визитов</span>
                                        </div>
                                        <div className="text-2xl font-bold pl-1">{stats.total_visits}</div>
                                    </CardContent>
                                </Card>
                                <Card className="shadow-sm border-none bg-muted/30">
                                    <CardContent className="p-4">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="p-2 rounded-lg bg-background shadow-sm text-green-600">
                                                <Wallet size={16} />
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground">Выручка</span>
                                        </div>
                                        <div className="text-xl font-bold pl-1 truncate" title={`${Number(stats.total_spent).toLocaleString('ru-RU')} ₽`}>
                                            {new Intl.NumberFormat('ru-RU', { notation: "compact", compactDisplay: "short" }).format(stats.total_spent)} ₽
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>

                        {/* Right Column: History - 8 cols */}
                        <div className="lg:col-span-8">
                            <Card className="h-full flex flex-col shadow-sm">
                                <CardHeader className="border-b bg-muted/10 pb-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-lg">История визитов</CardTitle>
                                            <CardDescription className="mt-1">
                                                Полная хронология записей клиента
                                            </CardDescription>
                                        </div>
                                        <Badge variant="outline" className="ml-auto">
                                            Всего: {appointments.length}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1">
                                    {appointments.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center p-12 text-muted-foreground space-y-4">
                                            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                                                <Calendar className="h-8 w-8 opacity-40" />
                                            </div>
                                            <div className="text-center">
                                                <p className="font-medium">История пуста</p>
                                                <p className="text-sm max-w-xs mx-auto mt-1">Клиент еще не посещал салон. Создайте первую запись в календаре.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <ResponsiveTable>
                                            <ResponsiveTableHeader>
                                                <ResponsiveTableRow className="bg-muted/50 hover:bg-muted/50">
                                                    <ResponsiveTableHead className="w-[180px]">Дата и время</ResponsiveTableHead>
                                                    <ResponsiveTableHead>Услуга</ResponsiveTableHead>
                                                    <ResponsiveTableHead>Статус</ResponsiveTableHead>
                                                    <ResponsiveTableHead>Оплата</ResponsiveTableHead>
                                                    <ResponsiveTableHead className="text-right">Сумма</ResponsiveTableHead>
                                                </ResponsiveTableRow>
                                            </ResponsiveTableHeader>
                                            <ResponsiveTableBody>
                                                {appointments.map((appointment) => (
                                                    <ResponsiveTableRow
                                                        key={appointment.id}
                                                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                                                        onClick={() => handleAppointmentClick(appointment)}
                                                        mobileCardContent={
                                                            <div className="space-y-3">
                                                                <div className="flex items-start justify-between">
                                                                    <div>
                                                                        <div className="font-semibold text-base py-1">
                                                                            {formatDate(appointment.start_time)}
                                                                        </div>
                                                                        <div className="text-muted-foreground text-sm">{appointment.service?.name || 'Без услуги'}</div>
                                                                    </div>
                                                                    <div className="font-bold whitespace-nowrap bg-muted/30 px-2 py-1 rounded">
                                                                        {Number(appointment.price).toLocaleString('ru-RU')} ₽
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between pt-2 border-t mt-2">
                                                                    <Badge variant={statusLabels[appointment.status]?.variant as any || 'secondary'} className="font-normal">
                                                                        {statusLabels[appointment.status]?.label || appointment.status}
                                                                    </Badge>
                                                                    <div className="flex items-center gap-2">
                                                                        {appointment.payment_method === 'card' && <CreditCard className="h-3 w-3 text-muted-foreground" />}
                                                                        {appointment.payment_method === 'cash' && <Banknote className="h-3 w-3 text-muted-foreground" />}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        }
                                                    >
                                                        <ResponsiveTableCell className="font-medium py-4">
                                                            <div className="flex flex-col">
                                                                <span>{format(new Date(appointment.start_time), 'd MMMM yyyy', { locale: ru })}</span>
                                                                <span className="text-xs text-muted-foreground">{format(new Date(appointment.start_time), 'HH:mm', { locale: ru })}</span>
                                                            </div>
                                                        </ResponsiveTableCell>
                                                        <ResponsiveTableCell>
                                                            <div className="font-medium">
                                                                {appointment.service?.name || 'Без услуги'}
                                                            </div>
                                                            {appointment.options.length > 0 && (
                                                                <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                                                                    + {appointment.options.map(opt => opt.name).join(', ')}
                                                                </div>
                                                            )}
                                                        </ResponsiveTableCell>
                                                        <ResponsiveTableCell>
                                                            <Badge variant={statusLabels[appointment.status]?.variant as any || 'secondary'} className="rounded-md font-normal shadow-sm">
                                                                {statusLabels[appointment.status]?.label || appointment.status}
                                                            </Badge>
                                                        </ResponsiveTableCell>
                                                        <ResponsiveTableCell>
                                                            {appointment.payment_method === 'cash' ? (
                                                                <div className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2 py-1 rounded text-xs">
                                                                    <Banknote className="h-3 w-3" />
                                                                    <span>Наличные</span>
                                                                </div>
                                                            ) : appointment.payment_method === 'card' ? (
                                                                <div className="inline-flex items-center gap-1.5 text-muted-foreground bg-muted/30 px-2 py-1 rounded text-xs">
                                                                    <CreditCard className="h-3 w-3" />
                                                                    <span>Карта</span>
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground text-xs">—</span>
                                                            )}
                                                        </ResponsiveTableCell>
                                                        <ResponsiveTableCell className="text-right font-medium">
                                                            {Number(appointment.price).toLocaleString('ru-RU')} ₽
                                                        </ResponsiveTableCell>
                                                    </ResponsiveTableRow>
                                                ))}
                                            </ResponsiveTableBody>
                                        </ResponsiveTable>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>

                {/* Appointment Details Modal */}
                <AppointmentDetailsModal
                    isOpen={isDetailsModalOpen}
                    onClose={handleCloseModal}
                    appointment={selectedAppointment}
                    onEdit={handleEditAppointment}
                    userFields={customFields}
                    availableTags={availableTags}
                />

                {/* Edit Client Dialog */}
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Редактировать клиента</DialogTitle>
                            <DialogDescription>
                                Измените контактную информацию и заметки
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSaveClient}>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="name">Имя *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Иван Иванов"
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-destructive">{errors.name}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Телефон</Label>
                                    <Input
                                        id="phone"
                                        value={data.phone}
                                        onChange={(e) => setData('phone', e.target.value)}
                                        placeholder="+7 (999) 123-45-67"
                                    />
                                    {errors.phone && (
                                        <p className="text-sm text-destructive">{errors.phone}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        placeholder="ivan@example.com"
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-destructive">{errors.email}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="telegram_id">Telegram</Label>
                                    <Input
                                        id="telegram_id"
                                        value={data.telegram_id}
                                        onChange={(e) => setData('telegram_id', e.target.value)}
                                        placeholder="@username"
                                    />
                                    {errors.telegram_id && (
                                        <p className="text-sm text-destructive">{errors.telegram_id}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Заметки</Label>
                                    <Textarea
                                        id="notes"
                                        value={data.notes}
                                        onChange={(e) => setData('notes', e.target.value)}
                                        placeholder="Дополнительная информация о клиенте"
                                        rows={3}
                                        className="resize-none"
                                    />
                                </div>
                            </div>
                            <DialogFooter className="gap-2 sm:gap-0">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditDialogOpen(false)}
                                    disabled={processing}
                                >
                                    Отмена
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing ? 'Сохранение...' : 'Сохранить изменения'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </SidebarInset>
        </AppSidebarProvider>
    );
}
