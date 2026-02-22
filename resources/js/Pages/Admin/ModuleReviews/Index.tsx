import { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
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
    DropdownMenuSeparator,
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
import {
    Star,
    Search,
    MoreHorizontal,
    Check,
    X,
    BadgeCheck,
    Trash2,
    MessageSquare,
    Filter,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

interface Review {
    id: number;
    user: {
        id: number;
        name: string;
        email: string;
    };
    module: {
        slug: string;
        name: string;
    };
    rating: number;
    comment: string | null;
    is_verified: boolean;
    is_approved: boolean;
    created_at: string;
}

interface ModuleOption {
    slug: string;
    name: string;
}

interface Stats {
    total: number;
    pending: number;
    approved: number;
    average_rating: number;
}

interface Filters {
    status: string | null;
    module: string | null;
    rating: string | null;
    search: string | null;
}

interface Props {
    reviews: {
        data: Review[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        links: { url: string | null; label: string; active: boolean }[];
    };
    modules: ModuleOption[];
    stats: Stats;
    filters: Filters;
}

export default function Index({ reviews, modules, stats, filters }: Props) {
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const [search, setSearch] = useState(filters.search || '');
    const [statusFilter, setStatusFilter] = useState(filters.status || 'all');
    const [moduleFilter, setModuleFilter] = useState(filters.module || 'all');
    const [ratingFilter, setRatingFilter] = useState(filters.rating || 'all');

    const handleFilter = () => {
        router.get(
            route('admin.module-reviews.index'),
            {
                status: statusFilter !== 'all' ? statusFilter : undefined,
                module: moduleFilter !== 'all' ? moduleFilter : undefined,
                rating: ratingFilter !== 'all' ? ratingFilter : undefined,
                search: search || undefined,
            },
            { preserveState: true }
        );
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedIds(reviews.data.map((r) => r.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: number, checked: boolean) => {
        if (checked) {
            setSelectedIds([...selectedIds, id]);
        } else {
            setSelectedIds(selectedIds.filter((i) => i !== id));
        }
    };

    const handleApprove = (id: number) => {
        router.post(route('admin.module-reviews.approve', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Отзыв одобрен'),
        });
    };

    const handleReject = (id: number) => {
        router.post(route('admin.module-reviews.reject', id), {}, {
            preserveScroll: true,
            onSuccess: () => toast.success('Отзыв отклонён'),
        });
    };

    const handleToggleVerified = (id: number) => {
        router.post(route('admin.module-reviews.toggle-verified', id), {}, {
            preserveScroll: true,
        });
    };

    const handleDelete = (id: number) => {
        router.delete(route('admin.module-reviews.destroy', id), {
            preserveScroll: true,
            onSuccess: () => toast.success('Отзыв удалён'),
        });
    };

    const handleBulkApprove = () => {
        router.post(route('admin.module-reviews.bulk-approve'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${selectedIds.length} отзыв(ов) одобрено`);
                setSelectedIds([]);
            },
        });
    };

    const handleBulkReject = () => {
        router.post(route('admin.module-reviews.bulk-reject'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${selectedIds.length} отзыв(ов) отклонено`);
                setSelectedIds([]);
            },
        });
    };

    const handleBulkDelete = () => {
        router.post(route('admin.module-reviews.bulk-destroy'), { ids: selectedIds }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`${selectedIds.length} отзыв(ов) удалено`);
                setSelectedIds([]);
            },
        });
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={`h-4 w-4 ${i < rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-muted-foreground/30'
                            }`}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            <Head title="Модерация отзывов" />

            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Модерация отзывов модулей</h1>
                        <p className="text-muted-foreground">
                            Управление отзывами пользователей на модули маркетплейса
                        </p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Всего отзывов</CardDescription>
                            <CardTitle className="text-3xl">{stats.total}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Ожидают модерации</CardDescription>
                            <CardTitle className="text-3xl text-orange-500">{stats.pending}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Одобренные</CardDescription>
                            <CardTitle className="text-3xl text-green-500">{stats.approved}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Средний рейтинг</CardDescription>
                            <CardTitle className="text-3xl flex items-center gap-2">
                                {stats.average_rating}
                                <Star className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                            </CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="h-5 w-5" />
                            Фильтры
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex-1 min-w-[200px]">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Поиск по тексту или email..."
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        className="pl-9"
                                        onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    />
                                </div>
                            </div>

                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="pending">Ожидает</SelectItem>
                                    <SelectItem value="approved">Одобрен</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={moduleFilter} onValueChange={setModuleFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Модуль" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все модули</SelectItem>
                                    {modules.map((m) => (
                                        <SelectItem key={m.slug} value={m.slug}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select value={ratingFilter} onValueChange={setRatingFilter}>
                                <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder="Рейтинг" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Любой</SelectItem>
                                    <SelectItem value="5">5 звёзд</SelectItem>
                                    <SelectItem value="4">4 звезды</SelectItem>
                                    <SelectItem value="3">3 звезды</SelectItem>
                                    <SelectItem value="2">2 звезды</SelectItem>
                                    <SelectItem value="1">1 звезда</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleFilter}>Применить</Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Bulk Actions */}
                {selectedIds.length > 0 && (
                    <Card>
                        <CardContent className="py-4">
                            <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">
                                    Выбрано: {selectedIds.length}
                                </span>
                                <Button size="sm" variant="outline" onClick={handleBulkApprove}>
                                    <Check className="h-4 w-4 mr-1" />
                                    Одобрить
                                </Button>
                                <Button size="sm" variant="outline" onClick={handleBulkReject}>
                                    <X className="h-4 w-4 mr-1" />
                                    Отклонить
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="destructive">
                                            <Trash2 className="h-4 w-4 mr-1" />
                                            Удалить
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Удалить выбранные отзывы?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Это действие нельзя отменить. Будет удалено {selectedIds.length} отзыв(ов).
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Отмена</AlertDialogCancel>
                                            <AlertDialogAction onClick={handleBulkDelete}>
                                                Удалить
                                            </AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Reviews Table */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Отзывы ({reviews.total})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={
                                                reviews.data.length > 0 &&
                                                selectedIds.length === reviews.data.length
                                            }
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Пользователь</TableHead>
                                    <TableHead>Модуль</TableHead>
                                    <TableHead>Рейтинг</TableHead>
                                    <TableHead className="max-w-[300px]">Комментарий</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead>Дата</TableHead>
                                    <TableHead className="w-[60px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {reviews.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                            Отзывы не найдены
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    reviews.data.map((review) => (
                                        <TableRow key={review.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(review.id)}
                                                    onCheckedChange={(checked) =>
                                                        handleSelectOne(review.id, checked as boolean)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <p className="font-medium">{review.user.name}</p>
                                                    <p className="text-xs text-muted-foreground">{review.user.email}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Link
                                                    href={route('admin.modules.show', review.module.slug)}
                                                    className="text-primary hover:underline"
                                                >
                                                    {review.module.name}
                                                </Link>
                                            </TableCell>
                                            <TableCell>{renderStars(review.rating)}</TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <p className="truncate text-sm">
                                                    {review.comment || <span className="text-muted-foreground italic">Без комментария</span>}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {review.is_approved ? (
                                                        <Badge variant="default" className="bg-green-500 w-fit">
                                                            Одобрен
                                                        </Badge>
                                                    ) : (
                                                        <Badge variant="secondary" className="bg-orange-100 text-orange-700 w-fit">
                                                            Ожидает
                                                        </Badge>
                                                    )}
                                                    {review.is_verified && (
                                                        <Badge variant="outline" className="w-fit">
                                                            <BadgeCheck className="h-3 w-3 mr-1" />
                                                            Проверен
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(review.created_at).toLocaleDateString('ru-RU')}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {!review.is_approved && (
                                                            <DropdownMenuItem onClick={() => handleApprove(review.id)}>
                                                                <Check className="h-4 w-4 mr-2" />
                                                                Одобрить
                                                            </DropdownMenuItem>
                                                        )}
                                                        {review.is_approved && (
                                                            <DropdownMenuItem onClick={() => handleReject(review.id)}>
                                                                <X className="h-4 w-4 mr-2" />
                                                                Отклонить
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleToggleVerified(review.id)}>
                                                            <BadgeCheck className="h-4 w-4 mr-2" />
                                                            {review.is_verified ? 'Снять метку' : 'Отметить проверенным'}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => handleDelete(review.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Удалить
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>

                        {/* Pagination */}
                        {reviews.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Показано {(reviews.current_page - 1) * reviews.per_page + 1} -{' '}
                                    {Math.min(reviews.current_page * reviews.per_page, reviews.total)} из{' '}
                                    {reviews.total}
                                </p>
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={reviews.current_page === 1}
                                        onClick={() =>
                                            router.get(route('admin.module-reviews.index', { page: reviews.current_page - 1, ...filters }))
                                        }
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-sm">
                                        {reviews.current_page} / {reviews.last_page}
                                    </span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        disabled={reviews.current_page === reviews.last_page}
                                        onClick={() =>
                                            router.get(route('admin.module-reviews.index', { page: reviews.current_page + 1, ...filters }))
                                        }
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
