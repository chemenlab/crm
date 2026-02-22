import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { PlusCircle, Loader2, User, Scissors, Calendar, X, Clock, FileText } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { router } from '@inertiajs/react';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import { cn } from '@/lib/utils';
import { showAchievementToast } from '@/Components/Onboarding/AchievementToast';

interface Client {
    id: number;
    name: string;
    phone: string;
}

interface ServiceOption {
    id: number;
    name: string;
    price_change: number;
    duration_change: number;
}

interface Service {
    id: number;
    name: string;
    price: string; // comes as string from DB decimal often
    duration: number;
    color: string;
    options: ServiceOption[];
}

interface UserField {
    id: number;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'select' | 'checkbox' | 'date';
    is_required: boolean;
    options: string[] | null; // For select/checkbox
}

interface AppointmentDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    initialDate?: Date | null;
    appointment?: any; // If provided, edit mode
    mode?: 'create' | 'edit';
    userFields?: UserField[];
    clients?: Client[];
    services?: Service[];
}

export function AppointmentDialog({
    children,
    open,
    onOpenChange,
    initialDate,
    appointment,
    mode = 'create',
    userFields = [],
    clients = [],
    services = []
}: AppointmentDialogProps) {
    const [internalOpen, setInternalOpen] = useState(false);
    const isControlled = open !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [clientId, setClientId] = useState<string>('');
    const [serviceId, setServiceId] = useState<string>('');
    const [date, setDate] = useState<string>('');
    const [notes, setNotes] = useState('');
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});

    // New Entity State
    const [isNewClient, setIsNewClient] = useState(false);
    const [newClientName, setNewClientName] = useState('');
    const [newClientPhone, setNewClientPhone] = useState('');

    // Initialize form when opening
    useEffect(() => {
        if (isOpen) {
            if (mode === 'edit' && appointment) {
                // Populate form for editing
                setClientId(String(appointment.extendedProps.client_id));
                setServiceId(String(appointment.extendedProps.service_id));

                // Format date to local YYYY-MM-DDTHH:mm
                const start = new Date(appointment.start);
                start.setMinutes(start.getMinutes() - start.getTimezoneOffset());
                setDate(start.toISOString().slice(0, 16));

                setNotes(appointment.extendedProps.notes || '');

                // Options
                const optionIds = appointment.extendedProps.options?.map((o: any) => o.id) || [];
                setSelectedOptions(optionIds);

                // Custom Fields
                if (appointment.extendedProps.meta) {
                    setCustomFieldValues(appointment.extendedProps.meta);
                } else {
                    setCustomFieldValues({});
                }

                setIsNewClient(false);
                setNewClientName('');
                setNewClientPhone('');
            } else {
                // Reset form for creation
                setClientId('');
                setServiceId('');
                setNotes('');
                setSelectedOptions([]);
                setCustomFieldValues({});
                setIsNewClient(false);
                setNewClientName('');
                setNewClientPhone('');

                if (initialDate) {
                    const tzOffset = initialDate.getTimezoneOffset() * 60000;
                    const localISOTime = (new Date(initialDate.getTime() - tzOffset)).toISOString().slice(0, 16);
                    setDate(localISOTime);
                } else if (!date) {
                    const now = new Date();
                    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                    setDate(now.toISOString().slice(0, 16));
                }
            }
        }
    }, [isOpen, appointment, mode, initialDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            // Ensure start_time is in correct format YYYY-MM-DD HH:mm:ss for Laravel
            // date state is YYYY-MM-DDTHH:mm
            const formattedDate = date.replace('T', ' ');

            const payload: any = {
                service_id: serviceId,
                start_time: formattedDate,
                notes: notes,
                option_ids: selectedOptions,
                custom_fields: customFieldValues,
            };

            if (mode === 'create') {
                if (isNewClient) {
                    payload.is_new_client = true;
                    payload.new_client_name = newClientName;
                    payload.new_client_phone = newClientPhone;
                } else {
                    payload.client_id = clientId;
                }

                await axios.post('/app/calendar', payload);
                toast.success('Запись создана!');
                
                // Показываем achievement toast для онбординга
                showAchievementToast({
                    step: 'first_appointment',
                    message: 'Отлично! Вы создали первую запись',
                });
            } else {
                // Update
                payload.client_id = clientId;
                await axios.put(`/app/calendar/${appointment.id}`, payload);
                toast.success('Запись обновлена!');
            }

            setIsOpen && setIsOpen(false);
            router.reload();

        } catch (error) {
            console.error(error);
            toast.error(mode === 'create' ? 'Ошибка при создании записи' : 'Ошибка при обновлении записи');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedService = services.find(s => String(s.id) === serviceId);

    // Calculate totals for preview
    const calculateTotal = () => {
        if (!selectedService) return { price: 0, duration: 0 };

        let price = parseFloat(selectedService.price);
        let duration = selectedService.duration;

        selectedService.options.forEach(opt => {
            if (selectedOptions.includes(opt.id)) {
                price += Number(opt.price_change);
                duration += Number(opt.duration_change);
            }
        });

        return { price, duration };
    };

    const totals = calculateTotal();

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {children && <DialogTrigger asChild>{children}</DialogTrigger>}
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto p-0 gap-0">
                <div className="p-6 pb-2 border-b">
                    <DialogHeader>
                        <DialogTitle>{mode === 'create' ? 'Новая запись' : 'Редактировать запись'}</DialogTitle>
                        <DialogDescription>
                            {mode === 'create'
                                ? 'Заполните данные для создания новой записи.'
                                : 'Измените данные существующей записи.'}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="p-6 space-y-6">
                        {/* Client Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-base font-semibold">
                                <User className="w-4 h-4 text-primary" />
                                Клиент
                            </Label>

                            {!isNewClient ? (
                                <Select
                                    value={clientId}
                                    onValueChange={(val) => {
                                        if (val === '_new') {
                                            setIsNewClient(true);
                                            setClientId('');
                                        } else {
                                            setClientId(val);
                                        }
                                    }}
                                >
                                    <SelectTrigger className="h-11">
                                        <SelectValue placeholder="Выберите клиента" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="_new" className="text-primary font-medium bg-primary/5 focus:bg-primary/10 mb-1 border-b">
                                            <div className="flex items-center gap-2 py-1">
                                                <PlusCircle className="w-4 h-4" />
                                                Новый клиент
                                            </div>
                                        </SelectItem>
                                        {clients.map(client => (
                                            <SelectItem key={client.id} value={String(client.id)}>
                                                {client.name} {client.phone ? `(${client.phone})` : ''}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            ) : mode === 'edit' ? (
                                <div className="p-3 bg-muted/30 rounded-lg border flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {clients.find(c => String(c.id) === clientId)?.name?.charAt(0) || 'C'}
                                    </div>
                                    <div>
                                        <div className="font-medium">{clients.find(c => String(c.id) === clientId)?.name || 'Loading...'}</div>
                                        <div className="text-xs text-muted-foreground">{clients.find(c => String(c.id) === clientId)?.phone}</div>
                                    </div>
                                    {/* Usually we don't change client in edit mode, but if needed we can add a change button */}
                                </div>
                            ) : (
                                <div className="space-y-3 p-4 border rounded-xl bg-muted/30 border-muted-foreground/20 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-semibold flex items-center gap-2">
                                            <PlusCircle className="w-4 h-4" />
                                            Новый клиент
                                        </span>
                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => setIsNewClient(false)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                    <div className="grid gap-3">
                                        <Input
                                            placeholder="Имя клиента"
                                            value={newClientName}
                                            onChange={e => setNewClientName(e.target.value)}
                                            required={isNewClient}
                                            className="bg-background"
                                        />
                                        <Input
                                            placeholder="Телефон"
                                            value={newClientPhone}
                                            onChange={e => setNewClientPhone(e.target.value)}
                                            className="bg-background"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Service Selection */}
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-base font-semibold">
                                <Scissors className="w-4 h-4 text-primary" />
                                Услуга
                            </Label>
                            <Select
                                value={serviceId}
                                onValueChange={(val) => {
                                    setServiceId(val);
                                    setSelectedOptions([]); // Reset options when service changes
                                }}
                            >
                                <SelectTrigger className="h-11">
                                    <SelectValue placeholder="Выберите услугу" />
                                </SelectTrigger>
                                <SelectContent>
                                    {services.map(service => (
                                        <SelectItem key={service.id} value={String(service.id)}>
                                            <div className="flex justify-between w-full gap-8 items-center">
                                                <span>{service.name}</span>
                                                <Badge variant="secondary" className="font-normal text-xs">
                                                    {parseInt(service.price).toLocaleString()} ₽ • {service.duration} мин
                                                </Badge>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {/* Options */}
                            {selectedService && selectedService.options.length > 0 && (
                                <div className="mt-4 pt-3 border-t">
                                    <Label className="text-xs uppercase text-muted-foreground mb-3 block tracking-wider">Дополнительные опции</Label>
                                    <div className="grid grid-cols-1 gap-2">
                                        {selectedService.options.map(option => (
                                            <div key={option.id} className={cn(
                                                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all",
                                                selectedOptions.includes(option.id) ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                                            )}
                                                onClick={() => {
                                                    if (selectedOptions.includes(option.id)) {
                                                        setSelectedOptions(prev => prev.filter(id => id !== option.id));
                                                    } else {
                                                        setSelectedOptions(prev => [...prev, option.id]);
                                                    }
                                                }}
                                            >
                                                <Checkbox
                                                    checked={selectedOptions.includes(option.id)}
                                                    onCheckedChange={(checked) => {
                                                        if (checked) {
                                                            setSelectedOptions(prev => [...prev, option.id]);
                                                        } else {
                                                            setSelectedOptions(prev => prev.filter(id => id !== option.id));
                                                        }
                                                    }}
                                                    className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                                />
                                                <div className="flex-1 text-sm font-medium leading-none">
                                                    {option.name}
                                                </div>
                                                <div className="text-xs text-muted-foreground">
                                                    {option.price_change > 0 && `+${parseInt(option.price_change as any)} ₽`}
                                                    {option.duration_change > 0 && ` • +${option.duration_change} мин`}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-base font-semibold">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    Дата
                                </Label>
                                <Input
                                    type="date"
                                    value={date.split('T')[0]}
                                    onChange={e => {
                                        const newDate = e.target.value;
                                        const currentTime = date.includes('T') ? date.split('T')[1].substring(0, 5) : '09:00';
                                        setDate(`${newDate}T${currentTime}`);
                                    }}
                                    required
                                    className="h-11"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="flex items-center gap-2 text-base font-semibold">
                                    <Clock className="w-4 h-4 text-primary" />
                                    Время start
                                </Label>
                                <Input
                                    type="time"
                                    value={date.includes('T') ? date.split('T')[1].substring(0, 5) : ''}
                                    onChange={e => {
                                        const currentDate = date.split('T')[0];
                                        setDate(`${currentDate}T${e.target.value}`);
                                    }}
                                    required
                                    className="h-11"
                                />
                            </div>
                        </div>

                        {/* Custom Fields */}
                        {userFields.length > 0 && (
                            <div className="space-y-4 pt-2 border-t">
                                <Label className="text-xs uppercase text-muted-foreground block tracking-wider">Дополнительная информация</Label>
                                {userFields.map(field => (
                                    <div key={field.id} className="space-y-2">
                                        <Label className="text-sm font-medium">{field.label}</Label>

                                        {field.type === 'text' && (
                                            <Input
                                                value={customFieldValues[field.id] || ''}
                                                onChange={e => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                                                placeholder={field.label}
                                                required={field.is_required}
                                            />
                                        )}
                                        {field.type === 'textarea' && (
                                            <Textarea
                                                value={customFieldValues[field.id] || ''}
                                                onChange={e => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                                                placeholder={field.label}
                                                required={field.is_required}
                                            />
                                        )}
                                        {/* Basic support for other types can be expanded */}
                                        {field.type === 'number' && (
                                            <Input
                                                type="number"
                                                value={customFieldValues[field.id] || ''}
                                                onChange={e => setCustomFieldValues({ ...customFieldValues, [field.id]: e.target.value })}
                                                placeholder={field.label}
                                                required={field.is_required}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-3 pt-2 border-t">
                            <Label className="flex items-center gap-2 text-base font-semibold">
                                <FileText className="w-4 h-4 text-primary" />
                                Заметки
                            </Label>
                            <Textarea
                                placeholder="Комментарий к записи..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                className="min-h-[80px]"
                            />
                        </div>
                    </div>

                    {/* Footer Summary */}
                    <div className="p-6 bg-muted/20 border-t flex flex-col gap-4">
                        {selectedService && (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Итого к оплате / время:</span>
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-base px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                                        {totals.duration} мин
                                    </Badge>
                                    <span className="text-xl font-bold">{totals.price.toLocaleString()} ₽</span>
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 pt-2">
                            <Button type="button" variant="outline" className="flex-1" onClick={() => setIsOpen && setIsOpen(false)}>
                                Отмена
                            </Button>
                            <Button type="submit" className="flex-[2]" disabled={submitting || (!isNewClient && !clientId) || !serviceId || !date || (isNewClient && (!newClientName || !newClientPhone))}>
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Сохранение...
                                    </>
                                ) : (
                                    mode === 'create' ? 'Записать клиента' : 'Сохранить изменения'
                                )}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
