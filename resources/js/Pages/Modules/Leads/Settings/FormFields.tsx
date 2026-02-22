import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { Badge } from '@/Components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/Components/ui/dialog';
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
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  ArrowLeft,
  FileText,
  Type,
  AlignLeft,
  List,
  CheckSquare,
  Mail,
  Link as LinkIcon,
} from 'lucide-react';

export interface LeadFormField {
  id: number;
  user_id: number;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'email' | 'url';
  options: string[] | null;
  is_required: boolean;
  is_active: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

interface Props {
  fields: LeadFormField[];
  fieldTypes: Record<string, string>;
}

const fieldTypeIcons: Record<string, React.ReactNode> = {
  text: <Type className="h-4 w-4" />,
  textarea: <AlignLeft className="h-4 w-4" />,
  select: <List className="h-4 w-4" />,
  checkbox: <CheckSquare className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  url: <LinkIcon className="h-4 w-4" />,
};

interface SortableRowProps {
  field: LeadFormField;
  fieldTypes: Record<string, string>;
  onEdit: (field: LeadFormField) => void;
  onDelete: (field: LeadFormField) => void;
  onToggleActive: (field: LeadFormField) => void;
}

function SortableRow({ field, fieldTypes, onEdit, onDelete, onToggleActive }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell className="w-10">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-medium">{field.label}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {fieldTypeIcons[field.type]}
          <span>{fieldTypes[field.type]}</span>
        </div>
      </TableCell>
      <TableCell className="text-center">
        {field.is_required ? (
          <Badge variant="secondary">Да</Badge>
        ) : (
          <span className="text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Switch
          checked={field.is_active}
          onCheckedChange={() => onToggleActive(field)}
        />
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-1">
          <Button variant="ghost" size="icon" onClick={() => onEdit(field)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(field)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

export default function FormFields({ fields: initialFields, fieldTypes }: Props) {
  const [fields, setFields] = useState<LeadFormField[]>(initialFields);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingField, setEditingField] = useState<LeadFormField | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    field: LeadFormField | null;
  }>({ open: false, field: null });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    label: '',
    type: 'text' as LeadFormField['type'],
    options: [] as string[],
    is_required: false,
    is_active: true,
  });
  const [newOption, setNewOption] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = fields.findIndex((f) => f.id === active.id);
      const newIndex = fields.findIndex((f) => f.id === over.id);

      const newFields = arrayMove(fields, oldIndex, newIndex);
      setFields(newFields);

      // Update positions on backend
      const reorderData = newFields.map((f, index) => ({
        id: f.id,
        position: index,
      }));

      router.patch('/app/modules/leads/settings/fields/reorder', {
        fields: reorderData,
      }, {
        preserveScroll: true,
        preserveState: true,
        onError: () => {
          toast.error('Не удалось сохранить порядок');
          setFields(initialFields);
        },
      });
    }
  };

  const openCreateDialog = () => {
    setEditingField(null);
    setFormData({
      label: '',
      type: 'text',
      options: [],
      is_required: false,
      is_active: true,
    });
    setNewOption('');
    setIsDialogOpen(true);
  };

  const openEditDialog = (field: LeadFormField) => {
    setEditingField(field);
    setFormData({
      label: field.label,
      type: field.type,
      options: field.options || [],
      is_required: field.is_required,
      is_active: field.is_active,
    });
    setNewOption('');
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingField(null);
    setNewOption('');
  };

  const addOption = () => {
    const trimmed = newOption.trim();
    if (trimmed && !formData.options.includes(trimmed)) {
      setFormData({ ...formData, options: [...formData.options, trimmed] });
      setNewOption('');
    }
  };

  const removeOption = (index: number) => {
    setFormData({
      ...formData,
      options: formData.options.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.type === 'select' && formData.options.length === 0) {
      toast.error('Добавьте хотя бы один вариант для выпадающего списка');
      return;
    }

    setIsSubmitting(true);

    const data = {
      label: formData.label,
      type: formData.type,
      options: formData.type === 'select' ? formData.options : null,
      is_required: formData.is_required,
      is_active: formData.is_active,
    };

    if (editingField) {
      router.patch(`/app/modules/leads/settings/fields/${editingField.id}`, data, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Поле обновлено');
          closeDialog();
        },
        onError: () => toast.error('Не удалось обновить поле'),
        onFinish: () => setIsSubmitting(false),
      });
    } else {
      router.post('/app/modules/leads/settings/fields', data, {
        preserveScroll: true,
        onSuccess: () => {
          toast.success('Поле создано');
          closeDialog();
        },
        onError: () => toast.error('Не удалось создать поле'),
        onFinish: () => setIsSubmitting(false),
      });
    }
  };

  const handleToggleActive = (field: LeadFormField) => {
    router.patch(`/app/modules/leads/settings/fields/${field.id}`, {
      is_active: !field.is_active,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        setFields(fields.map(f =>
          f.id === field.id ? { ...f, is_active: !f.is_active } : f
        ));
        toast.success(field.is_active ? 'Поле отключено' : 'Поле включено');
      },
      onError: () => toast.error('Не удалось обновить поле'),
    });
  };

  const handleDelete = (field: LeadFormField) => {
    setDeleteConfirm({ open: true, field });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.field) return;

    router.delete(`/app/modules/leads/settings/fields/${deleteConfirm.field.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Поле удалено');
        setDeleteConfirm({ open: false, field: null });
      },
      onError: () => toast.error('Не удалось удалить поле'),
    });
  };

  return (
    <AppSidebarProvider>
      <Head title="Настройка полей формы заявки" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6">
            <div className="flex items-center gap-4 mb-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.visit('/app/modules/leads')}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Поля формы заявки</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Настройте дополнительные поля для формы заявки на публичной странице
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Кастомные поля
                </CardTitle>
                <CardDescription>
                  Перетаскивайте поля для изменения порядка отображения
                </CardDescription>
              </div>
              <Button onClick={openCreateDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Добавить поле
              </Button>
            </CardHeader>
            <CardContent>
              {fields.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Нет кастомных полей</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Создайте дополнительные поля для сбора информации от клиентов
                  </p>
                  <Button onClick={openCreateDialog}>
                    <Plus className="h-4 w-4 mr-2" />
                    Создать первое поле
                  </Button>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10"></TableHead>
                          <TableHead>Название</TableHead>
                          <TableHead>Тип</TableHead>
                          <TableHead className="text-center">Обязательное</TableHead>
                          <TableHead className="text-center">Активно</TableHead>
                          <TableHead className="text-right">Действия</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <SortableContext
                          items={fields.map(f => f.id)}
                          strategy={verticalListSortingStrategy}
                        >
                          {fields.map((field) => (
                            <SortableRow
                              key={field.id}
                              field={field}
                              fieldTypes={fieldTypes}
                              onEdit={openEditDialog}
                              onDelete={handleDelete}
                              onToggleActive={handleToggleActive}
                            />
                          ))}
                        </SortableContext>
                      </TableBody>
                    </Table>
                  </DndContext>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </SidebarInset>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingField ? 'Редактировать поле' : 'Создать поле'}
              </DialogTitle>
              <DialogDescription>
                Настройте параметры поля формы заявки
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Label */}
              <div className="space-y-2">
                <Label htmlFor="label">Название поля *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  placeholder="Например: Бюджет проекта"
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Тип поля *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: LeadFormField['type']) =>
                    setFormData({ ...formData, type: value, options: value === 'select' ? formData.options : [] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(fieldTypes).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          {fieldTypeIcons[value]}
                          <span>{label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Options for select type */}
              {formData.type === 'select' && (
                <div className="space-y-2">
                  <Label>Варианты выбора *</Label>
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
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  {formData.options.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {formData.options.map((opt, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-muted rounded"
                        >
                          <span className="text-sm">{opt}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => removeOption(index)}
                          >
                            <Trash2 className="h-3 w-3" />
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

              {/* Is Required */}
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_required" className="text-sm font-medium">
                    Обязательное поле
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Клиент должен заполнить это поле
                  </p>
                </div>
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_required: checked })
                  }
                />
              </div>

              {/* Is Active */}
              <div className="flex items-center justify-between space-x-2 p-3 border rounded-lg">
                <div className="space-y-0.5">
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Активно
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Показывать поле в форме заявки
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Сохранение...' : editingField ? 'Сохранить' : 'Создать'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Удаление поля"
        itemName={deleteConfirm.field?.label || ''}
      />
    </AppSidebarProvider>
  );
}
