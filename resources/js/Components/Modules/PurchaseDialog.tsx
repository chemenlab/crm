import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { Badge } from '@/Components/ui/badge';
import { Loader2, ShoppingCart, CreditCard, Calendar, Shield } from 'lucide-react';
import type { Module } from '@/types/modules';

interface PurchaseDialogProps {
  module: Module;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * PurchaseDialog component for confirming module purchases.
 * 
 * Uses shadcn/ui components: Dialog, RadioGroup, Button, Badge
 * 
 * Requirements: 9.4
 */
export function PurchaseDialog({ module, open, onOpenChange }: PurchaseDialogProps) {
  const [subscriptionPeriod, setSubscriptionPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const isSubscription = module.pricing_type === 'subscription';
  
  // Calculate yearly price with discount (typically 2 months free)
  const monthlyPrice = module.price;
  const yearlyPrice = monthlyPrice * 10; // 10 months instead of 12 (2 months free)
  const yearlySavings = monthlyPrice * 2;

  const getCurrentPrice = () => {
    if (!isSubscription) {
      return module.price;
    }
    return subscriptionPeriod === 'monthly' ? monthlyPrice : yearlyPrice;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handlePurchase = () => {
    setIsLoading(true);

    router.post(
      `/app/modules/${module.slug}/purchase`,
      {
        subscription_period: isSubscription ? subscriptionPeriod : undefined,
      },
      {
        onSuccess: () => {
          // Redirect will happen automatically to payment page
        },
        onError: (errors) => {
          setIsLoading(false);
          const errorMessage = typeof errors === 'object' && errors.error 
            ? errors.error 
            : 'Не удалось создать платёж. Попробуйте позже.';
          toast.error(errorMessage);
        },
        onFinish: () => {
          // Don't set loading to false here as we're redirecting
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Покупка модуля
          </DialogTitle>
          <DialogDescription>
            Подтвердите покупку модуля «{module.name}»
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Module Info */}
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <span className="text-2xl">{module.icon || '📦'}</span>
            </div>
            <div className="flex-1">
              <h4 className="font-medium">{module.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {module.description}
              </p>
            </div>
          </div>

          {/* Subscription Period Selection */}
          {isSubscription && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label className="text-sm font-medium">Период подписки</Label>
                <RadioGroup
                  value={subscriptionPeriod}
                  onValueChange={(value) => setSubscriptionPeriod(value as 'monthly' | 'yearly')}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ежемесячно</span>
                        </div>
                        <span className="font-medium">{formatPrice(monthlyPrice)}/мес</span>
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer relative">
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Ежегодно</span>
                          <Badge variant="secondary" className="text-xs">
                            Экономия {formatPrice(yearlySavings)}
                          </Badge>
                        </div>
                        <span className="font-medium">{formatPrice(yearlyPrice)}/год</span>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          <Separator />

          {/* Price Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Стоимость</span>
              <span>{formatPrice(getCurrentPrice())}</span>
            </div>
            {isSubscription && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Период</span>
                <span>{subscriptionPeriod === 'monthly' ? '1 месяц' : '1 год'}</span>
              </div>
            )}
            <Separator />
            <div className="flex items-center justify-between font-medium">
              <span>Итого к оплате</span>
              <span className="text-lg">{formatPrice(getCurrentPrice())}</span>
            </div>
          </div>

          {/* Security Note */}
          <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg text-sm">
            <Shield className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="text-muted-foreground">
              <p>Безопасная оплата через ЮKassa.</p>
              {isSubscription && (
                <p className="mt-1">Подписку можно отменить в любой момент.</p>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Отмена
          </Button>
          <Button
            onClick={handlePurchase}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Обработка...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Оплатить {formatPrice(getCurrentPrice())}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PurchaseDialog;
