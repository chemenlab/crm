import { Head, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Search, BookOpen, TrendingUp, Star, Clock, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { Icon } from '@/utils/iconMapper';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  article_count?: number;
  children?: Category[];
}

interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  reading_time: number;
  view_count: number;
  category?: {
    name: string;
    slug: string;
  };
}

interface Props {
  categories: Category[];
  featuredArticles: Article[];
  popularArticles: Article[];
}

export default function Index({ categories, featuredArticles, popularArticles }: Props) {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = route('knowledge-base.index', { search: searchQuery });
    }
  };

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <Head title="База знаний" />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-6xl">
            {/* Header */}
            <div className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                База знаний
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Найдите ответы на ваши вопросы и изучите возможности MasterPlan
              </p>
            </div>

            {/* Search */}
            <Card className="mb-8">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Поиск по базе знаний..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <Button type="submit">Найти</Button>
                </form>
              </CardContent>
            </Card>

            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Избранные статьи
                  </h2>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  {featuredArticles.map((article) => (
                    <Link key={article.id} href={route('knowledge-base.show', article.slug)}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardHeader>
                          <div className="flex items-start justify-between mb-2">
                            <Badge variant="outline">{article.category?.name}</Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {article.reading_time} мин
                            </div>
                          </div>
                          <CardTitle className="text-lg">{article.title}</CardTitle>
                          {article.excerpt && (
                            <CardDescription className="line-clamp-2">
                              {article.excerpt}
                            </CardDescription>
                          )}
                        </CardHeader>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Categories */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Категории
                </h2>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categories.map((category) => (
                  <Link
                    key={category.id}
                    href={route('knowledge-base.category', category.slug)}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {category.icon && (
                              <div
                                className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                                style={{ backgroundColor: category.color || '#3b82f6' }}
                              >
                                <Icon name={category.icon} className="h-5 w-5" />
                              </div>
                            )}
                            <div>
                              <CardTitle className="text-base">{category.name}</CardTitle>
                              {category.article_count !== undefined && (
                                <p className="text-sm text-gray-500 mt-1">
                                  {category.article_count} статей
                                </p>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>
                        {category.description && (
                          <CardDescription className="line-clamp-2 mt-2">
                            {category.description}
                          </CardDescription>
                        )}
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>

            {/* Popular Articles */}
            {popularArticles.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Популярные статьи
                  </h2>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="divide-y">
                      {popularArticles.map((article) => (
                        <Link
                          key={article.id}
                          href={route('knowledge-base.show', article.slug)}
                        >
                          <div className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                                  {article.title}
                                </h3>
                                <div className="flex items-center gap-3 text-sm text-gray-500">
                                  <span>{article.category?.name}</span>
                                  <span>•</span>
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
                          </div>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
