import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { CheckCircle2, XCircle, Send, Unlink, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface TelegramIntegrationProps {
    user: {
        telegram_id?: string | null;
        telegram_username?: string | null;
        telegram_verified_at?: string | null;
    };
}

export default function TelegramIntegration({ user }: TelegramIntegrationProps) {
    const [isConnecting, setIsConnecting] = useState(false);
    const [isDisconnecting, setIsDisconnecting] = useState(false);
    const [disconnectConfirm, setDisconnectConfirm] = useState(false);
    
    const isConnected = !!user.telegram_verified_at;

    const handleConnect = async () => {
        setIsConnecting(true);
        
        try {
            const response = await axios.post('/app/settings/profile/telegram/generate-link');
            const { link } = response.data;
            
            // Открыть Telegram в новой вкладке
            window.open(link, '_blank');
            
            toast.success('Telegram открыт! Нажмите "Start" в боте для подключения.', {
                duration: 5000,
            });
            
            // Обновить страницу через 3 секунды, чтобы пользователь увидел изменения
            setTimeout(() => {
                router.reload({ only: ['user'] });
            }, 3000);
        } catch (error) {
            console.error('Error generating Telegram link:', error);
            toast.error('Ошибка при генерации ссылки. Попробуйте еще раз.');
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setDisconnectConfirm(true);
    };

    const confirmDisconnect = () => {
        setIsDisconnecting(true);
        
        router.delete('/app/settings/profile/telegram/unlink', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Telegram аккаунт отключен');
                setDisconnectConfirm(false);
            },
            onError: () => {
                toast.error('Ошибка при отключении Telegram');
            },
            onFinish: () => {
                setIsDisconnecting(false);
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-5 w-5" />
                            Telegram
                        </CardTitle>
                        <CardDescription>
                            Получайте уведомления о записях и тикетах в Telegram
                        </CardDescription>
                    </div>
                    {isConnected && (
                        <Badge variant="default" className="bg-green-500">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Подключено
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {isConnected ? (
                    <>
                        {/* Информация о подключенном аккаунте */}
                        <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                                    Telegram подключен
                                </p>
                                {user.telegram_username && (
                                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                                        @{user.telegram_username}
                                    </p>
                                )}
                                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                                    Вы будете получать уведомления о новых записях, изменениях и ответах на тикеты
                                </p>
                            </div>
                        </div>

                        {/* Кнопка отключения */}
                        <div className="flex justify-end">
                            <Button
                                variant="outline"
                                onClick={handleDisconnect}
                                disabled={isDisconnecting}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                                {isDisconnecting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Отключение...
                                    </>
                                ) : (
                                    <>
                                        <Unlink className="h-4 w-4 mr-2" />
                                        Отключить Telegram
                                    </>
                                )}
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Информация о подключении */}
                        <Alert>
                            <Info className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-medium mb-2">Как это работает:</p>
                                <ol className="list-decimal list-inside space-y-1 text-sm">
                                    <li>Нажмите кнопку "Подключить Telegram"</li>
                                    <li>Telegram откроется автоматически</li>
                                    <li>Нажмите "Start" в боте</li>
                                    <li>Готово! Вы начнете получать уведомления</li>
                                </ol>
                            </AlertDescription>
                        </Alert>

                        {/* Преимущества */}
                        <div className="space-y-2">
                            <Label className="text-sm font-medium">Вы будете получать уведомления о:</Label>
                            <ul className="space-y-1.5 text-sm text-muted-foreground">
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    Новых записях клиентов
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    Изменениях в записях
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    Ответах на тикеты поддержки
                                </li>
                                <li className="flex items-center gap-2">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                                    Напоминаниях о предстоящих записях
                                </li>
                            </ul>
                        </div>

                        {/* Кнопка подключения */}
                        <Button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="w-full"
                        >
                            {isConnecting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Открываем Telegram...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Подключить Telegram
                                </>
                            )}
                        </Button>
                    </>
                )}
                
                <ConfirmDialog
                    open={disconnectConfirm}
                    onOpenChange={setDisconnectConfirm}
                    onConfirm={confirmDisconnect}
                    title="Отключение Telegram"
                    description="Вы уверены, что хотите отключить Telegram уведомления?"
                    confirmText="Да, отключить"
                />
            </CardContent>
        </Card>
    );
}
