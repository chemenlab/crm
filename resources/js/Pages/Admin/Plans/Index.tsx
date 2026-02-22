import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Badge } from '@/Components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { useState } from 'react';
import { Eye, Edit, Trash2 } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string | null;
    price: number;
    billing_period: string;
    is_active: boolean;
    max_appointments: number;
    max_clients: number;
    max_services: number;
    trial_days: number | null;
    has_analytics: boolean;
    has_priority_support: boolean;
    has_custom_branding: boolean;
    sort_order: number;
    created_at: string;
}

interface PlansIndexProps {
    plans: {
        data: Plan[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filters: {
        is_active?: string;
        billing_period?: string;
        search?: string;
    };
}

export default function PlansIndex({ plans, filters }: PlansIndexProps) {
    const [search, setSearch] = useState(filters.search || '');
    const [isActive, setIsActive] = useState(filters.is_active || '');
    const [billingPeriod, setBillingPeriod] = useState(filters.billing_period || '');
    const [deleteId, setDeleteId] = useState<number | null>(null);

    const handleFilter = () => {
        router.get(
            route('admin.plans.index'),
            { search, is_active: isActive, billing_period: billingPeriod },
            { preserveState: true }
        );
    };

    const handleReset = () => {
        setSearch('');
        setIsActive('');
        setBillingPeriod('');
        router.get(route('admin.plans.index'));
    };

    const handleDelete = (id: number) => {
        router.delete(route('admin.plans.destroy', id), {
            onSuccess: () => setDeleteId(null),
        });
    };

    const getBillingPeriodLabel = (period: string) => {
        return period === 'monthly' ? 'Месяц' : 'Год';
    };

    return (
        <AdminLayout>
            <Head title="Управление тарифными планами" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Тарифные планы</h1>
                        <p className="text-muted-foreground mt-1">
                            Управление тарифами и их условиями
                        </p>
                    </div>
                    <Link href={route('admin.plans.create')}>
                        <Button>Создать тариф</Button>
                    </Link>
                </div>

                {/* Фильтры */}
                <Card>
                    <CardHeader>
                        <CardTitle>Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <Input
                                placeholder="Поиск по названию..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
                            />

                            <Select
                                value={isActive || 'all'}
                                onValueChange={(value) => setIsActive(value === 'all' ? '' : value)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Все статусы" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все статусы</SelectItem>
                                    <SelectItem value="1">Активные</SelectItem>
                                    <SelectItem value="0">Неактивные</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={billingPeriod || 'all'}
                                onValueChange={(value) =>
                                    setBillingPeriod(value === 'all' ? '' : value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Все периоды" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все периоды</SelectItem>
                                    <SelectItem value="monthly">Месячные</SelectItem>
                                    <SelectItem value="yearly">Годовые</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-2">
                                <Button onClick={handleFilter} className="flex-1">
                                    Применить
                                </Button>
                                <Button onClick={handleReset} variant="outline">
                                    Сбросить
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Таблица тарифов */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Название
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Цена
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Период
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Лимиты
                                        </th>
                                        <th className="px-4 py-3 text-left text-sm font-medium">
                                            Статус
                                        </th>
                                        <th className="px-4 py-3 text-right text-sm font-medium">
                                            Действия
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {plans.data.map((plan) => (
                                        <tr key={plan.id} className="hover:bg-muted/50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <div className="font-medium">{plan.name}</div>
                                                    {plan.description && (
                                                        <div className="text-sm text-muted-foreground line-clamp-1">
                                                            {plan.description}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="font-medium">
                                                    {plan.price === 0
                                                        ? 'Бесплатно'
                                                        : `${plan.price} ₽`}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {getBillingPeriodLabel(plan.billing_period)}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <div className="space-y-1">
                                                    <div>
                                                        Записи:{' '}
                                                        {plan.max_appointments === -1
                                                            ? '∞'
                                                            : plan.max_appointments}
                                                    </div>
                                                    <div>
                                                        Клиенты:{' '}
                                                        {plan.max_clients === -1
                                                            ? '∞'
                                                            : plan.max_clients}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge
                                                    variant={
                                                        plan.is_active ? 'default' : 'secondary'
                                                    }
                                                >
                                                    {plan.is_active ? 'Активен' : 'Неактивен'}
                                                </Badge>
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(
                                                                route('admin.plans.show', plan.id)
                                                            )
                                                        }
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            router.visit(
                                                                route('admin.plans.edit', plan.id)
                                                            )
                                                        }
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                    <Dialog
                                                        open={deleteId === plan.id}
                                                        onOpenChange={(open) =>
                                                            setDeleteId(open ? plan.id : null)
                                                        }
                                                    >
                                                        <DialogTrigger asChild>
                                                            <Button variant="ghost" size="sm">
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </DialogTrigger>
                                                        <DialogContent>
                                                            <DialogHeader>
                                                                <DialogTitle>
                                                                    Деактивировать тариф
                                                                </DialogTitle>
                                                                <DialogDescription>
                                                                    Вы уверены, что хотите
                                                                    деактивировать тариф "
                                                                    {plan.name}"? Если у тарифа есть
                                                                    активные подписки, операция будет
                                                                    отменена.
                                                                </DialogDescription>
                                                            </DialogHeader>
                                                            <DialogFooter>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setDeleteId(null)}
                                                                >
                                                                    Отмена
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    onClick={() =>
                                                                        handleDelete(plan.id)
                                                                    }
                                                                >
                                                                    Деактивировать
                                                                </Button>
                                                            </DialogFooter>
                                                        </DialogContent>
                                                    </Dialog>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Пагинация */}
                        {plans.last_page > 1 && (
                            <div className="flex items-center justify-between px-4 py-3 border-t">
                                <div className="text-sm text-muted-foreground">
                                    Показано {plans.data.length} из {plans.total}
                                </div>
                                <div className="flex gap-2">
                                    {Array.from(
                                        { length: plans.last_page },
                                        (_, i) => i + 1
                                    ).map((page) => (
                                        <Button
                                            key={page}
                                            variant={
                                                page === plans.current_page
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            size="sm"
                                            onClick={() =>
                                                router.get(
                                                    route('admin.plans.index'),
                                                    { ...filters, page },
                                                    { preserveState: true }
                                                )
                                            }
                                        >
                                            {page}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
