import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit, Trash2, ChevronRight, Folder } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { toast } from 'sonner';
import { Icon } from '@/utils/iconMapper';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  parent_id?: number;
  icon?: string;
  color?: string;
  order: number;
  is_active: boolean;
  article_count?: number;
  children?: Category[];
}

interface Props {
  categories: Category[];
}

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  parent_id: string;
  icon: string;
  color: string;
  is_active: boolean;
}

export default function Categories({ categories }: Props) {
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string }>({
    open: false,
    id: null,
    name: '',
  });
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    slug: '',
    description: '',
    parent_id: '',
    icon: '📁',
    color: '#3b82f6',
    is_active: true,
  });

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: '',
      parent_id: '',
      icon: '📁',
      color: '#3b82f6',
      is_active: true,
    });
    setEditingCategory(null);
  };

  const handleCreate = () => {
    resetForm();
    setShowDialog(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      parent_id: category.parent_id?.toString() || '',
      icon: category.icon || '📁',
      color: category.color || '#3b82f6',
      is_active: category.is_active,
    });
    setShowDialog(true);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Введите название категории');
      return;
    }

    const data = {
      ...formData,
      parent_id: formData.parent_id ? parseInt(formData.parent_id) : null,
    };

    if (editingCategory) {
      router.put(
        route('admin.knowledge-base.categories.update', editingCategory.id),
        data,
        {
          preserveScroll: true,
          onSuccess: () => {
            toast.success('Категория обновлена');
            setShowDialog(false);
            resetForm();
          },
          onError: () => {
            toast.error('Не удалось обновить категорию');
          },
        }
      );
    } else {
      router.post(route('admin.knowledge-base.categories.store'), data, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Категория создана');
          setShowDialog(false);
          resetForm();
        },
        onError: () => {
          toast.error('Не удалось создать категорию');
        },
      });
    }
  };

  const handleDelete = (category: Category) => {
    setDeleteConfirm({ open: true, id: category.id, name: category.name });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.id) return;
    router.delete(route('admin.knowledge-base.categories.destroy', deleteConfirm.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Категория удалена');
        setDeleteConfirm({ open: false, id: null, name: '' });
      },
      onError: () => {
        toast.error('Не удалось удалить категорию');
      },
    });
  };

  const generateSlug = (name: string) => {
    const translitMap: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };

    return name
      .toLowerCase()
      .split('')
      .map((char) => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleNameChange = (name: string) => {
    setFormData({ ...formData, name });
    if (!editingCategory) {
      setFormData({ ...formData, name, slug: generateSlug(name) });
    }
  };

  const renderCategoryTree = (cats: Category[], level: number = 0) => {
    return cats.map((category) => (
      <div key={category.id}>
        <Card className="mb-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3" style={{ marginLeft: `${level * 24}px` }}>
                {level > 0 && <ChevronRight className="h-4 w-4 text-gray-400" />}
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                  style={{ backgroundColor: category.color || '#3b82f6' }}
                >
                  <Icon name={category.icon} className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    {!category.is_active && (
                      <Badge variant="outline">Неактивна</Badge>
                    )}
                    {category.article_count !== undefined && (
                      <Badge variant="outline">
                        {category.article_count} статей
                      </Badge>
                    )}
                  </div>
                  {category.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {category.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit(category)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(category)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {category.children && category.children.length > 0 && (
          <div>{renderCategoryTree(category.children, level + 1)}</div>
        )}
      </div>
    ));
  };

  const flattenCategories = (cats: Category[]): Category[] => {
    return cats.reduce((acc: Category[], cat) => {
      acc.push(cat);
      if (cat.children && cat.children.length > 0) {
        acc.push(...flattenCategories(cat.children));
      }
      return acc;
    }, []);
  };

  const allCategories = flattenCategories(categories);

  return (
    <AdminLayout>
      <Head title="Управление категориями" />

      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Категории базы знаний
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Управление категориями и их иерархией
            </p>
          </div>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Создать категорию
          </Button>
        </div>

        {/* Categories Tree */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Folder className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Нет категорий
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Создайте первую категорию для организации статей
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Создать категорию
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>{renderCategoryTree(categories)}</div>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Редактирование категории' : 'Создание категории'}
              </DialogTitle>
              <DialogDescription>
                Заполните информацию о категории
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Название *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Название категории"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL (slug) *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    placeholder="url-kategorii"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Описание</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Краткое описание категории"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="parent_id">Родительская категория</Label>
                <Select
                  value={formData.parent_id || 'none'}
                  onValueChange={(value) =>
                    setFormData({ ...formData, parent_id: value === 'none' ? '' : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Без родителя (корневая)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Без родителя (корневая)</SelectItem>
                    {allCategories
                      .filter((cat) => cat.id !== editingCategory?.id)
                      .map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="icon">Иконка (emoji)</Label>
                  <Input
                    id="icon"
                    value={formData.icon}
                    onChange={(e) =>
                      setFormData({ ...formData, icon: e.target.value })
                    }
                    placeholder="📁"
                  />
                </div>

                <div>
                  <Label htmlFor="color">Цвет</Label>
                  <Input
                    id="color"
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      setFormData({ ...formData, color: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowDialog(false);
                    resetForm();
                  }}
                >
                  Отмена
                </Button>
                <Button type="submit">
                  {editingCategory ? 'Обновить' : 'Создать'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        
        <ConfirmDialog
          open={deleteConfirm.open}
          onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
          onConfirm={confirmDelete}
          title="Удаление категории"
          itemName={deleteConfirm.name}
        />
      </div>
    </AdminLayout>
  );
}
