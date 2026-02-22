import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, MoreHorizontal, Clock, Scissors, Sparkles, ClipboardList, ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import AppPageLayout from '@/Layouts/AppPageLayout';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import LimitReachedAlert from '@/Components/LimitReachedAlert';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    ResponsiveTable,
    ResponsiveTableBody,
    ResponsiveTableCell,
    ResponsiveTableHead,
    ResponsiveTableHeader,
    ResponsiveTableRow,
} from '@/Components/ui/responsive-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import { ScrollArea } from '@/Components/ui/scroll-area';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import {
    AlertDialog,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { toast } from 'sonner';

// @ts-ignore
declare const route: any;

interface ServiceOption {
    id?: number;
    name: string;
    price_change: number;
    duration_change: number;
}

interface Service {
    id: number;
    name: string;
    description: string | null;
    price: number;
    duration: number;
    color: string | null;
    is_active: boolean;
    booking_type: 'appointment' | 'lead';
    options: ServiceOption[];
    custom_slot_step: number | null;
    custom_buffer_time: number | null;
}

interface Props {
    services: {
        data: Service[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    remainingSlots: number;
    isLeadsModuleActive?: boolean;
}

const serviceSchema = z.object({
    name: z.string().min(1, 'Название обязательно'),
    description: z.string().nullable(),
    price: z.coerce.number().min(0, 'Цена не может быть отрицательной'),
    duration: z.coerce.number().min(5, 'Минимальная длительность 5 минут'),
    is_active: z.boolean(),
    booking_type: z.enum(['appointment', 'lead']).default('appointment'),
    custom_slot_step: z.coerce.number().nullable().optional(),
    custom_buffer_time: z.coerce.number().nullable().optional(),
    options: z.array(z.object({
        id: z.number().optional(),
        name: z.string().min(1, 'Название опции обязательно'),
        price_change: z.coerce.number(),
        duration_change: z.coerce.number(),
    })),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

export default function ServicesIndex({ services, remainingSlots: remaining_slots, isLeadsModuleActive = false }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string; error: string | null; isDeleting: boolean }>({
        open: false,
        id: null,
        name: '',
        error: null,
        isDeleting: false,
    });

    // Show flash messages
    const { props } = usePage<any>();
    const { auth } = props;
    const hasActiveSubscription = auth?.user?.currentSubscription?.status === 'active' || auth?.user?.currentSubscription?.status === 'trial';

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    const form = useForm<ServiceFormValues>({
        resolver: zodResolver(serviceSchema) as any,
        defaultValues: {
            name: '',
            description: '',
            price: 0,
            duration: 60,
            is_active: true,
            booking_type: 'appointment',
            custom_slot_step: null,
            custom_buffer_time: null,
            options: [],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: 'options',
    });

    const onSubmit = (data: ServiceFormValues) => {
        if (editingService) {
            router.patch(route('services.update', editingService.id), data, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingService(null);
                    form.reset();
                },
            });
        } else {
            router.post(route('services.store'), data, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleEdit = (service: Service) => {
        setEditingService(service);
        form.reset({
            name: service.name,
            description: service.description,
            price: service.price,
            duration: service.duration,
            is_active: !!service.is_active,
            booking_type: service.booking_type || 'appointment',
            custom_slot_step: service.custom_slot_step,
            custom_buffer_time: service.custom_buffer_time,
            options: service.options.map(opt => ({
                id: opt.id,
                name: opt.name,
                price_change: opt.price_change,
                duration_change: opt.duration_change,
            })),
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (service: Service) => {
        setDeleteConfirm({
            open: true,
            id: service.id,
            name: service.name,
            error: null,
            isDeleting: false,
        });
    };

    const confirmDelete = () => {
        if (deleteConfirm.id) {
            setDeleteConfirm(prev => ({ ...prev, isDeleting: true, error: null }));
            router.delete(route('services.destroy', deleteConfirm.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDeleteConfirm({ open: false, id: null, name: '', error: null, isDeleting: false });
                },
                onError: (errors) => {
                    setDeleteConfirm(prev => ({
                        ...prev,
                        isDeleting: false,
                        error: errors.service || 'Не удалось удалить услугу'
                    }));
                },
            });
        }
    };

    const closeDeleteDialog = () => {
        setDeleteConfirm({ open: false, id: null, name: '', error: null, isDeleting: false });
    };

    const handleAddNew = () => {
        setEditingService(null);
        form.reset({
            name: '',
            description: '',
            price: 0,
            duration: 60,
            is_active: true,
            booking_type: 'appointment',
            custom_slot_step: null,
            custom_buffer_time: null,
            options: [],
        });
        setIsDialogOpen(true);
    };

    return (
        <AppPageLayout title="Услуги">
            <Head title="Услуги" />

            <div className="flex flex-col gap-6 w-full">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Услуги
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Управляйте списком ваших услуг и их стоимостью
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="sm" onClick={handleAddNew} className="cursor-pointer shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 active:scale-95 h-9" disabled={!hasActiveSubscription || remaining_slots === 0}>
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить услугу
                        </Button>
                    </div>
                </div>

                    {!hasActiveSubscription && (
                        <SubscriptionRequired
                            title="Требуется подписка"
                            description="Для управления услугами необходима активная подписка"
                        />
                    )}

                    {hasActiveSubscription && remaining_slots === 0 && (
                        <LimitReachedAlert
                            resourceName="Услуги"
                            message="Вы достигли лимита услуг для вашего тарифного плана. Удалите существующие услуги или обновите тариф для добавления новых."
                        />
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle>Список услуг ({services.total})</CardTitle>
                            <CardDescription>
                                Перечень доступных процедур для записи
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveTable>
                                <ResponsiveTableHeader>
                                    <ResponsiveTableRow>
                                        <ResponsiveTableHead>Название</ResponsiveTableHead>
                                        <ResponsiveTableHead>Длительность</ResponsiveTableHead>
                                        <ResponsiveTableHead>Цена</ResponsiveTableHead>
                                        <ResponsiveTableHead>Статус</ResponsiveTableHead>
                                        <ResponsiveTableHead className="text-right">Действия</ResponsiveTableHead>
                                    </ResponsiveTableRow>
                                </ResponsiveTableHeader>
                                <ResponsiveTableBody>
                                    {services.data.length === 0 ? (
                                        <ResponsiveTableRow>
                                            <ResponsiveTableCell colSpan={5} className="h-[300px] text-center">
                                                <div className="flex flex-col items-center justify-center gap-2">
                                                    <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                                                        <Scissors className="h-6 w-6 text-muted-foreground" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold">Нет услуг</h3>
                                                    <p className="text-muted-foreground max-w-sm">
                                                        Ваш список услуг пуст. Добавьте услуги, чтобы клиенты могли записываться к вам.
                                                    </p>
                                                    <Button variant="outline" onClick={handleAddNew} className="mt-4">
                                                        Создать услугу
                                                    </Button>
                                                </div>
                                            </ResponsiveTableCell>
                                        </ResponsiveTableRow>
                                    ) : (
                                        services.data.map((service) => (
                                            <ResponsiveTableRow
                                                key={service.id}
                                                mobileCardContent={
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-base mb-1">{service.name}</div>
                                                                {service.description && (
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {service.description}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                                                    <DropdownMenuItem onClick={() => handleEdit(service)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Редактировать
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => handleDelete(service)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Удалить
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-2 border-t">
                                                            <div className="flex items-center gap-4">
                                                                <div className="flex items-center gap-1 text-sm">
                                                                    <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span>{service.duration} мин</span>
                                                                </div>
                                                                <Badge variant={service.is_active ? 'outline' : 'secondary'} className={service.is_active ? "bg-primary/5 text-primary border-primary/20" : ""}>
                                                                    {service.is_active ? 'Активна' : 'Скрыта'}
                                                                </Badge>
                                                            </div>
                                                            <div className="font-semibold text-primary text-lg">
                                                                {Number(service.price).toLocaleString('ru-RU')} ₽
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <ResponsiveTableCell className="font-medium">
                                                    <div>{service.name}</div>
                                                    {service.description && (
                                                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                                                            {service.description}
                                                        </div>
                                                    )}
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    <div className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3 text-muted-foreground" />
                                                        {service.duration} мин
                                                    </div>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    <div className="font-semibold text-primary">
                                                        {Number(service.price).toLocaleString('ru-RU')} ₽
                                                    </div>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    <Badge variant={service.is_active ? 'outline' : 'secondary'} className={service.is_active ? "bg-primary/5 text-primary border-primary/20" : ""}>
                                                        {service.is_active ? 'Активна' : 'Скрыта'}
                                                    </Badge>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                                <span className="sr-only">Открыть меню</span>
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                                            <DropdownMenuItem onClick={() => handleEdit(service)}>
                                                                <Pencil className="mr-2 h-4 w-4" />
                                                                Редактировать
                                                            </DropdownMenuItem>
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                className="text-destructive focus:text-destructive"
                                                                onClick={() => handleDelete(service)}
                                                            >
                                                                <Trash2 className="mr-2 h-4 w-4" />
                                                                Удалить
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </ResponsiveTableCell>
                                            </ResponsiveTableRow>
                                        ))
                                    )}
                                </ResponsiveTableBody>
                            </ResponsiveTable>
                        </CardContent>

                        {/* Pagination */}
                        {services.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Показано {services.from} - {services.to} из {services.total} услуг
                                </p>
                                <div className="flex items-center gap-1">
                                    {services.links.map((link, idx) => {
                                        if (idx === 0) {
                                            return (
                                                <Button
                                                    key="prev"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                    className="h-8 px-2"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                            );
                                        }
                                        if (idx === services.links.length - 1) {
                                            return (
                                                <Button
                                                    key="next"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                    className="h-8 px-2"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            );
                                        }
                                        return (
                                            <Button
                                                key={idx}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className="h-8 w-8 p-0"
                                            >
                                                {link.label.replace('&laquo;', '').replace('&raquo;', '')}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="sm:max-w-[600px]">
                            <DialogHeader>
                                <DialogTitle>{editingService ? 'Редактировать услугу' : 'Новая услуга'}</DialogTitle>
                                <DialogDescription>
                                    Заполните информация об услуге. Нажмите сохранить, когда закончите.
                                </DialogDescription>
                            </DialogHeader>
                            <ScrollArea className="max-h-[80vh] pr-4">
                                <form id="service-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                                    <div className="grid gap-4 bg-muted/20 p-4 rounded-lg border">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Название</Label>
                                            <Input id="name" {...form.register('name')} placeholder="Например: Стрижка мужская" className="bg-background" />
                                            {form.formState.errors.name && (
                                                <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                            )}
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Описание</Label>
                                            <Textarea id="description" {...form.register('description')} placeholder="Краткое описание услуги..." className="bg-background" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="price">Цена (₽)</Label>
                                                <Input id="price" type="number" {...form.register('price')} className="bg-background" />
                                                {form.formState.errors.price && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.price.message}</p>
                                                )}
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="duration">Длительность (мин)</Label>
                                                <Input id="duration" type="number" {...form.register('duration')} className="bg-background" />
                                                {form.formState.errors.duration && (
                                                    <p className="text-sm text-destructive">{form.formState.errors.duration.message}</p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 pt-2">
                                            <Switch
                                                id="is_active"
                                                checked={form.watch('is_active')}
                                                onCheckedChange={(checked) => form.setValue('is_active', checked)}
                                            />
                                            <Label htmlFor="is_active">Услуга активна и доступна для записи</Label>
                                        </div>
                                    </div>

                                    {/* Booking Type Section - only show if Leads module is active */}
                                    {isLeadsModuleActive && (
                                        <div className="grid gap-4 bg-muted/20 p-4 rounded-lg border">
                                            <div className="flex items-center gap-2 mb-2">
                                                <ClipboardList className="h-4 w-4 text-primary" />
                                                <Label className="text-base font-semibold">Тип записи</Label>
                                            </div>
                                            <div className="grid gap-2">
                                                <Select
                                                    value={form.watch('booking_type')}
                                                    onValueChange={(value: 'appointment' | 'lead') => form.setValue('booking_type', value)}
                                                >
                                                    <SelectTrigger className="bg-background">
                                                        <SelectValue placeholder="Выберите тип записи" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="appointment">
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="h-4 w-4" />
                                                                <span>Запись на время</span>
                                                            </div>
                                                        </SelectItem>
                                                        <SelectItem value="lead">
                                                            <div className="flex items-center gap-2">
                                                                <ClipboardList className="h-4 w-4" />
                                                                <span>Заявка без даты</span>
                                                            </div>
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <p className="text-xs text-muted-foreground">
                                                    {form.watch('booking_type') === 'lead'
                                                        ? 'Клиенты смогут оставить заявку без выбора даты и времени. Заявки отображаются на Kanban-доске.'
                                                        : 'Клиенты выбирают дату и время для записи в вашем календаре.'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Booking Settings Section */}
                                    <div className="grid gap-4 bg-muted/20 p-4 rounded-lg border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-4 w-4 text-primary" />
                                            <Label className="text-base font-semibold">Настройки записи</Label>
                                        </div>
                                        <p className="text-xs text-muted-foreground -mt-2 mb-2">
                                            Оставьте пустым, чтобы использовать глобальные настройки из раздела «Настройки записи»
                                        </p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="custom_slot_step">Шаг сетки времени</Label>
                                                <Select
                                                    value={form.watch('custom_slot_step')?.toString() || 'default'}
                                                    onValueChange={(value) => form.setValue('custom_slot_step', value === 'default' ? null : parseInt(value))}
                                                >
                                                    <SelectTrigger id="custom_slot_step" className="bg-background">
                                                        <SelectValue placeholder="По умолчанию" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">По умолчанию</SelectItem>
                                                        <SelectItem value="15">15 минут</SelectItem>
                                                        <SelectItem value="30">30 минут</SelectItem>
                                                        <SelectItem value="45">45 минут</SelectItem>
                                                        <SelectItem value="60">60 минут</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="custom_buffer_time">Перерыв после записи</Label>
                                                <Select
                                                    value={form.watch('custom_buffer_time')?.toString() || 'default'}
                                                    onValueChange={(value) => form.setValue('custom_buffer_time', value === 'default' ? null : parseInt(value))}
                                                >
                                                    <SelectTrigger id="custom_buffer_time" className="bg-background">
                                                        <SelectValue placeholder="По умолчанию" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">По умолчанию</SelectItem>
                                                        <SelectItem value="0">Без перерыва</SelectItem>
                                                        <SelectItem value="5">5 минут</SelectItem>
                                                        <SelectItem value="10">10 минут</SelectItem>
                                                        <SelectItem value="15">15 минут</SelectItem>
                                                        <SelectItem value="30">30 минут</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4 text-primary" />
                                                <Label className="text-base font-semibold">Дополнительные опции</Label>
                                            </div>
                                            <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', price_change: 0, duration_change: 0 })}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Добавить
                                            </Button>
                                        </div>

                                        {fields.length === 0 && (
                                            <div className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg bg-muted/10">
                                                У этой услуги нет дополнительных опций (например: мытье головы, укладка)
                                            </div>
                                        )}

                                        {fields.map((field, index) => (
                                            <div key={field.id} className="grid gap-4 p-4 border border-dashed rounded-lg relative bg-background/50 hover:bg-muted/10 transition-colors">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-2 h-6 w-6 text-muted-foreground hover:text-destructive"
                                                    onClick={() => remove(index)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                                <div className="grid gap-2">
                                                    <Label>Название опции</Label>
                                                    <Input {...form.register(`options.${index}.name`)} placeholder="Например: Мытье головы" />
                                                    {form.formState.errors.options?.[index]?.name && (
                                                        <p className="text-sm text-destructive">{form.formState.errors.options[index]?.name?.message}</p>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="grid gap-2">
                                                        <Label>+ к цене (₽)</Label>
                                                        <Input type="number" {...form.register(`options.${index}.price_change`)} />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label>+ к времени (мин)</Label>
                                                        <Input type="number" {...form.register(`options.${index}.duration_change`)} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </form>
                            </ScrollArea>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                                <Button type="submit" form="service-form" disabled={form.formState.isSubmitting}>
                                    {editingService ? 'Сохранить изменения' : 'Создать услугу'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <AlertDialog open={deleteConfirm.open} onOpenChange={(open) => !open && closeDeleteDialog()}>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Удаление услуги</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {deleteConfirm.error ? (
                                        <span className="text-destructive">{deleteConfirm.error}</span>
                                    ) : (
                                        <>Вы точно хотите удалить "{deleteConfirm.name}"? Это действие нельзя будет отменить.</>
                                    )}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            {deleteConfirm.error && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        Сначала удалите или перенесите все записи с этой услугой.
                                    </AlertDescription>
                                </Alert>
                            )}
                            <AlertDialogFooter>
                                <AlertDialogCancel onClick={closeDeleteDialog}>
                                    {deleteConfirm.error ? 'Закрыть' : 'Отмена'}
                                </AlertDialogCancel>
                                {!deleteConfirm.error && (
                                    <Button
                                        variant="destructive"
                                        onClick={confirmDelete}
                                        disabled={deleteConfirm.isDeleting}
                                    >
                                        {deleteConfirm.isDeleting ? 'Удаление...' : 'Да, удалить'}
                                    </Button>
                                )}
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
            </div>
        </AppPageLayout>
    );
}
