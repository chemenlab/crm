import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

interface Plan {
    id: number;
    name: string;
    price: number;
}

interface Subscription {
    id: number;
    status: string;
    subscription_plan_id: number;
    current_period_end: string;
    auto_renew: boolean;
    user: {
        name: string;
        email: string;
    };
    plan: {
        name: string;
    };
}

export default function Edit({ subscription, plans }: { subscription: Subscription; plans: Plan[] }) {
    const { data, setData, put, processing, errors } = useForm({
        subscription_plan_id: subscription.subscription_plan_id.toString(),
        status: subscription.status,
        extend_days: '0',
        auto_renew: subscription.auto_renew,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.subscriptions.update', subscription.id));
    };

    return (
        <AdminLayout>
            <Head title={`Редактирование подписки #${subscription.id}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.subscriptions.show', subscription.id)}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Редактирование подписки</h1>
                        <p className="text-muted-foreground">
                            {subscription.user.name} - {subscription.plan.name}
                        </p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Параметры подписки</CardTitle>
                        <CardDescription>
                            Измените тариф, статус или продлите подписку
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Пользователь</Label>
                                <Input
                                    value={`${subscription.user.name} (${subscription.user.email})`}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subscription_plan_id">Тарифный план</Label>
                                <Select
                                    value={data.subscription_plan_id}
                                    onValueChange={(value) => setData('subscription_plan_id', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {plans.map((plan) => (
                                            <SelectItem key={plan.id} value={plan.id.toString()}>
                                                {plan.name} - {plan.price}₽/мес
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.subscription_plan_id && (
                                    <p className="text-sm text-destructive">{errors.subscription_plan_id}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Статус</Label>
                                <Select
                                    value={data.status}
                                    onValueChange={(value) => setData('status', value)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="active">Активна</SelectItem>
                                        <SelectItem value="trial">Пробная</SelectItem>
                                        <SelectItem value="cancelled">Отменена</SelectItem>
                                        <SelectItem value="expired">Истекла</SelectItem>
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-destructive">{errors.status}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Текущий период заканчивается</Label>
                                <Input
                                    value={format(new Date(subscription.current_period_end), 'dd.MM.yyyy')}
                                    disabled
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="extend_days">Продлить на (дней)</Label>
                                <Input
                                    id="extend_days"
                                    type="number"
                                    min="0"
                                    max="365"
                                    value={data.extend_days}
                                    onChange={(e) => setData('extend_days', e.target.value)}
                                    placeholder="0"
                                />
                                <p className="text-sm text-muted-foreground">
                                    Оставьте 0, чтобы не продлевать
                                </p>
                                {errors.extend_days && (
                                    <p className="text-sm text-destructive">{errors.extend_days}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="auto_renew"
                                    checked={data.auto_renew}
                                    onCheckedChange={(checked) => setData('auto_renew', checked)}
                                />
                                <Label htmlFor="auto_renew">Автоматическое продление</Label>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Сохранение...' : 'Сохранить изменения'}
                                </Button>
                                <Link href={route('admin.subscriptions.show', subscription.id)}>
                                    <Button type="button" variant="outline">
                                        Отмена
                                    </Button>
                                </Link>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
