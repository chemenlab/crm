import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { Lock } from 'lucide-react';

interface SubscriptionRequiredProps {
    title?: string;
    description?: string;
    showButton?: boolean;
}

export default function SubscriptionRequired({
    title = 'Требуется подписка',
    description = 'Для использования этого функционала необходима активная подписка',
    showButton = true,
}: SubscriptionRequiredProps) {
    return (
        <Alert className="border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-900">{title}</AlertTitle>
            <AlertDescription className="text-amber-700">
                {description}
                {showButton && (
                    <div className="mt-4">
                        <Link href={route('subscriptions.index')}>
                            <Button size="sm" variant="default">
                                Выбрать тариф
                            </Button>
                        </Link>
                    </div>
                )}
            </AlertDescription>
        </Alert>
    );
}
