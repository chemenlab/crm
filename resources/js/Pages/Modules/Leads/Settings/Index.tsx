import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Switch } from '@/Components/ui/switch';

import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Bell,
  Info,
  Settings,
  BarChart3,
  ChevronRight,
  Check,
  Download,
  Trash2,
} from 'lucide-react';

interface ModuleInfo {
  slug: string;
  name: string;
  description: string;
  version: string;
  author: string;
  category: string;
  price: string;
  is_enabled: boolean;
  features?: string[];
}

interface ModuleStats {
  total_leads: number;
  leads_this_month: number;
  conversion_rate: number;
  avg_response_time: string;
}

interface ModuleSettings {
  notify_on_new_lead: boolean;
  default_status: string;
  auto_assign_tags: boolean;
}

interface Props {
  moduleInfo: ModuleInfo;
  stats: ModuleStats | null;
  settings: ModuleSettings;
}

export default function LeadsSettings({ moduleInfo, stats, settings }: Props) {
  const handleInstall = () => {
    router.post(`/app/modules/${moduleInfo.slug}/enable`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Модуль установлен'),
      onError: () => toast.error('Ошибка при установке модуля'),
    });
  };

  const handleUninstall = () => {
    if (!confirm('Вы уверены, что хотите отключить модуль? Все данные будут сохранены.')) return;
    router.post(`/app/modules/${moduleInfo.slug}/disable`, {}, {
      preserveScroll: true,
      onSuccess: () => toast.success('Модуль отключён'),
      onError: () => toast.error('Ошибка при отключении модуля'),
    });
  };

  return (
    <AppSidebarProvider>
      <Head title={`${moduleInfo.is_enabled ? 'Настройки' : 'Обзор'} модуля ${moduleInfo.name}`} />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.visit('/app/modules')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {moduleInfo.is_enabled ? 'Настройки модуля' : 'Обзор модуля'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {moduleInfo.is_enabled ? 'Управление модулем' : 'Информация о модуле'} "{moduleInfo.name}"
                </p>
              </div>
              {moduleInfo.is_enabled ? (
                <Button variant="outline" onClick={handleUninstall}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Отключить модуль
                </Button>
              ) : (
                <Button onClick={handleInstall}>
                  <Download className="h-4 w-4 mr-2" />
                  Включить модуль
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Module Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  О модуле
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ClipboardList className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{moduleInfo.name}</h3>
                    <p className="text-sm text-muted-foreground">{moduleInfo.description}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Версия</p>
                    <p className="font-medium">{moduleInfo.version}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Автор</p>
                    <p className="font-medium">{moduleInfo.author}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Категория</p>
                    <Badge variant="secondary">{moduleInfo.category}</Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Стоимость</p>
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                      {moduleInfo.price}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features or Stats */}
            {moduleInfo.is_enabled && stats ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Статистика
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{stats.total_leads}</p>
                      <p className="text-xs text-muted-foreground">Всего заявок</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{stats.leads_this_month}</p>
                      <p className="text-xs text-muted-foreground">За этот месяц</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{stats.conversion_rate}%</p>
                      <p className="text-xs text-muted-foreground">Конверсия</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-2xl font-bold">{stats.avg_response_time}</p>
                      <p className="text-xs text-muted-foreground">Среднее время ответа</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Возможности
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {moduleInfo.features?.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Settings Sections - only if enabled */}
            {moduleInfo.is_enabled && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Настройки
                  </CardTitle>
                  <CardDescription>
                    Настройте поведение модуля под ваши нужды
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {/* Form Fields */}
                  <button
                    onClick={() => router.visit('/app/modules/leads/settings/fields')}
                    className="w-full flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium">Поля формы</p>
                        <p className="text-sm text-muted-foreground">
                          Настройте дополнительные поля для формы заявки
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </button>

                  {/* Notifications */}
                  <div className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Уведомления о новых заявках</p>
                        <p className="text-sm text-muted-foreground">
                          Получать уведомления при поступлении новых заявок
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.notify_on_new_lead}
                      onCheckedChange={(checked) => {
                        router.patch('/app/modules/leads/settings', {
                          notify_on_new_lead: checked,
                        }, { preserveScroll: true });
                      }}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Install CTA for non-enabled */}
            {!moduleInfo.is_enabled && (
              <Card className="md:col-span-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Установите модуль</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4 max-w-md">
                    Установите модуль "{moduleInfo.name}" чтобы начать собирать и управлять заявками на ваши услуги
                  </p>
                  <Button size="lg" onClick={handleInstall}>
                    <Download className="h-4 w-4 mr-2" />
                    Включить бесплатно
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
