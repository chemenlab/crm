import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { ArrowLeft } from 'lucide-react';

interface Plan {
    id: number;
    name: string;
}

export default function Create({ plans }: { plans: Plan[] }) {
    const { data, setData, post, processing, errors } = useForm({
        code: '',
        type: 'percentage',
        value: '',
        plan_id: '',
        max_uses: '',
        valid_from: '',
        valid_until: '',
        first_payment_only: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.promo-codes.store'));
    };

    return (
        <AdminLayout>
            <Head title="Создать промокод" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.promo-codes.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Создать промокод</h1>
                        <p className="text-muted-foreground">Заполните форму для создания нового промокода</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <Card>
                        <CardHeader>
                            <CardTitle>Информация о промокоде</CardTitle>
                            <CardDescription>Укажите параметры промокода</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Код промокода *</Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.toUpperCase())}
                                        placeholder="SUMMER2025"
                                        required
                                    />
                                    {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="type">Тип скидки *</Label>
                                    <Select value={data.type} onValueChange={(value) => setData('type', value)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Процент</SelectItem>
                                            <SelectItem value="fixed">Фиксированная сумма</SelectItem>
                                            <SelectItem value="trial_extension">Продление пробного периода</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="value">
                                        Значение *{' '}
                                        {data.type === 'percentage'
                                            ? '(%)'
                                            : data.type === 'fixed'
                                            ? '(₽)'
                                            : '(дней)'}
                                    </Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        value={data.value}
                                        onChange={(e) => setData('value', e.target.value)}
                                        placeholder="10"
                                        required
                                    />
                                    {errors.value && <p className="text-sm text-destructive">{errors.value}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">Тарифный план (необязательно)</Label>
                                    <Select value={data.plan_id || undefined} onValueChange={(value) => setData('plan_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Все тарифы" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                                    {plan.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.plan_id && <p className="text-sm text-destructive">{errors.plan_id}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="max_uses">Максимум использований (необязательно)</Label>
                                    <Input
                                        id="max_uses"
                                        type="number"
                                        value={data.max_uses}
                                        onChange={(e) => setData('max_uses', e.target.value)}
                                        placeholder="Без ограничений"
                                    />
                                    {errors.max_uses && <p className="text-sm text-destructive">{errors.max_uses}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="valid_from">Действует с (необязательно)</Label>
                                    <Input
                                        id="valid_from"
                                        type="date"
                                        value={data.valid_from}
                                        onChange={(e) => setData('valid_from', e.target.value)}
                                    />
                                    {errors.valid_from && <p className="text-sm text-destructive">{errors.valid_from}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="valid_until">Действует до (необязательно)</Label>
                                    <Input
                                        id="valid_until"
                                        type="date"
                                        value={data.valid_until}
                                        onChange={(e) => setData('valid_until', e.target.value)}
                                    />
                                    {errors.valid_until && <p className="text-sm text-destructive">{errors.valid_until}</p>}
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="first_payment_only"
                                        checked={data.first_payment_only}
                                        onCheckedChange={(checked) => setData('first_payment_only', checked)}
                                    />
                                    <Label htmlFor="first_payment_only">Только для первого платежа</Label>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    Создать промокод
                                </Button>
                                <Link href={route('admin.promo-codes.index')}>
                                    <Button type="button" variant="outline">
                                        Отмена
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                </form>
            </div>
        </AdminLayout>
    );
}
