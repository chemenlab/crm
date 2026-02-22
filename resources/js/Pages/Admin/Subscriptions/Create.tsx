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
    price: number;
}

interface User {
    id: number;
    name: string;
    email: string;
    has_active_subscription?: boolean;
}

export default function Create({ plans, users }: { plans: Plan[]; users: User[] }) {
    const { data, setData, post, processing, errors } = useForm({
        user_id: '',
        subscription_plan_id: '',
        status: 'active',
        trial_days: '0',
        auto_renew: true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Form data:', data);
        console.log('Route:', route('admin.subscriptions.store'));
        
        // Проверка обязательных полей
        if (!data.user_id) {
            console.error('User not selected');
            return;
        }
        if (!data.subscription_plan_id) {
            console.error('Plan not selected');
            return;
        }
        
        post(route('admin.subscriptions.store'), {
            onSuccess: () => {
                console.log('Success!');
            },
            onError: (errors) => {
                console.log('Errors:', errors);
            },
        });
    };

    console.log('Plans:', plans);
    console.log('Users:', users);
    console.log('Current data:', data);
    console.log('Errors:', errors);

    return (
        <AdminLayout>
            <Head title="Создание подписки" />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.subscriptions.index')}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Создание подписки</h1>
                        <p className="text-muted-foreground">Создать подписку для пользователя</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Параметры подписки</CardTitle>
                        <CardDescription>
                            Выберите пользователя и тарифный план
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="user_id">Пользователь <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.user_id}
                                    onValueChange={(value) => setData('user_id', value)}
                                >
                                    <SelectTrigger className={!data.user_id && errors.user_id ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Выберите пользователя" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {users.map((user) => (
                                            <SelectItem 
                                                key={user.id} 
                                                value={user.id.toString()}
                                                disabled={user.has_active_subscription}
                                            >
                                                {user.name} ({user.email})
                                                {user.has_active_subscription && ' - Уже есть подписка'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.user_id && (
                                    <p className="text-sm text-destructive">{errors.user_id}</p>
                                )}
                                {!data.user_id && (
                                    <p className="text-sm text-muted-foreground">Выберите пользователя из списка</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="subscription_plan_id">Тарифный план <span className="text-destructive">*</span></Label>
                                <Select
                                    value={data.subscription_plan_id}
                                    onValueChange={(value) => setData('subscription_plan_id', value)}
                                >
                                    <SelectTrigger className={!data.subscription_plan_id && errors.subscription_plan_id ? 'border-destructive' : ''}>
                                        <SelectValue placeholder="Выберите тариф" />
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
                                {!data.subscription_plan_id && (
                                    <p className="text-sm text-muted-foreground">Выберите тарифный план</p>
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
                                    </SelectContent>
                                </Select>
                                {errors.status && (
                                    <p className="text-sm text-destructive">{errors.status}</p>
                                )}
                            </div>

                            {data.status === 'trial' && (
                                <div className="space-y-2">
                                    <Label htmlFor="trial_days">Пробный период (дней)</Label>
                                    <Input
                                        id="trial_days"
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={data.trial_days}
                                        onChange={(e) => setData('trial_days', e.target.value)}
                                        placeholder="7"
                                    />
                                    {errors.trial_days && (
                                        <p className="text-sm text-destructive">{errors.trial_days}</p>
                                    )}
                                </div>
                            )}

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
                                    {processing ? 'Создание...' : 'Создать подписку'}
                                </Button>
                                <Link href={route('admin.subscriptions.index')}>
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
