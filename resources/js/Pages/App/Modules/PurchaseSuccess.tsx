import { useState, useEffect } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { CheckCircle, ArrowRight, Loader2, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Purchase {
  id: number;
  module_slug: string;
  module_name: string;
  module_icon?: string;
  price: number;
  formatted_price: string;
  status: string;
  status_label: string;
  pricing_type: string;
  pricing_type_label: string;
  expires_at?: string;
  is_ready?: boolean;
}

interface Props {
  purchase: Purchase | null;
}

export default function PurchaseSuccess({ purchase }: Props) {
  const [isActivating, setIsActivating] = useState(true);
  const [showConfetti, setShowConfetti] = useState(false);
  const [activationStep, setActivationStep] = useState(0);

  useEffect(() => {
    if (!purchase) {
      setIsActivating(false);
      return;
    }

    // Simulate activation progress
    const steps = [
      { delay: 500, step: 1 },
      { delay: 1500, step: 2 },
      { delay: 2500, step: 3 },
    ];

    const timers = steps.map(({ delay, step }) =>
      setTimeout(() => setActivationStep(step), delay)
    );

    // Finish activation
    const finishTimer = setTimeout(() => {
      setIsActivating(false);
      setShowConfetti(true);

      // Enable module automatically
      router.post(`/app/modules/${purchase.module_slug}/enable`, {}, {
        preserveScroll: true,
        onError: () => {
          // Silent error - module might already be enabled
        },
      });
    }, 3000);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finishTimer);
    };
  }, [purchase]);

  // Activation steps labels
  const activationSteps = [
    'Проверка платежа...',
    'Подготовка модуля...',
    'Активация лицензии...',
  ];

  return (
    <AppSidebarProvider>
      <Head title={isActivating ? 'Активация...' : 'Покупка успешна'} />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-6 min-h-[calc(100vh-200px)]">
          <Card className="max-w-md w-full text-center overflow-hidden">
            <CardHeader className="relative">
              {/* Confetti Animation */}
              {showConfetti && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  {Array.from({ length: 20 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 0.5}s`,
                        animationDuration: `${0.5 + Math.random() * 0.5}s`,
                      }}
                    >
                      <Sparkles
                        className="h-4 w-4 text-yellow-400 opacity-80"
                        style={{ transform: `rotate(${Math.random() * 360}deg)` }}
                      />
                    </div>
                  ))}
                </div>
              )}

              <div className={cn(
                "mx-auto mb-4 h-20 w-20 rounded-full flex items-center justify-center transition-all duration-500",
                isActivating
                  ? "bg-primary/10"
                  : "bg-green-100 dark:bg-green-900 scale-110"
              )}>
                {isActivating ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400 animate-in zoom-in-50 duration-500" />
                )}
              </div>

              <CardTitle className="text-2xl">
                {isActivating ? 'Активация модуля...' : 'Покупка успешна!'}
              </CardTitle>

              <CardDescription className="mt-2">
                {isActivating ? (
                  <span className="flex items-center justify-center gap-2">
                    {activationSteps[activationStep] || 'Подготовка...'}
                  </span>
                ) : (
                  purchase
                    ? `Модуль «${purchase.module_name}» успешно активирован`
                    : 'Ваш платёж успешно обработан'
                )}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Activation Progress */}
              {isActivating && (
                <div className="space-y-3">
                  {activationSteps.map((step, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded-lg transition-all duration-300",
                        index === activationStep && "bg-primary/5 border border-primary/20",
                        index < activationStep && "bg-green-500/5"
                      )}
                    >
                      <div className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                        index < activationStep && "bg-green-500 text-white",
                        index === activationStep && "bg-primary text-white",
                        index > activationStep && "bg-muted text-muted-foreground"
                      )}>
                        {index < activationStep ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : index === activationStep ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={cn(
                        "text-sm transition-colors",
                        index <= activationStep ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Purchase Info */}
              {!isActivating && purchase && (
                <div className="bg-muted rounded-xl p-4 text-left animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-2xl">
                      {purchase.module_icon || '📦'}
                    </div>
                    <div>
                      <p className="font-semibold">{purchase.module_name}</p>
                      <p className="text-sm text-muted-foreground">{purchase.pricing_type_label}</p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Сумма</span>
                      <span className="font-semibold text-green-600">{purchase.formatted_price}</span>
                    </div>
                    {purchase.expires_at && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Действует до</span>
                        <span>{new Date(purchase.expires_at).toLocaleDateString('ru-RU')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              {!isActivating && (
                <div className="flex flex-col gap-3 animate-in fade-in-50 slide-in-from-bottom-4 delay-150 duration-500">
                  {purchase && (
                    <>
                      <Button size="lg" asChild className="group">
                        <Link href={`/app/modules/${purchase.module_slug}/settings`}>
                          <Settings className="h-4 w-4 mr-2" />
                          Настроить модуль
                          <ArrowRight className="h-4 w-4 ml-2 transition-transform group-hover:translate-x-1" />
                        </Link>
                      </Button>
                      <Button variant="outline" asChild>
                        <Link href={`/app/modules/${purchase.module_slug}`}>
                          Подробнее о модуле
                        </Link>
                      </Button>
                    </>
                  )}
                  <Button variant="ghost" asChild>
                    <Link href="/app/modules">Вернуться в каталог</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
