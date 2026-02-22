import { Head, router, usePage, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Plus, Trash2, Eye, EyeOff, GripVertical } from 'lucide-react';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import LimitReachedAlert from '@/Components/LimitReachedAlert';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

// @ts-ignore
declare const route: any;

interface PortfolioItem {
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string;
    image_url: string;
    tag: string | null;
    is_visible: boolean;
    sort_order: number;
}

interface Props {
    auth: any;
    items: PortfolioItem[];
    remainingSlots: number;
}

export default function PortfolioIndex({ auth, items: portfolio_items, remainingSlots: remaining_slots }: Props) {
    const { flash } = usePage().props as any;
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [items, setItems] = useState(portfolio_items);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
        open: false,
        id: null,
    });
    
    const hasActiveSubscription = auth?.user?.currentSubscription?.status === 'active' || auth?.user?.currentSubscription?.status === 'trial';

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    const handleDelete = (id: number) => {
        setDeleteConfirm({ open: true, id });
    };

    const confirmDelete = () => {
        if (!deleteConfirm.id) return;
        router.delete(`/app/portfolio/${deleteConfirm.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setItems(items.filter(item => item.id !== deleteConfirm.id));
                setDeleteConfirm({ open: false, id: null });
            },
        });
    };

    const handleToggleVisibility = (id: number) => {
        router.put(`/app/portfolio/${id}`, {
            is_visible: !items.find(item => item.id === id)?.is_visible,
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setItems(items.map(item => 
                    item.id === id ? { ...item, is_visible: !item.is_visible } : item
                ));
            },
        });
    };

    return (
        <AppSidebarProvider>
            <Toaster />
            <Head title="Портфолио" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-2 sm:p-4 lg:p-6 pt-0">
                    
                    {/* Header */}
                    <div className="py-4 sm:py-6 flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold">Портфолио</h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Управление фотографиями ваших работ ({items.length} из {items.length + remaining_slots})
                            </p>
                        </div>
                        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                            <DialogTrigger asChild>
                                <Button disabled={!hasActiveSubscription || remaining_slots === 0}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить работу
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogTitle>Добавить работу в портфолио</DialogTitle>
                                    <DialogDescription>
                                        Загрузите фотографию вашей работы
                                    </DialogDescription>
                                </DialogHeader>
                                <form method="POST" encType="multipart/form-data" onSubmit={(e) => {
                                    e.preventDefault();
                                    const formData = new FormData(e.currentTarget);
                                    router.post('/app/portfolio', formData, {
                                        onSuccess: () => {
                                            setIsCreateOpen(false);
                                            (e.target as HTMLFormElement).reset();
                                        },
                                    });
                                }}>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="image">Фотография *</Label>
                                            <Input id="image" name="image" type="file" accept="image/*" required />
                                            <p className="text-xs text-muted-foreground">
                                                Максимальный размер: 5 МБ. Форматы: JPG, PNG, WebP
                                            </p>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="title">Название работы *</Label>
                                            <Input id="title" name="title" placeholder="Маникюр с дизайном" required />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="description">Описание</Label>
                                            <textarea
                                                id="description"
                                                name="description"
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                placeholder="Краткое описание работы..."
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="tag">Тег</Label>
                                            <Input id="tag" name="tag" placeholder="Маникюр, Педикюр, Дизайн..." />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                            Отмена
                                        </Button>
                                        <Button type="submit">Добавить</Button>
                                    </div>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {!hasActiveSubscription && <SubscriptionRequired />}

                    {hasActiveSubscription && remaining_slots === 0 && (
                        <LimitReachedAlert 
                            resourceName="Фото портфолио"
                            message="Вы использовали все доступные слоты для фотографий в портфолио. Удалите существующие фото или обновите тариф для добавления новых."
                        />
                    )}

                    {/* Portfolio Grid */}
                    {items.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center justify-center py-12">
                                <p className="text-muted-foreground mb-4">Портфолио пусто</p>
                                <Button onClick={() => setIsCreateOpen(true)} disabled={!hasActiveSubscription || remaining_slots === 0}>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Добавить первую работу
                                </Button>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {items.map((item) => (
                                <Card key={item.id} className={!item.is_visible ? 'opacity-50' : ''}>
                                    <CardContent className="p-4">
                                        <div className="aspect-[4/5] rounded-lg overflow-hidden mb-3 relative group">
                                            <img 
                                                src={item.thumbnail_url} 
                                                alt={item.title}
                                                className="w-full h-full object-cover"
                                            />
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    onClick={() => handleToggleVisibility(item.id)}
                                                >
                                                    {item.is_visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(item.id)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <h3 className="font-semibold text-sm mb-1">{item.title}</h3>
                                        {item.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                                        )}
                                        {item.tag && (
                                            <span className="inline-block mt-2 px-2 py-1 text-xs bg-muted rounded-md">
                                                {item.tag}
                                            </span>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                
                <ConfirmDialog
                    open={deleteConfirm.open}
                    onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                    onConfirm={confirmDelete}
                    title="Удаление работы"
                    description="Удалить эту работу из портфолио?"
                />
            </SidebarInset>
        </AppSidebarProvider>
    );
}
