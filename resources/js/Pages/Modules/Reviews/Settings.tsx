import { Head, router, useForm } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import type { ReviewSettings } from '@/modules/reviews/types';

interface Props {
  settings: ReviewSettings;
}

export default function ReviewsSettings({ settings }: Props) {
  const { data, setData, post, processing } = useForm({
    auto_request: settings.auto_request ?? true,
    request_delay_hours: settings.request_delay_hours ?? 24,
    show_on_public_page: settings.show_on_public_page ?? true,
    require_moderation: settings.require_moderation ?? false,
    min_rating_to_show: settings.min_rating_to_show ?? 1,
    display_mode: settings.display_mode ?? 'grid',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    post('/app/modules/reviews/settings', {
      onSuccess: () => {
        toast.success('Настройки сохранены');
      },
      onError: () => {
        toast.error('Не удалось сохранить настройки');
      },
    });
  };

  return (
    <AppSidebarProvider>
      <Head title="Настройки отзывов" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6">
            <h1 className="text-2xl md:text-3xl font-bold">Настройки отзывов</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Настройте работу модуля отзывов
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
            {/* Auto request settings */}
            <Card>
              <CardHeader>
                <CardTitle>Автоматический запрос отзывов</CardTitle>
                <CardDescription>
                  Настройте автоматическую отправку запросов на отзыв после визита
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Автоматически запрашивать отзыв</Label>
                    <p className="text-sm text-muted-foreground">
                      Отправлять клиенту запрос на отзыв после визита
                    </p>
                  </div>
                  <Switch
                    checked={data.auto_request}
                    onCheckedChange={(checked) => setData('auto_request', checked)}
                  />
                </div>
                {data.auto_request && (
                  <div className="space-y-2">
                    <Label htmlFor="request_delay_hours">Задержка перед отправкой (часы)</Label>
                    <Input
                      id="request_delay_hours"
                      type="number"
                      min={1}
                      max={168}
                      value={data.request_delay_hours}
                      onChange={(e) => setData('request_delay_hours', parseInt(e.target.value))}
                      className="max-w-[200px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Moderation settings */}
            <Card>
              <CardHeader>
                <CardTitle>Модерация</CardTitle>
                <CardDescription>
                  Настройте правила модерации отзывов
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Требовать модерацию</Label>
                    <p className="text-sm text-muted-foreground">
                      Новые отзывы будут ожидать одобрения перед публикацией
                    </p>
                  </div>
                  <Switch
                    checked={data.require_moderation}
                    onCheckedChange={(checked) => setData('require_moderation', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Display settings */}
            <Card>
              <CardHeader>
                <CardTitle>Отображение на публичной странице</CardTitle>
                <CardDescription>
                  Настройте отображение отзывов на вашей публичной странице
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Показывать отзывы</Label>
                    <p className="text-sm text-muted-foreground">
                      Отображать секцию отзывов на публичной странице
                    </p>
                  </div>
                  <Switch
                    checked={data.show_on_public_page}
                    onCheckedChange={(checked) => setData('show_on_public_page', checked)}
                  />
                </div>
                {data.show_on_public_page && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="min_rating_to_show">Минимальный рейтинг для отображения</Label>
                      <Select
                        value={data.min_rating_to_show.toString()}
                        onValueChange={(value) => setData('min_rating_to_show', parseInt(value))}
                      >
                        <SelectTrigger className="max-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 звезда и выше</SelectItem>
                          <SelectItem value="2">2 звезды и выше</SelectItem>
                          <SelectItem value="3">3 звезды и выше</SelectItem>
                          <SelectItem value="4">4 звезды и выше</SelectItem>
                          <SelectItem value="5">Только 5 звёзд</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="display_mode">Режим отображения</Label>
                      <Select
                        value={data.display_mode}
                        onValueChange={(value: 'grid' | 'list' | 'carousel') => setData('display_mode', value)}
                      >
                        <SelectTrigger className="max-w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="grid">Сетка</SelectItem>
                          <SelectItem value="list">Список</SelectItem>
                          <SelectItem value="carousel">Карусель</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={processing}>
                {processing ? 'Сохранение...' : 'Сохранить настройки'}
              </Button>
            </div>
          </form>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
