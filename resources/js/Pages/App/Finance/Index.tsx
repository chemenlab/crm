import { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import {
    Plus,
    Trash2,
    TrendingUp,
    TrendingDown,
    Wallet,
    Calendar as CalendarIcon,
    Pencil,
    CreditCard,
    Banknote,
    Award,
    ArrowUpRight,
    ArrowDownRight,
    Receipt,
    FileText,
    ChevronLeft,
    ChevronRight,
    Target,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { ConfirmDialog } from '@/Components/ConfirmDialog';
import SubscriptionRequired from '@/Components/SubscriptionRequired';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

declare global {
    function route(name: string, params?: any): string;
}

interface Client {
    id: number;
    name: string;
    phone?: string;
}

interface Transaction {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: string;
    description: string | null;
    client_id: number | null;
    client?: Client;
}

interface TopClient {
    client: Client;
    total_revenue: number;
    transactions_count: number;
}

interface Stats {
    income: number;
    expense: number;
    profit: number;
    income_card: number;
    income_cash: number;
    appointments_count: number;
    year_income: number;
    year_expense: number;
    year_profit: number;
    year_appointments_count: number;
}

interface CategoryBreakdown {
    category: string;
    type: 'income' | 'expense';
    total: number;
    count: number;
}

interface AvailableMonth {
    month: number;
    year: number;
    label: string;
}

interface Props {
    transactions: {
        data: Transaction[];
        links: { url: string | null; label: string; active: boolean }[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    stats: Stats;
    topClients: TopClient[];
    clients: Client[];
    categoryBreakdown: CategoryBreakdown[];
    monthlyGoal: number | null;
    selectedMonth: number;
    selectedYear: number;
    availableMonths: AvailableMonth[];
}

const transactionSchema = z.object({
    type: z.enum(['income', 'expense']),
    amount: z.coerce.number().min(1, 'Сумма должна быть больше 0'),
    category: z.string().min(1, 'Категория обязательна'),
    date: z.string(),
    client_id: z.string().optional(),
    description: z.string().optional(),
});

type TransactionFormValues = z.infer<typeof transactionSchema>;

const formatCurrency = (amount: number) => {
    return Number(amount).toLocaleString('ru-RU');
};

export default function FinanceIndex({ transactions, stats, topClients, clients, categoryBreakdown, monthlyGoal, selectedMonth, selectedYear, availableMonths }: Props) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null; name: string }>({
        open: false,
        id: null,
        name: '',
    });
    const [isGoalDialogOpen, setIsGoalDialogOpen] = useState(false);
    const [goalValue, setGoalValue] = useState(String(monthlyGoal ?? ''));
    const [goalSubmitting, setGoalSubmitting] = useState(false);

    const { props } = usePage<any>();
    const hasActiveSubscription = props.auth?.user?.currentSubscription?.status === 'active' || props.auth?.user?.currentSubscription?.status === 'trial';

    useEffect(() => {
        if (props.flash?.success) {
            toast.success(props.flash.success);
        }
    }, [props.flash]);

    const form = useForm<TransactionFormValues>({
        resolver: zodResolver(transactionSchema) as any,
        defaultValues: {
            type: 'income',
            amount: 0,
            category: '',
            date: new Date().toISOString().split('T')[0],
            client_id: 'none',
            description: '',
        },
    });

    const onSubmit = (data: TransactionFormValues) => {
        const formattedData = {
            ...data,
            client_id: data.client_id === 'none' ? null : Number(data.client_id),
        };

        if (editingTransaction) {
            router.put(route('finance.update', editingTransaction.id), formattedData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    setEditingTransaction(null);
                    form.reset({ type: 'income', amount: 0, category: '', date: new Date().toISOString().split('T')[0], client_id: 'none', description: '' });
                },
            });
        } else {
            router.post(route('finance.store'), formattedData, {
                onSuccess: () => {
                    setIsDialogOpen(false);
                    form.reset({ type: 'income', amount: 0, category: '', date: new Date().toISOString().split('T')[0], client_id: 'none', description: '' });
                },
            });
        }
    };

    const handleEdit = (transaction: Transaction) => {
        setEditingTransaction(transaction);
        form.reset({
            type: transaction.type,
            amount: transaction.amount,
            category: transaction.category,
            date: transaction.date,
            client_id: transaction.client_id ? String(transaction.client_id) : 'none',
            description: transaction.description || '',
        });
        setIsDialogOpen(true);
    };

    const handleDelete = (transaction: Transaction) => {
        const name = `${transaction.category} - ${formatCurrency(transaction.amount)} \u20BD`;
        setDeleteConfirm({ open: true, id: transaction.id, name });
    };

    const confirmDelete = () => {
        if (deleteConfirm.id) {
            router.delete(route('finance.destroy', deleteConfirm.id), {
                onSuccess: () => setDeleteConfirm({ open: false, id: null, name: '' }),
            });
        }
    };

    const handleDialogClose = (open: boolean) => {
        setIsDialogOpen(open);
        if (!open) {
            setEditingTransaction(null);
            form.reset({ type: 'income', amount: 0, category: '', date: new Date().toISOString().split('T')[0], client_id: 'none', description: '' });
        }
    };

    const handleGoalSubmit = () => {
        setGoalSubmitting(true);
        router.patch(route('finance.goal.update'), {
            monthly_goal: Number(goalValue) || 0,
        }, {
            onSuccess: () => {
                setIsGoalDialogOpen(false);
                setGoalSubmitting(false);
            },
            onError: () => setGoalSubmitting(false),
        });
    };

    const goalPercentage = monthlyGoal && monthlyGoal > 0
        ? Math.min(Math.round((stats.income / monthlyGoal) * 100), 100)
        : 0;

    // Payment method percentages
    const cardPercent = stats.income > 0 ? Math.round((stats.income_card / stats.income) * 100) : 0;
    const cashPercent = stats.income > 0 ? Math.round((stats.income_cash / stats.income) * 100) : 0;

    return (
        <AppPageLayout title="Финансы">
            <Head title="Финансы" />

            <div className="flex flex-col gap-6 pb-8 max-w-[1400px] mx-auto w-full">

                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-1"
                >
                    <div className="space-y-1">
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Финансы
                        </h1>
                        <p className="text-muted-foreground text-sm sm:text-base">
                            Полная статистика доходов и расходов
                        </p>
                    </div>
                    <Button
                        onClick={() => setIsDialogOpen(true)}
                        disabled={!hasActiveSubscription}
                        size="sm"
                        className="cursor-pointer shadow-md bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary transition-all hover:scale-105 active:scale-95 h-9"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Добавить операцию
                    </Button>
                </motion.div>

                {!hasActiveSubscription && <SubscriptionRequired />}

                {/* Monthly Goal Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                >
                    <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-primary/10 p-2 text-primary ring-1 ring-primary/20">
                                        <Target className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">Цель на месяц</p>
                                        <p className="text-xs text-muted-foreground">
                                            {monthlyGoal && monthlyGoal > 0
                                                ? `${formatCurrency(monthlyGoal)} \u20BD`
                                                : 'Не установлена'}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setGoalValue(String(monthlyGoal ?? ''));
                                        setIsGoalDialogOpen(true);
                                    }}
                                    className="h-8 text-xs"
                                >
                                    {monthlyGoal && monthlyGoal > 0 ? 'Изменить' : 'Установить'}
                                </Button>
                            </div>
                            {monthlyGoal && monthlyGoal > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                        <span className="text-muted-foreground">
                                            {formatCurrency(stats.income)} / {formatCurrency(monthlyGoal)} {'\u20BD'}
                                        </span>
                                        <span className="font-medium">{goalPercentage}%</span>
                                    </div>
                                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full transition-all duration-700",
                                                goalPercentage >= 100 ? "bg-emerald-500" : goalPercentage >= 50 ? "bg-primary" : "bg-amber-500"
                                            )}
                                            style={{ width: `${goalPercentage}%` }}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Period Selector */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 }}
                    className="flex flex-col sm:flex-row sm:items-center gap-4"
                >
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">Период:</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Year Selector */}
                        <Select
                            value={String(selectedYear)}
                            onValueChange={(year) => {
                                router.get(route('finance.index'), { month: selectedMonth, year: Number(year) }, { preserveState: true, preserveScroll: true });
                            }}
                        >
                            <SelectTrigger className="w-[100px]">
                                <SelectValue placeholder="Год" />
                            </SelectTrigger>
                            <SelectContent>
                                {[...new Set(availableMonths.map(m => m.year))].map((year) => (
                                    <SelectItem key={year} value={String(year)}>
                                        {year}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Month Selector */}
                        <Select
                            value={String(selectedMonth)}
                            onValueChange={(month) => {
                                router.get(route('finance.index'), { month: Number(month), year: selectedYear }, { preserveState: true, preserveScroll: true });
                            }}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue placeholder="Месяц" />
                            </SelectTrigger>
                            <SelectContent>
                                {[
                                    { value: '1', label: 'Январь' },
                                    { value: '2', label: 'Февраль' },
                                    { value: '3', label: 'Март' },
                                    { value: '4', label: 'Апрель' },
                                    { value: '5', label: 'Май' },
                                    { value: '6', label: 'Июнь' },
                                    { value: '7', label: 'Июль' },
                                    { value: '8', label: 'Август' },
                                    { value: '9', label: 'Сентябрь' },
                                    { value: '10', label: 'Октябрь' },
                                    { value: '11', label: 'Ноябрь' },
                                    { value: '12', label: 'Декабрь' },
                                ].map((m) => (
                                    <SelectItem key={m.value} value={m.value}>
                                        {m.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </motion.div>

                {/* Tabs: Month / Year */}
                <Tabs defaultValue="month" className="w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.1 }}
                    >
                        <TabsList className="grid w-full max-w-xs grid-cols-2 mx-auto mb-1">
                            <TabsTrigger value="month">Выбранный месяц</TabsTrigger>
                            <TabsTrigger value="year">Весь {selectedYear} год</TabsTrigger>
                        </TabsList>
                    </motion.div>

                    {/* Monthly Stats */}
                    <TabsContent value="month" className="space-y-6 mt-4">
                        {/* Category Breakdown */}
                        {categoryBreakdown.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.08 }}
                            >
                                <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                                    <CardContent className="p-5">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="rounded-full bg-primary/10 p-2 text-primary ring-1 ring-primary/20">
                                                <Receipt className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">Разбивка по категориям</p>
                                                <p className="text-xs text-muted-foreground">За выбранный месяц</p>
                                            </div>
                                        </div>
                                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                            {categoryBreakdown
                                                .filter(c => c.type === 'income')
                                                .slice(0, 6)
                                                .map((cat, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{cat.category}</p>
                                                            <p className="text-xs text-muted-foreground">{cat.count} операций</p>
                                                        </div>
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                            +{formatCurrency(cat.total)} ₽
                                                        </span>
                                                    </div>
                                                ))}
                                            {categoryBreakdown
                                                .filter(c => c.type === 'expense')
                                                .slice(0, 6)
                                                .map((cat, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between p-3 rounded-xl bg-rose-500/5 border border-rose-500/10"
                                                    >
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-medium truncate">{cat.category}</p>
                                                            <p className="text-xs text-muted-foreground">{cat.count} операций</p>
                                                        </div>
                                                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                                                            -{formatCurrency(cat.total)} ₽
                                                        </span>
                                                    </div>
                                                ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Main Stats */}
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            {([
                                { title: 'Доходы', value: stats.income, prefix: '+', color: 'emerald', icon: <TrendingUp className="h-4 w-4" />, delay: 0.1, isCurrency: true },
                                { title: 'Расходы', value: stats.expense, prefix: '-', color: 'rose', icon: <TrendingDown className="h-4 w-4" />, delay: 0.15, isCurrency: true },
                                { title: 'Прибыль', value: stats.profit, prefix: '', color: stats.profit >= 0 ? 'primary' : 'rose', icon: <Wallet className="h-4 w-4" />, delay: 0.2, isCurrency: true },
                                { title: 'Записей', value: stats.appointments_count, prefix: '', color: 'blue', icon: <CalendarIcon className="h-4 w-4" />, delay: 0.25, isCurrency: false },
                            ] as const).map((card) => (
                                <motion.div
                                    key={card.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: card.delay }}
                                >
                                    <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl dark:bg-card/50 dark:backdrop-blur-sm relative h-full">
                                        <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl pointer-events-none", `bg-${card.color}-500/5`)} />
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between pb-2">
                                                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                                <div className={cn(
                                                    "rounded-full p-2 ring-1",
                                                    card.color === 'emerald' && "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
                                                    card.color === 'rose' && "bg-rose-500/10 text-rose-500 ring-rose-500/20",
                                                    card.color === 'blue' && "bg-blue-500/10 text-blue-500 ring-blue-500/20",
                                                    card.color === 'primary' && "bg-primary/10 text-primary ring-primary/20",
                                                )}>
                                                    {card.icon}
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div className={cn(
                                                    "text-2xl font-bold tracking-tight",
                                                    card.color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
                                                    card.color === 'rose' && "text-rose-600 dark:text-rose-400",
                                                    card.color === 'blue' && "text-blue-600 dark:text-blue-400",
                                                    card.color === 'primary' && "text-foreground",
                                                )}>
                                                    {card.isCurrency === false
                                                        ? card.value
                                                        : `${card.prefix}${formatCurrency(card.value)} \u20BD`
                                                    }
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">за выбранный месяц</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>

                        {/* Payment Methods */}
                        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.3 }}
                            >
                                <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative h-full">
                                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-500/5 blur-3xl pointer-events-none" />
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between pb-2">
                                            <p className="text-sm font-medium text-muted-foreground">Доход по карте</p>
                                            <div className="rounded-full bg-violet-500/10 p-2 text-violet-500 ring-1 ring-violet-500/20">
                                                <CreditCard className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <div className="text-2xl font-bold tracking-tight text-violet-600 dark:text-violet-400">
                                                {formatCurrency(stats.income_card)} {'\u20BD'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-violet-500 rounded-full transition-all duration-700"
                                                        style={{ width: `${cardPercent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground tabular-nums w-9 text-right">{cardPercent}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: 0.35 }}
                            >
                                <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative h-full">
                                    <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-amber-500/5 blur-3xl pointer-events-none" />
                                    <CardContent className="p-5">
                                        <div className="flex items-center justify-between pb-2">
                                            <p className="text-sm font-medium text-muted-foreground">Доход наличными</p>
                                            <div className="rounded-full bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
                                                <Banknote className="h-4 w-4" />
                                            </div>
                                        </div>
                                        <div className="mt-2">
                                            <div className="text-2xl font-bold tracking-tight text-amber-600 dark:text-amber-400">
                                                {formatCurrency(stats.income_cash)} {'\u20BD'}
                                            </div>
                                            <div className="flex items-center gap-2 mt-2">
                                                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-amber-500 rounded-full transition-all duration-700"
                                                        style={{ width: `${cashPercent}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-medium text-muted-foreground tabular-nums w-9 text-right">{cashPercent}%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        </div>
                    </TabsContent>

                    {/* Yearly Stats */}
                    <TabsContent value="year" className="space-y-6 mt-4">
                        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                            {([
                                { title: 'Доходы', value: stats.year_income, prefix: '+', color: 'emerald', icon: <TrendingUp className="h-4 w-4" />, delay: 0.1, isCurrency: true },
                                { title: 'Расходы', value: stats.year_expense, prefix: '-', color: 'rose', icon: <TrendingDown className="h-4 w-4" />, delay: 0.15, isCurrency: true },
                                { title: 'Прибыль', value: stats.year_profit, prefix: '', color: stats.year_profit >= 0 ? 'primary' : 'rose', icon: <Wallet className="h-4 w-4" />, delay: 0.2, isCurrency: true },
                                { title: 'Записей', value: stats.year_appointments_count, prefix: '', color: 'blue', icon: <CalendarIcon className="h-4 w-4" />, delay: 0.25, isCurrency: false },
                            ] as const).map((card) => (
                                <motion.div
                                    key={card.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: card.delay }}
                                >
                                    <Card className="overflow-hidden border-none shadow-lg transition-all hover:shadow-xl dark:bg-card/50 dark:backdrop-blur-sm relative h-full">
                                        <div className={cn("absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl pointer-events-none", `bg-${card.color}-500/5`)} />
                                        <CardContent className="p-5">
                                            <div className="flex items-center justify-between pb-2">
                                                <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                                                <div className={cn(
                                                    "rounded-full p-2 ring-1",
                                                    card.color === 'emerald' && "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20",
                                                    card.color === 'rose' && "bg-rose-500/10 text-rose-500 ring-rose-500/20",
                                                    card.color === 'blue' && "bg-blue-500/10 text-blue-500 ring-blue-500/20",
                                                    card.color === 'primary' && "bg-primary/10 text-primary ring-primary/20",
                                                )}>
                                                    {card.icon}
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div className={cn(
                                                    "text-2xl font-bold tracking-tight",
                                                    card.color === 'emerald' && "text-emerald-600 dark:text-emerald-400",
                                                    card.color === 'rose' && "text-rose-600 dark:text-rose-400",
                                                    card.color === 'blue' && "text-blue-600 dark:text-blue-400",
                                                    card.color === 'primary' && "text-foreground",
                                                )}>
                                                    {card.isCurrency === false
                                                        ? card.value
                                                        : `${card.prefix}${formatCurrency(card.value)} ₽`
                                                    }
                                                </div>
                                                <p className="text-xs text-muted-foreground mt-1">за {selectedYear} год</p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Top Clients */}
                {topClients.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4 }}
                    >
                        <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                            <div className="absolute -right-8 -top-8 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

                            <CardHeader className="pb-3">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-amber-500/10 p-2 text-amber-500 ring-1 ring-amber-500/20">
                                        <Award className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold">Топ-10 клиентов</CardTitle>
                                        <CardDescription className="text-xs">По выручке за все время</CardDescription>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                                <div className="space-y-2">
                                    {topClients.map((item, index) => {
                                        const maxRevenue = topClients[0]?.total_revenue || 1;
                                        const widthPercent = Math.max(8, (Number(item.total_revenue) / Number(maxRevenue)) * 100);

                                        return (
                                            <div
                                                key={item.client.id}
                                                className="group flex items-center gap-3 p-3 rounded-xl hover:bg-accent/50 transition-colors relative"
                                            >
                                                {/* Rank */}
                                                <div className={cn(
                                                    "flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs flex-shrink-0",
                                                    index === 0 && "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/20",
                                                    index === 1 && "bg-slate-400/15 text-slate-500 dark:text-slate-400 ring-1 ring-slate-400/20",
                                                    index === 2 && "bg-orange-500/15 text-orange-600 dark:text-orange-400 ring-1 ring-orange-500/20",
                                                    index > 2 && "bg-muted text-muted-foreground"
                                                )}>
                                                    {index + 1}
                                                </div>

                                                {/* Info + Bar */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between gap-2 mb-1.5">
                                                        <div className="min-w-0">
                                                            <span className="text-sm font-medium truncate block">{item.client.name}</span>
                                                            <span className="text-xs text-muted-foreground">
                                                                {item.transactions_count} {item.transactions_count === 1 ? 'операция' : item.transactions_count < 5 ? 'операции' : 'операций'}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                                            {formatCurrency(item.total_revenue)} {'\u20BD'}
                                                        </span>
                                                    </div>
                                                    {/* Revenue bar */}
                                                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                                                        <div
                                                            className={cn(
                                                                "h-full rounded-full transition-all duration-700",
                                                                index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-400" : index === 2 ? "bg-orange-500" : "bg-primary/40"
                                                            )}
                                                            style={{ width: `${widthPercent}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Transactions Table */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.45 }}
                >
                    <Card className="border-none shadow-lg dark:bg-card/50 dark:backdrop-blur-sm overflow-hidden relative">
                        <div className="absolute -left-8 -bottom-8 h-32 w-32 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

                        <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                                <div className="rounded-full bg-primary/10 p-2 text-primary ring-1 ring-primary/20">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">История операций</CardTitle>
                                    <CardDescription className="text-xs">Список всех транзакций</CardDescription>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <ResponsiveTable>
                                <ResponsiveTableHeader>
                                    <ResponsiveTableRow>
                                        <ResponsiveTableHead>Дата</ResponsiveTableHead>
                                        <ResponsiveTableHead>Категория</ResponsiveTableHead>
                                        <ResponsiveTableHead>Описание</ResponsiveTableHead>
                                        <ResponsiveTableHead>Клиент</ResponsiveTableHead>
                                        <ResponsiveTableHead className="text-right">Сумма</ResponsiveTableHead>
                                        <ResponsiveTableHead className="w-[50px]"></ResponsiveTableHead>
                                    </ResponsiveTableRow>
                                </ResponsiveTableHeader>
                                <ResponsiveTableBody>
                                    {transactions.data.length === 0 ? (
                                        <ResponsiveTableRow>
                                            <ResponsiveTableCell colSpan={6} className="text-center py-12">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="rounded-full bg-muted/50 p-3">
                                                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                                                    </div>
                                                    <p className="text-sm font-medium text-muted-foreground">Операций пока нет</p>
                                                    <p className="text-xs text-muted-foreground/70">Добавьте первую операцию для начала учета</p>
                                                </div>
                                            </ResponsiveTableCell>
                                        </ResponsiveTableRow>
                                    ) : (
                                        transactions.data.map((transaction) => (
                                            <ResponsiveTableRow
                                                key={transaction.id}
                                                mobileCardContent={
                                                    <div className="space-y-3">
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                                    <span className="text-sm">
                                                                        {format(new Date(transaction.date), 'd MMM yyyy', { locale: ru })}
                                                                    </span>
                                                                </div>
                                                                <span className={cn(
                                                                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                                                    transaction.type === 'income'
                                                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20"
                                                                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20"
                                                                )}>
                                                                    {transaction.type === 'income'
                                                                        ? <ArrowUpRight className="h-3 w-3" />
                                                                        : <ArrowDownRight className="h-3 w-3" />
                                                                    }
                                                                    {transaction.category}
                                                                </span>
                                                            </div>
                                                            <div className={cn(
                                                                "text-lg font-semibold tabular-nums",
                                                                transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                            )}>
                                                                {transaction.type === 'income' ? '+' : '-'}
                                                                {formatCurrency(transaction.amount)} {'\u20BD'}
                                                            </div>
                                                        </div>

                                                        {transaction.description && (
                                                            <div className="text-sm text-muted-foreground">
                                                                {transaction.description}
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-2 border-t">
                                                            {transaction.client?.name && (
                                                                <div className="text-sm font-medium">{transaction.client.name}</div>
                                                            )}
                                                            <div className="flex gap-1 ml-auto">
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(transaction)}>
                                                                    <Pencil className="h-4 w-4" />
                                                                </Button>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(transaction)}>
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                }
                                            >
                                                <ResponsiveTableCell>
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                                                        {format(new Date(transaction.date), 'd MMM yyyy', { locale: ru })}
                                                    </div>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    <span className={cn(
                                                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
                                                        transaction.type === 'income'
                                                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 ring-emerald-500/20"
                                                            : "bg-rose-500/10 text-rose-700 dark:text-rose-400 ring-rose-500/20"
                                                    )}>
                                                        {transaction.type === 'income'
                                                            ? <ArrowUpRight className="h-3 w-3" />
                                                            : <ArrowDownRight className="h-3 w-3" />
                                                        }
                                                        {transaction.category}
                                                    </span>
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell className="text-muted-foreground text-sm">
                                                    {transaction.description || '-'}
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell className="text-sm">
                                                    {transaction.client?.name || '-'}
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell className={cn(
                                                    "text-right font-semibold tabular-nums",
                                                    transaction.type === 'income' ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                                                )}>
                                                    {transaction.type === 'income' ? '+' : '-'}
                                                    {formatCurrency(transaction.amount)} {'\u20BD'}
                                                </ResponsiveTableCell>
                                                <ResponsiveTableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => handleEdit(transaction)}>
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(transaction)}>
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </ResponsiveTableCell>
                                            </ResponsiveTableRow>
                                        ))
                                    )}
                                </ResponsiveTableBody>
                            </ResponsiveTable>
                        </CardContent>

                        {/* Pagination */}
                        {transactions.last_page > 1 && (
                            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t">
                                <p className="text-sm text-muted-foreground">
                                    Показано {transactions.from} - {transactions.to} из {transactions.total} операций
                                </p>
                                <div className="flex items-center gap-1">
                                    {transactions.links.map((link, idx) => {
                                        // Skip prev/next text links, use actual buttons
                                        if (idx === 0) {
                                            return (
                                                <Button
                                                    key="prev"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                    className="h-8 px-2"
                                                >
                                                    <ChevronLeft className="h-4 w-4" />
                                                </Button>
                                            );
                                        }
                                        if (idx === transactions.links.length - 1) {
                                            return (
                                                <Button
                                                    key="next"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={!link.url}
                                                    onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                    className="h-8 px-2"
                                                >
                                                    <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            );
                                        }
                                        return (
                                            <Button
                                                key={idx}
                                                variant={link.active ? "default" : "outline"}
                                                size="sm"
                                                disabled={!link.url}
                                                onClick={() => link.url && router.get(link.url, {}, { preserveState: true, preserveScroll: true })}
                                                className="h-8 w-8 p-0"
                                            >
                                                {link.label.replace('&laquo;', '').replace('&raquo;', '')}
                                            </Button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </Card>
                </motion.div>

                {/* Transaction Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>{editingTransaction ? 'Редактировать операцию' : 'Новая операция'}</DialogTitle>
                            <DialogDescription>
                                {editingTransaction ? 'Измените данные операции.' : 'Добавьте доход или расход.'}
                            </DialogDescription>
                        </DialogHeader>
                        <form id="transaction-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="type">Тип</Label>
                                    <Select
                                        onValueChange={(value) => form.setValue('type', value as 'income' | 'expense')}
                                        defaultValue={form.getValues('type')}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Выберите тип" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="income">Доход</SelectItem>
                                            <SelectItem value="expense">Расход</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="date">Дата</Label>
                                    <Input id="date" type="date" {...form.register('date')} />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="amount">Сумма ({'\u20BD'})</Label>
                                <Input id="amount" type="number" {...form.register('amount')} />
                                {form.formState.errors.amount && (
                                    <p className="text-sm text-destructive">{form.formState.errors.amount.message}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="category">Категория</Label>
                                <Input id="category" {...form.register('category')} placeholder="Например: Стрижка, Аренда, Расходники" />
                                {form.formState.errors.category && (
                                    <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
                                )}
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="client">Клиент (опционально)</Label>
                                <Select
                                    onValueChange={(value) => form.setValue('client_id', value)}
                                    defaultValue={form.getValues('client_id')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Выберите клиента" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="none">Не выбран</SelectItem>
                                        {clients.map((client) => (
                                            <SelectItem key={client.id} value={String(client.id)}>
                                                {client.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="description">Описание</Label>
                                <Input id="description" {...form.register('description')} placeholder="Комментарий..." />
                            </div>
                        </form>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => handleDialogClose(false)}>Отмена</Button>
                            <Button type="submit" form="transaction-form" disabled={form.formState.isSubmitting}>
                                {editingTransaction ? 'Сохранить' : 'Добавить'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                <ConfirmDialog
                    open={deleteConfirm.open}
                    onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
                    onConfirm={confirmDelete}
                    title="Удаление операции"
                    itemName={deleteConfirm.name}
                />

                {/* Goal Dialog */}
                <Dialog open={isGoalDialogOpen} onOpenChange={setIsGoalDialogOpen}>
                    <DialogContent className="sm:max-w-[400px]">
                        <DialogHeader>
                            <DialogTitle>Цель на месяц</DialogTitle>
                            <DialogDescription>
                                Укажите сумму дохода, которую хотите достичь за месяц.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-2 py-4">
                            <Label htmlFor="monthly_goal">Сумма ({'\u20BD'})</Label>
                            <Input
                                id="monthly_goal"
                                type="number"
                                min="0"
                                step="1000"
                                value={goalValue}
                                onChange={(e) => setGoalValue(e.target.value)}
                                placeholder="100000"
                            />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsGoalDialogOpen(false)}>Отмена</Button>
                            <Button onClick={handleGoalSubmit} disabled={goalSubmitting}>
                                Сохранить
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppPageLayout>
    );
}
