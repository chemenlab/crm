import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from '@/Components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { ArrowLeft } from 'lucide-react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        description: '',
        price: '0',
        billing_period: 'monthly',
        trial_days: '0',
        max_appointments: '100',
        max_clients: '100',
        max_services: '10',
        max_portfolio_images: '20',
        max_tags: '10',
        max_notifications_per_month: '1000',
        has_analytics: false,
        has_priority_support: false,
        has_custom_branding: false,
        is_active: true,
        sort_order: '0',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.plans.store'));
    };

    return (
        <AdminLayout>
            <Head title="Создать тарифный план" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.plans.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Создать тарифный план</h1>
                        <p className="text-muted-foreground">
                            Заполните информацию о новом тарифе
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Основная информация */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Основная информация</CardTitle>
                            <CardDescription>
                                Название, описание и стоимость тарифа
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="name">Название тарифа *</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    placeholder="Например: Базовый, Профессиональный"
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive mt-1">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="description">Описание</Label>
                                <Textarea
                                    id="description"
                                    value={data.description}
                                    onChange={(e) => setData('description', e.target.value)}
                                    placeholder="Краткое описание тарифа"
                                    rows={3}
                                />
                                {errors.description && (
                                    <p className="text-sm text-destructive mt-1">
                                        {errors.description}
                                    </p>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-3">
                                <div>
                                    <Label htmlFor="price">Цена (₽) *</Label>
                                    <Input
                                        id="price"
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={data.price}
                                        onChange={(e) => setData('price', e.target.value)}
                                    />
                                    {errors.price && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.price}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="billing_period">Период оплаты *</Label>
                                    <Select
                                        value={data.billing_period}
                                        onValueChange={(value) =>
                                            setData('billing_period', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="monthly">Месяц</SelectItem>
                                            <SelectItem value="yearly">Год</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.billing_period && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.billing_period}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="trial_days">Пробный период (дней)</Label>
                                    <Input
                                        id="trial_days"
                                        type="number"
                                        min="0"
                                        max="365"
                                        value={data.trial_days}
                                        onChange={(e) => setData('trial_days', e.target.value)}
                                    />
                                    {errors.trial_days && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.trial_days}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Лимиты */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Лимиты</CardTitle>
                            <CardDescription>
                                Укажите -1 для безлимитного доступа
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <Label htmlFor="max_appointments">Записи в месяц *</Label>
                                    <Input
                                        id="max_appointments"
                                        type="number"
                                        min="-1"
                                        value={data.max_appointments}
                                        onChange={(e) =>
                                            setData('max_appointments', e.target.value)
                                        }
                                    />
                                    {errors.max_appointments && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.max_appointments}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="max_clients">Клиенты *</Label>
                                    <Input
                                        id="max_clients"
                                        type="number"
                                        min="-1"
                                        value={data.max_clients}
                                        onChange={(e) => setData('max_clients', e.target.value)}
                                    />
                                    {errors.max_clients && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.max_clients}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="max_services">Услуги *</Label>
                                    <Input
                                        id="max_services"
                                        type="number"
                                        min="-1"
                                        value={data.max_services}
                                        onChange={(e) => setData('max_services', e.target.value)}
                                    />
                                    {errors.max_services && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.max_services}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="max_portfolio_images">
                                        Изображения портфолио *
                                    </Label>
                                    <Input
                                        id="max_portfolio_images"
                                        type="number"
                                        min="-1"
                                        value={data.max_portfolio_images}
                                        onChange={(e) =>
                                            setData('max_portfolio_images', e.target.value)
                                        }
                                    />
                                    {errors.max_portfolio_images && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.max_portfolio_images}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="max_tags">Теги *</Label>
                                    <Input
                                        id="max_tags"
                                        type="number"
                                        min="-1"
                                        value={data.max_tags}
                                        onChange={(e) => setData('max_tags', e.target.value)}
                                    />
                                    {errors.max_tags && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.max_tags}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="max_notifications_per_month">
                                        Уведомления в месяц *
                                    </Label>
                                    <Input
                                        id="max_notifications_per_month"
                                        type="number"
                                        min="-1"
                                        value={data.max_notifications_per_month}
                                        onChange={(e) =>
                                            setData('max_notifications_per_month', e.target.value)
                                        }
                                    />
                                    {errors.max_notifications_per_month && (
                                        <p className="text-sm text-destructive mt-1">
                                            {errors.max_notifications_per_month}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Функции */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Дополнительные функции</CardTitle>
                            <CardDescription>
                                Включите дополнительные возможности для этого тарифа
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="has_analytics">Аналитика</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Доступ к расширенной аналитике
                                    </p>
                                </div>
                                <Switch
                                    id="has_analytics"
                                    checked={data.has_analytics}
                                    onCheckedChange={(checked) =>
                                        setData('has_analytics', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="has_priority_support">
                                        Приоритетная поддержка
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Быстрый ответ от службы поддержки
                                    </p>
                                </div>
                                <Switch
                                    id="has_priority_support"
                                    checked={data.has_priority_support}
                                    onCheckedChange={(checked) =>
                                        setData('has_priority_support', checked)
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="has_custom_branding">Кастомный брендинг</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Возможность настройки брендинга
                                    </p>
                                </div>
                                <Switch
                                    id="has_custom_branding"
                                    checked={data.has_custom_branding}
                                    onCheckedChange={(checked) =>
                                        setData('has_custom_branding', checked)
                                    }
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Настройки */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Настройки</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="is_active">Активен</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Тариф доступен для выбора пользователями
                                    </p>
                                </div>
                                <Switch
                                    id="is_active"
                                    checked={data.is_active}
                                    onCheckedChange={(checked) => setData('is_active', checked)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="sort_order">Порядок сортировки</Label>
                                <Input
                                    id="sort_order"
                                    type="number"
                                    min="0"
                                    value={data.sort_order}
                                    onChange={(e) => setData('sort_order', e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                    Меньшее значение = выше в списке
                                </p>
                                {errors.sort_order && (
                                    <p className="text-sm text-destructive mt-1">
                                        {errors.sort_order}
                                    </p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Кнопки */}
                    <div className="flex gap-4">
                        <Button type="submit" disabled={processing}>
                            Создать тариф
                        </Button>
                        <Link href={route('admin.plans.index')}>
                            <Button type="button" variant="outline">
                                Отмена
                            </Button>
                        </Link>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
