import { Head } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { router } from '@inertiajs/react';
import { Search, Package, TrendingUp, Star, Clock } from 'lucide-react';
import { useState, useMemo } from 'react';
import { ModuleCard, InstallationProgress } from '@/Components/Modules';
import type { Module } from '@/types/modules';

interface Props {
  modules: Module[];
  categories?: Record<string, Module[]>;
}

const categoryLabels: Record<string, string> = {
  marketing: 'Маркетинг',
  finance: 'Финансы',
  communication: 'Коммуникации',
  analytics: 'Аналитика',
  other: 'Другое',
};

type StatusFilter = 'all' | 'installed' | 'available';
type SortOption = 'popular' | 'rating' | 'newest' | 'name';

export default function Catalog({ modules }: Props) {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [installingSlug, setInstallingSlug] = useState<string | null>(null);
  const [installSuccess, setInstallSuccess] = useState(false);

  const filteredModules = useMemo(() => {
    let result = modules.filter(module => {
      // Search filter
      const matchesSearch = search === '' ||
        module.name.toLowerCase().includes(search.toLowerCase()) ||
        module.description.toLowerCase().includes(search.toLowerCase());

      // Category filter
      const matchesCategory = activeCategory === 'all' || module.category === activeCategory;

      // Status filter
      let matchesStatus = true;
      if (statusFilter === 'installed') {
        matchesStatus = module.status?.is_enabled === true;
      } else if (statusFilter === 'available') {
        matchesStatus = module.status?.is_enabled !== true;
      }

      return matchesSearch && matchesCategory && matchesStatus;
    });

    // Sorting
    switch (sortBy) {
      case 'popular':
        result.sort((a, b) => (b.installs_count || 0) - (a.installs_count || 0));
        break;
      case 'rating':
        result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        // Assuming lower id = older, higher id = newer
        result.sort((a, b) => b.id - a.id);
        break;
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        break;
    }

    return result;
  }, [modules, search, activeCategory, statusFilter, sortBy]);

  const installedCount = modules.filter(m => m.status?.is_enabled).length;

  const handleEnable = (slug: string) => {
    setInstallingSlug(slug);
    setInstallSuccess(false);

    router.post(`/app/modules/${slug}/enable`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setInstallSuccess(true);
      },
      onError: (errors) => {
        setInstallingSlug(null);
        const errorMessage = typeof errors === 'object' && errors.error
          ? errors.error
          : 'Не удалось включить модуль';
        toast.error('Ошибка', { description: errorMessage });
      },
    });
  };

  const handleInstallComplete = () => {
    if (installSuccess) {
      const moduleName = modules.find(m => m.slug === installingSlug)?.name || '';
      setTimeout(() => {
        setInstallingSlug(null);
        setInstallSuccess(false);
        toast.success('Модуль установлен', {
          description: `«${moduleName}» успешно активирован`,
        });
        router.reload();
      }, 1500);
    }
  };

  const handleDisable = (slug: string) => {
    const moduleName = modules.find(m => m.slug === slug)?.name || '';
    router.post(`/app/modules/${slug}/disable`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Модуль отключён', {
          description: `«${moduleName}» деактивирован`,
        });
      },
      onError: (errors) => {
        const errorMessage = typeof errors === 'object' && errors.error
          ? errors.error
          : 'Не удалось отключить модуль';
        toast.error('Ошибка', { description: errorMessage });
      },
    });
  };

  const isFiltering = search || statusFilter !== 'all' || activeCategory !== 'all';

  return (
    <AppSidebarProvider>
      <Head title="Каталог приложений" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />

        {/* Installation Progress Overlay */}
        <InstallationProgress
          isVisible={!!installingSlug}
          onComplete={handleInstallComplete}
          moduleName={modules.find(m => m.slug === installingSlug)?.name}
        />

        <div className="flex flex-col w-full min-h-[calc(100vh-4rem)] bg-background">
          {/* Header */}
          <div className="bg-muted/30 border-b py-8 md:py-10">
            <div className="container max-w-7xl mx-auto px-4 md:px-6">
              <div className="max-w-2xl">
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-3">Каталог приложений</h1>
                <p className="text-lg text-muted-foreground">
                  Расширьте возможности вашей CRM с помощью модулей для маркетинга, финансов и автоматизации.
                </p>
              </div>

              <div className="mt-8 flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="relative flex-1 w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Поиск модулей..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-11 bg-background border-input shadow-sm"
                  />
                </div>
                {/* Filters Desktop */}
                <div className="flex-1 w-full flex items-center justify-between md:justify-end gap-3 flex-wrap">
                  <div className="flex gap-2">
                    <Button
                      variant={statusFilter === 'all' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setStatusFilter('all')}
                      className="h-9"
                    >
                      Все
                    </Button>
                    <Button
                      variant={statusFilter === 'installed' ? 'secondary' : 'ghost'}
                      size="sm"
                      onClick={() => setStatusFilter('installed')}
                      className="h-9"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Установленные <span className="ml-1 opacity-70">({installedCount})</span>
                    </Button>
                  </div>

                  <div className="w-px h-6 bg-border hidden sm:block mx-1" />

                  <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                    <SelectTrigger className="w-[180px] h-9 bg-background shadow-sm border-input">
                      <SelectValue placeholder="Сортировка" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="popular">
                        <div className="flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Популярные
                        </div>
                      </SelectItem>
                      <SelectItem value="rating">
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          По рейтингу
                        </div>
                      </SelectItem>
                      <SelectItem value="newest">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Новые
                        </div>
                      </SelectItem>
                      <SelectItem value="name">
                        <div className="flex items-center gap-2">
                          По названию
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="container max-w-7xl mx-auto px-4 md:px-6 py-8">
            {/* Category Tabs */}
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8 overflow-x-auto pb-1">
              <TabsList className="h-auto gap-2 bg-transparent p-0 justify-start w-full">
                <TabsTrigger value="all" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 h-9 text-sm">Все категории</TabsTrigger>
                {Object.entries(categoryLabels).map(([key, label]) => (
                  <TabsTrigger key={key} value={key} className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border px-4 py-2 h-9 text-sm">
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* All Modules */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold tracking-tight">
                  {isFiltering ? `Результаты (${filteredModules.length})` : `Все модули (${filteredModules.length})`}
                </h2>
              </div>

              {filteredModules.length === 0 ? (
                <div className="text-center py-16 border-2 border-dashed rounded-xl bg-muted/20">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4 opacity-50">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground">Модули не найдены</h3>
                  <p className="text-muted-foreground mt-1 max-w-sm mx-auto">
                    По вашему запросу ничего не найдено. Попробуйте изменить параметры поиска или фильтры.
                  </p>
                  {isFiltering && (
                    <Button
                      variant="link"
                      className="mt-4"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('all');
                        setActiveCategory('all');
                      }}
                    >
                      Сбросить фильтры
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredModules.map((module) => (
                    <ModuleCard
                      key={module.slug}
                      module={module}
                      onEnable={() => handleEnable(module.slug)}
                      onDisable={() => handleDisable(module.slug)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
