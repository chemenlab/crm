import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { Button, ButtonProps } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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

interface DisabledButtonProps extends ButtonProps {
  feature?: string;
  resource?: string;
  lockedMessage?: string;
  children: React.ReactNode;
}

export function DisabledButton({
  feature,
  resource,
  lockedMessage,
  children,
  ...props
}: DisabledButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const { hasFeature, canAccessResource, getResourceUsage } = useFeatureAccess();

  let isLocked = false;
  let tooltipMessage = '';
  let modalTitle = 'Функция недоступна';
  let modalDescription = '';

  if (feature) {
    isLocked = !hasFeature(feature);
    tooltipMessage = lockedMessage || 'Доступно на платных тарифах';
    modalDescription = 'Эта функция доступна на тарифах "Профессиональная" и "Максимальная"';
  } else if (resource) {
    const canAccess = canAccessResource(resource);
    const usage = getResourceUsage(resource);
    
    isLocked = !canAccess;
    
    if (usage && !usage.unlimited) {
      tooltipMessage = `Достигнут лимит: ${usage.current_usage}/${usage.limit}`;
      modalTitle = 'Достигнут лимит';
      modalDescription = `Вы достигли лимита по ресурсу "${resource}". Для увеличения лимита перейдите на более высокий тариф.`;
    } else {
      tooltipMessage = lockedMessage || 'Недостаточно прав';
      modalDescription = 'Для доступа к этой функции необходимо обновить тариф';
    }
  }

  const handleUpgrade = () => {
    setShowModal(false);
    router.visit('/app/subscriptions');
  };

  if (isLocked) {
    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  {...props}
                  disabled
                  className="relative"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowModal(true);
                  }}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  {children}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>
              <p>{tooltipMessage}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modalTitle}</DialogTitle>
              <DialogDescription>{modalDescription}</DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <p className="text-sm text-muted-foreground">
                Перейдите на страницу тарифов, чтобы выбрать подходящий план.
              </p>
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

  return <Button {...props}>{children}</Button>;
}
