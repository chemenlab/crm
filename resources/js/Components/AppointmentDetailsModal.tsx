import { router } from '@inertiajs/react';
import { useState, useRef, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle, Edit, Phone, Calendar as CalendarIcon, Wallet, Image as ImageIcon, CreditCard, Banknote, Tag, X, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import axios from 'axios';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';

// @ts-ignore
declare const route: any;

// Helper to convert storage path to full URL
const getImageUrl = (path: string): string => {
    if (!path) return '';
    // Already a full URL
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/storage/')) {
        return path;
    }
    // Relative path - prepend /storage/
    return `/storage/${path}`;
};

interface AppointmentDetailsProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: any;
    onEdit?: () => void;
    userFields?: any[];
    availableTags?: any[];
}

const statusConfig: Record<string, { label: string; color: string; icon: any; bg: string }> = {
    scheduled: { label: 'Новая', color: 'text-amber-600 border-amber-200', bg: 'bg-amber-50', icon: Clock },
    confirmed: { label: 'Подтверждено', color: 'text-sky-600 border-sky-200', bg: 'bg-sky-50', icon: CheckCircle2 },
    completed: { label: 'Оплачено', color: 'text-lime-700 border-lime-200', bg: 'bg-lime-50', icon: CheckCircle2 },
    cancelled: { label: 'Отменено', color: 'text-rose-600 border-rose-200', bg: 'bg-rose-50', icon: XCircle },
    no_show: { label: 'Не пришел', color: 'text-slate-600 border-slate-200', bg: 'bg-slate-50', icon: AlertCircle },
};

