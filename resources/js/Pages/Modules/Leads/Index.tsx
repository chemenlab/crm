import { Head, router } from '@inertiajs/react';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { SiteHeader } from '@/Components/site-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Checkbox } from '@/Components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/Components/ui/dropdown-menu';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import {
  ClipboardList,
  TrendingUp,
  Clock,
  CheckCircle,
  Settings,
  Search,
  Download,
  MoreHorizontal,
  Trash2,
  Archive,
  ListTodo,
  XCircle,
  AlertTriangle,
} from 'lucide-react';
import { LeadCard, LeadDetailSheet, KanbanColumn } from './components';

export interface Lead {
  id: number;
  name: string;
  phone: string;
  message: string | null;
  status: string;
  priority: string;
  tags: string[] | null;
  reminder_at: string | null;
  reminder_note: string | null;
  position: number;
  custom_fields: Record<string, any> | null;
  created_at: string;
  updated_at: string;
  converted_appointment_id: number | null;
  service: {
    id: number;
    name: string;
    color: string | null;
  } | null;
  client: {
    id: number;
    name: string;
  } | null;
  todos?: LeadTodo[];
  comments?: LeadComment[];
}

export interface LeadTodo {
  id: number;
  lead_id: number;
  title: string;
  is_completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  lead?: {
    id: number;
    name: string;
    phone: string;
    service_id: number;
    service?: { id: number; name: string };
  };
}

export interface LeadComment {
  id: number;
  lead_id: number;
  content: string;
  created_at: string;
  user: { id: number; name: string; avatar: string | null };
}

export interface KanbanColumn {
  id: string;
  title: string;
  color: string;
  leads: Lead[];
}

export interface LeadStatus {
  value: string;
  label: string;
  color: string;
}

export interface LeadPriority {
  value: string;
  label: string;
  color: string;
}

interface PaginatedData<T> {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

interface Props {
  columns: KanbanColumn[];
  archivedLeads: PaginatedData<Lead>;
  allTodos: LeadTodo[];
  stats: {
    total: number;
    new: number;
    in_progress: number;
    completed: number;
    cancelled: number;
    archived: number;
    urgent: number;
    with_reminders: number;
  };
  statuses: LeadStatus[];
  priorities: LeadPriority[];
  allTags: string[];
  services: { id: number; name: string }[];
  filters: {
    tab: string;
    search: string;
    priority: string;
    service_id: number | null;
  };
}

const statusColors: Record<string, string> = {
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  gray: 'bg-gray-500',
};

export default function LeadsIndex({
  columns: initialColumns,
  archivedLeads,
  allTodos: initialTodos,
  stats: initialStats,
  statuses,
  priorities,
  allTags,
  services,
  filters,
}: Props) {
  const isMobile = useIsMobile();
  const [columns, setColumns] = useState<KanbanColumn[]>(initialColumns);
  const [todos, setTodos] = useState<LeadTodo[]>(initialTodos);
  const [stats, setStats] = useState(initialStats);
  const [activeTab, setActiveTab] = useState(filters.tab || 'kanban');
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(filters.search || '');
  const [selectedLeads, setSelectedLeads] = useState<number[]>([]);

  // Синхронизация с props при обновлении данных с сервера
  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  useEffect(() => {
    setTodos(initialTodos);
  }, [initialTodos]);

  useEffect(() => {
    setStats(initialStats);
  }, [initialStats]);

  // Обновить selectedLead если он изменился в columns
  useEffect(() => {
    if (selectedLead) {
      const updatedLead = columns.flatMap(col => col.leads).find(l => l.id === selectedLead.id);
      if (updatedLead) {
        setSelectedLead(updatedLead);
      }
    }
  }, [columns, selectedLead?.id]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const findColumn = useCallback((leadId: number): KanbanColumn | undefined => {
    return columns.find(col => col.leads.some((lead: Lead) => lead.id === leadId));
  }, [columns]);

  // Фильтрация
  const applyFilters = (newFilters: Partial<typeof filters>) => {
    router.get('/app/modules/leads/list', { ...filters, ...newFilters }, {
      preserveState: true,
      preserveScroll: true,
    });
  };

  const handleSearch = () => {
    applyFilters({ search: searchQuery });
  };

  const handleExport = () => {
    window.location.href = '/app/modules/leads/export';
  };

  // Bulk actions
  const handleBulkStatusChange = (status: string) => {
    if (selectedLeads.length === 0) return;
    router.post('/app/modules/leads/bulk/status', {
      lead_ids: selectedLeads,
      status,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Статус обновлён');
        setSelectedLeads([]);
      },
      onError: () => toast.error('Ошибка при обновлении'),
    });
  };

  const handleBulkDelete = () => {
    if (selectedLeads.length === 0) return;
    if (!confirm(`Удалить ${selectedLeads.length} заявок?`)) return;
    router.post('/app/modules/leads/bulk/delete', {
      lead_ids: selectedLeads,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Заявки удалены');
        setSelectedLeads([]);
      },
      onError: () => toast.error('Ошибка при удалении'),
    });
  };

