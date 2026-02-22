import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Target, ChevronRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Link } from '@inertiajs/react';

interface GoalsCardProps {
    className?: string;
    current: number;
    target: number | null;
}

function getStatus(current: number, target: number): { label: string; color: string; icon: React.ReactNode } {
    const dayOfMonth = new Date().getDate();
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const expectedProgress = dayOfMonth / daysInMonth;
    const actualProgress = current / target;

    if (actualProgress >= 1) {
        return { label: 'Цель достигнута!', color: 'emerald', icon: <TrendingUp className="h-3 w-3 mr-1" /> };
    }
    if (actualProgress >= expectedProgress * 0.9) {
        return { label: 'В графике', color: 'emerald', icon: <TrendingUp className="h-3 w-3 mr-1" /> };
    }
    if (actualProgress >= expectedProgress * 0.6) {
        return { label: 'Немного позади', color: 'amber', icon: <Minus className="h-3 w-3 mr-1" /> };
    }
    return { label: 'Отставание', color: 'rose', icon: <TrendingDown className="h-3 w-3 mr-1" /> };
}

export function GoalsCard({ className, current, target }: GoalsCardProps) {
    const hasGoal = target !== null && target > 0;
    const percentage = hasGoal ? Math.min(Math.round((current / target) * 100), 100) : 0;
    const status = hasGoal ? getStatus(current, target) : null;

    const radius = 55;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    if (!hasGoal) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className={cn("h-full", className)}
            >
                <Card className="h-full border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10 relative overflow-hidden flex flex-col justify-center items-center">
                    <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 blur-2xl pointer-events-none" />
                    <CardContent className="flex flex-col items-center justify-center gap-4 py-8 z-10">
                        <div className="flex items-center justify-center p-3 bg-primary/10 rounded-full text-primary">
                            <Target className="h-6 w-6" />
                        </div>
                        <div className="text-center space-y-1">
                            <p className="text-base font-semibold">Установите цель на месяц</p>
                            <p className="text-sm text-muted-foreground">Отслеживайте свой прогресс</p>
                        </div>
                        <Button variant="outline" size="sm" asChild className="group hover:border-primary/50 hover:text-primary transition-all h-8 text-xs">
                            <Link href="/app/finance">
                                Установить цель
                                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            </motion.div>
        );
    }

    const statusColorClasses = {
        emerald: 'text-emerald-500 bg-emerald-500/10',
        amber: 'text-amber-500 bg-amber-500/10',
        rose: 'text-rose-500 bg-rose-500/10',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className={cn("h-full", className)}
        >
            <Card className="h-full border-none shadow-lg bg-gradient-to-br from-primary/5 via-background to-background dark:from-primary/10 relative overflow-hidden flex flex-col justify-between">
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 h-32 w-32 bg-primary/5 rounded-bl-full -mr-8 -mt-8 blur-2xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 h-24 w-24 bg-amber-500/5 rounded-tr-full -ml-8 -mb-8 blur-2xl pointer-events-none" />

                <CardHeader className="pb-0 pt-4 z-10 flex-shrink-0">
                    <CardTitle className="text-base font-semibold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center p-1.5 bg-primary/10 rounded-lg text-primary">
                                <Target className="h-4 w-4" />
                            </span>
                            Цель на месяц
                        </div>
                        {status && (
                            <div className={cn(
                                "flex items-center text-xs font-medium px-2 py-1 rounded-full",
                                statusColorClasses[status.color as keyof typeof statusColorClasses]
                            )}>
                                {status.icon}
                                {status.label}
                            </div>
                        )}
                    </CardTitle>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col items-center justify-between z-10 px-6 py-2">

                    {/* Circular Progress */}
                    <div className="relative flex items-center justify-center -mt-2">
                        <svg className="transform -rotate-90 w-36 h-36">
                            <circle
                                cx="72"
                                cy="72"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                className="text-muted/20"
                            />
                            <circle
                                cx="72"
                                cy="72"
                                r={radius}
                                stroke="currentColor"
                                strokeWidth="8"
                                fill="transparent"
                                strokeDasharray={circumference}
                                strokeDashoffset={strokeDashoffset}
                                strokeLinecap="round"
                                className="text-primary transition-all duration-1000 ease-out"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-3xl font-bold tracking-tighter">{percentage}%</span>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Достигнуто</span>
                        </div>
                    </div>

                    <div className="w-full space-y-3">
                        <div className="flex justify-between items-end border-b border-dashed pb-2">
                            <div className="text-left">
                                <p className="text-xs text-muted-foreground mb-0.5">Текущий результат</p>
                                <p className="text-lg font-bold text-foreground">{current.toLocaleString('ru-RU')} ₽</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-muted-foreground mb-0.5">Цель</p>
                                <p className="text-base font-semibold text-muted-foreground">{target.toLocaleString('ru-RU')} ₽</p>
                            </div>
                        </div>

                        <Button variant="outline" size="sm" asChild className="w-full group hover:border-primary/50 hover:text-primary transition-all h-8 text-xs">
                            <Link href="/app/finance">
                                Настроить цель
                                <ChevronRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}
