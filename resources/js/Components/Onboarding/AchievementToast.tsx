import { toast } from 'sonner';
import { CheckCircle2, Sparkles } from 'lucide-react';

interface AchievementToastProps {
  step: string;
  message: string;
  isLastStep?: boolean;
}

/**
 * Показывает toast уведомление о достижении в онбординге
 * 
 * @param step - Название шага (например, 'first_service')
 * @param message - Сообщение для отображения
 * @param isLastStep - Последний ли это шаг (для особого оформления)
 */
export function showAchievementToast({ step, message, isLastStep = false }: AchievementToastProps) {
  if (isLastStep) {
    // Для последнего шага показываем особое уведомление
    toast.success(message, {
      icon: <Sparkles className="h-5 w-5 text-amber-500" />,
      duration: 7000,
      description: 'Поздравляем! Вы завершили все шаги онбординга 🎉',
      className: 'border-amber-200 bg-amber-50',
    });
  } else {
    // Обычное уведомление о достижении
    toast.success(message, {
      icon: <CheckCircle2 className="h-5 w-5 text-green-500" />,
      duration: 5000,
      description: 'Продолжайте в том же духе!',
    });
  }
}

/**
 * Показывает модалку поздравления с завершением онбординга
 * Вызывается автоматически при завершении последнего шага
 */
export function showCompletionModal() {
  // TODO: Реализовать модалку поздравления
  // Можно использовать существующий Dialog компонент
  console.log('Onboarding completed! Show celebration modal');
}
