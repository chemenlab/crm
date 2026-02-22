import { Head, Link, useForm, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Trash2, ArrowLeft, Calendar as CalendarIcon, Clock, CreditCard, User, Scissors } from 'lucide-react';
import { format } from 'date-fns';
import { ImageFieldUpload } from '@/Components/ImageFieldUpload';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { toast } from 'sonner';

// @ts-ignore
declare const route: any;

interface Props {
    appointment: any;
    clients: any[];
    services: any[];
    customFields: any[];
}

export default function CalendarEdit({ appointment, clients, services, customFields = [] }: Props) {
    const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [deleteConfirm, setDeleteConfirm] = useState(false);

    // Show flash messages
    const { props } = usePage<any>();
    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    const { data, setData, put, processing, errors, delete: destroy } = useForm({
        client_id: appointment.client_id,
        service_id: appointment.service_id,
        start_time: format(new Date(appointment.start_time), "yyyy-MM-dd'T'HH:mm"),
        status: appointment.status,
        note: appointment.note || '',
        price: appointment.price,
    });

    // Load existing custom field values
    useEffect(() => {
        if (appointment.meta && appointment.meta.length > 0) {
            const fieldValues: Record<number, any> = {};
            appointment.meta.forEach((meta: any) => {
                // meta has custom_field (relationship) or user_field_id (FK)
                const fieldId = meta.custom_field?.id || meta.user_field_id;
                if (fieldId && meta.value) {
                    try {
                        // Try to parse as JSON (for arrays/objects)
                        const parsed = JSON.parse(meta.value);
                        fieldValues[fieldId] = parsed;
                    } catch {
                        // If not JSON, use as is
                        fieldValues[fieldId] = meta.value;
                    }
                }
            });
            setCustomFieldValues(fieldValues);
            console.log('Loaded custom field values:', fieldValues);
        }

        // Load existing service options
        if (appointment.options && appointment.options.length > 0) {
            const optionIds = appointment.options.map((opt: any) => opt.id);
            setSelectedOptions(optionIds);
            console.log('Loaded service options:', optionIds);
        }
    }, [appointment]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Updating with custom fields:', customFieldValues);

        // Update form data with custom fields and service options before submitting
        const submitData = {
            ...data,
            custom_fields: customFieldValues,
            option_ids: selectedOptions,
        };

        console.log('Final update data:', submitData);

        // Use Inertia's router.patch directly with data (route uses PATCH method)
        router.patch(route('calendar.update', appointment.id), submitData, {
            preserveState: false,
            onSuccess: () => {
                console.log('✅ Appointment updated successfully');
            },
            onError: (errors) => {
                console.error('❌ Failed to update appointment:', errors);
            },
        });
    };

    const handleOptionToggle = (optionId: number) => {
        setSelectedOptions(prev =>
            prev.includes(optionId)
                ? prev.filter(id => id !== optionId)
                : [...prev, optionId]
        );
    };

    const handleDelete = () => {
        setDeleteConfirm(true);
    };

    const confirmDelete = () => {
        destroy(route('calendar.destroy', appointment.id), {
            onSuccess: () => {
                setDeleteConfirm(false);
            },
        });
    };

    const handleServiceChange = (serviceId: string) => {
        const service = services.find(s => s.id.toString() === serviceId);
        setData(data => ({
            ...data,
            service_id: serviceId,
            price: service?.price || data.price,
        }));
        // Reset options when service changes
        setSelectedOptions([]);
    };

    const selectedService = services.find((s: any) => s.id.toString() === data.service_id);

    const calculateTotal = () => {
        if (!selectedService) return { price: 0, duration: 0 };

        let price = parseFloat(selectedService.price);
        let duration = selectedService.duration;

        if (selectedService.options && selectedService.options.length > 0) {
            selectedService.options.forEach((opt: any) => {
                if (selectedOptions.includes(opt.id)) {
                    price += Number(opt.price_change);
                    duration += Number(opt.duration_change);
                }
            });
        }

        return { price, duration };
    };

    const totals = calculateTotal();

    return (
        <AppSidebarProvider>
            <Head title={`Редактирование записи #${appointment.id}`} />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="max-w-3xl mx-auto w-full p-4 md:p-8">
                    <div className="flex items-center justify-between mb-6">
                        <Button variant="ghost" asChild>
                            <Link href={route('calendar.index')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Назад в календарь
                            </Link>
                        </Button>
                        <Button variant="destructive" size="icon" onClick={handleDelete}>
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Редактирование записи</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Client & Service Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="client">Клиент</Label>
                                        <div className="relative">
                                            <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Select
                                                value={data.client_id.toString()}
                                                onValueChange={(val) => setData('client_id', val)}
                                            >
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Выберите клиента" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {clients.map(client => (
                                                        <SelectItem key={client.id} value={client.id.toString()}>
                                                            {client.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {errors.client_id && <p className="text-sm text-red-500">{errors.client_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="service">Услуга</Label>
                                        <div className="relative">
                                            <Scissors className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Select
                                                value={data.service_id.toString()}
                                                onValueChange={handleServiceChange}
                                            >
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Выберите услугу" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {services.map(service => (
                                                        <SelectItem key={service.id} value={service.id.toString()}>
                                                            {service.name} ({Number(service.price).toLocaleString()} ₽)
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {errors.service_id && <p className="text-sm text-red-500">{errors.service_id}</p>}

                                        {/* Service Options */}
                                        {selectedService && selectedService.options && selectedService.options.length > 0 && (
                                            <div className="mt-4 p-3 bg-muted/30 rounded-lg space-y-2">
                                                <Label className="text-sm font-semibold">Дополнительные опции</Label>
                                                <div className="space-y-2">
                                                    {selectedService.options.map((option: any) => (
                                                        <div key={option.id} className="flex items-center justify-between p-2 bg-background rounded border">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`option-${option.id}`}
                                                                    checked={selectedOptions.includes(option.id)}
                                                                    onCheckedChange={() => handleOptionToggle(option.id)}
                                                                />
                                                                <Label htmlFor={`option-${option.id}`} className="font-normal cursor-pointer">
                                                                    {option.name}
                                                                </Label>
                                                            </div>
                                                            <div className="text-sm text-muted-foreground">
                                                                {option.price_change > 0 && `+${parseInt(option.price_change)} ₽`}
                                                                {option.duration_change > 0 && ` • +${option.duration_change} мин`}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="pt-2 border-t">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-semibold">Итого:</span>
                                                        <span className="font-semibold">{totals.price.toLocaleString('ru-RU')} ₽ • {totals.duration} мин</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Date & Status Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="start_time">Дата и время</Label>
                                        <div className="relative">
                                            <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="start_time"
                                                type="datetime-local"
                                                className="pl-9"
                                                value={data.start_time}
                                                onChange={e => setData('start_time', e.target.value)}
                                            />
                                        </div>
                                        {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="status">Статус</Label>
                                        <Select
                                            value={data.status}
                                            onValueChange={(val) => setData('status', val)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="scheduled">Запланировано</SelectItem>
                                                <SelectItem value="confirmed">Подтверждено</SelectItem>
                                                <SelectItem value="completed">Выполнено</SelectItem>
                                                <SelectItem value="cancelled">Отменено</SelectItem>
                                                <SelectItem value="no_show">Неявка</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.status && <p className="text-sm text-red-500">{errors.status}</p>}
                                    </div>
                                </div>

                                {/* Price */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Стоимость</Label>
                                        <div className="relative">
                                            <CreditCard className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="price"
                                                type="number"
                                                className="pl-9"
                                                value={data.price}
                                                onChange={e => setData('price', e.target.value)}
                                            />
                                        </div>
                                        {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <Label htmlFor="note">Заметки</Label>
                                    <Textarea
                                        id="note"
                                        rows={4}
                                        value={data.note}
                                        onChange={e => setData('note', e.target.value)}
                                        placeholder="Дополнительная информация..."
                                    />
                                </div>

                                {/* Custom Fields */}
                                {customFields.length > 0 && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                                            Дополнительная информация
                                        </h3>
                                        {customFields.map(field => (
                                            <div key={field.id} className="space-y-2">
                                                <Label>
                                                    {field.name}
                                                    {field.is_required && <span className="text-destructive ml-1">*</span>}
                                                </Label>

                                                {field.type === 'text' && (
                                                    <Input
                                                        value={customFieldValues[field.id] || ''}
                                                        onChange={e => setCustomFieldValues({
                                                            ...customFieldValues,
                                                            [field.id]: e.target.value
                                                        })}
                                                        required={field.is_required}
                                                    />
                                                )}

                                                {field.type === 'number' && (
                                                    <Input
                                                        type="number"
                                                        value={customFieldValues[field.id] || ''}
                                                        onChange={e => setCustomFieldValues({
                                                            ...customFieldValues,
                                                            [field.id]: e.target.value
                                                        })}
                                                        required={field.is_required}
                                                    />
                                                )}

                                                {field.type === 'date' && (
                                                    <Input
                                                        type="date"
                                                        value={customFieldValues[field.id] || ''}
                                                        onChange={e => setCustomFieldValues({
                                                            ...customFieldValues,
                                                            [field.id]: e.target.value
                                                        })}
                                                        required={field.is_required}
                                                    />
                                                )}

                                                {field.type === 'checkbox' && (
                                                    <div className="flex items-center space-x-2">
                                                        <Checkbox
                                                            id={`checkbox-${field.id}`}
                                                            checked={customFieldValues[field.id] || false}
                                                            onCheckedChange={(checked) => setCustomFieldValues({
                                                                ...customFieldValues,
                                                                [field.id]: checked
                                                            })}
                                                        />
                                                        <Label htmlFor={`checkbox-${field.id}`} className="font-normal cursor-pointer">
                                                            {field.name}
                                                        </Label>
                                                    </div>
                                                )}

                                                {field.type === 'image' && (
                                                    <ImageFieldUpload
                                                        fieldId={field.id}
                                                        value={customFieldValues[field.id] || (field.allow_multiple ? [] : '')}
                                                        onChange={(value) => setCustomFieldValues({
                                                            ...customFieldValues,
                                                            [field.id]: value
                                                        })}
                                                        allowMultiple={field.allow_multiple}
                                                    />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={processing} className="w-full md:w-auto">
                                        Сохранить изменения
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <ConfirmDialog
                    open={deleteConfirm}
                    onOpenChange={setDeleteConfirm}
                    onConfirm={confirmDelete}
                    title="Удаление записи"
                    description="Вы точно хотите удалить эту запись?"
                />
            </SidebarInset>
        </AppSidebarProvider>
    );
}
