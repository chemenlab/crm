import { Head, Link, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Search, Eye, Edit, Trash2, CheckCircle, XCircle, Newspaper } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    category: string;
    is_published: boolean;
    published_at: string | null;
    view_count: number;
    reading_time: number;
    created_at: string;
    updated_at: string;
}

interface Props {
    news: {
        data: NewsItem[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        search?: string;
        status?: string;
        category?: string;
    };
    categories: Record<string, string>;
}

export default function Index({ news, filters, categories }: Props) {
    const [searchQuery, setSearchQuery] = useState(filters.search || '');
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; title: string }>({
        open: false,
        id: null,
        title: '',
    });

    const handleFilterChange = (key: string, value: string) => {
        router.get(
            route('admin.news.index'),
            { ...filters, [key]: value === 'all' ? undefined : value },
            { preserveState: true, preserveScroll: true }
        );
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        handleFilterChange('search', searchQuery);
    };

    const handlePublish = (newsId: number, isPublished: boolean) => {
        const endpoint = isPublished
            ? route('admin.news.unpublish', newsId)
            : route('admin.news.publish', newsId);

        router.post(
            endpoint,
            {},
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        isPublished ? 'Новость снята с публикации' : 'Новость опубликована'
                    );
                },
                onError: () => {
                    toast.error('Не удалось изменить статус');
                },
            }
        );
    };

    const handleDelete = (item: NewsItem) => {
        setDeleteConfirm({ open: true, id: item.id, title: item.title });
    };

    const confirmDelete = () => {
        if (!deleteConfirm.id) return;
        router.delete(route('admin.news.destroy', deleteConfirm.id), {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Новость удалена');
                setDeleteConfirm({ open: false, id: null, title: '' });
            },
            onError: () => {
                toast.error('Не удалось удалить новость');
            },
        });
    };

    const categoryColors: Record<string, string> = {
        'Советы': 'bg-lime-500',
        'Обновление': 'bg-blue-500',
        'Кейс': 'bg-amber-500',
    };

    return (
        <AdminLayout>
            <Head title="Управление новостями" />

            <div className="mx-auto w-full max-w-7xl">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Newspaper className="h-6 w-6" />
                            Новости
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Управление новостями и статьями для лендинга
                        </p>
                    </div>
                    <Link href={route('admin.news.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Создать новость
                        </Button>
                    </Link>
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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium mb-2 block">Категория</label>
                                    <Select
                                        value={filters.category || 'all'}
                                        onValueChange={(value) => handleFilterChange('category', value)}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Все категории</SelectItem>
                                            {Object.entries(categories).map(([key, label]) => (
                                                <SelectItem key={key} value={key}>
                                                    {label}
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
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {/* News List */}
                {news.data.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center">
                            <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                                Нет новостей
                            </h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-4">
                                Создайте первую новость для лендинга
                            </p>
                            <Link href={route('admin.news.create')}>
                                <Button>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Создать новость
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <>
                        <div className="space-y-4">
                            {news.data.map((item) => (
                                <Card key={item.id}>
                                    <CardContent className="p-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <Badge className={categoryColors[item.category] || 'bg-gray-500'}>
                                                        {item.category}
                                                    </Badge>
                                                    <Badge
                                                        className={
                                                            item.is_published
                                                                ? 'bg-green-500'
                                                                : 'bg-gray-500'
                                                        }
                                                    >
                                                        {item.is_published ? 'Опубликовано' : 'Черновик'}
                                                    </Badge>
                                                </div>

                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                                                    {item.title}
                                                </h3>

                                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-4 w-4" />
                                                        {item.view_count} просмотров
                                                    </div>
                                                    <span>•</span>
                                                    <span>{item.reading_time} мин чтения</span>
                                                    <span>•</span>
                                                    <span>
                                                        {item.published_at
                                                            ? new Date(item.published_at).toLocaleDateString('ru-RU')
                                                            : 'Не опубликовано'}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2 ml-4">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        handlePublish(item.id, item.is_published)
                                                    }
                                                >
                                                    {item.is_published ? (
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
                                                    href={route('admin.news.edit', item.id)}
                                                >
                                                    <Button variant="outline" size="sm">
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDelete(item)}
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
                        {news.last_page > 1 && (
                            <div className="mt-6 flex justify-center gap-2">
                                {Array.from({ length: news.last_page }, (_, i) => i + 1).map(
                                    (page) => (
                                        <Button
                                            key={page}
                                            variant={
                                                page === news.current_page ? 'default' : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                router.get(
                                                    route('admin.news.index'),
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
                    title="Удаление новости"
                    itemName={deleteConfirm.title}
                />
            </div>
        </AdminLayout>
    );
}
