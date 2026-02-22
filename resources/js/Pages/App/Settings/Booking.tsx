import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Clock, Timer, ArrowLeft } from 'lucide-react';
import { Link } from '@inertiajs/react';

interface Props {
    bookingSettings: {
        slot_step: number;
        buffer_time: number;
    };
}

const slotStepOptions = [
    { value: '15', label: '15 минут' },
    { value: '30', label: '30 минут' },
    { value: '45', label: '45 минут' },
    { value: '60', label: '60 минут' },
];

const bufferTimeOptions = [
    { value: '0', label: 'Без перерыва' },
    { value: '5', label: '5 минут' },
    { value: '10', label: '10 минут' },
    { value: '15', label: '15 минут' },
    { value: '30', label: '30 минут' },
];

export default function BookingSettings({ bookingSettings }: Props) {
    const { flash } = usePage().props as any;
    const [slotStep, setSlotStep] = useState(String(bookingSettings?.slot_step ?? 30));
    const [bufferTime, setBufferTime] = useState(String(bookingSettings?.buffer_time ?? 0));
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        router.put('/app/settings/booking', {
            slot_step: parseInt(slotStep),
            buffer_time: parseInt(bufferTime),
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                setIsSubmitting(false);
            },
            onError: () => {
                setIsSubmitting(false);
                toast.error('Не удалось сохранить настройки');
            },
        });
    };

    return (
        <AppSidebarProvider>
            <Toaster />
            <Head title="Настройки записи" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-2 sm:p-4 lg:p-6 pt-0">
                    {/* Header */}
                    <div className="py-4 sm:py-6">
                        <div className="flex items-center gap-4 mb-2">
                            <Link 
                                href="/app/settings" 
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                            <h1 className="text-2xl sm:text-3xl font-bold">Настройки записи</h1>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 ml-9">
                            Настройте интервалы времени для онлайн-записи клиентов
                        </p>
                    </div>

                    {/* Content */}
                    <div className="max-w-2xl">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    Интервалы записи
                                </CardTitle>
                                <CardDescription>
                                    Эти настройки влияют на отображение доступных слотов времени на вашей публичной странице
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="slot_step">Шаг сетки времени</Label>
                                            <Select value={slotStep} onValueChange={setSlotStep}>
                                                <SelectTrigger id="slot_step">
                                                    <SelectValue placeholder="Выберите интервал" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {slotStepOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Интервал между началами доступных слотов для записи. Например, при шаге 30 минут клиент увидит слоты: 10:00, 10:30, 11:00...
                                            </p>
                                        </div>

                                        <div className="grid gap-2">
                                            <Label htmlFor="buffer_time" className="flex items-center gap-2">
                                                <Timer className="h-4 w-4" />
                                                Перерыв между записями
                                            </Label>
                                            <Select value={bufferTime} onValueChange={setBufferTime}>
                                                <SelectTrigger id="buffer_time">
                                                    <SelectValue placeholder="Выберите перерыв" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {bufferTimeOptions.map((option) => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <p className="text-xs text-muted-foreground">
                                                Время на подготовку между клиентами. Система автоматически добавит этот перерыв после каждой записи.
                                            </p>
                                        </div>
                                    </div>

                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Info card */}
                        <Card className="mt-6 bg-muted/30">
                            <CardContent className="pt-6">
                                <div className="text-sm text-muted-foreground space-y-2">
                                    <p className="font-medium text-foreground">💡 Подсказка</p>
                                    <p>
                                        Вы можете переопределить эти настройки для отдельных услуг. 
                                        Перейдите в раздел «Услуги» и отредактируйте нужную услугу, 
                                        чтобы задать индивидуальный шаг записи и перерыв.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </SidebarInset>
        </AppSidebarProvider>
    );
}
