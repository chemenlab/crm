import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Separator } from '@/Components/ui/separator';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { showAchievementToast } from '@/Components/Onboarding/AchievementToast';

interface NotificationSettingsProps {
    settings: {
        email_new_booking: boolean;
        email_cancelled: boolean;
        email_modified: boolean;
        email_payment: boolean;
        client_reminder_24h: boolean;
        client_reminder_1h: boolean;
        client_thank_you: boolean;
        daily_summary: boolean;
        daily_summary_time: string | null;
        weekly_summary: boolean;
        weekly_summary_day: number | null;
    };
}

export function NotificationSettings({ settings }: NotificationSettingsProps) {
    const [formData, setFormData] = useState(settings);

    const handleSwitchChange = (field: keyof typeof settings) => {
        const newData = { ...formData, [field]: !formData[field] };
        setFormData(newData);
        // Auto-save on switch toggle
        router.put('/app/settings/notifications', newData, {
            preserveScroll: true,
            onSuccess: () => {
                // Показываем achievement toast для онбординга
                showAchievementToast({
                    step: 'notification_setup',
                    message: 'Отлично! Вы настроили уведомления',
                });
            },
        });
    };

    const handleTimeChange = (value: string) => {
        const newData = { ...formData, daily_summary_time: value };
        setFormData(newData);
    };

    const handleSaveTime = () => {
        router.put('/app/settings/notifications', formData, {
            preserveScroll: true,
            onSuccess: () => {
                // Показываем achievement toast для онбординга
                showAchievementToast({
                    step: 'notification_setup',
                    message: 'Отлично! Вы настроили уведомления',
                });
            },
        });
    };

    return (
        <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Email уведомления</CardTitle>
                        <CardDescription>
                            Выберите, какие уведомления вы хотите получать на email
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Новая запись</Label>
                                <p className="text-sm text-muted-foreground">
                                    Уведомление о создании новой записи
                                </p>
                            </div>
                            <Switch
                                checked={formData.email_new_booking}
                                onCheckedChange={() => handleSwitchChange('email_new_booking')}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Отмена записи</Label>
                                <p className="text-sm text-muted-foreground">
                                    Уведомление об отмене записи клиентом
                                </p>
                            </div>
                            <Switch
                                checked={formData.email_cancelled}
                                onCheckedChange={() => handleSwitchChange('email_cancelled')}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Изменение записи</Label>
                                <p className="text-sm text-muted-foreground">
                                    Уведомление о переносе или изменении записи
                                </p>
                            </div>
                            <Switch
                                checked={formData.email_modified}
                                onCheckedChange={() => handleSwitchChange('email_modified')}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Сводки</CardTitle>
                        <CardDescription>
                            Получайте регулярные отчеты о вашей деятельности
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Ежедневная сводка</Label>
                                <p className="text-sm text-muted-foreground">
                                    Список записей на сегодня каждое утро
                                </p>
                            </div>
                            <Switch
                                checked={formData.daily_summary}
                                onCheckedChange={() => handleSwitchChange('daily_summary')}
                            />
                        </div>
                        {formData.daily_summary && (
                            <div className="flex items-center gap-4 pl-6">
                                <Label>Время отправки:</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="time"
                                        value={formData.daily_summary_time || '09:00'}
                                        onChange={(e) => handleTimeChange(e.target.value)}
                                        className="w-[120px]"
                                    />
                                    <Button size="sm" variant="outline" onClick={handleSaveTime}>Сохранить</Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Уведомления клиентам</CardTitle>
                        <CardDescription>
                            Автоматические уведомления для ваших клиентов
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Напоминание за 24 часа</Label>
                                <p className="text-sm text-muted-foreground">
                                    Отправлять напоминание за сутки до визита
                                </p>
                            </div>
                            <Switch
                                checked={formData.client_reminder_24h}
                                onCheckedChange={() => handleSwitchChange('client_reminder_24h')}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Напоминание за 1 час</Label>
                                <p className="text-sm text-muted-foreground">
                                    Отправлять напоминание за час до визита
                                </p>
                            </div>
                            <Switch
                                checked={formData.client_reminder_1h}
                                onCheckedChange={() => handleSwitchChange('client_reminder_1h')}
                            />
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>Благодарность после визита</Label>
                                <p className="text-sm text-muted-foreground">
                                    Отправлять письмо с просьбой оставить отзыв
                                </p>
                            </div>
                            <Switch
                                checked={formData.client_thank_you}
                                onCheckedChange={() => handleSwitchChange('client_thank_you')}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
