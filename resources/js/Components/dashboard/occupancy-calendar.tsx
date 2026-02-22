import * as React from 'react';
import { Calendar } from '@/Components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { parseISO } from 'date-fns';

interface OccupancyData {
    [date: string]: {
        count: number;
        level: 'low' | 'medium' | 'high';
    };
}

interface OccupancyCalendarProps {
    data: OccupancyData;
    className?: string;
}

export default function OccupancyCalendar({ data, className }: OccupancyCalendarProps) {
    // Convert string dates to Date objects for matchers
    const highOccupancyDates = Object.keys(data)
        .filter(date => data[date].level === 'high')
        .map(date => parseISO(date));

    const mediumOccupancyDates = Object.keys(data)
        .filter(date => data[date].level === 'medium')
        .map(date => parseISO(date));

    const lowOccupancyDates = Object.keys(data)
        .filter(date => data[date].level === 'low')
        .map(date => parseISO(date));

    return (
        <Card className={cn("flex flex-col", className)}>
            <CardHeader>
                <CardTitle className="text-lg font-semibold">Загруженность</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex items-center justify-center p-0 pb-4">
                <Calendar
                    mode="single"
                    locale={ru}
                    className="rounded-md"
                    modifiers={{
                        high: highOccupancyDates,
                        medium: mediumOccupancyDates,
                        low: lowOccupancyDates,
                    }}
                    modifiersClassNames={{
                        high: "bg-red-500/15 text-red-600 font-bold hover:bg-red-500/25",
                        medium: "bg-amber-500/15 text-amber-600 font-bold hover:bg-amber-500/25",
                        low: "bg-green-500/15 text-green-600 font-bold hover:bg-green-500/25",
                    }}
                />
            </CardContent>
            <div className="px-6 pb-4 flex gap-4 text-xs text-muted-foreground justify-center">
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span>Свободно</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span>Средне</span>
                </div>
                <div className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500"></div>
                    <span>Плотно</span>
                </div>
            </div>
        </Card>
    );
}
