import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { AlertCircle } from 'lucide-react';
import GoogleIcon from './GoogleIcon';
import YandexIcon from './YandexIcon';

interface OAuthButtonsProps {
    mode?: 'login' | 'register' | 'settings';
    error?: string;
}

export default function OAuthButtons({ mode = 'login', error }: OAuthButtonsProps) {
    const [loading, setLoading] = useState<string | null>(null);

    const handleOAuthClick = (provider: 'google' | 'yandex') => {
        setLoading(provider);
        
        // Redirect to OAuth provider
        const url = mode === 'settings' 
            ? `/auth/${provider}/link`
            : `/auth/${provider}/redirect`;
            
        window.location.href = url;
    };

    return (
        <div className="space-y-4">
            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        или
                    </span>
                </div>
            </div>

            <div className="grid gap-3">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthClick('google')}
                    disabled={loading !== null}
                    className="w-full"
                >
                    {loading === 'google' ? (
                        <span className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Подключение...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <GoogleIcon />
                            {mode === 'settings' ? 'Подключить Google' : 'Войти через Google'}
                        </span>
                    )}
                </Button>

                <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOAuthClick('yandex')}
                    disabled={loading !== null}
                    className="w-full hover:bg-yellow-50"
                >
                    {loading === 'yandex' ? (
                        <span className="flex items-center gap-2">
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Подключение...
                        </span>
                    ) : (
                        <span className="flex items-center gap-2">
                            <YandexIcon />
                            {mode === 'settings' ? 'Подключить Yandex' : 'Войти через Yandex'}
                        </span>
                    )}
                </Button>
            </div>
        </div>
    );
}
