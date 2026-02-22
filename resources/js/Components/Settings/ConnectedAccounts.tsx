import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/Components/ui/alert-dialog';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import GoogleIcon from '@/Components/Auth/GoogleIcon';
import YandexIcon from '@/Components/Auth/YandexIcon';

interface Provider {
    name: string;
    displayName: string;
    icon: React.ReactNode;
    connected: boolean;
    email?: string;
}

interface ConnectedAccountsProps {
    providers: {
        google?: { connected: boolean; email?: string };
        yandex?: { connected: boolean; email?: string };
    };
    hasPassword: boolean;
}

export default function ConnectedAccounts({ providers, hasPassword }: ConnectedAccountsProps) {
    const [disconnecting, setDisconnecting] = useState<string | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

    const providersList: Provider[] = [
        {
            name: 'google',
            displayName: 'Google',
            icon: <GoogleIcon className="w-6 h-6" />,
            connected: providers.google?.connected || false,
            email: providers.google?.email,
        },
        {
            name: 'yandex',
            displayName: 'Yandex',
            icon: <YandexIcon className="w-6 h-6" />,
            connected: providers.yandex?.connected || false,
            email: providers.yandex?.email,
        },
    ];

    const connectedCount = providersList.filter((p) => p.connected).length;
    const canDisconnect = hasPassword || connectedCount > 1;

    const handleConnect = (providerName: string) => {
        window.location.href = `/auth/${providerName}/link`;
    };

    const handleDisconnectClick = (providerName: string) => {
        if (!canDisconnect) {
            return;
        }
        setSelectedProvider(providerName);
        setShowConfirmDialog(true);
    };

    const handleDisconnectConfirm = () => {
        if (!selectedProvider) return;

        setDisconnecting(selectedProvider);
        setShowConfirmDialog(false);

        router.delete(`/auth/${selectedProvider}/unlink`, {
            onFinish: () => {
                setDisconnecting(null);
                setSelectedProvider(null);
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Подключенные аккаунты</CardTitle>
                <CardDescription>
                    Управляйте способами входа в ваш аккаунт
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {!canDisconnect && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Невозможно отключить единственный способ входа. Установите пароль или
                            подключите другой аккаунт.
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-3">
                    {providersList.map((provider) => (
                        <div
                            key={provider.name}
                            className="flex items-center justify-between p-4 border rounded-lg"
                        >
                            <div className="flex items-center gap-3">
                                {provider.icon}
                                <div>
                                    <div className="font-medium">{provider.displayName}</div>
                                    {provider.connected && provider.email && (
                                        <div className="text-sm text-muted-foreground">
                                            {provider.email}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {provider.connected ? (
                                    <>
                                        <div className="flex items-center gap-1 text-sm text-green-600">
                                            <CheckCircle2 className="w-4 h-4" />
                                            Подключено
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDisconnectClick(provider.name)}
                                            disabled={
                                                !canDisconnect ||
                                                disconnecting === provider.name
                                            }
                                        >
                                            {disconnecting === provider.name
                                                ? 'Отключение...'
                                                : 'Отключить'}
                                        </Button>
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                            <XCircle className="w-4 h-4" />
                                            Не подключено
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleConnect(provider.name)}
                                        >
                                            Подключить
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Отключить аккаунт?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Вы уверены, что хотите отключить аккаунт{' '}
                            {selectedProvider === 'google' ? 'Google' : 'Yandex'}? Вы сможете
                            подключить его снова в любое время.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Отмена</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDisconnectConfirm}>
                            Отключить
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    );
}
