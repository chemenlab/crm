import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Settings, ExternalLink, Clock, MoreVertical, Power, PowerOff, Package } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { UserModule } from '@/types/modules';

interface Props {
  modules: UserModule[];
}

/**
 * My Modules page - displays user's installed modules with quick actions
 * 
 * Requirements: 2.1
 */
export default function MyModules({ modules }: Props) {
  const handleToggle = (slug: string, name: string, enabled: boolean) => {
    if (enabled) {
      router.post(`/app/modules/${slug}/disable`, {}, { 
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Модуль отключён', {
            description: `«${name}» деактивирован. Данные сохранены.`,
          });
        },
        onError: (errors) => {
          const errorMessage = typeof errors === 'object' && errors.error 
            ? errors.error 
            : 'Не удалось отключить модуль';
          toast.error('Ошибка', { description: errorMessage });
        },
      });
    } else {
      router.post(`/app/modules/${slug}/enable`, {}, { 
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Модуль включён', {
            description: `«${name}» успешно активирован`,
          });
        },
        onError: (errors) => {
          const errorMessage = typeof errors === 'object' && errors.error 
            ? errors.error 
            : 'Не удалось включить модуль';
          toast.error('Ошибка', { description: errorMessage });
        },
      });
    }
  };

  // Count enabled modules
  const enabledCount = modules.filter(m => m.is_enabled).length;

  return (
    <AppSidebarProvider>
      <Head title="Мои приложения" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Мои приложения</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {modules.length > 0 
                  ? `${enabledCount} из ${modules.length} модулей активно`
                  : 'Управляйте установленными модулями'
                }
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/app/modules/history">История покупок</Link>
              </Button>
              <Button asChild>
                <Link href="/app/modules">
                  <Package className="h-4 w-4 mr-2" />
                  Каталог
                </Link>
              </Button>
            </div>
          </div>

          {/* Modules List */}
          {modules.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">Нет установленных модулей</h3>
                <p className="text-muted-foreground mb-4">
                  Расширьте возможности вашей CRM с помощью модулей из каталога
                </p>
                <Button asChild>
                  <Link href="/app/modules">Перейти в каталог</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {modules.map((module) => (
                <Card key={module.slug} className={!module.is_enabled ? 'opacity-75' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <span className="text-lg">{module.icon || '📦'}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">{module.name}</CardTitle>
                            <Badge variant={module.is_enabled ? 'default' : 'secondary'} className="text-xs">
                              {module.is_enabled ? 'Активен' : 'Отключён'}
                            </Badge>
                          </div>
                          {module.category_label && (
                            <CardDescription className="text-xs">{module.category_label}</CardDescription>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={module.is_enabled}
                          onCheckedChange={() => handleToggle(module.slug, module.name, module.is_enabled)}
                          disabled={!module.status.can_access}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                              <span className="sr-only">Действия</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/modules/${module.slug}`}>
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Подробнее
                              </Link>
                            </DropdownMenuItem>
                            {module.is_enabled && (
                              <DropdownMenuItem asChild>
                                <Link href={`/app/modules/${module.slug}/settings`}>
                                  <Settings className="h-4 w-4 mr-2" />
                                  Настройки
                                </Link>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {module.is_enabled ? (
                              <DropdownMenuItem 
                                onClick={() => handleToggle(module.slug, module.name, true)}
                                disabled={!module.status.can_access}
                              >
                                <PowerOff className="h-4 w-4 mr-2" />
                                Отключить
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleToggle(module.slug, module.name, false)}
                                disabled={!module.status.can_access}
                              >
                                <Power className="h-4 w-4 mr-2" />
                                Включить
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  {module.description && (
                    <CardContent className="pb-3">
                      <p className="text-sm text-muted-foreground">{module.description}</p>
                    </CardContent>
                  )}
                  <CardFooter className="pt-0 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {module.enabled_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>Установлен {format(new Date(module.enabled_at), 'd MMM yyyy', { locale: ru })}</span>
                        </div>
                      )}
                      {module.usage_count > 0 && (
                        <span>Использований: {module.usage_count}</span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {module.is_enabled && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/app/modules/${module.slug}/settings`}>
                            <Settings className="h-4 w-4 mr-1" />
                            Настройки
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
