import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Switch } from '@/Components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Clock, Copy } from 'lucide-react';
import { showAchievementToast } from '@/Components/Onboarding/AchievementToast';

interface ScheduleDay {
    day_of_week: number;
    is_working: boolean;
    start_time: string;
    end_time: string;
    break_start: string;
    break_end: string;
}

interface WorkScheduleProps {
    initialSchedule: any[];
}

const DAYS = [
    { id: 1, name: 'Понедельник' },
    { id: 2, name: 'Вторник' },
    { id: 3, name: 'Среда' },
    { id: 4, name: 'Четверг' },
    { id: 5, name: 'Пятница' },
    { id: 6, name: 'Суббота' },
    { id: 0, name: 'Воскресенье' },
];

export function WorkSchedule({ initialSchedule }: WorkScheduleProps) {
    const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
        // Initialize schedule with existing data or defaults
        return DAYS.map(day => {
            const existing = initialSchedule.find(s => s.day_of_week === day.id);
            return {
                day_of_week: day.id,
                is_working: existing?.is_working || false,
                start_time: existing?.start_time || '09:00',
                end_time: existing?.end_time || '18:00',
                break_start: existing?.break_start || '',
                break_end: existing?.break_end || '',
            };
        });
    });

    const handleToggleDay = (dayId: number) => {
        setSchedule(prev => prev.map(day =>
            day.day_of_week === dayId
                ? { ...day, is_working: !day.is_working }
                : day
        ));
    };

    const handleTimeChange = (dayId: number, field: keyof ScheduleDay, value: string) => {
        setSchedule(prev => prev.map(day =>
            day.day_of_week === dayId
                ? { ...day, [field]: value }
                : day
        ));
    };

    const handleCopyDay = (dayId: number) => {
        const sourceDaySchedule = schedule.find(s => s.day_of_week === dayId);
        if (!sourceDaySchedule) return;

        setSchedule(prev => prev.map(day => {
            // Skip the source day itself
            if (day.day_of_week === dayId) return day;
            
            // Copy schedule to all other days
            return {
                ...day,
                is_working: sourceDaySchedule.is_working,
                start_time: sourceDaySchedule.start_time,
                end_time: sourceDaySchedule.end_time,
                break_start: sourceDaySchedule.break_start,
                break_end: sourceDaySchedule.break_end,
            };
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        router.put('/app/settings/profile/schedule', {
            schedule: schedule as any,
        }, {
            preserveState: false,
            onSuccess: () => {
                // Показываем achievement toast для онбординга
                showAchievementToast({
                    step: 'schedule_setup',
                    message: 'Отлично! Вы настроили рабочий график',
                });
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>График работы</CardTitle>
                <CardDescription>
                    Укажите ваши рабочие дни и время работы
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Desktop View - Table */}
                    <div className="hidden md:block border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[200px]">День недели</TableHead>
                                    <TableHead className="text-center w-[100px]">Рабочий</TableHead>
                                    <TableHead>Начало</TableHead>
                                    <TableHead>Конец</TableHead>
                                    <TableHead>Перерыв с</TableHead>
                                    <TableHead>Перерыв до</TableHead>
                                    <TableHead className="text-center w-[100px]">Повторить на</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {DAYS.map(day => {
                                    const daySchedule = schedule.find(s => s.day_of_week === day.id);
                                    if (!daySchedule) return null;

                                    return (
                                        <TableRow key={day.id}>
                                            <TableCell className="font-medium">{day.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Switch
                                                    checked={daySchedule.is_working}
                                                    onCheckedChange={() => handleToggleDay(day.id)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={daySchedule.start_time}
                                                        onChange={(e) => handleTimeChange(day.id, 'start_time', e.target.value)}
                                                        disabled={!daySchedule.is_working}
                                                        className="w-[120px] pl-8"
                                                    />
                                                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={daySchedule.end_time}
                                                        onChange={(e) => handleTimeChange(day.id, 'end_time', e.target.value)}
                                                        disabled={!daySchedule.is_working}
                                                        className="w-[120px] pl-8"
                                                    />
                                                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={daySchedule.break_start}
                                                        onChange={(e) => handleTimeChange(day.id, 'break_start', e.target.value)}
                                                        disabled={!daySchedule.is_working}
                                                        className="w-[120px] pl-8"
                                                    />
                                                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="relative">
                                                    <Input
                                                        type="time"
                                                        value={daySchedule.break_end}
                                                        onChange={(e) => handleTimeChange(day.id, 'break_end', e.target.value)}
                                                        disabled={!daySchedule.is_working}
                                                        className="w-[120px] pl-8"
                                                    />
                                                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleCopyDay(day.id)}
                                                    disabled={!daySchedule.is_working}
                                                    title="Скопировать на все дни"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="md:hidden space-y-3">
                        {DAYS.map(day => {
                            const daySchedule = schedule.find(s => s.day_of_week === day.id);
                            if (!daySchedule) return null;

                            return (
                                <Card key={day.id} className="overflow-hidden">
                                    <CardContent className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">{day.name}</span>
                                            <Switch
                                                checked={daySchedule.is_working}
                                                onCheckedChange={() => handleToggleDay(day.id)}
                                            />
                                        </div>
                                        
                                        {daySchedule.is_working && (
                                            <>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Начало</label>
                                                        <div className="relative mt-1">
                                                            <Input
                                                                type="time"
                                                                value={daySchedule.start_time}
                                                                onChange={(e) => handleTimeChange(day.id, 'start_time', e.target.value)}
                                                                className="pl-8"
                                                            />
                                                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Конец</label>
                                                        <div className="relative mt-1">
                                                            <Input
                                                                type="time"
                                                                value={daySchedule.end_time}
                                                                onChange={(e) => handleTimeChange(day.id, 'end_time', e.target.value)}
                                                                className="pl-8"
                                                            />
                                                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Перерыв с</label>
                                                        <div className="relative mt-1">
                                                            <Input
                                                                type="time"
                                                                value={daySchedule.break_start}
                                                                onChange={(e) => handleTimeChange(day.id, 'break_start', e.target.value)}
                                                                className="pl-8"
                                                            />
                                                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-muted-foreground">Перерыв до</label>
                                                        <div className="relative mt-1">
                                                            <Input
                                                                type="time"
                                                                value={daySchedule.break_end}
                                                                onChange={(e) => handleTimeChange(day.id, 'break_end', e.target.value)}
                                                                className="pl-8"
                                                            />
                                                            <Clock className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleCopyDay(day.id)}
                                                    className="w-full"
                                                >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Скопировать на все дни
                                                </Button>
                                            </>
                                        )}
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>

                    <Button type="submit" className="w-full sm:w-auto">Сохранить график</Button>
                </form>
            </CardContent>
        </Card>
    );
}
