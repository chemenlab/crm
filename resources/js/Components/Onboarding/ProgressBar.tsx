import { Progress } from '@/Components/ui/progress';
import { Button } from '@/Components/ui/button';
import { X, RotateCcw, CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';

interface ProgressBarProps {
  percentage: number;
  completedSteps: string[];
  totalSteps: number;
  isCompleted: boolean;
  onDismiss?: () => void;
  onRestart?: () => void;
}

const stepLabels: Record<string, string> = {
  profile_setup: 'Настройте профиль',
  first_service: 'Создайте первую услугу',
  first_client: 'Добавьте первого клиента',
  schedule_setup: 'Настройте расписание работы',
  first_appointment: 'Создайте первую запись',
  public_page_setup: 'Настройте публичную страницу',
  notification_setup: 'Настройте уведомления',
};

const stepOrder = [
  'profile_setup',
  'first_service',
  'first_client',
  'schedule_setup',
  'first_appointment',
  'public_page_setup',
  'notification_setup',
];

export default function ProgressBar({
  percentage,
  completedSteps,
  totalSteps,
  isCompleted,
  onDismiss,
  onRestart,
}: ProgressBarProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showRestartDialog, setShowRestartDialog] = useState(false);
  const [isRestarting, setIsRestarting] = useState(false);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleRestartConfirm = async () => {
    setIsRestarting(true);
    try {
      await axios.post('/app/onboarding/tour/reset');
      setShowRestartDialog(false);
      onRestart?.();
      window.location.reload();
    } catch (error) {
      console.error('Failed to restart tour:', error);
    } finally {
      setIsRestarting(false);
    }
  };

  if (!isVisible || isCompleted) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-b border-blue-100 dark:border-blue-900 px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Настройка системы
                  </span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-0.5 rounded-full">
                    {completedSteps.length} из {totalSteps}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="h-7 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    {isExpanded ? (
                      <>
                        <ChevronUp className="h-3 w-3 mr-1" />
                        Свернуть
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-3 w-3 mr-1" />
                        Подробнее
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRestartDialog(true)}
                    className="h-7 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Начать заново
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleDismiss}
                    className="h-7 w-7 p-0 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3">
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {percentage}% завершено
                </p>
              </div>

              {/* Expanded Step List */}
              {isExpanded && (
                <div className="mt-3 space-y-2 pb-2">
                  {stepOrder.map((stepKey, index) => {
                    const isCompleted = completedSteps.includes(stepKey);
                    return (
                      <div
                        key={stepKey}
                        className="flex items-center gap-3 text-sm"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
                        )}
                        <span className="flex-shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400 w-4">
                          {index + 1}.
                        </span>
                        <span
                          className={
                            isCompleted
                              ? 'text-gray-900 dark:text-gray-100 font-medium'
                              : 'text-gray-600 dark:text-gray-400'
                          }
                        >
                          {stepLabels[stepKey]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compact Step Pills (when collapsed) */}
              {!isExpanded && (
                <div className="flex flex-wrap gap-2">
                  {stepOrder.map((stepKey) => {
                    const isCompleted = completedSteps.includes(stepKey);
                    return (
                      <span
                        key={stepKey}
                        className={`text-xs px-2 py-1 rounded-full transition-colors ${
                          isCompleted
                            ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 font-medium'
                            : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {isCompleted ? '✓ ' : ''}
                        {stepLabels[stepKey].replace('Настройте ', '').replace('Создайте ', '').replace('Добавьте ', '')}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Restart Confirmation Dialog */}
      <Dialog open={showRestartDialog} onOpenChange={setShowRestartDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Начать онбординг заново?</DialogTitle>
            <DialogDescription>
              Это действие сбросит весь прогресс настройки системы. Все отметки о выполненных шагах будут удалены, и вы сможете пройти онбординг с начала.
              <br /><br />
              <strong>Важно:</strong> Ваши данные (услуги, клиенты, записи) не будут удалены.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRestartDialog(false)}
              disabled={isRestarting}
            >
              Отмена
            </Button>
            <Button
              onClick={handleRestartConfirm}
              disabled={isRestarting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRestarting ? (
                <>
                  <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                  Сброс...
                </>
              ) : (
                <>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Начать заново
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
