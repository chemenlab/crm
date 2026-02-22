import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Switch } from '@/Components/ui/switch';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    Package,
    Search,
    Eye,
    Edit,
    MoreHorizontal,
    BarChart3,
    Users,
    Gift,
    AlertTriangle,
    RefreshCw,
    Star,
} from 'lucide-react';
import { useState } from 'react';

interface Module {
    slug: string;
    name: string;
    description: string | null;
    version: string;
    category: string | null;
    icon: string | null;
    pricing_type: 'free' | 'subscription' | 'one_time';
    price: number;
    is_active: boolean;
    is_featured: boolean;
    installs_count: number;
    rating: number;
}

interface Category {
    value: string;
    label: string;
}

interface Filters {
    category?: string;
    pricing_type?: string;
    status?: string;
    search?: string;
}

interface Props {
    modules: Module[];
    filters: Filters;
    categories: Category[];
}

export default function ModulesIndex({ modules, filters, categories }: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [category, setCategory] = useState(filters.category || '');
    const [pricingType, setPricingType] = useState(filters.pricing_type || '');
    const [status, setStatus] = useState(filters.status || '');
    const [togglingModule, setTogglingModule] = useState<string | null>(null);

    const handleFilter = () => {
        router.get(
            route('admin.modules.index'),
            {
                search: search || undefined,
                category: category || undefined,
                pricing_type: pricingType || undefined,
                status: status || undefined,
            },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setCategory('');
        setPricingType('');
        setStatus('');
        router.get(route('admin.modules.index'));
    };

    const handleToggleStatus = (slug: string, currentStatus: boolean) => {
        setTogglingModule(slug);
        router.post(
            route('admin.modules.toggle-status', slug),
            { is_active: !currentStatus },
            {
                preserveState: true,
                onFinish: () => setTogglingModule(null),
            }
        );
    };

    const handleSync = () => {
        router.post(route('admin.modules.sync'), {}, { preserveState: true });
    };

    const getCategoryLabel = (cat: string | null) => {
        if (!cat) return 'Без категории';
        const found = categories.find((c) => c.value === cat);
        return found?.label || cat;
    };

    const getPricingBadge = (type: string, price: number) => {
        if (type === 'free') {
            return <Badge variant="secondary">Бесплатно</Badge>;
        }
        if (type === 'subscription') {
            return <Badge variant="default">{price} ₽/мес</Badge>;
        }
        return <Badge variant="outline">{price} ₽</Badge>;
    };

    const getStatusBadge = (isActive: boolean) => {
        return isActive ? (
            <Badge variant="default" className="bg-green-500">Активен</Badge>
        ) : (
            <Badge variant="secondary">Отключён</Badge>
        );
    };

    return (
        <AdminLayout>
            <Head title="Управление модулями" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Package className="h-8 w-8" />
                            Модули
                        </h1>
                        <p className="text-muted-foreground">
                            Управление модулями системы
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleSync}>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Синхронизировать
                        </Button>
                        <Link href={route('admin.modules.stats')}>
                            <Button variant="outline">
                                <BarChart3 className="h-4 w-4 mr-2" />
                                Статистика
                            </Button>
                        </Link>
                        <Link href={route('admin.modules.error-logs')}>
                            <Button variant="outline">
                                <AlertTriangle className="h-4 w-4 mr-2" />
                                Логи ошибок
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Фильтры</CardTitle>
                        <CardDescription>Найдите нужный модуль</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                                    className="pl-9"
                                />
                            </div>

                            <Select
                                value={category || 'all'}
                                onValueChange={(v) => setCategory(v === 'all' ? '' : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Категория" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все категории</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat.value} value={cat.value}>
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            <Select
                                value={pricingType || 'all'}
                                onValueChange={(v) => setPricingType(v === 'all' ? '' : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Тип оплаты" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все типы</SelectItem>
                                    <SelectItem value="free">Бесплатные</SelectItem>
                                    <SelectItem value="subscription">Подписка</SelectItem>
                                    <SelectItem value="one_time">Разовая покупка</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={status || 'all'}
                                onValueChange={(v) => setStatus(v === 'all' ? '' : v)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="active">Активные</SelectItem>
                                    <SelectItem value="inactive">Отключённые</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button onClick={handleFilter} className="flex-1">
                                    Применить
                                </Button>
                                <Button variant="outline" onClick={handleReset}>
                                    Сбросить
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Modules Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Список модулей</CardTitle>
                        <CardDescription>
                            Всего модулей: {modules.length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Модуль</TableHead>
                                    <TableHead>Категория</TableHead>
                                    <TableHead>Цена</TableHead>
                                    <TableHead>Установки</TableHead>
                                    <TableHead>Рейтинг</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead>Активен</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {modules.length > 0 ? (
                                    modules.map((module) => (
                                        <TableRow key={module.slug}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                                        <Package className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium flex items-center gap-2">
                                                            {module.name}
                                                            {module.is_featured && (
                                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                            )}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            {module.slug} • v{module.version}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {getCategoryLabel(module.category)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {getPricingBadge(module.pricing_type, module.price)}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{module.installs_count}</span>
                                            </TableCell>
                                            <TableCell>
                                                {module.rating > 0 ? (
                                                    <div className="flex items-center gap-1">
                                                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                                        <span>{module.rating.toFixed(1)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getStatusBadge(module.is_active)}
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={module.is_active}
                                                    disabled={togglingModule === module.slug}
                                                    onCheckedChange={() =>
                                                        handleToggleStatus(module.slug, module.is_active)
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(route('admin.modules.show', module.slug))
                                                            }
                                                        >
                                                            <Eye className="h-4 w-4 mr-2" />
                                                            Просмотр
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(route('admin.modules.edit', module.slug))
                                                            }
                                                        >
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Редактировать
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(route('admin.modules.module-stats', module.slug))
                                                            }
                                                        >
                                                            <BarChart3 className="h-4 w-4 mr-2" />
                                                            Статистика
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(route('admin.modules.users', module.slug))
                                                            }
                                                        >
                                                            <Users className="h-4 w-4 mr-2" />
                                                            Пользователи
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(route('admin.modules.grants', module.slug))
                                                            }
                                                        >
                                                            <Gift className="h-4 w-4 mr-2" />
                                                            Бесплатный доступ
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() =>
                                                                router.visit(route('admin.modules.module-error-logs', module.slug))
                                                            }
                                                        >
                                                            <AlertTriangle className="h-4 w-4 mr-2" />
                                                            Логи ошибок
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            Модули не найдены
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
