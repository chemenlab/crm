import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/Components/ui/tabs';
import {
  ArrowLeft, Star, Download, Check, ShoppingCart, Clock, Shield,
  Settings, Loader2, Info, BookOpen, MessageSquare, LayoutGrid
} from 'lucide-react';
import { ScreenshotGallery, ModuleStatusBadge, InstallationProgress, ReviewForm, ReviewsList } from '@/Components/Modules';
import { MarkdownRenderer } from '@/Components/ui/markdown-renderer';
import { DynamicIcon } from '@/Components/DynamicIcon';
import type { Module, ModuleAccessStatus } from '@/types/modules';

interface ModuleReview {
  id: number;
  user_name: string;
  user_initials?: string;
  rating: number;
  comment: string | null;
  is_verified: boolean;
  created_at: string;
}

interface RatingStats {
  average: number;
  total: number;
  distribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

interface Props {
  module: Module & { reviews_count?: number };
  status: ModuleAccessStatus;
  reviews?: ModuleReview[];
  rating_stats?: RatingStats;
  user_review?: {
    id: number;
    rating: number;
    comment: string | null;
  } | null;
  can_review?: boolean;
}

export default function Show({ module, status, reviews = [], rating_stats, user_review, can_review }: Props) {
  const [isEnabling, setIsEnabling] = useState(false);
  const [showInstallProgress, setShowInstallProgress] = useState(false);
  const [installationSuccess, setInstallationSuccess] = useState(false);

  const handleEnableFree = () => {
    setIsEnabling(true);
    setShowInstallProgress(true);

    router.post(`/app/modules/${module.slug}/enable`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setInstallationSuccess(true);
      },
      onError: (errors) => {
        setShowInstallProgress(false);
        setIsEnabling(false);
        const errorMessage = typeof errors === 'object' && errors.error
          ? errors.error
          : 'Не удалось установить модуль';
        toast.error('Ошибка', { description: errorMessage });
      },
    });
  };

  const handleInstallComplete = () => {
    if (installationSuccess) {
      setTimeout(() => {
        setShowInstallProgress(false);
        setIsEnabling(false);
        toast.success('Модуль установлен', {
          description: `«${module.name}» успешно активирован`,
        });
        router.reload();
      }, 1500);
    }
  };

  const getActionButton = () => {
    // Если модуль установлен - кнопка "Настройки"
    if (status.is_enabled) {
      return (
        <Button className="w-full text-base font-medium h-12 shadow-md hover:shadow-lg transition-all" variant="outline" asChild>
          <Link href={`/app/modules/${module.slug}/settings`}>
            <Settings className="h-5 w-5 mr-2 text-primary" />
            Перейти к настройкам
          </Link>
        </Button>
      );
    }

    // Если бесплатный и можно установить - "Установить бесплатно"
    if (module.pricing_type === 'free' && status.can_access) {
      return (
        <Button className="w-full text-base font-medium h-12 shadow-md hover:shadow-lg transition-all" onClick={handleEnableFree} disabled={isEnabling}>
          {isEnabling ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Установка...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Установить бесплатно
            </>
          )}
        </Button>
      );
    }

    // Если платный и не куплен - "Купить за X ₽" → переход на checkout
    if (status.reason === 'purchase_required') {
      return (
        <Button className="w-full text-base font-medium h-12 shadow-md hover:shadow-lg transition-all" asChild>
          <Link href={`/app/modules/${module.slug}/checkout`}>
            <ShoppingCart className="h-5 w-5 mr-2" />
            Купить сейчас
          </Link>
        </Button>
      );
    }

    // Если требуется более высокий тариф
    if (status.reason === 'plan_required') {
      return (
        <Button className="w-full text-base font-medium h-12 shadow-md hover:shadow-lg transition-all" variant="secondary" asChild>
          <Link href="/app/subscription">
            <Shield className="h-5 w-5 mr-2" />
            Обновить тариф
          </Link>
        </Button>
      );
    }

    // Если куплен, но не включён - "Включить"
    if (status.can_access) {
      return (
        <Button className="w-full text-base font-medium h-12 shadow-md hover:shadow-lg transition-all" onClick={handleEnableFree} disabled={isEnabling}>
          {isEnabling ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Включение...
            </>
          ) : (
            <>
              <Check className="h-5 w-5 mr-2" />
              Включить модуль
            </>
          )}
        </Button>
      );
    }

    return null;
  };

  return (
    <AppSidebarProvider>
      <Head title={module.name} />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        <InstallationProgress
          isVisible={showInstallProgress}
          onComplete={handleInstallComplete}
          moduleName={module.name}
        />

        <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-background">
          {/* Hero Section */}
          <div className="bg-muted/30 border-b py-8 md:py-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
            <div className="container max-w-7xl mx-auto px-4 md:px-6 relative z-10">
              <div className="mb-6">
                <Link href="/app/modules" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors p-2 -ml-2 rounded-md hover:bg-muted/50">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад в каталог
                </Link>
              </div>

              <div className="flex flex-col md:flex-row gap-8 md:gap-10">
                <div className="shrink-0 relative">
                  <div className="h-28 w-28 md:h-36 md:w-36 rounded-2xl bg-background shadow-lg border border-border/50 flex items-center justify-center text-5xl md:text-6xl overflow-hidden ring-4 ring-background/50">
                    <DynamicIcon name={module.icon} className="h-16 w-16 text-primary" />
                  </div>
                  <div className="absolute -bottom-3 -right-3 md:right-auto md:left-1/2 md:-translate-x-1/2 md:-bottom-4 whitespace-nowrap">
                    <ModuleStatusBadge status={status} size="default" />
                  </div>
                </div>

                <div className="flex-1 space-y-4 md:pt-2">
                  <div className="space-y-2">
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">{module.name}</h1>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">{module.author}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold uppercase tracking-wider">{module.category_label}</span>
                      <span className="w-1 h-1 rounded-full bg-border" />
                      <span>v{module.version}</span>
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground leading-relaxed max-w-3xl">
                    {module.description}
                  </p>

                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        <span className="text-lg font-bold ml-1.5">{module.rating.toFixed(1)}</span>
                      </div>
                      {/* Scroll smoothly to reviews */}
                      <button onClick={() => document.getElementById('reviews')?.scrollIntoView({ behavior: 'smooth' })} className="text-sm text-muted-foreground hover:underline hover:text-foreground transition-colors">
                        ({module.reviews_count || 0} отзывов)
                      </button>
                    </div>
                    <div className="w-px h-5 bg-border" />
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Download className="h-4 w-4" />
                      <span>{module.installs_count} установок</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

              {/* Left Content (Tabs) */}
              <div className="lg:col-span-8 space-y-8">
                {/* Screenshots Gallery */}
                {module.screenshots && module.screenshots.length > 0 && (
                  <div className="overflow-hidden rounded-xl border shadow-sm bg-background">
                    <ScreenshotGallery screenshots={module.screenshots} moduleName={module.name} />
                  </div>
                )}

                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none bg-transparent h-auto p-0 mb-6 space-x-6 overflow-x-auto">
                    <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-0 font-semibold text-base text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                      <Info className="h-4 w-4" /> Обзор
                    </TabsTrigger>
                    {(module.documentation) && (
                      <TabsTrigger value="docs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-0 font-semibold text-base text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                        <BookOpen className="h-4 w-4" /> Документация
                      </TabsTrigger>
                    )}
                    {(module.changelog) && (
                      <TabsTrigger value="changelog" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-0 font-semibold text-base text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" /> История версий
                      </TabsTrigger>
                    )}
                    <TabsTrigger value="reviews" id="reviews-tab" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none py-3 px-0 font-semibold text-base text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" /> Отзывы
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-img:rounded-xl">
                      <MarkdownRenderer content={module.long_description || module.description} />
                    </div>
                  </TabsContent>

                  <TabsContent value="docs" className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="prose dark:prose-invert max-w-none prose-headings:font-bold prose-pre:bg-muted prose-pre:text-foreground">
                      <MarkdownRenderer content={module.documentation || ''} />
                    </div>
                  </TabsContent>

                  <TabsContent value="changelog" className="space-y-6 animate-in fade-in-50 duration-300">
                    <div className="prose dark:prose-invert max-w-none prose-li:marker:text-primary">
                      <MarkdownRenderer content={module.changelog || ''} />
                    </div>
                  </TabsContent>

                  <TabsContent value="reviews" className="space-y-8 animate-in fade-in-50 duration-300">
                    <div id="reviews">
                      <ReviewsList
                        reviews={reviews}
                        ratingStats={rating_stats || { average: 0, total: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }}
                      />
                      <Separator className="my-8" />
                      <ReviewForm
                        moduleSlug={module.slug}
                        canReview={can_review || false}
                        userReview={user_review}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-4 space-y-6">
                <Card className="border-2 border-primary/5 shadow-xl overflow-hidden sticky top-24">
                  <div className="h-1.5 w-full bg-gradient-to-r from-primary/30 via-primary to-primary/30" />
                  <div className="bg-primary/5 p-6 border-b border-primary/10">
                    <div className="text-sm font-medium text-muted-foreground mb-1 uppercase tracking-wider">Стоимость</div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-4xl font-black text-foreground tracking-tight">
                        {module.pricing_type === 'free' ? 'Бесплатно' : module.formatted_price}
                      </span>
                      {module.subscription_period && (
                        <span className="text-muted-foreground font-medium">/{module.subscription_period === 'monthly' ? 'мес' : 'год'}</span>
                      )}
                    </div>
                  </div>
                  <CardContent className="p-6 space-y-6">
                    {getActionButton()}

                    {/* License Info */}
                    {(status.is_enabled || status.reason === 'purchased') && (
                      <div className="rounded-l-md border-l-4 border-green-500 bg-green-500/10 p-4 text-sm flex items-start gap-3">
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        <div className="space-y-1">
                          <p className="font-bold text-green-900 dark:text-green-100">Лицензия активна</p>
                          {status.purchase_expires_at && (
                            <p className="text-green-800/80 dark:text-green-200/80 text-xs">Действует до {new Date(status.purchase_expires_at).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="space-y-4 pt-2">
                      <h4 className="font-semibold text-sm">Включено:</h4>
                      <ul className="space-y-3">
                        <li className="flex items-start text-sm gap-2.5 text-muted-foreground">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Мгновенная активация функций</span>
                        </li>
                        <li className="flex items-start text-sm gap-2.5 text-muted-foreground">
                          <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Безопасная обработка данных</span>
                        </li>
                        <li className="flex items-start text-sm gap-2.5 text-muted-foreground">
                          <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>Круглосуточная поддержка</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/30 border-t p-4 flex flex-col items-center justify-center text-center">
                    <p className="text-xs text-muted-foreground">
                      Возникли вопросы? <Link href="#" className="font-medium text-primary hover:underline">Напишите нам</Link>
                    </p>
                  </CardFooter>
                </Card>

                {/* Dependencies or other info could go here */}
                {module.dependencies && module.dependencies.length > 0 && (
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3 px-6 pt-5">
                      <CardTitle className="text-base text-foreground font-semibold">Зависимости</CardTitle>
                    </CardHeader>
                    <CardContent className="px-6 pb-5">
                      <div className="flex flex-wrap gap-2">
                        {module.dependencies.map(dep => (
                          <Badge key={dep} variant="secondary" className="text-xs py-1 px-2.5 font-normal bg-secondary">
                            {dep}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
