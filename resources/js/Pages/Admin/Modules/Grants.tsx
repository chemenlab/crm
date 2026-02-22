import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/Components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/Components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/Components/ui/popover';
import { Calendar } from '@/Components/ui/calendar';
import {
    ArrowLeft,
    Gift,
    Plus,
    Search,
    Trash2,
    Calendar as CalendarIcon,
    Loader2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Module {
    slug: string;
    name: string;
    pricing_type: string;
    price: number;
}

interface Grant {
    id: number;
    user_id: number;
    module_slug: string;
    granted_by: number;
    reason: string | null;
    expires_at: string | null;
    created_at: string;
    // Flat fields from backend
    user_name: string | null;
    user_email: string | null;
    user_avatar?: string | null;
    granted_by_name: string | null;
    is_active: boolean;
    is_permanent: boolean;
}

interface SearchUser {
    id: number;
    name: string | null;
    email: string;
    avatar: string | null;
}

interface Props {
    module: Module;
    grants: Grant[];
}

export default function ModuleGrants({ module, grants }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
    const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [revokeId, setRevokeId] = useState<number | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        user_id: 0,
        expires_at: '',
        reason: '',
    });

    // Debounced search
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSearching(true);
            try {
                const response = await fetch(
                    route('admin.modules.search-users') + `?q=${encodeURIComponent(searchQuery)}`
                );
                const users = await response.json();
                setSearchResults(users);
            } catch (error) {
                console.error('Search error:', error);
                setSearchResults([]);
            } finally {
                setSearching(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleSelectUser = (user: SearchUser) => {
        setSelectedUser(user);
        setData('user_id', user.id);
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleDateSelect = (date: Date | undefined) => {
        setExpiresAt(date);
        setData('expires_at', date ? format(date, 'yyyy-MM-dd') : '');
        setCalendarOpen(false);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.modules.grant-access', module.slug), {
            onSuccess: () => {
                setDialogOpen(false);
                resetForm();
            },
        });
    };

    const handleRevoke = (userId: number) => {
        router.delete(route('admin.modules.revoke-access', module.slug), {
            data: { user_id: userId },
            onSuccess: () => setRevokeId(null),
        });
    };

    const resetForm = () => {
        reset();
        setSelectedUser(null);
        setExpiresAt(undefined);
        setSearchQuery('');
        setSearchResults([]);
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
        if (!dateString) return 'Бессрочно';
        return format(new Date(dateString), 'dd MMMM yyyy', { locale: ru });
    };

    const isExpired = (dateString: string | null) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    return (
        <AdminLayout>
            <Head title={`Бесплатный доступ: ${module.name}`} />

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
                                <Gift className="h-6 w-6" />
                                Бесплатный доступ
                            </h1>
                            <p className="text-muted-foreground">
                                {module.name}
                            </p>
                        </div>
                    </div>

                    <Dialog open={dialogOpen} onOpenChange={(open) => {
                        setDialogOpen(open);
                        if (!open) resetForm();
                    }}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Выдать доступ
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                            <form onSubmit={handleSubmit}>
                                <DialogHeader>
                                    <DialogTitle>Выдать бесплатный доступ</DialogTitle>
                                    <DialogDescription>
                                        Предоставьте пользователю бесплатный доступ к модулю "{module.name}"
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    {/* User Search */}
                                    <div className="space-y-2">
                                        <Label>Пользователь</Label>
                                        {selectedUser ? (
                                            <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={selectedUser.avatar || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {getUserInitials(selectedUser.name, selectedUser.email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {selectedUser.name || 'Без имени'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {selectedUser.email}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedUser(null);
                                                        setData('user_id', 0);
                                                    }}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    placeholder="Поиск по имени или email..."
                                                    className="pl-9"
                                                />
                                                {searching && (
                                                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                                                )}

                                                {/* Search Results Dropdown */}
                                                {searchResults.length > 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-auto">
                                                        {searchResults.map((user) => (
                                                            <button
                                                                key={user.id}
                                                                type="button"
                                                                className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left"
                                                                onClick={() => handleSelectUser(user)}
                                                            >
                                                                <Avatar className="h-8 w-8">
                                                                    <AvatarImage src={user.avatar || undefined} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {getUserInitials(user.name, user.email)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="font-medium text-sm">
                                                                        {user.name || 'Без имени'}
                                                                    </p>
                                                                    <p className="text-xs text-muted-foreground">
                                                                        {user.email}
                                                                    </p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {searchQuery.length >= 2 && !searching && searchResults.length === 0 && (
                                                    <div className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg p-4 text-center text-muted-foreground">
                                                        Пользователи не найдены
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {errors.user_id && (
                                            <p className="text-sm text-destructive">{errors.user_id}</p>
                                        )}
                                    </div>

                                    {/* Expiration Date */}
                                    <div className="space-y-2">
                                        <Label>Срок действия</Label>
                                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-start text-left font-normal',
                                                        !expiresAt && 'text-muted-foreground'
                                                    )}
                                                >
                                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                                    {expiresAt ? format(expiresAt, 'PPP', { locale: ru }) : 'Бессрочно'}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar
                                                    mode="single"
                                                    selected={expiresAt}
                                                    onSelect={handleDateSelect}
                                                    disabled={(date) => date < new Date()}
                                                    initialFocus
                                                />
                                                {expiresAt && (
                                                    <div className="p-3 border-t">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full"
                                                            onClick={() => handleDateSelect(undefined)}
                                                        >
                                                            Сделать бессрочным
                                                        </Button>
                                                    </div>
                                                )}
                                            </PopoverContent>
                                        </Popover>
                                        <p className="text-xs text-muted-foreground">
                                            Оставьте пустым для бессрочного доступа
                                        </p>
                                        {errors.expires_at && (
                                            <p className="text-sm text-destructive">{errors.expires_at}</p>
                                        )}
                                    </div>

                                    {/* Reason */}
                                    <div className="space-y-2">
                                        <Label htmlFor="reason">Причина</Label>
                                        <Textarea
                                            id="reason"
                                            value={data.reason}
                                            onChange={(e) => setData('reason', e.target.value)}
                                            placeholder="Укажите причину выдачи бесплатного доступа..."
                                            rows={3}
                                        />
                                        {errors.reason && (
                                            <p className="text-sm text-destructive">{errors.reason}</p>
                                        )}
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setDialogOpen(false);
                                            resetForm();
                                        }}
                                    >
                                        Отмена
                                    </Button>
                                    <Button type="submit" disabled={processing || !selectedUser}>
                                        {processing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                        Выдать доступ
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Grants Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Выданные гранты</CardTitle>
                        <CardDescription>
                            Всего: {grants.length} грантов
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {grants.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Gift className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Нет выданных грантов</p>
                                <p className="text-sm text-muted-foreground">
                                    Нажмите "Выдать доступ" чтобы предоставить бесплатный доступ пользователю
                                </p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Пользователь</TableHead>
                                        <TableHead>Срок действия</TableHead>
                                        <TableHead>Причина</TableHead>
                                        <TableHead>Выдал</TableHead>
                                        <TableHead>Дата выдачи</TableHead>
                                        <TableHead className="text-right">Действия</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {grants.map((grant) => (
                                        <TableRow key={grant.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={grant.user_avatar || undefined} />
                                                        <AvatarFallback className="text-xs">
                                                            {getUserInitials(grant.user_name, grant.user_email)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {grant.user_name || 'Без имени'}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {grant.user_email || '—'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {formatDate(grant.expires_at)}
                                                    {isExpired(grant.expires_at) && (
                                                        <Badge variant="destructive">Истёк</Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm text-muted-foreground">
                                                    {grant.reason || '—'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {grant.granted_by_name ? (
                                                    <span className="text-sm">
                                                        {grant.granted_by_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">—</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-sm">
                                                    {formatDate(grant.created_at)}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Dialog
                                                    open={revokeId === grant.id}
                                                    onOpenChange={(open) => setRevokeId(open ? grant.id : null)}
                                                >
                                                    <DialogTrigger asChild>
                                                        <Button variant="ghost" size="sm">
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </DialogTrigger>
                                                    <DialogContent>
                                                        <DialogHeader>
                                                            <DialogTitle>Отозвать доступ</DialogTitle>
                                                            <DialogDescription>
                                                                Вы уверены, что хотите отозвать бесплатный доступ у пользователя{' '}
                                                                <strong>{grant.user_name || grant.user_email || 'Неизвестный'}</strong>?
                                                            </DialogDescription>
                                                        </DialogHeader>
                                                        <DialogFooter>
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => setRevokeId(null)}
                                                            >
                                                                Отмена
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                onClick={() => handleRevoke(grant.user_id)}
                                                            >
                                                                Отозвать
                                                            </Button>
                                                        </DialogFooter>
                                                    </DialogContent>
                                                </Dialog>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
