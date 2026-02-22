import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Tag, Plus, Search, Eye, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface PromoCode {
    id: number;
    code: string;
    type: string;
    value: number;
    is_active: boolean;
    used_count: number;
    max_uses: number | null;
    valid_from: string | null;
    valid_until: string | null;
    created_at: string;
    plan?: {
        name: string;
    };
}

interface PaginatedPromoCodes {
    data: PromoCode[];
    current_page: number;
    last_page: number;
    total: number;
}

export default function Index({
    promoCodes,
    filters,
}: {
    promoCodes: PaginatedPromoCodes;
    filters: { is_active?: string; type?: string; search?: string };
}) {
    const [search, setSearch] = useState(filters.search || '');
    const [isActive, setIsActive] = useState(filters.is_active || 'all');
    const [type, setType] = useState(filters.type || 'all');
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; code: string }>({
        open: false,
        id: null,
        code: '',
    });

    const handleFilter = () => {
        router.get(
            route('admin.promo-codes.index'),
            {
                search: search || undefined,
                is_active: isActive !== 'all' ? isActive : undefined,
                type: type !== 'all' ? type : undefined,
            },
            { preserveState: true }
        );
    };

    const handleDelete = (promoCode: PromoCode) => {
        setDeleteConfirm({ open: true, id: promoCode.id, code: promoCode.code });
    };

    const confirmDelete = () => {
        if (!deleteConfirm.id) return;
        router.delete(route('admin.promo-codes.destroy', deleteConfirm.id), {
            onSuccess: () => setDeleteConfirm({ open: false, id: null, code: '' }),
        });
    };

    const getTypeBadge = (type: string) => {
        const labels: Record<string, string> = {
            percentage: 'Процент',
            fixed: 'Фиксированная',
            trial_extension: 'Продление пробного',
        };

        return <Badge variant="secondary">{labels[type]}</Badge>;
    };

    const getStatusBadge = (isActive: boolean, validUntil: string | null) => {
        if (!isActive) {
            return <Badge variant="destructive">Неактивен</Badge>;
        }

        if (validUntil && new Date(validUntil) < new Date()) {
            return <Badge variant="outline">Истек</Badge>;
        }

        return <Badge variant="default">Активен</Badge>;
    };

    return (
        <AdminLayout>
            <Head title="Промокоды" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Tag className="h-8 w-8" />
                            Промокоды
                        </h1>
                        <p className="text-muted-foreground">Управление промокодами и скидками</p>
                    </div>
                    <Link href={route('admin.promo-codes.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Создать промокод
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск по коду..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            <Select value={isActive} onValueChange={setIsActive}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="1">Активные</SelectItem>
                                    <SelectItem value="0">Неактивные</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Тип" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все типы</SelectItem>
                                    <SelectItem value="percentage">Процент</SelectItem>
                                    <SelectItem value="fixed">Фиксированная</SelectItem>
                                    <SelectItem value="trial_extension">Продление пробного</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button onClick={handleFilter} className="flex-1">
                                    Применить
                                </Button>
                                {(filters.search || filters.is_active || filters.type) && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setIsActive('all');
                                            setType('all');
                                            router.get(route('admin.promo-codes.index'));
                                        }}
                                    >
                                        Сбросить
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Список промокодов</CardTitle>
                        <CardDescription>Всего промокодов: {promoCodes.total}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Код</TableHead>
                                    <TableHead>Тип</TableHead>
                                    <TableHead>Значение</TableHead>
                                    <TableHead>Использовано</TableHead>
                                    <TableHead>Тариф</TableHead>
                                    <TableHead>Действует до</TableHead>
                                    <TableHead>Статус</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {promoCodes.data.length > 0 ? (
                                    promoCodes.data.map((promoCode) => (
                                        <TableRow key={promoCode.id}>
                                            <TableCell className="font-mono font-bold">{promoCode.code}</TableCell>
                                            <TableCell>{getTypeBadge(promoCode.type)}</TableCell>
                                            <TableCell>
                                                {promoCode.type === 'percentage'
                                                    ? `${promoCode.value}%`
                                                    : promoCode.type === 'fixed'
                                                    ? `${promoCode.value}₽`
                                                    : `${promoCode.value} дней`}
                                            </TableCell>
                                            <TableCell>
                                                {promoCode.used_count}
                                                {promoCode.max_uses ? ` / ${promoCode.max_uses}` : ''}
                                            </TableCell>
                                            <TableCell>{promoCode.plan?.name || 'Все'}</TableCell>
                                            <TableCell>
                                                {promoCode.valid_until
                                                    ? format(new Date(promoCode.valid_until), 'dd.MM.yyyy', { locale: ru })
                                                    : '∞'}
                                            </TableCell>
                                            <TableCell>{getStatusBadge(promoCode.is_active, promoCode.valid_until)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Link href={route('admin.promo-codes.show', promoCode.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Link href={route('admin.promo-codes.edit', promoCode.id)}>
                                                        <Button variant="ghost" size="sm">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {promoCode.is_active && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(promoCode)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                                            Промокоды не найдены
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {promoCodes.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Страница {promoCodes.current_page} из {promoCodes.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {promoCodes.current_page > 1 && (
                                        <Link
                                            href={route('admin.promo-codes.index', {
                                                ...filters,
                                                page: promoCodes.current_page - 1,
                                            })}
                                        >
                                            <Button variant="outline" size="sm">
                                                Назад
                                            </Button>
                                        </Link>
                                    )}
                                    {promoCodes.current_page < promoCodes.last_page && (
                                        <Link
                                            href={route('admin.promo-codes.index', {
                                                ...filters,
                                                page: promoCodes.current_page + 1,
                                            })}
                                        >
                                            <Button variant="outline" size="sm">
                                                Вперед
                                            </Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
                
                <ConfirmDialog
                    open={deleteConfirm.open}
                    onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                    onConfirm={confirmDelete}
                    title="Деактивация промокода"
                    description={`Вы уверены, что хотите деактивировать промокод "${deleteConfirm.code}"?`}
                    confirmText="Да, деактивировать"
                />
            </div>
        </AdminLayout>
    );
}
