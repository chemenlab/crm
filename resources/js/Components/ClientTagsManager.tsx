import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Badge } from '@/Components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/Components/ui/dialog';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

// @ts-ignore
declare const route: any;

interface ClientTag {
    id: number;
    name: string;
    color: string;
    description: string | null;
    clients_count: number;
}

const PRESET_COLORS = [
    '#ef4444', // red
    '#f59e0b', // amber
    '#10b981', // emerald
    '#3b82f6', // blue
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
];

export function ClientTagsManager() {
    const [tags, setTags] = useState<ClientTag[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingTag, setEditingTag] = useState<ClientTag | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; tag: ClientTag | null }>({
        open: false,
        tag: null,
    });
    const [formData, setFormData] = useState({
        name: '',
        color: PRESET_COLORS[0],
        description: '',
    });

    useEffect(() => {
        fetchTags();
    }, []);

    const fetchTags = async () => {
        try {
            const response = await axios.get(route('client-tags.index'));
            setTags(response.data);
        } catch (error) {
            toast.error('Не удалось загрузить теги');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingTag) {
                await axios.put(route('client-tags.update', editingTag.id), formData);
                toast.success('Тег обновлён');
            } else {
                await axios.post(route('client-tags.store'), formData);
                toast.success('Тег создан');
            }
            
            fetchTags();
            handleCloseDialog();
        } catch (error: any) {
            toast.error('Ошибка', {
                description: error.response?.data?.message || 'Попробуйте еще раз',
            });
        }
    };

    const handleDelete = async (tag: ClientTag) => {
        setDeleteConfirm({
            open: true,
            tag,
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.tag) return;

        try {
            await axios.delete(route('client-tags.destroy', deleteConfirm.tag.id));
            toast.success('Тег удалён');
            fetchTags();
            setDeleteConfirm({ open: false, tag: null });
        } catch (error) {
            toast.error('Не удалось удалить тег');
        }
    };

    const handleEdit = (tag: ClientTag) => {
        setEditingTag(tag);
        setFormData({
            name: tag.name,
            color: tag.color,
            description: tag.description || '',
        });
        setShowDialog(true);
    };

    const handleCloseDialog = () => {
        setShowDialog(false);
        setEditingTag(null);
        setFormData({
            name: '',
            color: PRESET_COLORS[0],
            description: '',
        });
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                    Используйте теги для отметки клиентов: "VIP", "Постоянный", "Проблемный" и т.д.
                </p>
                <Button onClick={() => setShowDialog(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Создать тег
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                    Загрузка...
                </div>
            ) : tags.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed rounded-lg">
                    <Tag className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground mb-4">
                        У вас пока нет тегов
                    </p>
                    <Button onClick={() => setShowDialog(true)} variant="outline">
                        <Plus className="w-4 h-4 mr-2" />
                        Создать первый тег
                    </Button>
                </div>
            ) : (
                <div className="space-y-2">
                    {tags.map((tag) => (
                        <div
                            key={tag.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                        >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                <Badge
                                    variant="outline"
                                    className="px-2 py-1 shrink-0"
                                    style={{
                                        borderColor: tag.color,
                                        color: tag.color,
                                    }}
                                >
                                    {tag.name}
                                </Badge>
                                <div className="flex-1 min-w-0">
                                    {tag.description && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {tag.description}
                                        </p>
                                    )}
                                </div>
                                <div className="text-xs text-muted-foreground shrink-0">
                                    {tag.clients_count} {tag.clients_count === 1 ? 'клиент' : 'клиентов'}
                                </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleEdit(tag)}
                                >
                                    <Pencil className="w-4 h-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleDelete(tag)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent className="sm:max-w-[480px]">
                    <DialogHeader>
                        <DialogTitle>
                            {editingTag ? 'Редактировать тег' : 'Создать тег'}
                        </DialogTitle>
                        <DialogDescription>
                            Теги помогают классифицировать клиентов и видеть важную информацию при записи
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Название <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="name"
                                placeholder="VIP клиент, Постоянный..."
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Цвет</Label>
                            <div className="flex gap-2">
                                {PRESET_COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        className={`w-10 h-10 rounded-full border-2 transition-all ${
                                            formData.color === color
                                                ? 'border-foreground scale-110'
                                                : 'border-border hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: color }}
                                        onClick={() => setFormData({ ...formData, color })}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Описание</Label>
                            <Textarea
                                id="description"
                                placeholder="Дополнительная информация о теге..."
                                rows={3}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="p-3 bg-muted rounded-lg">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">Превью:</span>
                                <Badge
                                    variant="outline"
                                    style={{
                                        borderColor: formData.color,
                                        color: formData.color,
                                    }}
                                >
                                    {formData.name || 'Название тега'}
                                </Badge>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Отмена
                            </Button>
                            <Button type="submit" disabled={!formData.name}>
                                {editingTag ? 'Сохранить' : 'Создать'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                onConfirm={confirmDelete}
                title="Удаление тега"
                itemName={deleteConfirm.tag?.name}
                description={
                    deleteConfirm.tag && deleteConfirm.tag.clients_count > 0
                        ? `Этот тег используется у ${deleteConfirm.tag.clients_count} клиентов. Он будет удалён у всех.`
                        : undefined
                }
            />
        </div>
    );
}
