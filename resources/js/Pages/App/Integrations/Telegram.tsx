import { useState } from 'react';
import { router } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Trash2, RefreshCw } from 'lucide-react';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

// @ts-ignore
declare const route: any;

interface TelegramIntegration {
  id: number;
  telegram_id: string;
  username: string | null;
  first_name: string | null;
  is_active: boolean;
  linked_at: string;
}

interface Props {
  integration: TelegramIntegration | null;
  linkingCode: string | null;
  botUsername: string;
}

export default function TelegramIntegration({ integration, linkingCode, botUsername }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);

  const handleGenerateCode = () => {
    setIsGenerating(true);
    router.post(
      '/app/integrations/telegram/generate-code',
      {},
      {
        onFinish: () => setIsGenerating(false),
      }
    );
  };

  const handleDisconnect = () => {
    setDisconnectConfirm(true);
  };

  const confirmDisconnect = () => {
    router.delete('/app/integrations/telegram', {
      onSuccess: () => setDisconnectConfirm(false),
    });
  };

  return (
    <AppPageLayout title="Telegram Интеграция">

      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">Telegram Интеграция</h1>

          {integration ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Интеграция активна</CardTitle>
                    <CardDescription>
                      {integration.first_name && `${integration.first_name} `}
                      {integration.username && `(@${integration.username})`}
                    </CardDescription>
                  </div>
                  <Badge variant={integration.is_active ? 'default' : 'secondary'}>
                    {integration.is_active ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1" />
                        Активна
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Неактивна
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Telegram ID</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {integration.telegram_id}
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Подключено: {new Date(integration.linked_at).toLocaleString('ru-RU')}
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Доступные команды бота:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>
                        <code>/today</code> - записи на сегодня
                      </li>
                      <li>
                        <code>/tomorrow</code> - записи на завтра
                      </li>
                      <li>
                        <code>/stats</code> - статистика за месяц
                      </li>
                    </ul>
                    <p className="mt-2">
                      Вы также будете получать уведомления о новых записях и ежедневную сводку в
                      8:00
                    </p>
                  </AlertDescription>
                </Alert>

                <Button variant="destructive" onClick={handleDisconnect}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Отключить интеграцию
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Подключить Telegram</CardTitle>
                <CardDescription>
                  Получайте уведомления о записях и управляйте расписанием через Telegram бота
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {linkingCode ? (
                  <>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Код для привязки сгенерирован!</strong>
                        <p className="mt-2">Следуйте инструкциям ниже для подключения.</p>
                      </AlertDescription>
                    </Alert>

                    <div>
                      <Label>Код привязки</Label>
                      <div className="mt-1 p-4 bg-gray-50 rounded-md text-center">
                        <span className="text-3xl font-bold font-mono tracking-wider">
                          {linkingCode}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        Код действителен 10 минут
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label>Инструкция по подключению:</Label>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>
                          Откройте Telegram и найдите бота{' '}
                          <a
                            href={`https://t.me/${botUsername}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline font-medium"
                          >
                            @{botUsername}
                          </a>
                        </li>
                        <li>Нажмите "Начать" или отправьте команду /start</li>
                        <li>
                          Отправьте команду <code className="bg-gray-100 px-2 py-1 rounded">/link {linkingCode}</code>
                        </li>
                        <li>Дождитесь подтверждения от бота</li>
                      </ol>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={handleGenerateCode}
                        disabled={isGenerating}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Сгенерировать новый код
                      </Button>
                      <Button asChild>
                        <a
                          href={`https://t.me/${botUsername}?start=link`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Открыть бота
                        </a>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <strong>Что вы получите:</strong>
                        <ul className="list-disc list-inside mt-2 space-y-1">
                          <li>Уведомления о новых записях</li>
                          <li>Уведомления об отмене записей</li>
                          <li>Ежедневную сводку записей в 8:00</li>
                          <li>Возможность просматривать расписание через команды бота</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    <Button onClick={handleGenerateCode} disabled={isGenerating}>
                      {isGenerating ? 'Генерация...' : 'Сгенерировать код привязки'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}
          
          <ConfirmDialog
            open={disconnectConfirm}
            onOpenChange={setDisconnectConfirm}
            onConfirm={confirmDisconnect}
            title="Отключение Telegram"
            description="Вы уверены, что хотите отключить Telegram интеграцию?"
            confirmText="Да, отключить"
          />
        </div>
      </div>
    </AppPageLayout>
  );
}
