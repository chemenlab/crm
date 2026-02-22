import { Head, Link, router, useForm } from '@inertiajs/react';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Separator } from '@/Components/ui/separator';
import { Check, AlertCircle, CreditCard, Tag, ArrowLeft, Sparkles } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

declare global {
    function route(name: string, params?: any): string;
}

interface SubscriptionPlan {
    id: number;
    name: string;
    description: string;
    price: number;
    trial_days: number;
}

interface Props {
    plan: SubscriptionPlan;
    currentSubscription: any;
}

export default function Checkout({ plan, currentSubscription }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        promo_code: '',
    });

    const [promoValidation, setPromoValidation] = useState<{
        valid: boolean;
        discount?: number;
        final_price?: number;
        trial_extension?: number;
        error?: string;
    } | null>(null);

    const [validatingPromo, setValidatingPromo] = useState(false);

    const validatePromoCode = async () => {
        if (!data.promo_code) {
            setPromoValidation(null);
            return;
        }

        setValidatingPromo(true);

        try {
            const response = await axios.post(route('subscriptions.validate-promo'), {
                code: data.promo_code,
                plan_id: plan.id,
            });

            setPromoValidation({
                valid: true,
                discount: response.data.discount,
                final_price: response.data.final_price,
                trial_extension: response.data.trial_extension,
            });
        } catch (error: any) {
            setPromoValidation({
                valid: false,
                error: error.response?.data?.error || 'Ошибка валидации промокода',
            });
        } finally {
            setValidatingPromo(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('subscriptions.store', plan.id));
    };

    const finalPrice = promoValidation?.valid ? promoValidation.final_price : plan.price;
    const discount = promoValidation?.valid ? promoValidation.discount : 0;
    const trialExtension = promoValidation?.valid ? promoValidation.trial_extension : 0;

    return (
        <AppSidebarProvider>
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <Head title={`Оформление подписки - ${plan.name}`} />

                <div className="flex flex-1 flex-col gap-4 p-2 md:p-4 pt-0">
                    {/* Page Header */}
                    <div className="px-2 sm:px-4 lg:px-6 py-4">
                        <div className="flex items-center gap-4 mb-2">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={route('subscriptions.index')}>
                                    <ArrowLeft className="h-5 w-5" />
                                </Link>
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">Оформление подписки</h1>
                                <p className="text-muted-foreground mt-1">
                                    Тариф: <span className="font-semibold text-foreground">{plan.name}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="px-2 sm:px-4 lg:px-6 pb-6">
                        <div className="max-w-3xl mx-auto">
                            <form onSubmit={handleSubmit}>
                                <div className="grid gap-6">
                                    {/* Plan Details Card */}
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <CreditCard className="h-5 w-5 text-primary" />
                                                <CardTitle>Детали тарифа</CardTitle>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Тариф</p>
                                                        <p className="text-lg font-semibold">{plan.name}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm text-muted-foreground">Стоимость</p>
                                                        <p className="text-2xl font-bold">
                                                            {plan.price === 0 ? 'Бесплатно' : `${Number(plan.price).toFixed(2)} ₽`}
                                                        </p>
                                                        {plan.price > 0 && (
                                                            <p className="text-xs text-muted-foreground">в месяц</p>
                                                        )}
                                                    </div>
                                                </div>

                                                {plan.trial_days > 0 && (
                                                    <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
                                                        <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                                                        <div>
                                                            <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                                Триальный период
                                                            </p>
                                                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                                                {plan.trial_days + (trialExtension || 0)} дней бесплатно
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="text-sm text-muted-foreground">
                                                    <p>{plan.description}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Promo Code Card */}
                                    {plan.price > 0 && (
                                        <Card>
                                            <CardHeader>
                                                <div className="flex items-center gap-2">
                                                    <Tag className="h-5 w-5 text-primary" />
                                                    <CardTitle>Промокод</CardTitle>
                                                </div>
                                                <CardDescription>
                                                    Есть промокод? Введите его для получения скидки
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex gap-2">
                                                    <div className="flex-1">
                                                        <Input
                                                            id="promo_code"
                                                            value={data.promo_code}
                                                            onChange={(e) => {
                                                                setData('promo_code', e.target.value.toUpperCase());
                                                                setPromoValidation(null);
                                                            }}
                                                            placeholder="ВВЕДИТЕ ПРОМОКОД"
                                                            disabled={processing}
                                                            className="uppercase"
                                                        />
                                                        {errors.promo_code && (
                                                            <p className="text-sm text-destructive mt-1">{errors.promo_code}</p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        onClick={validatePromoCode}
                                                        disabled={!data.promo_code || validatingPromo || processing}
                                                    >
                                                        {validatingPromo ? 'Проверка...' : 'Применить'}
                                                    </Button>
                                                </div>

                                                {promoValidation && (
                                                    <Alert variant={promoValidation.valid ? 'default' : 'destructive'}>
                                                        <AlertCircle className="h-4 w-4" />
                                                        <AlertDescription>
                                                            {promoValidation.valid ? (
                                                                <div className="space-y-1">
                                                                    <p className="font-semibold">Промокод применен!</p>
                                                                    {discount! > 0 && <p>Скидка: {Number(discount).toFixed(2)} ₽</p>}
                                                                    {trialExtension! > 0 && <p>Продление триала: +{trialExtension} дней</p>}
                                                                </div>
                                                            ) : (
                                                                promoValidation.error
                                                            )}
                                                        </AlertDescription>
                                                    </Alert>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* Summary Card */}
                                    <Card className="border-primary/50">
                                        <CardHeader>
                                            <CardTitle>Итого к оплате</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {plan.price > 0 && (
                                                <>
                                                    <div className="space-y-2">
                                                        {discount! > 0 && (
                                                            <>
                                                                <div className="flex justify-between text-muted-foreground">
                                                                    <span>Стоимость тарифа:</span>
                                                                    <span className="line-through">{Number(plan.price).toFixed(2)} ₽</span>
                                                                </div>
                                                                <div className="flex justify-between text-green-600 font-medium">
                                                                    <span>Скидка по промокоду:</span>
                                                                    <span>-{Number(discount).toFixed(2)} ₽</span>
                                                                </div>
                                                                <Separator />
                                                            </>
                                                        )}
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="text-lg font-semibold">К оплате:</span>
                                                            <span className="text-3xl font-bold">{Number(finalPrice).toFixed(2)} ₽</span>
                                                        </div>
                                                    </div>

                                                    {plan.trial_days > 0 && (
                                                        <Alert>
                                                            <Check className="h-4 w-4" />
                                                            <AlertDescription>
                                                                Первые {plan.trial_days + (trialExtension || 0)} дней бесплатно!
                                                                Оплата спишется автоматически после окончания триального периода.
                                                            </AlertDescription>
                                                        </Alert>
                                                    )}
                                                </>
                                            )}

                                            {plan.price === 0 && (
                                                <div className="text-center py-4">
                                                    <p className="text-2xl font-bold text-green-600">Бесплатно</p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        Базовый тариф не требует оплаты
                                                    </p>
                                                </div>
                                            )}
                                        </CardContent>
                                        <CardFooter className="flex justify-between gap-4">
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => router.visit(route('subscriptions.index'))}
                                                disabled={processing}
                                                className="flex-1"
                                            >
                                                Назад
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={processing}
                                                className="flex-1"
                                                size="lg"
                                            >
                                                {processing ? 'Обработка...' : (plan.price === 0 ? 'Активировать тариф' : 'Перейти к оплате')}
                                            </Button>
                                        </CardFooter>
                                    </Card>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </AppSidebarProvider>
    );
}
