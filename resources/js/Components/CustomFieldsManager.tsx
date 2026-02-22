import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/Components/ui/table';
import { Switch } from '@/Components/ui/switch';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import axios from 'axios';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import { toast } from 'sonner';

interface CustomField {
    id: number;
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'image';
    is_required: boolean;
    is_public: boolean;
    allow_multiple?: boolean;
    options?: string[];
    order: number;
}

export function CustomFieldsManager() {
    const [fields, setFields] = useState<CustomField[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingField, setEditingField] = useState<CustomField | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string }>({
        open: false,
        id: null,
        name: '',
    });
    const [formData, setFormData] = useState<{
        name: string;
        type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'image';
        is_required: boolean;
        is_public: boolean;
        allow_multiple: boolean;
        options: string[];
    }>({
        name: '',
        type: 'text',
        is_required: false,
        is_public: true,
        allow_multiple: false,
        options: [],
    });
    const [newOption, setNewOption] = useState('');

    useEffect(() => {
        loadFields();
    }, []);

    const loadFields = async () => {
        try {
            const response = await axios.get('/app/settings/custom-fields');
            setFields(response.data);
        } catch (error) {
            console.error('Failed to load fields:', error);
        }
    };

    const handleOpenDialog = (field?: CustomField) => {
        if (field) {
            setEditingField(field);
            setFormData({
                name: field.name,
                type: field.type,
                is_required: field.is_required,
                is_public: field.is_public,
                allow_multiple: field.allow_multiple || false,
                options: field.options || [],
            });
        } else {
            setEditingField(null);
            setFormData({
                name: '',
                type: 'text',
                is_required: false,
                is_public: true,
                allow_multiple: false,
                options: [],
            });
        }
        setNewOption('');
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingField(null);
        setNewOption('');
    };

    const addOption = () => {
        if (newOption.trim() && !formData.options.includes(newOption.trim())) {
            setFormData({ ...formData, options: [...formData.options, newOption.trim()] });
            setNewOption('');
        }
    };

    const removeOption = (index: number) => {
        setFormData({ 
            ...formData, 
            options: formData.options.filter((_, i) => i !== index) 
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingField) {
                await axios.put(`/app/settings/custom-fields/${editingField.id}`, formData);
            } else {
                await axios.post('/app/settings/custom-fields', formData);
            }
            await loadFields();
            handleCloseDialog();
        } catch (error) {
            console.error('Failed to save field:', error);
        }
    };

    const handleDelete = async (field: CustomField) => {
        setDeleteConfirm({
            open: true,
            id: field.id,
            name: field.name,
        });
    };

    const confirmDelete = async () => {
        if (!deleteConfirm.id) return;

        try {
            await axios.delete(`/app/settings/custom-fields/${deleteConfirm.id}`);
            await loadFields();
            setDeleteConfirm({ open: false, id: null, name: '' });
            toast.success('Поле успешно удалено');
        } catch (error) {
            console.error('Failed to delete field:', error);
            toast.error('Не удалось удалить поле');
        }
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            text: 'Текст',
            number: 'Число',
            date: 'Дата',
            select: 'Выбор',
            checkbox: 'Чекбокс',
            image: 'Изображение',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button onClick={() => handleOpenDialog()}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Добавить поле
                </Button>
            </div>

            {fields.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                    Пока нет кастомных полей. Создайте первое поле.
                </div>
            ) : (
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Название</TableHead>
                                <TableHead>Тип</TableHead>
                                <TableHead className="text-center">Обязательное</TableHead>
                                <TableHead className="text-center">Публичное</TableHead>
                                <TableHead className="text-right">Действия</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field) => (
                                <TableRow key={field.id}>
                                    <TableCell className="font-medium">{field.name}</TableCell>
                                    <TableCell>{getTypeLabel(field.type)}</TableCell>
                                    <TableCell className="text-center">
                                        {field.is_required ? '✓' : '—'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {field.is_public ? '✓' : '—'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDialog(field)}
                                            >
                                                <PencilIcon className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(field)}
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingField ? 'Редактировать поле' : 'Создать поле'}
                            </DialogTitle>
                            <DialogDescription>
                                Заполните информацию о кастомном поле
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Название поля *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Например: Дата рождения"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="type">Тип поля *</Label>
                                <Select
                                    value={formData.type}
                                    onValueChange={(value: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'image') =>
                                        setFormData({ ...formData, type: value })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="text">Текст</SelectItem>
                                        <SelectItem value="number">Число</SelectItem>
                                        <SelectItem value="date">Дата</SelectItem>
                                        <SelectItem value="select">Выбор</SelectItem>
                                        <SelectItem value="checkbox">Чекбокс</SelectItem>
                                        <SelectItem value="image">Изображение</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {formData.type === 'image' && (
                                <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                                    <div className="space-y-0.5">
                                        <Label htmlFor="allow_multiple" className="text-sm font-medium">
                                            Множественная загрузка
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Разрешить загрузку нескольких изображений
                                        </p>
                                    </div>
                                    <Switch
                                        id="allow_multiple"
                                        checked={formData.allow_multiple}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, allow_multiple: checked })
                                        }
                                    />
                                </div>
                            )}

                            {formData.type === 'select' && (
                                <div className="space-y-2">
                                    <Label>Варианты выбора</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newOption}
                                            onChange={(e) => setNewOption(e.target.value)}
                                            placeholder="Новый вариант"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addOption();
                                                }
                                            }}
                                        />
                                        <Button type="button" variant="outline" onClick={addOption}>
                                            <PlusIcon className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {formData.options.length > 0 && (
                                        <div className="space-y-1 mt-2">
                                            {formData.options.map((opt, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                                    <span className="text-sm">{opt}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => removeOption(index)}
                                                    >
                                                        <TrashIcon className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {formData.options.length === 0 && (
                                        <p className="text-xs text-muted-foreground">
                                            Добавьте хотя бы один вариант для выбора
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_required" className="text-sm font-medium">
                                        Обязательное поле
                                    </Label>
                                </div>
                                <Switch
                                    id="is_required"
                                    checked={formData.is_required}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_required: checked })
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is_public" className="text-sm font-medium">
                                        Публичное поле
                                    </Label>
                                    <p className="text-xs text-muted-foreground">
                                        Показывать на публичной странице записи
                                    </p>
                                </div>
                                <Switch
                                    id="is_public"
                                    checked={formData.is_public}
                                    onCheckedChange={(checked) =>
                                        setFormData({ ...formData, is_public: checked })
                                    }
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Отмена
                            </Button>
                            <Button type="submit">
                                {editingField ? 'Сохранить' : 'Создать'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={deleteConfirm.open}
                onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                onConfirm={confirmDelete}
                title="Удаление поля"
                itemName={deleteConfirm.name}
            />
        </div>
    );
}
