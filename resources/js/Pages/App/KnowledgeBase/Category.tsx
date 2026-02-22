import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/Components/ui/breadcrumb';
import { Clock, ChevronRight, BookOpen } from 'lucide-react';
import { Icon } from '@/utils/iconMapper';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  reading_time: number;
  view_count: number;
  category: Category;
}

interface Props {
  category: Category;
  articles: {
    data: Article[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  breadcrumbs: Array<{ name: string; slug?: string }>;
  subcategories: Category[];
}

export default function Category({ category, articles, breadcrumbs, subcategories }: Props) {
  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <Head title={category.name} />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-6xl">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={route('knowledge-base.index')}>
                    База знаний
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.slug ? (
                        <BreadcrumbLink href={route('knowledge-base.category', crumb.slug)}>
                          {crumb.name}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Category Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  {category.icon && (
                    <div
                      className="w-16 h-16 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: category.color || '#3b82f6' }}
                    >
                      <Icon name={category.icon} className="h-8 w-8" />
                    </div>
                  )}
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                      {category.name}
                    </h1>
                    {category.description && (
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {articles.total} статей в этой категории
                </div>
              </CardContent>
            </Card>

            {/* Subcategories */}
            {subcategories && subcategories.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Подкатегории
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {subcategories.map((subcat) => (
                    <Link
                      key={subcat.id}
                      href={route('knowledge-base.category', subcat.slug)}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {subcat.icon && (
                                <div
                                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                                  style={{ backgroundColor: subcat.color || '#3b82f6' }}
                                >
                                  {subcat.icon}
                                </div>
                              )}
                              <CardTitle className="text-base">{subcat.name}</CardTitle>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400" />
                          </div>
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Articles List */}
            {articles.data.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Нет статей
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    В этой категории пока нет статей
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {articles.data.map((article) => (
                    <Link
                      key={article.id}
                      href={route('knowledge-base.show', article.slug)}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                {article.title}
                              </h3>
                              {article.excerpt && (
                                <p className="text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                                  {article.excerpt}
                                </p>
                              )}
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {article.reading_time} мин
                                </div>
                                <span>•</span>
                                <span>{article.view_count} просмотров</span>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>

                {/* Pagination */}
                {articles.last_page > 1 && (
                  <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: articles.last_page }, (_, i) => i + 1).map(
                      (page) => (
                        <Button
                          key={page}
                          variant={page === articles.current_page ? 'default' : 'outline'}
                          size="sm"
                          onClick={() =>
                            router.get(route('knowledge-base.category', category.slug), {
                              page,
                            })
                          }
                        >
                          {page}
                        </Button>
                      )
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
