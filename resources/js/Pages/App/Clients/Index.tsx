import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import { Plus, Pencil, Trash2, MoreHorizontal, Phone, Mail, MessageSquare, Users, Eye, Tag as TagIcon, ChevronLeft, ChevronRight, AlertCircle, ExternalLink, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import AppPageLayout from '@/Layouts/AppPageLayout';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import LimitReachedAlert from '@/Components/LimitReachedAlert';
import { Button } from '@/Components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/Components/ui/card';
import {
    ResponsiveTable,
    ResponsiveTableBody,
    ResponsiveTableCell,
    ResponsiveTableHead,
    ResponsiveTableHeader,
    ResponsiveTableRow,
} from '@/Components/ui/responsive-table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/Components/ui/avatar';
import { Badge } from '@/Components/ui/badge';

// @ts-ignore
declare const route: any;

interface Client {
    id: number;
    name: string;
    phone: string | null;
    email: string | null;
    telegram_id: string | null;
    notes: string | null;
    tags?: Array<{
        id: number;
        name: string;
        color: string;
    }>;
}

interface Props {
    clients: {
        data: Client[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    remainingSlots: number;
    search?: string;
}

const clientSchema = z.object({
    name: z.string().min(1, 'Имя обязательно'),
    phone: z.string().nullable(),
    email: z.string().email('Некорректный email').nullable().or(z.literal('')),
    telegram_id: z.string().nullable(),
    notes: z.string().nullable(),
});

type ClientFormValues = z.infer<typeof clientSchema>;

export default function ClientsIndex({ clients, remainingSlots: remaining_slots, search }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string }>({
        open: false,
        id: null,
        name: '',
    });
    const [existingClient, setExistingClient] = useState<Client | null>(null);
    const [isCheckingPhone, setIsCheckingPhone] = useState(false);
    const [searchQuery, setSearchQuery] = useState(search || '');

    // Show flash messages
    const { props } = usePage<any>();
    const { auth } = props;
    const hasActiveSubscription = auth?.user?.currentSubscription?.status === 'active' || auth?.user?.currentSubscription?.status === 'trial';

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    // Handle search text change
    const onSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    // Debounce search execution
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchQuery !== search) {
                router.get(
                    route('clients.index'),
                    { search: searchQuery },
                    { preserveState: true, replace: true }
                );
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const form = useForm<ClientFormValues>({
        resolver: zodResolver(clientSchema),
        defaultValues: {
            name: '',
            phone: '',
            email: '',
            telegram_id: '',
            notes: '',
        },
    });

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Check phone for existing client
    const checkPhoneForDuplicate = async (phone: string) => {
        if (!phone || phone.length < 10 || editingClient) {
            setExistingClient(null);
            return;
        }

        setIsCheckingPhone(true);
        try {
            const response = await fetch(route('clients.checkPhone'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ phone }),
            });
            const data = await response.json();
            if (data.exists && data.client) {
                setExistingClient(data.client);
            } else {
                setExistingClient(null);
            }
        } catch (error) {
            console.error('Error checking phone:', error);
            setExistingClient(null);
        } finally {
            setIsCheckingPhone(false);
        }
    };

    // Debounce phone check
    useEffect(() => {
        const phone = form.watch('phone');
        const timer = setTimeout(() => {
            checkPhoneForDuplicate(phone || '');
        }, 500);
        return () => clearTimeout(timer);
    }, [form.watch('phone'), editingClient]);

    const onSubmit = (data: ClientFormValues) => {
        // Convert empty strings to null for nullable fields
        const formattedData = {
            ...data,
            phone: data.phone || null,
            email: data.email || null,
            telegram_id: data.telegram_id || null,
            notes: data.notes || null,
        };

        if (editingClient) {
            router.put(route('clients.update', editingClient.id), formattedData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingClient(null);
                    form.reset();
                },
            });
        } else {
            router.post(route('clients.store'), formattedData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    form.reset();
                },
            });
        }
    };

    const handleEdit = (client: Client) => {
        setEditingClient(client);
        form.reset({
            name: client.name,
            phone: client.phone || '',
            email: client.email || '',
            telegram_id: client.telegram_id || '',
            notes: client.notes || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (client: Client) => {
        setDeleteConfirm({
            open: true,
            id: client.id,
            name: client.name,
        });
    };

    const confirmDelete = () => {
        if (deleteConfirm.id) {
            router.delete(route('clients.destroy', deleteConfirm.id), {
                onSuccess: () => {
                    setDeleteConfirm({ open: false, id: null, name: '' });
                },
            });
        }
    };

    const handleAddNew = () => {
        setEditingClient(null);
        setExistingClient(null);
        form.reset({
            name: '',
            phone: '',
            email: '',
            telegram_id: '',
            notes: '',
        });
        setIsDialogOpen(true);
    };

    return (
        <AppPageLayout title="Клиенты">
            <Head title="Клиенты" />

            <div className="flex flex-col gap-6 w-full">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Клиенты
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Управление базой клиентов
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button size="sm" onClick={handleAddNew} className="cursor-pointer shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 active:scale-95 h-9" disabled={!hasActiveSubscription || remaining_slots === 0}>
                            <Plus className="mr-2 h-4 w-4" />
                            Добавить клиента
                        </Button>
                    </div>
                </div>

                    {!hasActiveSubscription && (
                        <SubscriptionRequired
                            title="Требуется подписка"
                            description="Для управления клиентами необходима активная подписка"
                        />
                    )}

                    {hasActiveSubscription && remaining_slots === 0 && (
                        <LimitReachedAlert
                            resourceName="Клиенты"
                            message="Вы достигли лимита клиентов для вашего тарифного плана. Удалите существующих клиентов или обновите тариф для добавления новых."
                        />
                    )}

                    <Card className="shadow-sm">
                        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
                            <div>
                                <CardTitle className="text-lg">Список клиентов</CardTitle>
                                <CardDescription>
                                    Всего записей: {clients.total}
                                </CardDescription>
                            </div>
                            <div className="relative w-full sm:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="search"
                                    placeholder="Поиск..."
                                    className="pl-9 h-9"
                                    value={searchQuery}
                                    onChange={onSearchChange}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ResponsiveTable>
                                <ResponsiveTableHeader>
                                    <ResponsiveTableRow className="bg-muted/50 hover:bg-muted/50">
                                        <ResponsiveTableHead className="w-[300px]">Клиент</ResponsiveTableHead>
                                        <ResponsiveTableHead>Контакты</ResponsiveTableHead>
                                        <ResponsiveTableHead>Теги</ResponsiveTableHead>
                                        <ResponsiveTableHead>Заметки</ResponsiveTableHead>
                                        <ResponsiveTableHead className="text-right w-[80px]"></ResponsiveTableHead>
                                    </ResponsiveTableRow>
                                </ResponsiveTableHeader>
                                <ResponsiveTableBody>
                                    {clients.data.length === 0 ? (
                                        <ResponsiveTableRow>
                                            <ResponsiveTableCell colSpan={5} className="h-[300px] text-center">
                                                <div className="flex flex-col items-center justify-center gap-3">
                                                    <div className="h-16 w-16 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground">
                                                        <Users className="h-8 w-8 opacity-50" />
                                                    </div>
                                                    <h3 className="text-lg font-semibold mt-2">Клиентов не найдено</h3>
                                                    <p className="text-muted-foreground max-w-sm">
                                                        {searchQuery ? 'По вашему запросу ничего не найдено.' : 'Вы еще не добавили ни одного клиента.'}
                                                    </p>
                                                    {!searchQuery && (
                                                        <Button variant="outline" onClick={handleAddNew} className="mt-4">
                                                            Добавить первого клиента
                                                        </Button>
                                                    )}
                                                </div>
                                            </ResponsiveTableCell>
                                        </ResponsiveTableRow>
                                    ) : (
                                        clients.data.map((client) => (
                                            <ResponsiveTableRow
                                                key={client.id}
                                                className="cursor-pointer hover:bg-muted/40 transition-colors"
                                                onClick={(e: React.MouseEvent) => {
                                                    // Prevent navigation if clicking on dropdown or interactive elements
                                                    if ((e.target as HTMLElement).closest('[data-no-click]')) return;
                                                    router.visit(`/app/clients/${client.id}`);
                                                }}
                                                mobileCardContent={
                                                    <div className="space-y-4">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10 border border-muted">
                                                                    <AvatarFallback className="bg-primary/5 text-primary text-sm">
                                                                        {getInitials(client.name)}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <div className="font-medium text-base">{client.name}</div>
                                                                    <div className="text-xs text-muted-foreground">ID: {client.id}</div>
                                                                </div>
                                                            </div>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 -mr-2" data-no-click="true">
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end">
                                                                    <DropdownMenuItem onClick={() => router.visit(`/app/clients/${client.id}`)}>
                                                                        <Eye className="mr-2 h-4 w-4" />
                                                                        Профиль
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem onClick={() => handleEdit(client)}>
                                                                        <Pencil className="mr-2 h-4 w-4" />
                                                                        Редактировать
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem
                                                                        className="text-destructive focus:text-destructive"
                                                                        onClick={() => handleDelete(client)}
                                                                    >
                                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                                        Удалить
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </div>

                                                        <div className="space-y-2 pl-13">
                                                            {client.phone && (
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Phone className="h-3.5 w-3.5" />
                                                                    <span>{client.phone}</span>
                                                                </div>
                                                            )}
                                                            {client.email && (
                                                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                                    <Mail className="h-3.5 w-3.5" />
                                                                    <span>{client.email}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {client.tags && client.tags.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 pt-2">
                                                                {client.tags.map((tag) => (
                                                                    <Badge
                                                                        key={tag.id}
                                                                        variant="secondary"
                                                                        className="font-normal text-xs px-1.5"
                                                                        style={{
                                                                            backgroundColor: `${tag.color}15`,
                                                                            color: tag.color,
                                                                        }}
                                                                    >
                                                                        {tag.name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                }
                                            >
                                                <ResponsiveTableCell className="font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-9 w-9 border border-muted/40">
                                                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-medium">
                                                                {getInitials(client.name)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-medium text-sm text-foreground">{client.name}</div>
                                                        </div>
                                                    </div>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    <div className="flex flex-col gap-1.5">
                                                        {client.phone && (
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                                                <div className="h-5 w-5 rounded bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    <Phone className="h-3 w-3" />
                                                                </div>
                                                                {client.phone}
                                                            </div>
                                                        )}
                                                        {client.email && (
                                                            <div className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group">
                                                                <div className="h-5 w-5 rounded bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                                                                    <Mail className="h-3 w-3" />
                                                                </div>
                                                                {client.email}
                                                            </div>
                                                        )}
                                                    </div>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    {client.tags && client.tags.length > 0 ? (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {client.tags.map((tag) => (
                                                                <Badge
                                                                    key={tag.id}
                                                                    variant="secondary"
                                                                    className="font-normal text-xs px-1.5"
                                                                    style={{
                                                                        backgroundColor: `${tag.color}15`,
                                                                        color: tag.color,
                                                                    }}
                                                                >
                                                                    {tag.name}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground opacity-50">—</span>
                                                    )}
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    {client.notes && (
                                                        <div className="text-sm text-muted-foreground text-ellipsis overflow-hidden whitespace-nowrap max-w-[200px]" title={client.notes}>
                                                            {client.notes}
                                                        </div>
                                                    )}
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell className="text-right">
                                                    <div onClick={(e) => e.stopPropagation()} data-no-click="true">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                                    <span className="sr-only">Открыть меню</span>
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Действия</DropdownMenuLabel>
                                                                <DropdownMenuItem onClick={() => router.visit(`/app/clients/${client.id}`)}>
                                                                    <Eye className="mr-2 h-4 w-4" />
                                                                    Открыть профиль
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem onClick={() => handleEdit(client)}>
                                                                    <Pencil className="mr-2 h-4 w-4" />
                                                                    Редактировать
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    className="text-destructive focus:text-destructive"
                                                                    onClick={() => handleDelete(client)}
                                                                >
                                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                                    Удалить
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </ResponsiveTableCell>
                                            </ResponsiveTableRow>
                                        ))
                                    )}
                                </ResponsiveTableBody>
                            </ResponsiveTable>
                        </CardContent>

                        {/* Pagination */}
                        {clients.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t bg-muted/5">
                                <p className="text-xs text-muted-foreground">
                                    Показано с {clients.from} по {clients.to} из {clients.total} записей
                                </p>
                                <div className="flex items-center gap-1">
                                    {clients.links.map((link, idx) => {
                                        if (idx === 0) {
                                            return (
                                                <Button
                                                    key="prev"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                            );
                                        }
                                        if (idx === clients.links.length - 1) {
                                            return (
                                                <Button
                                                    key="next"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                    className="h-8 w-8 p-0"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            );
                                        }
                                        return (
                                            <Button
                                                key={idx}
                                                variant={link.active ? "default" : "ghost"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className={`h-8 w-8 p-0 ${!link.active && 'text-muted-foreground font-normal'}`}
                                            >
                                                {link.label.replace('&laquo;', '').replace('&raquo;', '')}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>{editingClient ? 'Редактировать клиента' : 'Новый клиент'}</DialogTitle>
                                <DialogDescription>
                                    Заполните данные карты клиента.
                                </DialogDescription>
                            </DialogHeader>
                            <form id="client-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                <div className="grid gap-4 bg-muted/30 p-4 rounded-lg border">
                                    <div className="grid gap-2">
                                        <Label htmlFor="name">Имя</Label>
                                        <Input id="name" {...form.register('name')} placeholder="Имя клиента" className="bg-background" />
                                        {form.formState.errors.name && (
                                            <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                                        )}
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="phone">Телефон</Label>
                                        <Input id="phone" {...form.register('phone')} placeholder="+7 (999) 000-00-00" className="bg-background" />

                                        {/* Existing client warning */}
                                        {existingClient && !editingClient && (
                                            <div className="rounded-lg border border-amber-500/50 bg-amber-500/10 p-3 mt-2">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1 space-y-2">
                                                        <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                                            Обнаружено совпадение!
                                                        </p>
                                                        <div className="flex items-center justify-between gap-2 p-2 rounded-md bg-background/80 shadow-sm border border-amber-200 dark:border-amber-800">
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarFallback className="text-xs">{getInitials(existingClient.name)}</AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-sm leading-none">{existingClient.name}</span>
                                                                </div>
                                                            </div>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setIsDialogOpen(false);
                                                                    router.visit(`/app/clients/${existingClient.id}`);
                                                                }}
                                                                className="h-7 text-xs"
                                                            >
                                                                Открыть
                                                                <ExternalLink className="ml-1 h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {isCheckingPhone && (
                                            <p className="text-xs text-muted-foreground animate-pulse">Проверка номера...</p>
                                        )}
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" {...form.register('email')} placeholder="client@example.com" />
                                    {form.formState.errors.email && (
                                        <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="telegram_id">Telegram ID</Label>
                                    <Input id="telegram_id" {...form.register('telegram_id')} placeholder="@username" />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="notes">Заметки</Label>
                                    <Textarea id="notes" {...form.register('notes')} placeholder="Дополнительная информация..." className="min-h-[80px]" />
                                </div>
                            </form>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsDialogOpen(false)}>Отмена</Button>
                                <Button type="submit" form="client-form" disabled={form.formState.isSubmitting || (!!existingClient && !editingClient)}>
                                    {editingClient ? 'Сохранить изменения' : 'Создать клиента'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>

                    <ConfirmDialog
                        open={deleteConfirm.open}
                        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                        onConfirm={confirmDelete}
                        title="Удаление клиента"
                        itemName={deleteConfirm.name}
                        description="Вы уверены? История записей и все данные будут безвозвратно удалены."
                    />
            </div>
        </AppPageLayout>
    );
}
