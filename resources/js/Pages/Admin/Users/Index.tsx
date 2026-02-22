import { Head, Link, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Users, Search, Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface User {
    id: number;
    name: string;
    email: string;
    created_at: string;
    subscription?: {
        status: string;
        plan: {
            name: string;
        };
    };
}

interface PaginatedUsers {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export default function Index({ users, filters }: { users: PaginatedUsers; filters: { search?: string } }) {
    const [search, setSearch] = useState(filters.search || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(route('admin.users.index'), { search }, { preserveState: true });
    };

    const getRoleBadge = (role: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'outline'> = {
            master: 'default',
            client: 'secondary',
        };

        const labels: Record<string, string> = {
            master: 'Мастер',
            client: 'Клиент',
        };

        return <Badge variant={variants[role] || 'outline'}>{labels[role] || role}</Badge>;
    };

    const getSubscriptionBadge = (status?: string) => {
        if (!status) return <Badge variant="outline">Нет подписки</Badge>;

        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            active: 'default',
            trial: 'secondary',
            cancelled: 'destructive',
            expired: 'outline',
        };

        const labels: Record<string, string> = {
            active: 'Активна',
            trial: 'Пробная',
            cancelled: 'Отменена',
            expired: 'Истекла',
        };

        return <Badge variant={variants[status]}>{labels[status]}</Badge>;
    };

    return (
        <AdminLayout>
            <Head title="Пользователи" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-2">
                            <Users className="h-8 w-8" />
                            Пользователи
                        </h1>
                        <p className="text-muted-foreground">Управление пользователями системы</p>
                    </div>
                    <Link href={route('admin.users.create')}>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Создать пользователя
                        </Button>
                    </Link>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Поиск пользователей</CardTitle>
                        <CardDescription>Найдите пользователя по имени или email</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Поиск по имени или email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                            <Button type="submit">Найти</Button>
                            {filters.search && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setSearch('');
                                        router.get(route('admin.users.index'));
                                    }}
                                >
                                    Сбросить
                                </Button>
                            )}
                        </form>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Список пользователей</CardTitle>
                        <CardDescription>
                            Всего пользователей: {users.total}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>ID</TableHead>
                                    <TableHead>Имя</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Подписка</TableHead>
                                    <TableHead>Тариф</TableHead>
                                    <TableHead>Дата регистрации</TableHead>
                                    <TableHead className="text-right">Действия</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.data.length > 0 ? (
                                    users.data.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>#{user.id}</TableCell>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{getSubscriptionBadge(user.subscription?.status)}</TableCell>
                                            <TableCell>
                                                {user.subscription?.plan.name || '-'}
                                            </TableCell>
                                            <TableCell>
                                                {format(new Date(user.created_at), 'dd.MM.yyyy', { locale: ru })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={route('admin.users.show', user.id)}>
                                                    <Button variant="ghost" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                                            Пользователи не найдены
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>

                        {users.last_page > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-muted-foreground">
                                    Страница {users.current_page} из {users.last_page}
                                </p>
                                <div className="flex gap-2">
                                    {users.current_page > 1 && (
                                        <Link
                                            href={route('admin.users.index', {
                                                ...filters,
                                                page: users.current_page - 1,
                                            })}
                                        >
                                            <Button variant="outline" size="sm">
                                                Назад
                                            </Button>
                                        </Link>
                                    )}
                                    {users.current_page < users.last_page && (
                                        <Link
                                            href={route('admin.users.index', {
                                                ...filters,
                                                page: users.current_page + 1,
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
            </div>
        </AdminLayout>
    );
}
