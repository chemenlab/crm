import React, { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { CheckCircle2, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface VKIntegration {
  id: number;
  group_id: string;
  confirmation_code: string;
  is_active: boolean;
  last_verified_at: string | null;
}

interface Props {
  integration: VKIntegration | null;
}

export default function VKIntegration({ integration }: Props) {
  const [disconnectConfirm, setDisconnectConfirm] = useState(false);
  const { data, setData, post, processing, errors } = useForm({
    group_id: '',
    access_token: '',
    secret_key: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/app/integrations/vk');
  };

  const handleDisconnect = () => {
    setDisconnectConfirm(true);
  };

  const confirmDisconnect = () => {
    router.delete('/app/integrations/vk', {
      onSuccess: () => setDisconnectConfirm(false),
    });
  };

  return (
    <AppPageLayout title="VK Интеграция">

      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-6">VK Интеграция</h1>

          {integration ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Интеграция активна</CardTitle>
                    <CardDescription>
                      Группа ID: {integration.group_id}
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
                  <Label>Confirmation Code</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm">
                    {integration.confirmation_code}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Используйте этот код при настройке Callback API в VK
                  </p>
                </div>

                <div>
                  <Label>Webhook URL</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md font-mono text-sm break-all">
                    {window.location.origin}/webhooks/vk
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Укажите этот URL в настройках Callback API вашей группы VK
                  </p>
                </div>

                {integration.last_verified_at && (
                  <div className="text-sm text-gray-600">
                    Последняя проверка:{' '}
                    {new Date(integration.last_verified_at).toLocaleString('ru-RU')}
                  </div>
                )}

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Настройка Callback API:</strong>
                    <ol className="list-decimal list-inside mt-2 space-y-1">
                      <li>Перейдите в настройки вашей группы VK</li>
                      <li>Откройте раздел "Работа с API" → "Callback API"</li>
                      <li>Включите Callback API</li>
                      <li>Укажите Webhook URL выше</li>
                      <li>Введите Confirmation Code при запросе</li>
                      <li>Включите события: "Входящие сообщения" и "Исходящие сообщения"</li>
                    </ol>
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
                <CardTitle>Подключить VK группу</CardTitle>
                <CardDescription>
                  Настройте интеграцию с VK для отправки уведомлений клиентам
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="group_id">ID группы VK</Label>
                    <Input
                      id="group_id"
                      type="text"
                      value={data.group_id}
                      onChange={(e) => setData('group_id', e.target.value)}
                      placeholder="123456789"
                      required
                    />
                    {errors.group_id && (
                      <p className="text-sm text-red-500 mt-1">{errors.group_id}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Найдите ID группы в настройках группы VK
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="access_token">Access Token</Label>
                    <Input
                      id="access_token"
                      type="password"
                      value={data.access_token}
                      onChange={(e) => setData('access_token', e.target.value)}
                      placeholder="vk1.a.xxxxx"
                      required
                    />
                    {errors.access_token && (
                      <p className="text-sm text-red-500 mt-1">{errors.access_token}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Создайте токен в настройках группы → Работа с API → Ключи доступа
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="secret_key">Secret Key (опционально)</Label>
                    <Input
                      id="secret_key"
                      type="password"
                      value={data.secret_key}
                      onChange={(e) => setData('secret_key', e.target.value)}
                      placeholder="Секретный ключ для проверки подписи"
                    />
                    {errors.secret_key && (
                      <p className="text-sm text-red-500 mt-1">{errors.secret_key}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">
                      Рекомендуется для дополнительной безопасности
                    </p>
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Требуемые права для токена:</strong>
                      <ul className="list-disc list-inside mt-2">
                        <li>Управление сообществом (manage)</li>
                        <li>Сообщения сообщества (messages)</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <Button type="submit" disabled={processing}>
                    {processing ? 'Подключение...' : 'Подключить'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
          
          <ConfirmDialog
            open={disconnectConfirm}
            onOpenChange={setDisconnectConfirm}
            onConfirm={confirmDisconnect}
            title="Отключение VK"
            description="Вы уверены, что хотите отключить VK интеграцию?"
            confirmText="Да, отключить"
          />
        </div>
      </div>
    </AppPageLayout>
  );
}
