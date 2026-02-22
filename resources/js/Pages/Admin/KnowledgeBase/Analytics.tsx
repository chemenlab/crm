import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AdminLayout from '@/Layouts/AdminLayout';
import { Eye, TrendingUp, ThumbsUp, FileText, Clock } from 'lucide-react';

interface Article {
  id: number;
  title: string;
  slug: string;
  view_count: number;
  helpful_percentage?: number;
  category: {
    name: string;
  };
}

interface Stats {
  total_articles: number;
  total_views: number;
  total_ratings: number;
  average_helpful_percentage: number;
  views_today: number;
  views_this_week: number;
  views_this_month: number;
}

interface Props {
  stats: Stats;
  topArticles: Article[];
  lowRatedArticles: Article[];
}

export default function Analytics({ stats, topArticles, lowRatedArticles }: Props) {
  return (
    <AdminLayout>
      <Head title="Аналитика базы знаний" />

      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Аналитика базы знаний
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Статистика использования и эффективности статей
              </p>
            </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего статей</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_articles}</div>
                  <p className="text-xs text-muted-foreground">
                    Опубликованных статей
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Всего просмотров</CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_views}</div>
                  <p className="text-xs text-muted-foreground">
                    За все время
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Оценок</CardTitle>
                  <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_ratings}</div>
                  <p className="text-xs text-muted-foreground">
                    {Math.round(stats.average_helpful_percentage)}% полезных
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.views_today}</div>
                  <p className="text-xs text-muted-foreground">
                    Просмотров сегодня
                  </p>
                </CardContent>
              </Card>
            </div>

        {/* Period Stats */}
        <Card className="mb-6">
              <CardHeader>
                <CardTitle>Просмотры по периодам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                      <Clock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        Сегодня
                      </p>
                      <p className="text-2xl font-bold">{stats.views_today}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                      <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        За неделю
                      </p>
                      <p className="text-2xl font-bold">{stats.views_this_week}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                      <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        За месяц
                      </p>
                      <p className="text-2xl font-bold">{stats.views_this_month}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

        {/* Top and Low Rated Articles */}
        <Tabs defaultValue="top" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="top">Популярные статьи</TabsTrigger>
            <TabsTrigger value="low">Требуют улучшения</TabsTrigger>
          </TabsList>

          <TabsContent value="top" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Топ-10 статей по просмотрам</CardTitle>
                    <CardDescription>
                      Самые популярные статьи в базе знаний
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {topArticles.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Нет данных для отображения
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {topArticles.map((article, index) => (
                          <div
                            key={article.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex items-center gap-4 flex-1">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900 font-bold text-blue-600 dark:text-blue-400">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 dark:text-white">
                                  {article.title}
                                </h3>
                                <p className="text-sm text-gray-500">
                                  {article.category.name}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                  <Eye className="h-4 w-4" />
                                  <span className="font-semibold">
                                    {article.view_count}
                                  </span>
                                </div>
                                {article.helpful_percentage !== undefined && (
                                  <div className="text-sm text-gray-500">
                                    {Math.round(article.helpful_percentage)}% полезно
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

          <TabsContent value="low" className="mt-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Статьи с низким рейтингом</CardTitle>
                    <CardDescription>
                      Статьи, которые пользователи считают неполезными
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {lowRatedArticles.length === 0 ? (
                      <p className="text-center text-gray-500 py-8">
                        Все статьи имеют хороший рейтинг! 🎉
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {lowRatedArticles.map((article) => (
                          <div
                            key={article.id}
                            className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white mb-1">
                                {article.title}
                              </h3>
                              <p className="text-sm text-gray-500">
                                {article.category.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-4">
                              <Badge variant="destructive">
                                {article.helpful_percentage !== undefined
                                  ? `${Math.round(article.helpful_percentage)}% полезно`
                                  : 'Нет оценок'}
                              </Badge>
                              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                <Eye className="h-4 w-4" />
                                <span>{article.view_count}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
            </TabsContent>
          </Tabs>
        </div>
      </AdminLayout>
    );
  }
