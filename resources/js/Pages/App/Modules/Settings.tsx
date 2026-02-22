import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Separator } from '@/Components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import { ArrowLeft, Store, Power, Clock, CreditCard, Loader2 } from 'lucide-react';
import { ModuleSettings, type ModuleSettingsSchema } from '@/Components/Modules';

interface ModuleInfo {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
}

interface SubscriptionInfo {
  pricing_type: 'free' | 'subscription' | 'one_time';
  expires_at?: string;
  auto_renew?: boolean;
}

interface Props {
  module: ModuleInfo;
  schema: ModuleSettingsSchema;
  values: Record<string, any>;
  subscription?: SubscriptionInfo;
}

/**
 * Module Settings page
 * Displays a dynamic form for configuring module settings
 */
export default function Settings({ module, schema = {}, values = {}, subscription }: Props) {
  const [isDisabling, setIsDisabling] = useState(false);

  const handleSave = async (newValues: Record<string, any>) => {
    return new Promise<void>((resolve, reject) => {
      router.post(
        `/app/modules/${module.slug}/settings`,
        { settings: newValues },
        {
          preserveScroll: true,
          onSuccess: () => {
            toast.success('Настройки сохранены');
            resolve();
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors.error
              ? errors.error
              : 'Не удалось сохранить настройки';
            toast.error('Ошибка', { description: errorMessage });
            reject(new Error(errorMessage));
          },
        }
      );
    });
  };

  const handleReset = async () => {
    return new Promise<void>((resolve, reject) => {
      router.post(
        `/app/modules/${module.slug}/settings/reset`,
        {},
        {
          preserveScroll: true,
          onSuccess: () => {
            toast.success('Настройки сброшены');
            resolve();
          },
          onError: (errors) => {
            const errorMessage = typeof errors === 'object' && errors.error
              ? errors.error
              : 'Не удалось сбросить настройки';
            toast.error('Ошибка', { description: errorMessage });
            reject(new Error(errorMessage));
          },
        }
      );
    });
  };

  const handleDisable = () => {
    setIsDisabling(true);
    router.post(
      `/app/modules/${module.slug}/disable`,
      {},
      {
        onSuccess: () => {
          toast.success('Модуль отключён', {
            description: `«${module.name}» деактивирован. Данные сохранены.`,
          });
          router.visit('/app/modules/my');
        },
        onError: (errors) => {
          const errorMessage = typeof errors === 'object' && errors.error
            ? errors.error
            : 'Не удалось отключить модуль';
          toast.error('Ошибка', { description: errorMessage });
          setIsDisabling(false);
        },
      }
    );
  };

  const hasSettings = schema && Object.keys(schema).length > 0;

  return (
    <AppSidebarProvider>
      <Head title={`Настройки — ${module.name}`} />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6">
            <div className="flex items-center gap-2 mb-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/modules/my">
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Мои приложения
                </Link>
              </Button>
              <span className="text-muted-foreground">•</span>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/app/modules/${module.slug}`}>
                  <Store className="h-4 w-4 mr-1" />
                  Страница в магазине
                </Link>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <span className="text-2xl">{module.icon || '📦'}</span>
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">{module.name}</h1>
                {module.description && (
                  <p className="text-sm text-muted-foreground mt-1">{module.description}</p>
                )}
              </div>
            </div>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Subscription Info (for paid modules) */}
            {subscription && subscription.pricing_type !== 'free' && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Подписка
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {subscription.expires_at && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Доступ до
                      </span>
                      <span>
                        {new Date(subscription.expires_at).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {subscription.auto_renew !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Автопродление</span>
                      <span>{subscription.auto_renew ? 'Включено' : 'Отключено'}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/app/modules/history">История платежей</Link>
                    </Button>
                    {subscription.auto_renew && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          router.post(`/app/modules/${module.slug}/cancel-subscription`, {}, {
                            onSuccess: () => toast.success('Автопродление отключено'),
                            onError: () => toast.error('Не удалось отключить автопродление'),
                          });
                        }}
                      >
                        Отменить автопродление
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Settings Form */}
            {hasSettings ? (
              <ModuleSettings
                moduleSlug={module.slug}
                moduleName={module.name}
                schema={schema}
                values={values}
                onSave={handleSave}
                onReset={handleReset}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>Настройки</CardTitle>
                  <CardDescription>
                    У этого модуля нет настраиваемых параметров
                  </CardDescription>
                </CardHeader>
              </Card>
            )}

            {/* Danger Zone */}
            <Card className="border-destructive/50">
              <CardHeader>
                <CardTitle className="text-lg text-destructive">Опасная зона</CardTitle>
                <CardDescription>
                  Отключение модуля не удаляет ваши данные. Вы сможете включить его снова в любой момент.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isDisabling}>
                      {isDisabling ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Отключение...
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4 mr-2" />
                          Отключить модуль
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Отключить модуль?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Модуль «{module.name}» будет отключён. Все данные сохранятся, 
                        и вы сможете включить его снова в любой момент.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Отмена</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDisable}>
                        Отключить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
