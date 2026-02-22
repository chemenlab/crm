import { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Shield, ShieldCheck, ShieldOff, Key, Download, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface TwoFactorData {
    enabled: boolean;
    enabledAt?: string;
    unusedRecoveryCodesCount: number;
}

interface Props {
    twoFactor: TwoFactorData;
}

export default function TwoFactorSettings({ twoFactor }: Props) {
    const [showSetupModal, setShowSetupModal] = useState(false);
    const [showDisableModal, setShowDisableModal] = useState(false);
    const [showRegenerateModal, setShowRegenerateModal] = useState(false);
    const [setupStep, setSetupStep] = useState<'qr' | 'verify' | 'codes'>('qr');
    const [qrCode, setQrCode] = useState<string>('');
    const [secret, setSecret] = useState<string>('');
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

    const { post, delete: destroy, processing, data, setData, reset } = useForm({
        code: '',
        password: '',
    });

    const handleEnable = () => {
        post(route('two-factor.enable'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const props = page.props as any;
                if (props.qrCode && props.secret) {
                    setQrCode(props.qrCode);
                    setSecret(props.secret);
                    setSetupStep('verify');
                    setShowSetupModal(true);
                }
            },
        });
    };

    const handleConfirm = () => {
        post(route('two-factor.confirm'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const props = page.props as any;
                if (props.recoveryCodes) {
                    setRecoveryCodes(props.recoveryCodes);
                    setSetupStep('codes');
                    toast.success('2FA успешно включен');
                }
            },
            onError: () => {
                toast.error('Неверный код');
            },
        });
    };

    const handleDisable = () => {
        destroy(route('two-factor.disable'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDisableModal(false);
                reset();
                toast.success('2FA отключен');
            },
            onError: () => {
                toast.error('Ошибка при отключении 2FA');
            },
        });
    };

    const handleRegenerate = () => {
        post(route('two-factor.recovery-codes'), {
            preserveScroll: true,
            onSuccess: (page: any) => {
                const props = page.props as any;
                if (props.recoveryCodes) {
                    setRecoveryCodes(props.recoveryCodes);
                    setShowRegenerateModal(false);
                    setShowSetupModal(true);
                    setSetupStep('codes');
                    toast.success('Коды восстановления обновлены');
                }
            },
            onError: () => {
                toast.error('Ошибка при генерации кодов');
            },
        });
    };

    const downloadRecoveryCodes = () => {
        const text = recoveryCodes.join('\n');
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'recovery-codes.txt';
        a.click();
        URL.revokeObjectURL(url);
    };

    const closeSetupModal = () => {
        setShowSetupModal(false);
        setSetupStep('qr');
        setQrCode('');
        setSecret('');
        setRecoveryCodes([]);
        reset();
    };

    return (
        <>
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="h-5 w-5 text-gray-600" />
                            <div>
                                <CardTitle>Двухфакторная аутентификация</CardTitle>
                                <CardDescription>
                                    Дополнительный уровень безопасности для вашего аккаунта
                                </CardDescription>
                            </div>
                        </div>
                        {twoFactor.enabled ? (
                            <Badge variant="default" className="bg-green-500">
                                <ShieldCheck className="h-3 w-3 mr-1" />
                                Включено
                            </Badge>
                        ) : (
                            <Badge variant="secondary">
                                <ShieldOff className="h-3 w-3 mr-1" />
                                Отключено
                            </Badge>
                        )}
                    </div>
                </CardHeader>

                <CardContent className="space-y-4">
                    {twoFactor.enabled ? (
                        <>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-600">
                                    Включено: {twoFactor.enabledAt}
                                </p>
                                <p className="text-gray-600">
                                    Неиспользованных кодов восстановления: {twoFactor.unusedRecoveryCodesCount}
                                </p>
                            </div>

                            {twoFactor.unusedRecoveryCodesCount < 3 && (
                                <Alert>
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription>
                                        У вас осталось мало кодов восстановления. Рекомендуем сгенерировать новые.
                                    </AlertDescription>
                                </Alert>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRegenerateModal(true)}
                                >
                                    <Key className="h-4 w-4 mr-2" />
                                    Обновить коды
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={() => setShowDisableModal(true)}
                                >
                                    Отключить 2FA
                                </Button>
                            </div>
                        </>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600">
                                После ввода пароля вам нужно будет ввести код из приложения-аутентификатора
                                (Google Authenticator, Authy, Microsoft Authenticator).
                            </p>
                            <Button onClick={handleEnable} disabled={processing}>
                                Включить 2FA
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Setup Modal */}
            <Dialog open={showSetupModal} onOpenChange={closeSetupModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {setupStep === 'qr' && 'Настройка 2FA'}
                            {setupStep === 'verify' && 'Подтверждение настройки'}
                            {setupStep === 'codes' && 'Коды восстановления'}
                        </DialogTitle>
                        <DialogDescription>
                            {setupStep === 'qr' && 'Отсканируйте QR код в приложении-аутентификаторе'}
                            {setupStep === 'verify' && 'Введите код из приложения для подтверждения'}
                            {setupStep === 'codes' && 'Сохраните эти коды в безопасном месте'}
                        </DialogDescription>
                    </DialogHeader>

                    {setupStep === 'verify' && (
                        <div className="space-y-4">
                            <div className="flex justify-center">
                                <img src={qrCode} alt="QR Code" className="w-48 h-48" />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500">
                                    Или введите код вручную:
                                </Label>
                                <code className="block p-2 bg-gray-100 rounded text-sm text-center break-all">
                                    {secret}
                                </code>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="code">Код подтверждения</Label>
                                <Input
                                    id="code"
                                    type="text"
                                    value={data.code}
                                    onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="text-center text-2xl tracking-widest"
                                />
                            </div>

                            <Button
                                onClick={handleConfirm}
                                disabled={processing || data.code.length !== 6}
                                className="w-full"
                            >
                                Подтвердить
                            </Button>
                        </div>
                    )}

                    {setupStep === 'codes' && (
                        <div className="space-y-4">
                            <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                    Сохраните эти коды! Они понадобятся для восстановления доступа, если вы потеряете устройство.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-2 gap-2">
                                {recoveryCodes.map((code, index) => (
                                    <code key={index} className="p-2 bg-gray-100 rounded text-sm text-center">
                                        {code}
                                    </code>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={downloadRecoveryCodes}
                                    className="flex-1"
                                >
                                    <Download className="h-4 w-4 mr-2" />
                                    Скачать
                                </Button>
                                <Button onClick={closeSetupModal} className="flex-1">
                                    Готово
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Disable Modal */}
            <Dialog open={showDisableModal} onOpenChange={setShowDisableModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Отключить 2FA</DialogTitle>
                        <DialogDescription>
                            Введите пароль и код из приложения для отключения двухфакторной аутентификации
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="disable-password">Пароль</Label>
                            <Input
                                id="disable-password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="disable-code">Код аутентификации</Label>
                            <Input
                                id="disable-code"
                                type="text"
                                value={data.code}
                                onChange={(e) => setData('code', e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="000000"
                                maxLength={6}
                                className="text-center text-2xl tracking-widest"
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowDisableModal(false);
                                    reset();
                                }}
                                className="flex-1"
                            >
                                Отмена
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={processing || !data.password || data.code.length !== 6}
                                className="flex-1"
                            >
                                Отключить
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Regenerate Modal */}
            <Dialog open={showRegenerateModal} onOpenChange={setShowRegenerateModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Обновить коды восстановления</DialogTitle>
                        <DialogDescription>
                            Введите пароль для генерации новых кодов. Старые коды будут недействительны.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="regenerate-password">Пароль</Label>
                            <Input
                                id="regenerate-password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setShowRegenerateModal(false);
                                    reset();
                                }}
                                className="flex-1"
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleRegenerate}
                                disabled={processing || !data.password}
                                className="flex-1"
                            >
                                Обновить
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
