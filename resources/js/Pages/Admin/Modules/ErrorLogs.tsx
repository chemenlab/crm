import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Button } from '@/Components/ui/button';
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
} from '@/Components/ui/dialog';
import {
    ArrowLeft,
    AlertTriangle,
    ChevronDown,
    ChevronUp,
    Trash2,
    RefreshCw,
} from 'lucide-react';
import { useState } from 'react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Module {
    slug: string;
    name: string;
}

interface ErrorLog {
    id: number;
    module_slug: string;
    error_type: string;
    error_message: string;
    stack_trace: string | null;
    user_id: number | null;
    context: Record<string, any> | null;
    created_at: string;
}

interface PaginatedErrorLogs {
    data: ErrorLog[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

interface ErrorStats {
    total: number;
    today: number;
    types: Record<string, number>;
}

interface Props {
    module: Module;
    errorLogs: PaginatedErrorLogs;
    errorStats: ErrorStats;
}

export default function ModuleErrorLogs({ module, errorLogs, errorStats = { total: 0, today: 0, types: {} } }: Props) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [clearDialogOpen, setClearDialogOpen] = useState(false);
    const [clearing, setClearing] = useState(false);

    const toggleRow = (id: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedRows(newExpanded);
    };

    const handleClearLogs = () => {
        setClearing(true);
        router.post(
            route('admin.modules.error-logs.clear'),
            { days_to_keep: 7 },
            {
                onFinish: () => {
                    setClearing(false);
                    setClearDialogOpen(false);
                },
            }
        );
    };

    const getErrorTypeBadge = (type: string) => {
        const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
            hook_error: 'destructive',
            route_error: 'destructive',
            migration_error: 'destructive',
            load_error: 'secondary',
            event_error: 'outline',
            runtime_error: 'default',
        };
        const labels: Record<string, string> = {
            hook_error: 'Хук',
            route_error: 'Маршрут',
            migration_error: 'Миграция',
            load_error: 'Загрузка',
            event_error: 'Событие',
            runtime_error: 'Runtime',
        };
        return (
            <Badge variant={variants[type] || 'secondary'}>
                {labels[type] || type}
            </Badge>
        );
    };

    const formatDateTime = (dateString: string) => {
        return format(new Date(dateString), 'dd MMM yyyy, HH:mm:ss', { locale: ru });
    };

    return (
        <AdminLayout>
            <Head title={`Логи ошибок: ${module.name}`} />

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
                                <AlertTriangle className="h-6 w-6" />
                                Логи ошибок
                            </h1>
                            <p className="text-muted-foreground">
                                {module.name}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.reload()}
                        >
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Обновить
                        </Button>
                        <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
                            <Button
                                variant="destructive"
                                onClick={() => setClearDialogOpen(true)}
                                disabled={errorLogs.total === 0}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Очистить старые
                            </Button>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Очистить логи</DialogTitle>
                                    <DialogDescription>
                                        Будут удалены все логи ошибок старше 7 дней. Это действие нельзя отменить.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="outline"
                                        onClick={() => setClearDialogOpen(false)}
                                    >
                                        Отмена
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleClearLogs}
                                        disabled={clearing}
                                    >
                                        {clearing ? 'Очистка...' : 'Очистить'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Всего ошибок</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{errorStats.total}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium">Сегодня</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-destructive">{errorStats.today}</div>
                        </CardContent>
                    </Card>
                    {Object.entries(errorStats?.types || {}).slice(0, 2).map(([type, count]) => (
                        <Card key={type}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium capitalize">{type.replace('_', ' ')}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{count}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Error Logs Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Журнал ошибок</CardTitle>
                        <CardDescription>
                            Всего: {errorLogs.total} записей
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errorLogs.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">Нет ошибок</p>
                                <p className="text-sm text-muted-foreground">
                                    Модуль работает без ошибок
                                </p>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[40px]"></TableHead>
                                            <TableHead>Тип</TableHead>
                                            <TableHead>Сообщение</TableHead>
                                            <TableHead>User ID</TableHead>
                                            <TableHead>Дата</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {errorLogs.data.map((log) => (
                                            <>
                                                <TableRow
                                                    key={log.id}
                                                    className="cursor-pointer hover:bg-muted/50"
                                                    onClick={() => toggleRow(log.id)}
                                                >
                                                    <TableCell>
                                                        {expandedRows.has(log.id) ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {getErrorTypeBadge(log.error_type)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="line-clamp-1 max-w-md">
                                                            {log.error_message}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        {log.user_id || '—'}
                                                    </TableCell>
                                                    <TableCell className="text-sm">
                                                        {formatDateTime(log.created_at)}
                                                    </TableCell>
                                                </TableRow>
                                                {expandedRows.has(log.id) && (
                                                    <TableRow key={`${log.id}-expanded`}>
                                                        <TableCell colSpan={5} className="bg-muted/30">
                                                            <div className="p-4 space-y-4">
                                                                <div>
                                                                    <h4 className="text-sm font-medium mb-2">Сообщение об ошибке</h4>
                                                                    <p className="text-sm bg-background p-3 rounded border">
                                                                        {log.error_message}
                                                                    </p>
                                                                </div>
                                                                {log.stack_trace && (
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-2">Stack Trace</h4>
                                                                        <pre className="text-xs bg-background p-3 rounded border overflow-x-auto max-h-60">
                                                                            {log.stack_trace}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                                {log.context && Object.keys(log.context).length > 0 && (
                                                                    <div>
                                                                        <h4 className="text-sm font-medium mb-2">Контекст</h4>
                                                                        <pre className="text-xs bg-background p-3 rounded border overflow-x-auto">
                                                                            {JSON.stringify(log.context, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Pagination */}
                                {errorLogs.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <p className="text-sm text-muted-foreground">
                                            Страница {errorLogs.current_page} из {errorLogs.last_page}
                                        </p>
                                        <div className="flex gap-2">
                                            {errorLogs.current_page > 1 && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(route('admin.modules.module-error-logs', module.slug), {
                                                            page: errorLogs.current_page - 1,
                                                        })
                                                    }
                                                >
                                                    Назад
                                                </Button>
                                            )}
                                            {errorLogs.current_page < errorLogs.last_page && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        router.get(route('admin.modules.module-error-logs', module.slug), {
                                                            page: errorLogs.current_page + 1,
                                                        })
                                                    }
                                                >
                                                    Вперёд
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
