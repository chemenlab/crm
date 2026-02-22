import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Input } from '@/Components/ui/input';
import { Bell, Clock, Moon, FileText, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

interface TelegramNotificationSettingsProps {
    isConnected: boolean;
}

interface Settings {
    appointment_created: boolean;
    appointment_updated: boolean;
    ticket_reply: boolean;
    appointment_reminder: boolean;
    reminder_time: number;
    quiet_mode_enabled: boolean;
    quiet_mode_start: string | null;
    quiet_mode_end: string | null;
    notification_format: 'brief' | 'detailed';
}

const REMINDER_TIMES = [
    { value: 15, label: '15 минут' },
    { value: 30, label: '30 минут' },
    { value: 60, label: '1 час' },
    { value: 180, label: '3 часа' },
    { value: 1440, label: '1 день' },
];

export default function TelegramNotificationSettings({ isConnected }: TelegramNotificationSettingsProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        appointment_created: true,
        appointment_updated: true,
        ticket_reply: true,
        appointment_reminder: true,
        reminder_time: 60,
        quiet_mode_enabled: false,
        quiet_mode_start: null,
        quiet_mode_end: null,
        notification_format: 'detailed',
    });

    // Загрузка настроек при монтировании
    useEffect(() => {
        if (isConnected) {
            loadSettings();
        }
    }, [isConnected]);

    const loadSettings = async () => {
        try {
            const response = await axios.get('/app/settings/telegram/settings');
            setSettings(response.data);
        } catch (error) {
            console.error('Error loading settings:', error);
            toast.error('Ошибка загрузки настроек');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        // Валидация тихого режима
        if (settings.quiet_mode_enabled) {
            if (!settings.quiet_mode_start || !settings.quiet_mode_end) {
                toast.error('Укажите время начала и конца тихого режима');
                return;
            }
        }

        setIsSaving(true);

        try {
            await axios.post('/app/settings/telegram/settings', settings);
            toast.success('Настройки сохранены');
        } catch (error: any) {
            console.error('Error saving settings:', error);
            const message = error.response?.data?.message || 'Ошибка сохранения настроек';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isConnected) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Настройки уведомлений
                    </CardTitle>
                    <CardDescription>
                        Подключите Telegram для настройки уведомлений
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        Сначала подключите Telegram аккаунт выше, чтобы настроить уведомления
                    </p>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Настройки уведомлений
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bell className="h-5 w-5" />
                    Настройки уведомлений
                </CardTitle>
                <CardDescription>
                    Управляйте типами и параметрами уведомлений в Telegram
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Типы уведомлений */}
                <div className="space-y-4">
                    <Label className="text-base font-semibold">Типы уведомлений</Label>
                    
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="appointment_created">📅 Новые записи</Label>
                                <p className="text-sm text-muted-foreground">
                                    Уведомления о новых записях клиентов
                                </p>
                            </div>
                            <Switch
                                id="appointment_created"
                                checked={settings.appointment_created}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, appointment_created: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="appointment_updated">✏️ Изменения в записях</Label>
                                <p className="text-sm text-muted-foreground">
                                    Уведомления об изменениях существующих записей
                                </p>
                            </div>
                            <Switch
                                id="appointment_updated"
                                checked={settings.appointment_updated}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, appointment_updated: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="ticket_reply">💬 Ответы на тикеты</Label>
                                <p className="text-sm text-muted-foreground">
                                    Уведомления об ответах на тикеты поддержки
                                </p>
                            </div>
                            <Switch
                                id="ticket_reply"
                                checked={settings.ticket_reply}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, ticket_reply: checked })
                                }
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="appointment_reminder">⏰ Напоминания о записях</Label>
                                <p className="text-sm text-muted-foreground">
                                    Напоминания о предстоящих записях
                                </p>
                            </div>
                            <Switch
                                id="appointment_reminder"
                                checked={settings.appointment_reminder}
                                onCheckedChange={(checked) =>
                                    setSettings({ ...settings, appointment_reminder: checked })
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Время напоминаний */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Время напоминаний
                    </Label>
                    <Select
                        value={settings.reminder_time.toString()}
                        onValueChange={(value) =>
                            setSettings({ ...settings, reminder_time: parseInt(value) })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {REMINDER_TIMES.map((time) => (
                                <SelectItem key={time.value} value={time.value.toString()}>
                                    {time.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                        За сколько времени до записи отправлять напоминание
                    </p>
                </div>

                {/* Тихий режим */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-base font-semibold flex items-center gap-2">
                            <Moon className="h-4 w-4" />
                            Тихий режим
                        </Label>
                        <Switch
                            checked={settings.quiet_mode_enabled}
                            onCheckedChange={(checked) =>
                                setSettings({ ...settings, quiet_mode_enabled: checked })
                            }
                        />
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Не отправлять уведомления в определенное время
                    </p>

                    {settings.quiet_mode_enabled && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="quiet_start">Начало</Label>
                                <Input
                                    id="quiet_start"
                                    type="time"
                                    value={settings.quiet_mode_start || ''}
                                    onChange={(e) =>
                                        setSettings({ ...settings, quiet_mode_start: e.target.value })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="quiet_end">Конец</Label>
                                <Input
                                    id="quiet_end"
                                    type="time"
                                    value={settings.quiet_mode_end || ''}
                                    onChange={(e) =>
                                        setSettings({ ...settings, quiet_mode_end: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Формат уведомлений */}
                <div className="space-y-3">
                    <Label className="text-base font-semibold flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Формат уведомлений
                    </Label>
                    <RadioGroup
                        value={settings.notification_format}
                        onValueChange={(value: 'brief' | 'detailed') =>
                            setSettings({ ...settings, notification_format: value })
                        }
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="brief" id="brief" />
                            <Label htmlFor="brief" className="font-normal cursor-pointer">
                                <div>
                                    <div className="font-medium">Краткий</div>
                                    <div className="text-sm text-muted-foreground">
                                        Только основная информация (время, клиент)
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="detailed" id="detailed" />
                            <Label htmlFor="detailed" className="font-normal cursor-pointer">
                                <div>
                                    <div className="font-medium">Подробный</div>
                                    <div className="text-sm text-muted-foreground">
                                        Полная информация (услуга, цена, заметки)
                                    </div>
                                </div>
                            </Label>
                        </div>
                    </RadioGroup>
                </div>

                {/* Кнопка сохранения */}
                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Сохранение...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Сохранить настройки
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
