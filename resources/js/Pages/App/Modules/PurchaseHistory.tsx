import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/Components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
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
import { ArrowLeft, MoreHorizontal, XCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { ModulePurchase } from '@/types/modules';

interface Props {
  purchases: {
    data: ModulePurchase[];
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  refunded: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
  cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function PurchaseHistory({ purchases }: Props) {
  const handleCancelSubscription = (slug: string, moduleName: string) => {
    router.post(`/app/modules/${slug}/cancel-subscription`, {}, { 
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Подписка отменена', {
          description: `Автопродление для «${moduleName}» отключено. Доступ сохранится до конца оплаченного периода.`,
        });
      },
      onError: (errors) => {
        const errorMessage = typeof errors === 'object' && errors.error 
          ? errors.error 
          : 'Не удалось отменить подписку';
        toast.error('Ошибка', { description: errorMessage });
      },
    });
  };

  return (
    <AppSidebarProvider>
      <Head title="История покупок" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Back Button */}
          <div className="py-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/app/modules/my">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Мои приложения
              </Link>
            </Button>
          </div>

          {/* Header */}
          <div className="py-4 md:py-6">
            <h1 className="text-2xl md:text-3xl font-bold">История покупок</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Все ваши покупки модулей
            </p>
          </div>

          {/* Purchases Table */}
          <Card>
            <CardContent className="p-0">
              {purchases.data.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-muted-foreground mb-4">У вас пока нет покупок</p>
                  <Button asChild>
                    <Link href="/app/modules">Перейти в каталог</Link>
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Модуль</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Сумма</TableHead>
                      <TableHead>Статус</TableHead>
                      <TableHead>Дата</TableHead>
                      <TableHead>Действует до</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchases.data.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{purchase.module_icon || '📦'}</span>
                            <span className="font-medium">{purchase.module_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{purchase.pricing_type_label}</Badge>
                        </TableCell>
                        <TableCell>{purchase.formatted_price}</TableCell>
                        <TableCell>
                          <Badge className={statusColors[purchase.status]}>
                            {purchase.status_label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {purchase.purchased_at 
                            ? format(new Date(purchase.purchased_at), 'd MMM yyyy', { locale: ru })
                            : '—'
                          }
                        </TableCell>
                        <TableCell>
                          {purchase.expires_at 
                            ? format(new Date(purchase.expires_at), 'd MMM yyyy', { locale: ru })
                            : '∞'
                          }
                        </TableCell>
                        <TableCell>
                          {purchase.pricing_type === 'subscription' && 
                           purchase.is_active && 
                           purchase.auto_renew && (
                            <AlertDialog>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem 
                                      className="text-destructive"
                                      onSelect={(e) => e.preventDefault()}
                                    >
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Отменить подписку
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Отменить подписку?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Вы уверены, что хотите отменить подписку на модуль «{purchase.module_name}»? 
                                    Доступ сохранится до конца оплаченного периода
                                    {purchase.expires_at && (
                                      <> ({format(new Date(purchase.expires_at), 'd MMMM yyyy', { locale: ru })})</>
                                    )}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleCancelSubscription(purchase.module_slug, purchase.module_name)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Отменить подписку
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {purchase.pricing_type === 'subscription' && 
                           purchase.is_active && 
                           !purchase.auto_renew && (
                            <Badge variant="outline" className="text-xs">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Не продлевается
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
