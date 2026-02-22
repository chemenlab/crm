import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface Category {
  id: number;
  name: string;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  category: Category;
  status: 'draft' | 'published';
  is_published: boolean;
  view_count: number;
  reading_time: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  articles: {
    data: Article[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
  categories: Category[];
  filters: {
    search?: string;
    category_id?: string;
    status?: string;
    sort_by?: string;
    sort_order?: string;
  };
}

export default function Index({ articles, categories, filters }: Props) {
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; title: string }>({
    open: false,
    id: null,
    title: '',
  });

  const handleFilterChange = (key: string, value: string) => {
    router.get(
      route('admin.knowledge-base.articles.index'),
      { ...filters, [key]: value },
      { preserveState: true, preserveScroll: true }
    );
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilterChange('search', searchQuery);
  };

  const handlePublish = (articleId: number, isPublished: boolean) => {
    const endpoint = isPublished
      ? route('admin.knowledge-base.articles.unpublish', articleId)
      : route('admin.knowledge-base.articles.publish', articleId);

    router.post(
      endpoint,
      {},
      {
        preserveScroll: true,
        onSuccess: () => {
          toast.success(
            isPublished ? 'Статья снята с публикации' : 'Статья опубликована'
          );
        },
        onError: () => {
          toast.error('Не удалось изменить статус');
        },
      }
    );
  };

  const handleDelete = (article: Article) => {
    setDeleteConfirm({ open: true, id: article.id, title: article.title });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.id) return;
    router.delete(route('admin.knowledge-base.articles.destroy', deleteConfirm.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Статья удалена');
        setDeleteConfirm({ open: false, id: null, title: '' });
      },
      onError: () => {
        toast.error('Не удалось удалить статью');
      },
    });
  };

  return (
    <AdminLayout>
      <Head title="Управление статьями" />

      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  База знаний
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Управление статьями и категориями
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={route('admin.knowledge-base.categories.index')}>
                  <Button variant="outline">Категории</Button>
                </Link>
                <Link href={route('admin.knowledge-base.analytics.index')}>
                  <Button variant="outline">Аналитика</Button>
                </Link>
                <Link href={route('admin.knowledge-base.articles.create')}>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать статью
                  </Button>
                </Link>
              </div>
            </div>

        {/* Filters */}
        <Card className="mb-6">
              <CardContent className="pt-6">
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          type="text"
                          placeholder="Поиск по названию..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Button type="submit">Найти</Button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Категория</label>
                      <Select
                        value={filters.category_id || 'all'}
                        onValueChange={(value) => handleFilterChange('category_id', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все категории</SelectItem>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Статус</label>
                      <Select
                        value={filters.status || 'all'}
                        onValueChange={(value) => handleFilterChange('status', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Все статусы</SelectItem>
                          <SelectItem value="published">Опубликовано</SelectItem>
                          <SelectItem value="draft">Черновик</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Сортировка</label>
                      <Select
                        value={filters.sort_by || 'created_at'}
                        onValueChange={(value) => handleFilterChange('sort_by', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="created_at">По дате создания</SelectItem>
                          <SelectItem value="updated_at">По дате изменения</SelectItem>
                          <SelectItem value="title">По названию</SelectItem>
                          <SelectItem value="view_count">По просмотрам</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>

        {/* Articles List */}
        {articles.data.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Нет статей
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Создайте первую статью для базы знаний
                  </p>
                  <Link href={route('admin.knowledge-base.articles.create')}>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Создать статью
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="space-y-4">
                  {articles.data.map((article) => (
                    <Card key={article.id}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="outline">{article.category.name}</Badge>
                              <Badge
                                className={
                                  article.is_published
                                    ? 'bg-green-500'
                                    : 'bg-gray-500'
                                }
                              >
                                {article.is_published ? 'Опубликовано' : 'Черновик'}
                              </Badge>
                            </div>

                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                              {article.title}
                            </h3>

                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {article.view_count} просмотров
                              </div>
                              <span>•</span>
                              <span>{article.reading_time} мин чтения</span>
                              <span>•</span>
                              <span>
                                Обновлено:{' '}
                                {new Date(article.updated_at).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handlePublish(article.id, article.is_published)
                              }
                            >
                              {article.is_published ? (
                                <>
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Снять
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Опубликовать
                                </>
                              )}
                            </Button>
                            <Link
                              href={route('admin.knowledge-base.articles.edit', article.id)}
                            >
                              <Button variant="outline" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(article)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

            {/* Pagination */}
            {articles.last_page > 1 && (
              <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: articles.last_page }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={
                        page === articles.current_page ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() =>
                        router.get(
                          route('admin.knowledge-base.articles.index'),
                          {
                            ...filters,
                            page,
                          }
                        )
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
        
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
          onConfirm={confirmDelete}
          title="Удаление статьи"
          itemName={deleteConfirm.title}
        />
      </div>
    </AdminLayout>
  );
}
