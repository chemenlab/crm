import { FormEvent, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

export default function AdminLogin() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        post(route('admin.login.post'));
    };

    return (
        <>
            <Head title="Вход в админ-панель" />
            
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 bg-blue-500/10 rounded-full">
                                <Shield className="h-8 w-8 text-blue-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold text-white">
                            Панель администратора
                        </CardTitle>
                        <CardDescription className="text-slate-400">
                            Введите учетные данные для входа
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {errors.email && (
                            <Alert variant="destructive" className="mb-4">
                                <AlertDescription>{errors.email}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={submit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-slate-200">
                                    Email
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    required
                                    autoFocus
                                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                                    placeholder="admin@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-slate-200">
                                    Пароль
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={data.password}
                                    onChange={(e) => setData('password', e.target.value)}
                                    required
                                    className="bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                                    placeholder="••••••••"
                                />
                            </div>

                            <div className="flex items-center space-x-2">
                                <input
                                    id="remember"
                                    type="checkbox"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="rounded border-slate-700 bg-slate-900/50 text-blue-500 focus:ring-blue-500"
                                />
                                <Label htmlFor="remember" className="text-sm text-slate-300 cursor-pointer">
                                    Запомнить меня
                                </Label>
                            </div>

                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                                {processing ? 'Вход...' : 'Войти'}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-xs text-slate-500">
                                Защищенная зона. Все действия логируются.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
