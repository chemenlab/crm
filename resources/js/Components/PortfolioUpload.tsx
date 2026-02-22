import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface PortfolioItem {
    id: number;
    title: string;
    description: string | null;
    image_path: string;
    thumbnail_path: string;
    tag: string | null;
    sort_order: number;
    is_visible: boolean;
}

interface Props {
    items: PortfolioItem[];
    remainingSlots: number;
}

export function PortfolioUpload({ items, remainingSlots }: Props) {
    const [uploading, setUploading] = useState(false);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
        open: false,
        id: null,
    });

    const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        
        setUploading(true);
        router.post('/app/portfolio', formData, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Фото добавлено в портфолио');
                (e.target as HTMLFormElement).reset();
            },
            onError: (errors) => {
                toast.error(errors.image || 'Ошибка загрузки фото');
            },
            onFinish: () => setUploading(false),
        });
    };

    const handleDelete = (id: number) => {
        setDeleteConfirm({ open: true, id });
    };

    const confirmDelete = () => {
        if (!deleteConfirm.id) return;
        
        router.delete(`/app/portfolio/${deleteConfirm.id}`, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Фото удалено');
                setDeleteConfirm({ open: false, id: null });
            },
        });
    };

    return (
        <div className="space-y-6">
            {/* Upload Form */}
            {remainingSlots > 0 && (
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="image">Фото *</Label>
                            <Input 
                                id="image" 
                                name="image" 
                                type="file" 
                                accept="image/*" 
                                required 
                                disabled={uploading}
                            />
                            <p className="text-xs text-muted-foreground">
                                Осталось слотов: {remainingSlots}
                            </p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="title">Название</Label>
                            <Input 
                                id="title" 
                                name="title" 
                                placeholder="Например: Маникюр с дизайном" 
                                disabled={uploading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Описание</Label>
                            <textarea
                                id="description"
                                name="description"
                                className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                placeholder="Краткое описание работы..."
                                disabled={uploading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="tag">Тег</Label>
                            <Input 
                                id="tag" 
                                name="tag" 
                                placeholder="Например: маникюр, педикюр" 
                                disabled={uploading}
                            />
                        </div>
                    </div>
                    <Button type="submit" disabled={uploading} className="w-full sm:w-fit">
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? 'Загрузка...' : 'Загрузить фото'}
                    </Button>
                </form>
            )}

            {remainingSlots === 0 && (
                <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
                    Достигнут лимит фотографий. Удалите старые фото, чтобы загрузить новые.
                </div>
            )}

            {/* Portfolio Grid */}
            {items.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {items.map((item) => (
                        <div key={item.id} className="relative group">
                            <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={`/storage/${item.image_path}`}
                                    alt={item.title || 'Portfolio item'}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <button
                                onClick={() => handleDelete(item.id)}
                                className="absolute top-2 right-2 p-1.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                title="Удалить"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            {item.title && (
                                <p className="mt-2 text-sm font-medium truncate">{item.title}</p>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground">
                        Портфолио пусто. Загрузите первое фото.
                    </p>
                </div>
            )}
            
            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                onConfirm={confirmDelete}
                title="Удаление фото"
                description="Удалить это фото из портфолио?"
            />
        </div>
    );
}
