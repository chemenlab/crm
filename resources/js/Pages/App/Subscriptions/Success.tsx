import { Head, Link } from '@inertiajs/react';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { CheckCircle } from 'lucide-react';

interface Props {
    subscription: any;
}

export default function Success({ subscription }: Props) {
    return (
        <AppSidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <SiteHeader />
                <Head title="Подписка активирована" />

            <div className="py-12">
                <div className="max-w-2xl mx-auto sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader className="text-center">
                            <div className="flex justify-center mb-4">
                                <CheckCircle className="h-16 w-16 text-green-500" />
                            </div>
                            <CardTitle className="text-2xl">Подписка успешно активирована!</CardTitle>
                            <CardDescription>
                                Спасибо за выбор тарифа {subscription?.plan.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {subscription?.status === 'trial' && subscription?.trial_ends_at && (
                                <div className="bg-blue-50 p-4 rounded-lg">
                                    <p className="text-sm text-blue-900">
                                        Ваш триальный период активен до{' '}
                                        {new Date(subscription.trial_ends_at).toLocaleDateString('ru-RU')}
                                    </p>
                                </div>
                            )}

                            <div className="bg-muted p-4 rounded-lg space-y-2">
                                <h3 className="font-semibold mb-2">Что дальше?</h3>
                                <ul className="space-y-2 text-sm">
                                    <li>✓ Начните использовать все возможности вашего тарифа</li>
                                    <li>✓ Настройте интеграции для автоматизации работы</li>
                                    <li>✓ Отслеживайте статистику использования в личном кабинете</li>
                                </ul>
                            </div>
                        </CardContent>
                        <CardFooter className="flex gap-2">
                            <Button asChild className="flex-1">
                                <Link href={route('dashboard')}>
                                    Перейти в панель управления
                                </Link>
                            </Button>
                            <Button variant="outline" asChild className="flex-1">
                                <Link href={route('subscriptions.index')}>
                                    Управление подпиской
                                </Link>
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            </div>
            </SidebarInset>
        </AppSidebarProvider>
    );
}