  const toggleLeadSelection = (leadId: number) => {
    setSelectedLeads(prev =>
      prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]
    );
  };

  // Drag and drop handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const column = findColumn(active.id as number);
    if (column) {
      const lead = column.leads.find((l: Lead) => l.id === active.id);
      setActiveLead(lead || null);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    const activeId = active.id as number;
    const overId = over.id;
    const activeColumn = findColumn(activeId);
    let overColumn = findColumn(overId as number);
    if (!overColumn && typeof overId === 'string') {
      overColumn = columns.find(col => col.id === overId);
    }
    if (!activeColumn || !overColumn || activeColumn.id === overColumn.id) return;
    setColumns(prev => {
      const activeLeads = [...activeColumn.leads];
      const overLeads = [...overColumn.leads];
      const activeIndex = activeLeads.findIndex((l: Lead) => l.id === activeId);
      const [movedLead] = activeLeads.splice(activeIndex, 1);
      overLeads.push({ ...movedLead, status: overColumn.id });
      return prev.map(col => {
        if (col.id === activeColumn.id) return { ...col, leads: activeLeads };
        if (col.id === overColumn.id) return { ...col, leads: overLeads };
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveLead(null);
    if (!over) return;
    const activeId = active.id as number;
    const overId = over.id;
    const activeColumn = findColumn(activeId);
    if (!activeColumn) return;
    let newPosition = activeColumn.leads.findIndex((l: Lead) => l.id === activeId);
    let newStatus = activeColumn.id;
    if (typeof overId === 'string') {
      newStatus = overId;
      const targetColumn = columns.find(col => col.id === overId);
      newPosition = targetColumn?.leads.length || 0;
    } else {
      const overColumn = findColumn(overId as number);
      if (overColumn) {
        newStatus = overColumn.id;
        newPosition = overColumn.leads.findIndex((l: Lead) => l.id === overId);
      }
    }
    router.patch(`/app/modules/leads/${activeId}/position`, {
      status: newStatus,
      position: newPosition,
    }, {
      preserveScroll: true,
      preserveState: true,
      onError: () => {
        toast.error('Не удалось переместить заявку');
        setColumns(initialColumns);
      },
    });
  };

  // Обновление заявки из LeadDetailSheet
  const handleLeadUpdate = (updatedLead: Lead) => {
    setColumns(prev => prev.map(col => ({
      ...col,
      leads: col.leads.map((l: Lead) => l.id === updatedLead.id ? { ...l, ...updatedLead } : l),
    })));
    if (selectedLead?.id === updatedLead.id) {
      setSelectedLead(updatedLead);
    }
  };

  const handleLeadClick = (lead: Lead) => {
    // Просто открываем Sheet с текущими данными заявки
    // Данные уже загружены в columns или archivedLeads
    setSelectedLead(lead);
    setIsSheetOpen(true);
  };

  const handleStatusChange = (leadId: number, newStatus: string) => {
    router.patch(`/app/modules/leads/${leadId}/status`, { status: newStatus }, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Статус обновлён');
        setColumns(prev => {
          const newColumns = prev.map(col => ({
            ...col,
            leads: col.leads.filter((l: Lead) => l.id !== leadId),
          }));
          const targetColumn = newColumns.find(col => col.id === newStatus);
          const lead = prev.flatMap(col => col.leads).find((l: Lead) => l.id === leadId);
          if (targetColumn && lead) {
            targetColumn.leads.push({ ...lead, status: newStatus });
          }
          return newColumns;
        });
        if (selectedLead?.id === leadId) {
          setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
        }
      },
      onError: () => toast.error('Не удалось обновить статус'),
    });
  };

  const handleDeleteLead = (leadId: number) => {
    router.delete(`/app/modules/leads/${leadId}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Заявка удалена');
        setIsSheetOpen(false);
        setSelectedLead(null);
        setColumns(prev => prev.map(col => ({
          ...col,
          leads: col.leads.filter((l: Lead) => l.id !== leadId),
        })));
      },
      onError: () => toast.error('Не удалось удалить заявку'),
    });
  };

  // Render Kanban board
  const renderKanbanBoard = () => (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            statusColors={statusColors}
            onLeadClick={handleLeadClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeLead ? <LeadCard lead={activeLead} isDragging onClick={() => {}} /> : null}
      </DragOverlay>
    </DndContext>
  );

  // Render Archive tab
  const renderArchive = () => (
    <div className="space-y-4">
      {archivedLeads.data.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Archive className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Архив пуст</p>
          <p className="text-sm mt-1">Архивированные заявки будут отображаться здесь</p>
        </div>
      ) : (
        <div className="space-y-2">
          {archivedLeads.data.map(lead => (
            <Card key={lead.id} className="cursor-pointer hover:shadow-md" onClick={() => handleLeadClick(lead)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedLeads.includes(lead.id)}
                    onCheckedChange={() => toggleLeadSelection(lead.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div>
                    <p className="font-medium">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {lead.service && (
                    <Badge variant="secondary">{lead.service.name}</Badge>
                  )}
                  <Badge variant="outline">В архиве</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render Tasks tab
  const renderTasks = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    // Разделяем задачи на 3 категории
    const overdueTodos = todos.filter(t => 
      !t.is_completed && t.due_date && new Date(t.due_date) < now
    );
    const activeTodos = todos.filter(t => 
      !t.is_completed && (!t.due_date || new Date(t.due_date) >= now)
    );
    const completedTodos = todos.filter(t => t.is_completed);

    const handleTodoToggle = (todo: LeadTodo, checked: boolean) => {
      // Оптимистичное обновление
      setTodos(prev => prev.map(t => 
        t.id === todo.id 
          ? { ...t, is_completed: checked, completed_at: checked ? new Date().toISOString() : null }
          : t
      ));
      
      router.patch(`/app/modules/leads/${todo.lead_id}/todos/${todo.id}`, {
        is_completed: checked,
      }, { 
        preserveScroll: true,
        preserveState: true,
        onSuccess: () => toast.success(checked ? 'Задача выполнена' : 'Задача возвращена'),
        onError: () => {
          // Откатить при ошибке
          setTodos(prev => prev.map(t => 
            t.id === todo.id 
              ? { ...t, is_completed: !checked, completed_at: !checked ? new Date().toISOString() : null }
              : t
          ));
          toast.error('Не удалось обновить задачу');
        },
      });
    };

    const renderTodoCard = (todo: LeadTodo, isOverdue = false) => (
      <Card key={todo.id} className={isOverdue ? 'border-red-200 dark:border-red-800' : ''}>
        <CardContent className="p-3 flex items-center gap-3">
          <Checkbox
            checked={todo.is_completed}
            onCheckedChange={(checked) => handleTodoToggle(todo, !!checked)}
          />
          <div className="flex-1">
            <p className={`text-sm ${todo.is_completed ? 'line-through text-muted-foreground' : ''}`}>
              {todo.title}
            </p>
            {todo.lead && (
              <p className="text-xs text-muted-foreground">
                {todo.lead.name} • {todo.lead.service?.name}
              </p>
            )}
          </div>
          {todo.due_date && (
            <Badge 
              variant="outline" 
              className={`text-xs ${isOverdue ? 'border-red-400 text-red-600 bg-red-50 dark:bg-red-900/20' : ''}`}
            >
              {new Date(todo.due_date).toLocaleDateString('ru-RU')}
            </Badge>
          )}
        </CardContent>
      </Card>
    );

    return (
      <div className="space-y-6">
        {/* Overdue tasks */}
        {overdueTodos.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              Просроченные ({overdueTodos.length})
            </h3>
            <div className="space-y-2">
              {overdueTodos.map(todo => renderTodoCard(todo, true))}
            </div>
          </div>
        )}

        {/* Active tasks */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <ListTodo className="h-4 w-4" />
            Активные задачи ({activeTodos.length})
          </h3>
          {activeTodos.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет активных задач</p>
          ) : (
            <div className="space-y-2">
              {activeTodos.map(todo => renderTodoCard(todo))}
            </div>
          )}
        </div>

        {/* Completed tasks */}
        {completedTodos.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3 text-muted-foreground flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Завершённые ({completedTodos.length})
            </h3>
            <div className="space-y-2 opacity-60">
              {completedTodos.slice(0, 10).map(todo => renderTodoCard(todo))}
              {completedTodos.length > 10 && (
                <p className="text-xs text-muted-foreground text-center py-2">
                  И ещё {completedTodos.length - 10} задач...
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <AppSidebarProvider>
      <Head title="Заявки" />
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col p-4 md:p-6 pt-0">
          {/* Header */}
          <div className="py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Заявки</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Управляйте заявками на услуги
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Экспорт
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.visit('/app/modules/leads/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Настройки
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Всего</CardTitle>
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Новые</CardTitle>
                <TrendingUp className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">{stats.new}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">В работе</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Завершены</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Отменены</CardTitle>
                <XCircle className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-600">{stats.cancelled}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Срочные</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.urgent}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Поиск по имени, телефону..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="max-w-sm"
              />
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Select
                value={filters.priority || 'all'}
                onValueChange={(value) => applyFilters({ priority: value === 'all' ? '' : value })}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Приоритет" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все приоритеты</SelectItem>
                  {priorities.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filters.service_id?.toString() || 'all'}
                onValueChange={(value) => applyFilters({ service_id: value === 'all' ? null : parseInt(value) })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Услуга" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все услуги</SelectItem>
                  {services.map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <div className="flex items-center gap-4 mb-4 p-3 bg-muted rounded-lg">
              <span className="text-sm">Выбрано: {selectedLeads.length}</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Действия
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('completed')}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Завершить
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('cancelled')}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Отменить
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleBulkStatusChange('archived')}>
                    <Archive className="h-4 w-4 mr-2" />
                    В архив
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleBulkDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Удалить
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLeads([])}>
                Снять выделение
              </Button>
            </div>
          )}

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(tab) => {
            setActiveTab(tab);
            applyFilters({ tab });
          }}>
            <TabsList className="mb-4">
              <TabsTrigger value="kanban" className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4" />
                Заявки
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <ListTodo className="h-4 w-4" />
                Задачи
                {todos.filter(t => !t.is_completed).length > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {todos.filter(t => !t.is_completed).length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="archive" className="flex items-center gap-2">
                <Archive className="h-4 w-4" />
                Архив
                {stats.archived > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {stats.archived}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="kanban">
              {isMobile ? (
                <div className="space-y-3">
                  {columns.flatMap(col => col.leads).map(lead => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => handleLeadClick(lead)} />
                  ))}
                </div>
              ) : (
                renderKanbanBoard()
              )}
            </TabsContent>

            <TabsContent value="tasks">
              {renderTasks()}
            </TabsContent>

            <TabsContent value="archive">
              {renderArchive()}
            </TabsContent>
          </Tabs>
        </div>
      </SidebarInset>

      {/* Lead Detail Sheet */}
      <LeadDetailSheet
        lead={selectedLead}
        open={isSheetOpen}
        onOpenChange={setIsSheetOpen}
        statuses={statuses}
        priorities={priorities}
        allTags={allTags}
        onStatusChange={handleStatusChange}
        onDelete={handleDeleteLead}
        onLeadUpdate={handleLeadUpdate}
      />
    </AppSidebarProvider>
  );
}
