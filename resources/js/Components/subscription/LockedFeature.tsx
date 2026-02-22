import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useFeatureAccess } from '@/hooks/useFeatureAccess';
import { router } from '@inertiajs/react';

interface LockedFeatureProps {
  feature: string;
  title?: string;
  description?: string;
}

const featureLabels: Record<string, { title: string; description: string }> = {
  analytics: {
    title: 'Аналитика',
    description: 'Получите доступ к детальной аналитике и отчетам о вашем бизнесе',
  },
  priority_support: {
    title: 'Приоритетная поддержка',
    description: 'Получайте ответы на ваши вопросы в приоритетном порядке',
  },
  custom_branding: {
    title: 'Кастомный брендинг',
    description: 'Настройте внешний вид под ваш бренд',
  },
  portfolio: {
    title: 'Портфолио',
    description: 'Создайте красивое портфолио для привлечения клиентов',
  },
};

export function LockedFeature({ feature, title, description }: LockedFeatureProps) {
  const [showModal, setShowModal] = useState(false);
  const { getCurrentPlan, isInTrial, getTrialDaysRemaining } = useFeatureAccess();

  const featureInfo = featureLabels[feature] || {
    title: title || 'Функция недоступна',
    description: description || 'Эта функция доступна на платных тарифах',
  };

  const currentPlan = getCurrentPlan();
  const isTrial = isInTrial();
  const trialDays = getTrialDaysRemaining();

  const handleUpgrade = () => {
    router.visit('/app/subscriptions');
  };

  return (
    <>
      <div className="relative">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg">
          <div className="text-center space-y-4 p-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{featureInfo.title}</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {featureInfo.description}
              </p>
            </div>
            <Button onClick={() => setShowModal(true)} size="sm">
              Узнать больше
            </Button>
          </div>
        </div>
        <div className="opacity-30 pointer-events-none">
          {/* Placeholder content */}
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{featureInfo.title}</DialogTitle>
            <DialogDescription>{featureInfo.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {isTrial && trialDays !== null && trialDays > 0 ? (
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  У вас активен триальный период. Осталось дней: <strong>{trialDays}</strong>
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                  После окончания триала эта функция станет недоступна на бесплатном тарифе.
                </p>
              </div>
            ) : (
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  Ваш текущий тариф: <strong>{currentPlan?.name || 'Базовая'}</strong>
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Для доступа к этой функции необходимо перейти на тариф "Профессиональная" или "Максимальная".
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Закрыть
            </Button>
            <Button onClick={handleUpgrade}>
              Выбрать тариф
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
