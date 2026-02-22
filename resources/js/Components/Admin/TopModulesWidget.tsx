import { router } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Button } from '@/Components/ui/button';
import { Download, DollarSign, Package, ArrowRight } from 'lucide-react';

interface TopModule {
    slug: string;
    name: string;
    category: string | null;
    installs_count?: number;
    total_revenue?: number;
    purchases_count?: number;
}

interface TopModulesWidgetProps {
    topByInstalls: TopModule[];
    topByRevenue: TopModule[];
}

export function TopModulesWidget({ topByInstalls = [], topByRevenue = [] }: TopModulesWidgetProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(value);
    };

    const getCategoryLabel = (category: string | null) => {
        const categories: Record<string, string> = {
            finance: 'Финансы',
            marketing: 'Маркетинг',
            communication: 'Коммуникации',
            analytics: 'Аналитика',
            productivity: 'Продуктивность',
            integration: 'Интеграции',
            other: 'Другое',
        };
        return category ? categories[category] || category : 'Без категории';
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Топ модулей
                    </CardTitle>
                    <CardDescription>Популярные и прибыльные модули</CardDescription>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => router.visit(route('admin.modules.stats'))}
                >
                    Подробнее
                    <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="installs" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="installs">По установкам</TabsTrigger>
                        <TabsTrigger value="revenue">По доходу</TabsTrigger>
                    </TabsList>

                    <TabsContent value="installs" className="mt-4">
                        {topByInstalls.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 text-sm">
                                Нет данных
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {topByInstalls.slice(0, 5).map((module, index) => (
                                    <div
                                        key={module.slug}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => router.visit(route('admin.modules.module-stats', module.slug))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 font-semibold text-primary text-xs">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{module.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {getCategoryLabel(module.category)}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                            <span className="font-semibold">{module.installs_count}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="revenue" className="mt-4">
                        {topByRevenue.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4 text-sm">
                                Нет данных
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {topByRevenue.slice(0, 5).map((module, index) => (
                                    <div
                                        key={module.slug}
                                        className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                                        onClick={() => router.visit(route('admin.modules.module-stats', module.slug))}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-green-100 dark:bg-green-900 font-semibold text-green-600 dark:text-green-400 text-xs">
                                                {index + 1}
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{module.name}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {module.purchases_count} покупок
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <DollarSign className="h-3.5 w-3.5 text-green-500" />
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(module.total_revenue || 0)}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
