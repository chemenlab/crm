import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/Components/ui/radio-group';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { ArrowLeft, Calendar, CreditCard, Loader2, Shield, Check } from 'lucide-react';
import { DynamicIcon } from '@/Components/DynamicIcon';

interface Props {
  module: {
    slug: string;
    name: string;
    description: string;
    icon: string;
    pricing_type: string;
  };
  prices: {
    monthly: number;
    yearly: number;
    yearlyDiscount: number;
  };
}

export default function Checkout({ module, prices }: Props) {
  const [period, setPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getCurrentPrice = () => {
    return period === 'monthly' ? prices.monthly : prices.yearly;
  };

  const getMonthlySavings = () => {
    return prices.monthly * 12 - prices.yearly;
  };

  const handlePurchase = () => {
    setIsLoading(true);

    router.post(
      `/app/modules/${module.slug}/checkout`,
      { period },
      {
        onError: (errors) => {
          setIsLoading(false);
          const errorMessage = typeof errors === 'object' && errors.error
            ? errors.error
            : 'Не удалось создать платёж. Попробуйте позже.';
          toast.error(errorMessage);
        },
      }
    );
  };

  return (
    <AppSidebarProvider>
      <Head title={`Покупка — ${module.name}`} />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Back Button */}
          <div className="py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/app/modules/${module.slug}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к модулю
              </Link>
            </Button>
          </div>

          <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Header */}
            <div className="text-center">
              <h1 className="text-2xl font-bold">Оформление покупки</h1>
              <p className="text-muted-foreground mt-1">
                Выберите период подписки для модуля
              </p>
            </div>

            {/* Module Info */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <DynamicIcon name={module.icon} className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{module.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Period Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Период подписки</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={period}
                  onValueChange={(value) => setPeriod(value as 'monthly' | 'yearly')}
                  className="space-y-3"
                >
                  {/* Monthly */}
                  <div
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${period === 'monthly' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    onClick={() => setPeriod('monthly')}
                  >
                    <RadioGroupItem value="monthly" id="monthly" />
                    <Label htmlFor="monthly" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Ежемесячно</div>
                            <div className="text-sm text-muted-foreground">
                              Оплата каждый месяц
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {formatPrice(prices.monthly)}
                          </div>
                          <div className="text-sm text-muted-foreground">в месяц</div>
                        </div>
                      </div>
                    </Label>
                  </div>

                  {/* Yearly */}
                  <div
                    className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors relative ${period === 'yearly' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                    onClick={() => setPeriod('yearly')}
                  >
                    <Badge
                      className="absolute -top-2 right-4 bg-green-600"
                    >
                      Экономия {prices.yearlyDiscount}%
                    </Badge>
                    <RadioGroupItem value="yearly" id="yearly" />
                    <Label htmlFor="yearly" className="flex-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <div className="font-medium">Ежегодно</div>
                            <div className="text-sm text-muted-foreground">
                              Экономия {formatPrice(getMonthlySavings())} в год
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-lg">
                            {formatPrice(prices.yearly)}
                          </div>
                          <div className="text-sm text-muted-foreground">в год</div>
                        </div>
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Итого</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Модуль</span>
                  <span>{module.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Период</span>
                  <span>{period === 'monthly' ? '1 месяц' : '1 год'}</span>
                </div>
                {period === 'yearly' && (
                  <div className="flex items-center justify-between text-green-600">
                    <span>Экономия</span>
                    <span>-{formatPrice(getMonthlySavings())}</span>
                  </div>
                )}
                <Separator />
                <div className="flex items-center justify-between text-lg font-semibold">
                  <span>К оплате</span>
                  <span>{formatPrice(getCurrentPrice())}</span>
                </div>
              </CardContent>
            </Card>

            {/* Features */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Мгновенная активация после оплаты</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Отмена подписки в любой момент</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Check className="h-4 w-4 text-green-600" />
                    <span>Техническая поддержка</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg text-sm">
              <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="text-muted-foreground">
                <p className="font-medium text-foreground">Безопасная оплата</p>
                <p className="mt-1">
                  Платёж обрабатывается через ЮKassa. Мы не храним данные вашей карты.
                </p>
              </div>
            </div>

            {/* Action Button */}
            <Button
              size="lg"
              className="w-full"
              onClick={handlePurchase}
              disabled={isLoading}
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
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
