import { Link } from '@inertiajs/react'
import { Card, CardContent } from '@/Components/ui/card'
import { Button } from '@/Components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface LimitReachedAlertProps {
    resourceName: string
    message?: string
}

export default function LimitReachedAlert({ resourceName, message }: LimitReachedAlertProps) {
    const defaultMessage = `Вы достигли лимита по ресурсу "${resourceName}" для вашего тарифного плана. Обновите тариф для продолжения работы.`

    return (
        <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
            <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                        <h3 className="font-semibold text-yellow-900 dark:text-yellow-100">
                            Достигнут лимит
                        </h3>
                        <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                            {message || defaultMessage}
                        </p>
                        <Button variant="outline" className="mt-3" asChild>
                            <Link href="/app/subscriptions">
                                Обновить тариф
                            </Link>
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
