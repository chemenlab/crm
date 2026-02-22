import { Head, Link, useForm, router } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import axios from 'axios';
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
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { ArrowLeft, User, Scissors, Plus, Phone, CheckCircle2 } from 'lucide-react';
import { ImageFieldUpload } from '@/Components/ImageFieldUpload';
import { QuickCreateClientDialog } from '@/Components/QuickCreateClientDialog';
import { QuickCreateServiceDialog } from '@/Components/QuickCreateServiceDialog';
import { DateTimePicker } from '@/Components/ui/date-time-picker';

// @ts-ignore
declare const route: any;

interface Props {
    clients: any[];
    services: any[];
    customFields: any[];
    availableTags: any[];
}

export default function CalendarCreate({ clients, services, customFields = [], availableTags = [] }: Props) {
    // Get URL params for pre-filling date
    const params = new URLSearchParams(window.location.search);
    const initialDate = params.get('date') ? `${params.get('date')}T09:00` : '';

    const [customFieldValues, setCustomFieldValues] = useState<Record<number, any>>({});
    const [clientsList, setClientsList] = useState(clients);
    const [servicesList, setServicesList] = useState(services);
    const [showClientDialog, setShowClientDialog] = useState(false);
    const [showServiceDialog, setShowServiceDialog] = useState(false);
    const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
    
    // Client search by phone
    const [phoneSearch, setPhoneSearch] = useState('');
    const [foundClient, setFoundClient] = useState<any>(null);
    const [searchingClient, setSearchingClient] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        client_id: '',
        service_id: '',
        start_time: initialDate,
        note: '',
    });

    const selectedClient = foundClient || clientsList.find((c: any) => c.id.toString() === data.client_id);
    const selectedService = servicesList.find((s: any) => s.id.toString() === data.service_id);

    // Search client by phone with debounce
    useEffect(() => {
        if (!phoneSearch || phoneSearch.length < 5) {
            setFoundClient(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setSearchingClient(true);
            try {
                const response = await axios.post(route('clients.checkPhone'), {
                    phone: phoneSearch,
                });
                
                if (response.data.exists) {
                    setFoundClient(response.data.client);
                    setData('client_id', response.data.client.id.toString());
                } else {
                    setFoundClient(null);
                    setData('client_id', '');
                }
            } catch (error) {
                console.error('Error searching client:', error);
            } finally {
                setSearchingClient(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [phoneSearch]);

    const handleCreateClientWithPhone = () => {
        setShowClientDialog(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Submitting with custom fields:', customFieldValues);
        
        // Update form data with custom fields and service options before submitting
        const submitData = {
            ...data,
            custom_fields: customFieldValues,
            option_ids: selectedOptions,
        };
        
        console.log('Final submit data:', submitData);
        
        // Use Inertia's router.post directly with data
        router.post(route('calendar.store'), submitData, {
            preserveState: false,
            onSuccess: () => {
                console.log('✅ Appointment created successfully');
            },
            onError: (errors) => {
                console.error('❌ Failed to create appointment:', errors);
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
            <Head title="Новая запись" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="max-w-3xl mx-auto w-full p-4 md:p-8">
                    <div className="mb-6">
                        <Button variant="ghost" asChild>
                            <Link href={route('calendar.index')}>
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Назад в календарь
                            </Link>
                        </Button>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Новая запись</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Client & Service Row */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="client">Клиент</Label>
                                        
                                        {/* Phone Search Input or Client Name Display */}
                                        {!foundClient ? (
                                            <div className="relative">
                                                <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    id="client-phone"
                                                    type="tel"
                                                    placeholder="Введите телефон клиента..."
                                                    className="pl-9"
                                                    value={phoneSearch}
                                                    onChange={(e) => setPhoneSearch(e.target.value)}
                                                />
                                                {searchingClient && (
                                                    <div className="absolute right-2.5 top-2.5">
                                                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={foundClient.name}
                                                    className="pl-9 bg-muted"
                                                    readOnly
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="ghost"
                                                    className="absolute right-1 top-1 h-7"
                                                    onClick={() => {
                                                        setFoundClient(null);
                                                        setPhoneSearch('');
                                                        setData('client_id', '');
                                                    }}
                                                >
                                                    Изменить
                                                </Button>
                                            </div>
                                        )}

                                        {/* Found Client Display */}
                                        {foundClient && (
                                            <Alert className="border-primary/20 bg-muted">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <AlertDescription>
                                                    <div className="space-y-2">
                                                        <div>
                                                            <p className="font-medium">
                                                                {foundClient.name}
                                                            </p>
                                                            <p className="text-sm text-muted-foreground">
                                                                {foundClient.phone}
                                                                {foundClient.email && ` • ${foundClient.email}`}
                                                            </p>
                                                        </div>
                                                        {foundClient.tags && foundClient.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1">
                                                                {foundClient.tags.map((tag: any) => (
                                                                    <Badge
                                                                        key={tag.id}
                                                                        variant="outline"
                                                                        className="text-xs"
                                                                        style={{ borderColor: tag.color, color: tag.color }}
                                                                    >
                                                                        {tag.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {/* Client Not Found - Create Button */}
                                        {phoneSearch.length >= 5 && !foundClient && !searchingClient && (
                                            <Alert>
                                                <AlertDescription className="space-y-2">
                                                    <p className="text-sm">
                                                        Клиент с номером <strong>{phoneSearch}</strong> не найден
                                                    </p>
                                                    <Button
                                                        type="button"
                                                        size="sm"
                                                        onClick={handleCreateClientWithPhone}
                                                        className="w-full"
                                                    >
                                                        <Plus className="w-3 h-3 mr-1" />
                                                        Создать клиента
                                                    </Button>
                                                </AlertDescription>
                                            </Alert>
                                        )}

                                        {errors.client_id && <p className="text-sm text-red-500">{errors.client_id}</p>}
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <Label htmlFor="service">Услуга</Label>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-7 text-xs"
                                                onClick={() => setShowServiceDialog(true)}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                Создать
                                            </Button>
                                        </div>
                                        <div className="relative">
                                            <Scissors className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                            <Select
                                                key={`service-${servicesList.length}-${data.service_id}`}
                                                value={data.service_id}
                                                onValueChange={(val) => setData('service_id', val)}
                                            >
                                                <SelectTrigger className="pl-9">
                                                    <SelectValue placeholder="Выберите услугу" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {servicesList.map(service => (
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

                                {/* Date Row */}
                                <div className="space-y-2">
                                    <Label htmlFor="start_time">Дата и время</Label>
                                    <DateTimePicker
                                        value={data.start_time}
                                        onChange={(date) => {
                                            if (date) {
                                                // Format as datetime-local string for form submission
                                                const year = date.getFullYear()
                                                const month = (date.getMonth() + 1).toString().padStart(2, '0')
                                                const day = date.getDate().toString().padStart(2, '0')
                                                const hours = date.getHours().toString().padStart(2, '0')
                                                const minutes = date.getMinutes().toString().padStart(2, '0')
                                                setData('start_time', `${year}-${month}-${day}T${hours}:${minutes}`)
                                            } else {
                                                setData('start_time', '')
                                            }
                                        }}
                                        placeholder="Выберите дату и время"
                                    />
                                    <p className="text-xs text-muted-foreground">Длительность будет рассчитана автоматически из услуги</p>
                                    {errors.start_time && <p className="text-sm text-red-500">{errors.start_time}</p>}
                                </div>

                                {/* Note */}
                                <div className="space-y-2">
                                    <Label htmlFor="note">Заметки</Label>
                                    <Textarea
                                        id="note"
                                        rows={3}
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
                                        Создать запись
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                {/* Quick Create Dialogs */}
                <QuickCreateClientDialog
                    open={showClientDialog}
                    onOpenChange={setShowClientDialog}
                    availableTags={availableTags}
                    initialPhone={phoneSearch}
                    onClientCreated={(client) => {
                        setClientsList([...clientsList, client]);
                        setData('client_id', client.id.toString());
                        setFoundClient(client);
                    }}
                />

                <QuickCreateServiceDialog
                    open={showServiceDialog}
                    onOpenChange={setShowServiceDialog}
                    onServiceCreated={(service) => {
                        setServicesList([...servicesList, service]);
                        setData('service_id', service.id.toString());
                    }}
                />
            </SidebarInset>
        </AppSidebarProvider>
    );
}
