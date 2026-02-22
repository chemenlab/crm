import { Head, Link, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Switch } from '@/Components/ui/switch';
import { ArrowLeft } from 'lucide-react';

interface User {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
}

export default function Edit({ user }: { user: User }) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        password: '',
        password_confirmation: '',
        email_verified: !!user.email_verified_at,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.users.update', user.id));
    };

    return (
        <AdminLayout>
            <Head title={`Редактирование: ${user.name}`} />

            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href={route('admin.users.show', user.id)}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold">Редактирование пользователя</h1>
                        <p className="text-muted-foreground">{user.email}</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Информация о пользователе</CardTitle>
                        <CardDescription>
                            Обновите данные пользователя
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Имя</Label>
                                <Input
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    required
                                />
                                {errors.name && (
                                    <p className="text-sm text-destructive">{errors.name}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="email_verified"
                                    checked={data.email_verified}
                                    onCheckedChange={(checked) => setData('email_verified', checked)}
                                />
                                <Label htmlFor="email_verified">Email подтвержден</Label>
                            </div>

                            <div className="border-t pt-4">
                                <h3 className="text-lg font-medium mb-4">Изменить пароль</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Оставьте поля пустыми, если не хотите менять пароль
                                </p>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="password">Новый пароль</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={data.password}
                                            onChange={(e) => setData('password', e.target.value)}
                                            placeholder="Минимум 8 символов"
                                        />
                                        {errors.password && (
                                            <p className="text-sm text-destructive">{errors.password}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="password_confirmation">Подтверждение пароля</Label>
                                        <Input
                                            id="password_confirmation"
                                            type="password"
                                            value={data.password_confirmation}
                                            onChange={(e) => setData('password_confirmation', e.target.value)}
                                            placeholder="Повторите пароль"
                                        />
                                        {errors.password_confirmation && (
                                            <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Сохранение...' : 'Сохранить изменения'}
                                </Button>
                                <Link href={route('admin.users.show', user.id)}>
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
