import { useState, useEffect } from 'react';
import { Check, Loader2, Database, Sparkles, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InstallationStep {
    id: string;
    label: string;
    icon: React.ReactNode;
}

const installationSteps: InstallationStep[] = [
    { id: 'prepare', label: 'Подготовка модуля...', icon: <Package className="h-5 w-5" /> },
    { id: 'database', label: 'Настройка базы данных...', icon: <Database className="h-5 w-5" /> },
    { id: 'activate', label: 'Активация...', icon: <Sparkles className="h-5 w-5" /> },
    { id: 'complete', label: 'Готово!', icon: <Check className="h-5 w-5" /> },
];

interface InstallationProgressProps {
    isVisible: boolean;
    onComplete?: () => void;
    moduleName?: string;
}

/**
 * Installation progress overlay with animated steps
 */
export function InstallationProgress({ isVisible, onComplete, moduleName }: InstallationProgressProps) {
    const [currentStep, setCurrentStep] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    useEffect(() => {
        if (!isVisible) {
            setCurrentStep(0);
            setIsComplete(false);
            return;
        }

        // Simulate installation steps
        const timers: ReturnType<typeof setTimeout>[] = [];

        // Step 1: Prepare (0.5s)
        timers.push(setTimeout(() => setCurrentStep(1), 500));

        // Step 2: Database (1.5s)
        timers.push(setTimeout(() => setCurrentStep(2), 1500));

        // Step 3: Activate (2.5s)
        timers.push(setTimeout(() => setCurrentStep(3), 2500));

        // Complete (3s)
        timers.push(setTimeout(() => {
            setIsComplete(true);
            onComplete?.();
        }, 3000));

        return () => {
            timers.forEach(clearTimeout);
        };
    }, [isVisible, onComplete]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-in fade-in-50 zoom-in-95 duration-300">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className={cn(
                        "w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-all duration-500",
                        isComplete
                            ? "bg-green-500/10 text-green-500"
                            : "bg-primary/10 text-primary"
                    )}>
                        {isComplete ? (
                            <Check className="h-8 w-8 animate-in zoom-in-50 duration-300" />
                        ) : (
                            <Loader2 className="h-8 w-8 animate-spin" />
                        )}
                    </div>
                    <h2 className="text-xl font-bold">
                        {isComplete ? 'Установка завершена!' : 'Установка модуля'}
                    </h2>
                    {moduleName && (
                        <p className="text-sm text-muted-foreground mt-1">
                            {isComplete ? `«${moduleName}» успешно установлен` : `Устанавливаем «${moduleName}»...`}
                        </p>
                    )}
                </div>

                {/* Steps */}
                <div className="space-y-3">
                    {installationSteps.map((step, index) => {
                        const isActive = index === currentStep && !isComplete;
                        const isDone = index < currentStep || isComplete;

                        return (
                            <div
                                key={step.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                                    isActive && "bg-primary/5 border border-primary/20",
                                    isDone && "bg-green-500/5",
                                    !isActive && !isDone && "opacity-40"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300",
                                    isActive && "bg-primary/10 text-primary",
                                    isDone && "bg-green-500/10 text-green-500",
                                    !isActive && !isDone && "bg-muted text-muted-foreground"
                                )}>
                                    {isDone ? (
                                        <Check className="h-4 w-4" />
                                    ) : isActive ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        step.icon
                                    )}
                                </div>
                                <span className={cn(
                                    "font-medium text-sm transition-colors",
                                    isDone && "text-green-600 dark:text-green-400",
                                    isActive && "text-foreground",
                                    !isActive && !isDone && "text-muted-foreground"
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Progress bar */}
                <div className="mt-6">
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full transition-all duration-500 ease-out rounded-full",
                                isComplete ? "bg-green-500" : "bg-primary"
                            )}
                            style={{ width: `${((currentStep + 1) / installationSteps.length) * 100}%` }}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">
                        {isComplete ? '100%' : `${Math.round(((currentStep + 1) / installationSteps.length) * 100)}%`}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default InstallationProgress;