export function AppointmentDetailsModal({ isOpen, onClose, appointment, onEdit, userFields = [], availableTags = [] }: AppointmentDetailsProps) {
    const [editingNotes, setEditingNotes] = useState(false);
    const [notes, setNotes] = useState('');
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [showPaymentDialog, setShowPaymentDialog] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const [editingTags, setEditingTags] = useState(false);
    const [selectedTags, setSelectedTags] = useState<number[]>([]);
    const [hasScroll, setHasScroll] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Check if content is scrollable
    useEffect(() => {
        const checkScroll = () => {
            if (scrollRef.current) {
                const { scrollHeight, clientHeight } = scrollRef.current;
                setHasScroll(scrollHeight > clientHeight);
            }
        };

        // Small delay to let content render
        const timer = setTimeout(checkScroll, 100);

        // Re-check on window resize
        window.addEventListener('resize', checkScroll);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', checkScroll);
        };
    }, [isOpen, appointment, userFields]);

    if (!appointment) return null;

    const handleStatusChange = async (newStatus: string, selectedPaymentMethod?: string) => {
        try {
            await axios.patch(route('calendar.updateStatus', appointment.id), {
                status: newStatus,
                payment_method: selectedPaymentMethod,
            });

            // Update appointment status in the calendar
            if (appointment.extendedProps) {
                appointment.extendedProps.status = newStatus;
            }

            // Show success toast based on status
            const statusMessages: Record<string, string> = {
                confirmed: 'Запись подтверждена',
                completed: 'Оплата проведена',
                cancelled: 'Запись отменена',
                scheduled: 'Запись восстановлена',
                no_show: 'Клиент не пришел',
            };

            toast.success(statusMessages[newStatus] || 'Статус обновлен', {
                description: selectedPaymentMethod
                    ? `Способ оплаты: ${selectedPaymentMethod === 'cash' ? 'Наличные' : 'Перевод на карту'}`
                    : undefined,
            });

            // Reload calendar data to reflect changes
            router.reload();
        } catch (error) {
            console.error('Failed to update status:', error);
            toast.error('Не удалось обновить статус', {
                description: 'Попробуйте еще раз',
            });
        }
    };

    const handlePaymentClick = () => {
        setShowPaymentDialog(true);
    };

    const handlePaymentConfirm = () => {
        handleStatusChange('completed', paymentMethod);
        setShowPaymentDialog(false);
        setPaymentMethod('cash');
    };

    const handleSaveNotes = async () => {
        try {
            await axios.patch(route('calendar.updateNotes', appointment.id), {
                notes: notes,
            });
            setEditingNotes(false);
            // Update the appointment notes in parent
            if (appointment.extendedProps) {
                appointment.extendedProps.notes = notes;
            }
            toast.success('Заметка сохранена');
            router.reload();
        } catch (error) {
            console.error('Failed to update notes:', error);
            toast.error('Не удалось сохранить заметку');
        }
    };

    const handleEditNotes = () => {
        setNotes(appointment.extendedProps?.notes || '');
        setEditingNotes(true);
    };

    const handleEditTags = () => {
        const currentTags = appointment.extendedProps?.client?.tags || [];
        setSelectedTags(currentTags.map((t: any) => t.id));
        setEditingTags(true);
    };

    const handleSaveTags = async () => {
        try {
            const clientId = appointment.extendedProps?.client?.id;
            if (!clientId) {
                toast.error('Ошибка: клиент не найден');
                return;
            }

            // Use PATCH method as Laravel resource routes expect PATCH for update
            const response = await axios.patch(route('clients.update', clientId), {
                name: appointment.extendedProps.client.name,
                phone: appointment.extendedProps.client.phone || '',
                email: appointment.extendedProps.client.email || '',
                telegram_id: appointment.extendedProps.client.telegram_id || '',
                notes: appointment.extendedProps.client.notes || '',
                tag_ids: selectedTags,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                }
            });

            // Update local appointment data with new tags
            const updatedClient = response.data.client;
            if (appointment.extendedProps?.client && updatedClient) {
                appointment.extendedProps.client.tags = updatedClient.tags;
            }

            setEditingTags(false);

            // Reload to show updated tags immediately
            router.reload({
                only: ['appointments'],
                onSuccess: () => {
                    toast.success('Теги клиента обновлены');
                }
            });
        } catch (error: any) {
            console.error('Failed to update tags:', error);
            const errorMsg = error.response?.data?.message || 'Попробуйте еще раз';
            toast.error('Не удалось обновить теги', {
                description: errorMsg,
            });
        }
    };

    const startTime = new Date(appointment.start);
    const endTime = new Date(appointment.end);
    const status = appointment.extendedProps?.status || 'scheduled';
    const config = statusConfig[status] || statusConfig.scheduled;
    const StatusIcon = config.icon;

    const meta = appointment.extendedProps?.meta || {};
    const clientName = appointment.extendedProps?.client_name || 'Клиент';
    const totalPrice = parseInt(appointment.extendedProps?.total_price || '0');

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[480px] max-h-[95vh] p-0 overflow-hidden border-none shadow-2xl bg-card">

                {/* Modern Header */}
                <div className="relative pt-4 px-6 pb-2">
                    <DialogHeader className="space-y-3">
                        <DialogTitle className="text-2xl font-bold tracking-tight pr-8">
                            {clientName}
                        </DialogTitle>
                        {appointment.extendedProps?.client_phone && (
                            <a href={`tel:${appointment.extendedProps.client_phone}`} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5 w-fit">
                                <Phone className="w-3.5 h-3.5" />
                                {appointment.extendedProps.client_phone}
                            </a>
                        )}
                    </DialogHeader>
                </div>

                {/* Status Badge - Full Width Under Name */}
                <div className="px-6 pb-2">
                    <div className={cn(
                        "flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 transition-all",
                        config.color,
                        "shadow-sm backdrop-blur-sm"
                    )}>
                        <div className={cn(
                            "h-9 w-9 rounded-full flex items-center justify-center",
                            config.color.includes('lime') ? 'bg-lime-500/20' :
                                config.color.includes('emerald') ? 'bg-emerald-500/20' :
                                    config.color.includes('blue') ? 'bg-blue-500/20' :
                                        config.color.includes('amber') ? 'bg-amber-500/20' :
                                            config.color.includes('red') ? 'bg-red-500/20' : 'bg-gray-500/20'
                        )}>
                            <StatusIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Статус записи</div>
                            <div className="font-semibold text-sm">{config.label}</div>
                        </div>
                    </div>
                </div>

                <div className="px-6 pb-3">
                    {/* Date and Time Card */}
                    <div className="flex items-center gap-4 py-2 px-4 bg-muted/30 rounded-2xl border border-muted/40">
                        <div className="flex items-center gap-3 flex-1 border-r border-border/50 pr-4">
                            <div className="h-10 w-10 shrink-0 rounded-full bg-background flex items-center justify-center border shadow-sm text-muted-foreground">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">Дата</div>
                                <div className="font-semibold text-sm">{format(startTime, 'd MMMM', { locale: ru })}</div>
                            </div>
                        </div>
                        <div className="text-right pl-2">
                            <div className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider">Время</div>
                            <div className="font-mono font-medium text-sm">
                                {format(startTime, 'HH:mm')} - {format(endTime, 'HH:mm')}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <div ref={scrollRef} className="max-h-[45vh] overflow-y-auto px-6 pb-8 space-y-6">

                        {/* Service Card */}
                        <div className="space-y-3">
                            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                Услуга
                            </h4>
                            <div className="bg-card border rounded-xl p-4 shadow-sm group hover:border-primary/20 transition-colors">
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1">
                                        <div className="font-semibold text-base">
                                            {appointment.extendedProps?.service_name}
                                        </div>
                                        <div className="text-sm text-muted-foreground mt-1">
                                            {appointment.extendedProps?.service_price && (
                                                <span>{parseInt(appointment.extendedProps.service_price).toLocaleString()} ₽</span>
                                            )}
                                            {appointment.extendedProps?.service_duration && (
                                                <span> • {appointment.extendedProps.service_duration} мин</span>
                                            )}
                                        </div>
                                        {appointment.extendedProps?.options?.length > 0 && (
                                            <div className="mt-3 space-y-1.5">
                                                {appointment.extendedProps.options.map((o: any) => (
                                                    <div key={o.id} className="flex items-center justify-between text-sm">
                                                        <span className="text-muted-foreground">+ {o.name}</span>
                                                        <span className="text-muted-foreground font-medium">+{parseInt(o.price_change || 0).toLocaleString()} ₽</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-xs text-muted-foreground mb-1">Итого</div>
                                        <div className="font-bold text-lg tabular-nums tracking-tight">
                                            {totalPrice.toLocaleString()} ₽
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Details Grid */}
                        {(Object.keys(meta).length > 0 && userFields.length > 0) && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    Детали
                                </h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {userFields.map(field => {
                                        const value = meta[field.id];
                                        if (!value) return null;

                                        // Handle image fields
                                        if (field.type === 'image') {
                                            const images = Array.isArray(value) ? value : [value];
                                            return (
                                                <div key={field.id} className="col-span-2">
                                                    <div className="text-[11px] text-muted-foreground font-medium mb-2">{field.name}</div>
                                                    <div className="grid grid-cols-3 gap-2">
                                                        {images.map((imgUrl, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="relative group aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted cursor-pointer hover:border-primary transition-colors"
                                                                onClick={() => setSelectedImage(getImageUrl(imgUrl))}
                                                            >
                                                                <img
                                                                    src={getImageUrl(imgUrl)}
                                                                    alt={`${field.name} ${idx + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                                    <ImageIcon className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={field.id} className="bg-muted/10 border rounded-lg p-3 group hover:bg-muted/20 transition-colors">
                                                <div className="text-[11px] text-muted-foreground font-medium mb-1 line-clamp-1" title={field.name}>{field.name}</div>
                                                <div className="text-sm font-medium leading-snug break-words">
                                                    {field.type === 'checkbox' ? (value ? '✓ Да' : '✗ Нет') : value}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Client Tags */}
                        {availableTags.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                        <Tag className="w-3.5 h-3.5" />
                                        Теги клиента
                                    </h4>
                                    {!editingTags && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEditTags}
                                            className="h-7 text-xs"
                                        >
                                            <Edit className="w-3 h-3 mr-1" />
                                            Редактировать
                                        </Button>
                                    )}
                                </div>
                                {editingTags ? (
                                    <div className="space-y-3">
                                        <div className="flex flex-wrap gap-2">
                                            {availableTags.map((tag: any) => {
                                                const isSelected = selectedTags.includes(tag.id);
                                                return (
                                                    <Badge
                                                        key={tag.id}
                                                        variant={isSelected ? "default" : "outline"}
                                                        className="cursor-pointer transition-all hover:scale-105"
                                                        style={isSelected ? {
                                                            backgroundColor: tag.color,
                                                            borderColor: tag.color,
                                                            color: 'white',
                                                        } : {
                                                            borderColor: tag.color,
                                                            color: tag.color,
                                                        }}
                                                        onClick={() => {
                                                            setSelectedTags(prev =>
                                                                isSelected
                                                                    ? prev.filter(id => id !== tag.id)
                                                                    : [...prev, tag.id]
                                                            );
                                                        }}
                                                    >
                                                        {tag.name}
                                                        {isSelected && <X className="w-3 h-3 ml-1" />}
                                                    </Badge>
                                                );
                                            })}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button size="sm" onClick={handleSaveTags}>
                                                Сохранить
                                            </Button>
                                            <Button size="sm" variant="outline" onClick={() => setEditingTags(false)}>
                                                Отмена
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-wrap gap-2">
                                        {appointment.extendedProps?.client?.tags?.length > 0 ? (
                                            appointment.extendedProps.client.tags.map((tag: any) => (
                                                <Badge
                                                    key={tag.id}
                                                    variant="outline"
                                                    className="px-2 py-1"
                                                    style={{
                                                        borderColor: tag.color,
                                                        color: tag.color,
                                                    }}
                                                >
                                                    {tag.name}
                                                </Badge>
                                            ))
                                        ) : (
                                            <p className="text-sm text-muted-foreground">Тегов нет</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                    Заметки
                                </h4>
                                {!editingNotes && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleEditNotes}
                                        className="h-7 text-xs"
                                    >
                                        <Edit className="w-3 h-3 mr-1" />
                                        Редактировать
                                    </Button>
                                )}
                            </div>
                            {editingNotes ? (
                                <div className="space-y-2">
                                    <Textarea
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        rows={3}
                                        className="text-sm"
                                        placeholder="Добавьте заметку..."
                                    />
                                    <div className="flex gap-2">
                                        <Button size="sm" onClick={handleSaveNotes}>
                                            Сохранить
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingNotes(false)}>
                                            Отмена
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-100 dark:border-amber-900/20 rounded-xl p-4 text-sm leading-relaxed text-foreground/80">
                                    {appointment.extendedProps?.notes || 'Заметок нет'}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Scroll indicator gradient with animated arrow */}
                    {hasScroll && (
                        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card via-card/80 to-transparent pointer-events-none flex items-end justify-center pb-1">
                            <ChevronDown className="w-5 h-5 text-muted-foreground/60 animate-bounce" />
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-muted/5 border-t">
                    {/* Status Quick Actions */}
                    <div className="space-y-2">
                        {status === 'scheduled' && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleStatusChange('confirmed')}
                                    className="flex-1 h-10 font-medium"
                                >
                                    <CheckCircle2 className="w-4 h-4 mr-2" />
                                    Подтвердить
                                </Button>
                                {onEdit && (
                                    <Button
                                        variant="outline"
                                        onClick={onEdit}
                                        className="h-10"
                                        size="icon"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {status === 'confirmed' && (
                            <div className="flex gap-2">
                                <Button
                                    onClick={handlePaymentClick}
                                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 font-medium"
                                >
                                    <Wallet className="w-4 h-4 mr-2" />
                                    Оплатить
                                </Button>
                                {onEdit && (
                                    <Button
                                        variant="outline"
                                        onClick={onEdit}
                                        className="h-10"
                                        size="icon"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {status === 'completed' && onEdit && (
                            <Button
                                variant="outline"
                                onClick={onEdit}
                                className="w-full h-10"
                            >
                                <Edit className="w-4 h-4 mr-2" />
                                Редактировать
                            </Button>
                        )}

                        {(status === 'cancelled' || status === 'no_show') && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-10"
                                    onClick={() => handleStatusChange('scheduled')}
                                >
                                    Восстановить запись
                                </Button>
                                {onEdit && (
                                    <Button
                                        variant="outline"
                                        onClick={onEdit}
                                        className="h-10"
                                        size="icon"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </Button>
                                )}
                            </div>
                        )}

                        {/* Secondary Actions */}
                        {(status === 'scheduled' || status === 'confirmed') && (
                            <Button
                                variant="ghost"
                                onClick={() => handleStatusChange('cancelled')}
                                className="w-full text-muted-foreground hover:bg-destructive/5 hover:text-destructive h-9 text-sm"
                            >
                                Отменить запись
                            </Button>
                        )}
                    </div>
                </div>
            </DialogContent>

            {/* Payment Method Dialog */}
            <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                <DialogContent className="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Wallet className="w-5 h-5 text-primary" />
                            Выберите способ оплаты
                        </DialogTitle>
                        <DialogDescription>
                            Укажите, как клиент оплатил услугу
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-method">Способ оплаты</Label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger id="payment-method" className="h-12">
                                    <SelectValue>
                                        {paymentMethod === 'cash' ? (
                                            <div className="flex items-center gap-3">
                                                <Banknote className="w-4 h-4 text-primary" />
                                                <span>Наличные</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-3">
                                                <CreditCard className="w-4 h-4 text-blue-600" />
                                                <span>Перевод на карту</span>
                                            </div>
                                        )}
                                    </SelectValue>
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="cash">
                                        <div className="flex items-center gap-3">
                                            <Banknote className="w-4 h-4 text-primary" />
                                            <div>
                                                <div className="font-medium">Наличные</div>
                                                <div className="text-xs text-muted-foreground">Оплата наличными деньгами</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="card">
                                        <div className="flex items-center gap-3">
                                            <CreditCard className="w-4 h-4 text-blue-600" />
                                            <div>
                                                <div className="font-medium">Перевод на карту</div>
                                                <div className="text-xs text-muted-foreground">Безналичный расчет</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="bg-muted/50 rounded-lg p-4 space-y-1">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-muted-foreground">Сумма к оплате:</span>
                                <span className="text-xl font-bold">{totalPrice.toLocaleString()} ₽</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setShowPaymentDialog(false)}
                            className="flex-1"
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handlePaymentConfirm}
                            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                            Подтвердить
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Image Viewer Modal */}
            {selectedImage && (
                <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
                    <DialogContent className="max-w-4xl p-0 overflow-hidden" aria-describedby="image-viewer-description">
                        <DialogTitle className="sr-only">Просмотр изображения</DialogTitle>
                        <DialogDescription id="image-viewer-description" className="sr-only">
                            Полноэкранный просмотр загруженного изображения
                        </DialogDescription>
                        <img
                            src={selectedImage}
                            alt="Full size"
                            className="w-full h-auto max-h-[80vh] object-contain"
                        />
                    </DialogContent>
                </Dialog>
            )}
        </Dialog>
    );
}
