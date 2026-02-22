import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
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
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import {
    ArrowLeft,
    Users,
    MoreHorizontal,
    Power,
    PowerOff,
    Eye,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Module {
    slug: string;
    name: string;
}

interface ModuleUser {
    id: number;
    user_id: number;
    module_slug: string;
    is_enabled: boolean;
    enabled_at: string | null;
    disabled_at: string | null;
    last_used_at: string | null;
    usage_count: number;
    // Flat fields from backend
    user_name: string | null;
    user_email: string | null;
    user_avatar: string | null;
}

interface PaginatedUsers {
    data: ModuleUser[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface Filters {
    enabled_only?: boolean;
}

interface Props {
    module: Module;
    users: PaginatedUsers;
    filters: Filters;
}

export default function ModuleUsers({ module, users, filters }: Props) {
    const [enabledFilter, setEnabledFilter] = useState<string>(
        filters.enabled_only === true ? 'enabled' : filters.enabled_only === false ? 'disabled' : 'all'
    );
    const [processingUser, setProcessingUser] = useState<number | null>(null);

    const handleFilter = (value: string) => {
        setEnabledFilter(value);
        router.get(
            route('admin.modules.users', module.slug),
            {
                enabled_only: value === 'enabled' ? '1' : value === 'disabled' ? '0' : undefined,
            },
            { preserveState: true }
        );
    };

    const handleForceEnable = (userId: number) => {
        setProcessingUser(userId);
        router.post(
            route('admin.modules.force-enable', module.slug),
            { user_id: userId },
            {
                preserveState: true,
                onFinish: () => setProcessingUser(null),
            }
        );
    };

    const handleForceDisable = (userId: number) => {
        setProcessingUser(userId);
        router.post(
            route('admin.modules.force-disable', module.slug),
            { user_id: userId },
            {
                preserveState: true,
                onFinish: () => setProcessingUser(null),
            }
        );
    };

    const getUserInitials = (name: string | null, email: string | null) => {
        if (name) {
            return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
        if (email) {
            return email[0].toUpperCase();
        }
        return '?';
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return '—';
        return format(new Date(dateString), 'dd MMM yyyy', { locale: ru });
    };

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return '—';
        return format(new Date(dateString), 'dd MMM yyyy, HH:mm', { locale: ru });
    };

    return (
        <AdminLayout>
            <Head title={`Пользователи: ${module.name}`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(route('admin.modules.show', module.slug))}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Users className="h-6 w-6" />
                                Пользователи модуля
                            </h1>
                            <p className="text-muted-foreground">
                                {module.name}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Фильтры</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <Select value={enabledFilter} onValueChange={handleFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Статус" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Все пользователи</SelectItem>
                                    <SelectItem value="enabled">Только активные</SelectItem>
                                    <SelectItem value="disabled">Только отключённые</SelectItem>
                                </SelectContent>
                            </Select>
                            {enabledFilter !== 'all' && (
                                <Button
                                    variant="outline"
                                    onClick={() => handleFilter('all')}
                                >
                                    Сбросить
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Users Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Список пользователей</CardTitle>
                        <CardDescription>
                            Всего: {users.total} пользователей
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {users.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Нет пользователей</p>
                                <p className="text-sm text-muted-foreground">
                                    Никто ещё не установил этот модуль
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Пользователь</TableHead>
                                            <TableHead>Статус</TableHead>
                                            <TableHead>Включён</TableHead>
                                            <TableHead>Последнее использование</TableHead>
                                            <TableHead>Использований</TableHead>
                                            <TableHead className="text-right">Действия</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {users.data.map((userModule) => (
                                            <TableRow key={userModule.user_id}>
                                                <TableCell>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={userModule.user_avatar || undefined} />
                                                            <AvatarFallback className="text-xs">
                                                                {getUserInitials(userModule.user_name, userModule.user_email)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-medium text-sm">
                                                                {userModule.user_name || 'Без имени'}
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {userModule.user_email || '—'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={userModule.is_enabled ? 'default' : 'secondary'}>
                                                        {userModule.is_enabled ? 'Активен' : 'Отключён'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDate(userModule.enabled_at)}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {formatDateTime(userModule.last_used_at)}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {userModule.usage_count}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                disabled={processingUser === userModule.user_id}
                                                            >
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem
                                                                onClick={() =>
                                                                    router.visit(route('admin.users.show', userModule.user_id))
                                                                }
                                                            >
                                                                <Eye className="h-4 w-4 mr-2" />
                                                                Профиль пользователя
                                                            </DropdownMenuItem>
                                                            {userModule.is_enabled ? (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleForceDisable(userModule.user_id)}
                                                                    className="text-destructive"
                                                                >
                                                                    <PowerOff className="h-4 w-4 mr-2" />
                                                                    Принудительно отключить
                                                                </DropdownMenuItem>
                                                            ) : (
                                                                <DropdownMenuItem
                                                                    onClick={() => handleForceEnable(userModule.user_id)}
                                                                >
                                                                    <Power className="h-4 w-4 mr-2" />
                                                                    Принудительно включить
                                                                </DropdownMenuItem>
                                                            )}
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {users.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Страница {users.current_page} из {users.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            {users.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(route('admin.modules.users', module.slug), {
                                                            ...filters,
                                                            page: users.current_page - 1,
                                                        })
                                                    }
                                                >
                                                    Назад
                                                </Button>
                                            )}
                                            {users.current_page < users.last_page && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(route('admin.modules.users', module.slug), {
                                                            ...filters,
                                                            page: users.current_page + 1,
                                                        })
                                                    }
                                                >
                                                    Вперёд
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
