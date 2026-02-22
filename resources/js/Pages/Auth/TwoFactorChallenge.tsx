import { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Shield, Key } from 'lucide-react';

interface Props {
    attemptsLeft: number;
}

export default function TwoFactorChallenge({ attemptsLeft }: Props) {
    const [useRecovery, setUseRecovery] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        code: '',
        recovery_code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (useRecovery) {
            post(route('two-factor.recovery'));
        } else {
            post(route('two-factor.verify'));
        }
    };

    return (
        <>
            <Head title="Двухфакторная аутентификация" />

            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1">
                        <div className="flex items-center justify-center mb-4">
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Shield className="h-8 w-8 text-blue-600" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl text-center">
                            Двухфакторная аутентификация
                        </CardTitle>
                        <CardDescription className="text-center">
                            {useRecovery
                                ? 'Введите один из ваших кодов восстановления'
                                : 'Введите код из приложения-аутентификатора'}
                        </CardDescription>
                    </CardHeader>

                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {!useRecovery ? (
                                <div className="space-y-2">
                                    <Label htmlFor="code">Код аутентификации</Label>
                                    <Input
                                        id="code"
                                        type="text"
                                        value={data.code}
                                        onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        placeholder="000000"
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest"
                                        autoFocus
                                        autoComplete="one-time-code"
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-600">{errors.code}</p>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <Label htmlFor="recovery_code">Код восстановления</Label>
                                    <Input
                                        id="recovery_code"
                                        type="text"
                                        value={data.recovery_code}
                                        onChange={(e) => setData('recovery_code', e.target.value.toUpperCase())}
                                        placeholder="XXXX-XXXX"
                                        className="text-center text-xl tracking-wider"
                                        autoFocus
                                    />
                                    {errors.recovery_code && (
                                        <p className="text-sm text-red-600">{errors.recovery_code}</p>
                                    )}
                                </div>
                            )}

                            {attemptsLeft < 5 && attemptsLeft > 0 && (
                                <Alert>
                                    <AlertDescription>
                                        Осталось попыток: {attemptsLeft}
                                    </AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={processing || (!useRecovery && data.code.length !== 6) || (useRecovery && !data.recovery_code)}
                            >
                                {processing ? 'Проверка...' : 'Войти'}
                            </Button>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setUseRecovery(!useRecovery);
                                        setData(useRecovery ? 'recovery_code' : 'code', '');
                                    }}
                                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center justify-center gap-2 mx-auto"
                                >
                                    <Key className="h-4 w-4" />
                                    {useRecovery
                                        ? 'Использовать код из приложения'
                                        : 'Использовать код восстановления'}
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
