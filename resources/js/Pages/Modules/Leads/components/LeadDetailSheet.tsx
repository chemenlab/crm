import { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/Components/ui/sheet';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Separator } from '@/Components/ui/separator';
import { ScrollArea } from '@/Components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/Components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Phone,
  Briefcase,
  MessageSquare,
  CheckSquare,
  Trash2,
  ArrowRightLeft,
  User,
  Flag,
  Tag,
  Bell,
  X,
  Plus,
} from 'lucide-react';
import type { Lead, LeadStatus, LeadPriority } from '../Index';
import LeadTodoList from './LeadTodoList';
import LeadComments from './LeadComments';

interface LeadDetailSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statuses: LeadStatus[];
  priorities: LeadPriority[];
  allTags: string[];
  onStatusChange: (leadId: number, status: string) => void;
  onDelete: (leadId: number) => void;
  onLeadUpdate?: (lead: Lead) => void;
}

const statusColorDots: Record<string, string> = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  gray: 'bg-gray-500',
};

const priorityColors: Record<string, string> = {
  low: 'bg-gray-400',
  normal: 'bg-blue-500',
  high: 'bg-orange-500',
  urgent: 'bg-red-500',
};

export default function LeadDetailSheet({
  lead,
  open,
  onOpenChange,
  statuses,
  priorities,
  allTags,
  onStatusChange,
  onDelete,
  onLeadUpdate,
}: LeadDetailSheetProps) {
  const [localLead, setLocalLead] = useState<Lead | null>(lead);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [convertForm, setConvertForm] = useState({ start_time: '', end_time: '', notes: '' });
  const [reminderForm, setReminderForm] = useState({ reminder_at: '', reminder_note: '' });
  const [isConverting, setIsConverting] = useState(false);
  const [newTag, setNewTag] = useState('');

  // Синхронизация с props
  useEffect(() => {
    setLocalLead(lead);
  }, [lead]);

  if (!localLead) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const formatPhone = (phone: string) => {
    if (phone.length === 11 && phone.startsWith('7')) {
      return `+7 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7, 9)}-${phone.slice(9)}`;
    }
    return phone;
  };

  // Priority change
  const handlePriorityChange = (priority: string) => {
    const oldPriority = localLead.priority;
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { ...prev, priority } : null);
    
    router.patch(`/app/modules/leads/${localLead.id}/priority`, { priority }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Приоритет обновлён');
        onLeadUpdate?.({ ...localLead, priority });
      },
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, priority: oldPriority } : null);
        toast.error('Ошибка');
      },
    });
  };

  // Tags management
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    const currentTags = localLead.tags || [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }
    const newTags = [...currentTags, newTag.trim()];
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { ...prev, tags: newTags } : null);
    setNewTag('');
    
    router.patch(`/app/modules/leads/${localLead.id}/tags`, {
      tags: newTags,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Тег добавлен');
        onLeadUpdate?.({ ...localLead, tags: newTags });
      },
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, tags: currentTags } : null);
        toast.error('Ошибка');
      },
    });
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = localLead.tags || [];
    const newTags = currentTags.filter(t => t !== tagToRemove);
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { ...prev, tags: newTags } : null);
    
    router.patch(`/app/modules/leads/${localLead.id}/tags`, {
      tags: newTags,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Тег удалён');
        onLeadUpdate?.({ ...localLead, tags: newTags });
      },
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, tags: currentTags } : null);
        toast.error('Ошибка');
      },
    });
  };

  // Reminder
  const handleSetReminder = () => {
    const oldReminder = { reminder_at: localLead.reminder_at, reminder_note: localLead.reminder_note };
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { 
      ...prev, 
      reminder_at: reminderForm.reminder_at, 
      reminder_note: reminderForm.reminder_note 
    } : null);
    
    router.patch(`/app/modules/leads/${localLead.id}/reminder`, reminderForm, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Напоминание установлено');
        setIsReminderDialogOpen(false);
        onLeadUpdate?.({ ...localLead, ...reminderForm });
      },
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, ...oldReminder } : null);
        toast.error('Ошибка');
      },
    });
  };

  const handleClearReminder = () => {
    const oldReminder = { reminder_at: localLead.reminder_at, reminder_note: localLead.reminder_note };
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { ...prev, reminder_at: null, reminder_note: null } : null);
    
    router.patch(`/app/modules/leads/${localLead.id}/reminder`, {
      reminder_at: null,
      reminder_note: null,
    }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => {
        toast.success('Напоминание удалено');
        onLeadUpdate?.({ ...localLead, reminder_at: null, reminder_note: null });
      },
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, ...oldReminder } : null);
        toast.error('Ошибка');
      },
    });
  };

  // Convert to appointment
  const handleConvert = () => {
    if (!convertForm.start_time || !convertForm.end_time) {
      toast.error('Укажите время начала и окончания');
      return;
    }
    setIsConverting(true);
    router.post(`/app/modules/leads/${localLead.id}/convert`, convertForm, {
      preserveState: true,
      onSuccess: () => {
        toast.success('Заявка конвертирована в запись');
        setIsConvertDialogOpen(false);
        onOpenChange(false);
      },
      onError: (errors) => {
        const errorMessage = Object.values(errors).flat().join(', ');
        toast.error(errorMessage || 'Не удалось конвертировать заявку');
      },
      onFinish: () => setIsConverting(false),
    });
  };

  // Todo handlers
  const handleTodoAdd = (title: string) => {
    router.post(`/app/modules/leads/${localLead.id}/todos`, { title }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => toast.success('Задача добавлена'),
      onError: () => toast.error('Не удалось добавить задачу'),
    });
  };

  const handleTodoToggle = (todoId: number, isCompleted: boolean) => {
    // Оптимистичное обновление
    setLocalLead(prev => {
      if (!prev) return null;
      return {
        ...prev,
        todos: prev.todos?.map(t => 
          t.id === todoId 
            ? { ...t, is_completed: isCompleted, completed_at: isCompleted ? new Date().toISOString() : null }
            : t
        ),
      };
    });
    
    router.patch(`/app/modules/leads/${localLead.id}/todos/${todoId}`, { is_completed: isCompleted }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => toast.success(isCompleted ? 'Задача выполнена' : 'Задача возвращена'),
      onError: () => {
        // Откатить при ошибке
        setLocalLead(prev => {
          if (!prev) return null;
          return {
            ...prev,
            todos: prev.todos?.map(t => 
              t.id === todoId 
                ? { ...t, is_completed: !isCompleted, completed_at: !isCompleted ? new Date().toISOString() : null }
                : t
            ),
          };
        });
        toast.error('Не удалось обновить задачу');
      },
    });
  };

  const handleTodoDelete = (todoId: number) => {
    const oldTodos = localLead.todos;
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { ...prev, todos: prev.todos?.filter(t => t.id !== todoId) } : null);
    
    router.delete(`/app/modules/leads/${localLead.id}/todos/${todoId}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => toast.success('Задача удалена'),
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, todos: oldTodos } : null);
        toast.error('Не удалось удалить задачу');
      },
    });
  };

  // Comment handlers
  const handleCommentAdd = (content: string) => {
    router.post(`/app/modules/leads/${localLead.id}/comments`, { content }, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => toast.success('Комментарий добавлен'),
      onError: () => toast.error('Не удалось добавить комментарий'),
    });
  };

  const handleCommentDelete = (commentId: number) => {
    const oldComments = localLead.comments;
    // Оптимистичное обновление
    setLocalLead(prev => prev ? { ...prev, comments: prev.comments?.filter(c => c.id !== commentId) } : null);
    
    router.delete(`/app/modules/leads/${localLead.id}/comments/${commentId}`, {
      preserveScroll: true,
      preserveState: true,
      onSuccess: () => toast.success('Комментарий удалён'),
      onError: () => {
        setLocalLead(prev => prev ? { ...prev, comments: oldComments } : null);
        toast.error('Не удалось удалить комментарий');
      },
    });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-lg overflow-hidden flex flex-col">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {localLead.name}
            </SheetTitle>
            <SheetDescription>
              Заявка #{localLead.id} от {formatDate(localLead.created_at)}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-6 pb-6">
              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Статус</Label>
                  <Select
                    value={localLead.status}
                    onValueChange={(value) => onStatusChange(localLead.id, value)}
                    disabled={!!localLead.converted_appointment_id}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map(status => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statusColorDots[status.color]}`} />
                            {status.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <Flag className="h-3 w-3" />
                    Приоритет
                  </Label>
                  <Select value={localLead.priority || 'normal'} onValueChange={handlePriorityChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${priorityColors[p.value]}`} />
                            {p.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Tag className="h-4 w-4" />
                  Теги
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(localLead.tags || []).map((tag, i) => (
                    <Badge key={i} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button onClick={() => handleRemoveTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Новый тег..."
                    className="flex-1"
                    list="tag-suggestions"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <datalist id="tag-suggestions">
                    {allTags.filter(t => !(localLead.tags || []).includes(t)).map(t => (
                      <option key={t} value={t} />
                    ))}
                  </datalist>
                  <Button size="icon" onClick={handleAddTag} disabled={!newTag.trim()}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Reminder */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Напоминание
                </h4>
                {localLead.reminder_at ? (
                  <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                          {new Date(localLead.reminder_at).toLocaleString('ru-RU')}
                        </p>
                        {localLead.reminder_note && (
                          <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                            {localLead.reminder_note}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="sm" onClick={handleClearReminder}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setIsReminderDialogOpen(true)}>
                    <Bell className="h-4 w-4 mr-2" />
                    Установить напоминание
                  </Button>
                )}
              </div>

              <Separator />

              {/* Contact Info */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Контактная информация
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${localLead.phone}`} className="hover:underline">
                      {formatPhone(localLead.phone)}
                    </a>
                  </div>
                  {localLead.client?.name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{localLead.client.name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Service */}
              {localLead.service && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Услуга
                    </h4>
                    <Badge
                      variant="secondary"
                      style={{
                        backgroundColor: localLead.service.color ? `${localLead.service.color}20` : undefined,
                        color: localLead.service.color || undefined,
                      }}
                    >
                      {localLead.service.name}
                    </Badge>
                  </div>
                </>
              )}

              {/* Message */}
              {localLead.message && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Сообщение
                    </h4>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {localLead.message}
                    </p>
                  </div>
                </>
              )}

              {/* Custom Fields */}
              {localLead.custom_fields && Object.keys(localLead.custom_fields).length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-medium">Дополнительные поля</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(localLead.custom_fields).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-muted-foreground">{key}:</span>
                          <span>{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Todo List */}
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Задачи
                </h4>
                <LeadTodoList
                  todos={localLead.todos || []}
                  onAdd={handleTodoAdd}
                  onToggle={handleTodoToggle}
                  onDelete={handleTodoDelete}
                />
              </div>

              {/* Comments */}
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Комментарии
                </h4>
                <LeadComments
                  comments={localLead.comments || []}
                  onAdd={handleCommentAdd}
                  onDelete={handleCommentDelete}
                />
              </div>

              {/* Converted Info */}
              {localLead.converted_appointment_id && (
                <>
                  <Separator />
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300">
                      Заявка конвертирована в запись #{localLead.converted_appointment_id}
                    </p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            {!localLead.converted_appointment_id && (
              <Button variant="default" className="flex-1" onClick={() => setIsConvertDialogOpen(true)}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                Конвертировать
              </Button>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Удалить заявку?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Это действие нельзя отменить. Заявка и все связанные данные будут удалены.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Отмена</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(localLead.id)} className="bg-destructive text-destructive-foreground">
                    Удалить
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </SheetContent>
      </Sheet>

      {/* Convert Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Конвертировать в запись</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Дата и время начала</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={convertForm.start_time}
                onChange={(e) => setConvertForm(prev => ({ ...prev, start_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">Дата и время окончания</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={convertForm.end_time}
                onChange={(e) => setConvertForm(prev => ({ ...prev, end_time: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Заметки (необязательно)</Label>
              <Textarea
                id="notes"
                value={convertForm.notes}
                onChange={(e) => setConvertForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Дополнительная информация..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConvertDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleConvert} disabled={isConverting}>
              {isConverting ? 'Конвертация...' : 'Конвертировать'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Dialog */}
      <Dialog open={isReminderDialogOpen} onOpenChange={setIsReminderDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Установить напоминание</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reminder_at">Дата и время</Label>
              <Input
                id="reminder_at"
                type="datetime-local"
                value={reminderForm.reminder_at}
                onChange={(e) => setReminderForm(prev => ({ ...prev, reminder_at: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder_note">Заметка (необязательно)</Label>
              <Textarea
                id="reminder_note"
                value={reminderForm.reminder_note}
                onChange={(e) => setReminderForm(prev => ({ ...prev, reminder_note: e.target.value }))}
                placeholder="О чём напомнить..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReminderDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSetReminder} disabled={!reminderForm.reminder_at}>
              Установить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
