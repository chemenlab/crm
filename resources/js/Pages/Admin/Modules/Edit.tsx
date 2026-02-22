import { Head, router, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from '@/Components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/Components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { ArrowLeft, Save, Package, X, Plus, Image as ImageIcon } from 'lucide-react';
import { useState } from 'react';

interface Module {
    slug: string;
    name: string;
    description: string | null;
    long_description: string | null;
    documentation: string | null;
    changelog: string | null;
    version: string;
    author: string | null;
    category: string | null;
    icon: string | null;
    screenshots: string[] | null;
    pricing_type: 'free' | 'subscription' | 'one_time';
    price: number;
    subscription_period: 'monthly' | 'yearly';
    min_plan: string | null;
    is_active: boolean;
    is_featured: boolean;
}

interface Category {
    value: string;
    label: string;
}

interface Props {
    module: Module;
    categories: Category[];
}

export default function ModuleEdit({ module, categories }: Props) {
    const [screenshots, setScreenshots] = useState<string[]>(module.screenshots || []);
    const [newScreenshot, setNewScreenshot] = useState('');

    const { data, setData, put, processing, errors } = useForm({
        name: module.name,
        description: module.description || '',
        long_description: module.long_description || '',
        documentation: module.documentation || '',
        changelog: module.changelog || '',
        category: module.category || '',
        icon: module.icon || '',
        screenshots: module.screenshots || [],
        pricing_type: module.pricing_type,
        price: module.price,
        subscription_period: module.subscription_period,
        min_plan: module.min_plan || '',
        is_featured: module.is_featured,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(route('admin.modules.update', module.slug));
    };

    const addScreenshot = () => {
        if (newScreenshot.trim()) {
            const updated = [...screenshots, newScreenshot.trim()];
            setScreenshots(updated);
            setData('screenshots', updated);
            setNewScreenshot('');
        }
    };

    const removeScreenshot = (index: number) => {
        const updated = screenshots.filter((_, i) => i !== index);
        setScreenshots(updated);
        setData('screenshots', updated);
    };

    return (
        <AdminLayout>
            <Head title={`Редактирование: ${module.name}`} />

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => router.visit(route('admin.modules.show', module.slug))}
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                <Package className="h-6 w-6" />
                                Редактирование модуля
                            </h1>
                            <p className="text-muted-foreground">
                                {module.slug} • v{module.version}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.visit(route('admin.modules.show', module.slug))}
                        >
                            Отмена
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            Сохранить
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="general" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="general">Основное</TabsTrigger>
                        <TabsTrigger value="pricing">Цены</TabsTrigger>
                        <TabsTrigger value="media">Медиа</TabsTrigger>
                        <TabsTrigger value="docs">Документация</TabsTrigger>
                    </TabsList>

                    {/* General Tab */}
                    <TabsContent value="general" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Основная информация</CardTitle>
                                <CardDescription>
                                    Название, описание и категория модуля
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Название</Label>
                                        <Input
                                            id="name"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            placeholder="Название модуля"
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-destructive">{errors.name}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="category">Категория</Label>
                                        <Select
                                            value={data.category || 'none'}
                                            onValueChange={(v) => setData('category', v === 'none' ? '' : v)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Выберите категорию" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Без категории</SelectItem>
                                                {categories.map((cat) => (
                                                    <SelectItem key={cat.value} value={cat.value}>
                                                        {cat.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.category && (
                                            <p className="text-sm text-destructive">{errors.category}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="description">Краткое описание</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Краткое описание модуля (до 200 символов)"
                                        rows={2}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-destructive">{errors.description}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="long_description">Полное описание</Label>
                                    <Textarea
                                        id="long_description"
                                        value={data.long_description}
                                        onChange={(e) => setData('long_description', e.target.value)}
                                        placeholder="Подробное описание модуля, его возможностей и преимуществ"
                                        rows={6}
                                    />
                                    {errors.long_description && (
                                        <p className="text-sm text-destructive">{errors.long_description}</p>
                                    )}
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="icon">Иконка (название из Lucide)</Label>
                                        <Input
                                            id="icon"
                                            value={data.icon}
                                            onChange={(e) => setData('icon', e.target.value)}
                                            placeholder="star, package, etc."
                                        />
                                        {errors.icon && (
                                            <p className="text-sm text-destructive">{errors.icon}</p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between p-4 border rounded-lg">
                                        <div>
                                            <Label>Рекомендуемый</Label>
                                            <p className="text-sm text-muted-foreground">
                                                Показывать в рекомендуемых модулях
                                            </p>
                                        </div>
                                        <Switch
                                            checked={data.is_featured}
                                            onCheckedChange={(checked) => setData('is_featured', checked)}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Pricing Tab */}
                    <TabsContent value="pricing" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Настройки цены</CardTitle>
                                <CardDescription>
                                    Тип монетизации и стоимость модуля
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="pricing_type">Тип монетизации</Label>
                                        <Select
                                            value={data.pricing_type}
                                            onValueChange={(v: 'free' | 'subscription' | 'one_time') =>
                                                setData('pricing_type', v)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="free">Бесплатный</SelectItem>
                                                <SelectItem value="subscription">Подписка</SelectItem>
                                                <SelectItem value="one_time">Разовая покупка</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.pricing_type && (
                                            <p className="text-sm text-destructive">{errors.pricing_type}</p>
                                        )}
                                    </div>

                                    {data.pricing_type !== 'free' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="price">Цена (₽)</Label>
                                            <Input
                                                id="price"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={data.price}
                                                onChange={(e) => setData('price', parseFloat(e.target.value) || 0)}
                                            />
                                            {errors.price && (
                                                <p className="text-sm text-destructive">{errors.price}</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {data.pricing_type === 'subscription' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="subscription_period">Период подписки</Label>
                                        <Select
                                            value={data.subscription_period}
                                            onValueChange={(v: 'monthly' | 'yearly') =>
                                                setData('subscription_period', v)
                                            }
                                        >
                                            <SelectTrigger className="w-[200px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="monthly">Ежемесячно</SelectItem>
                                                <SelectItem value="yearly">Ежегодно</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.subscription_period && (
                                            <p className="text-sm text-destructive">{errors.subscription_period}</p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label htmlFor="min_plan">Минимальный тарифный план</Label>
                                    <Select
                                        value={data.min_plan || 'none'}
                                        onValueChange={(v) => setData('min_plan', v === 'none' ? '' : v)}
                                    >
                                        <SelectTrigger className="w-[200px]">
                                            <SelectValue placeholder="Не требуется" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Не требуется</SelectItem>
                                            <SelectItem value="basic">Basic</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <p className="text-sm text-muted-foreground">
                                        Минимальный тарифный план для использования модуля
                                    </p>
                                    {errors.min_plan && (
                                        <p className="text-sm text-destructive">{errors.min_plan}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Media Tab */}
                    <TabsContent value="media" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Скриншоты</CardTitle>
                                <CardDescription>
                                    Добавьте URL скриншотов модуля
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        value={newScreenshot}
                                        onChange={(e) => setNewScreenshot(e.target.value)}
                                        placeholder="https://example.com/screenshot.png"
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addScreenshot())}
                                    />
                                    <Button type="button" onClick={addScreenshot}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить
                                    </Button>
                                </div>

                                {screenshots.length > 0 ? (
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                        {screenshots.map((url, index) => (
                                            <div
                                                key={index}
                                                className="relative group border rounded-lg overflow-hidden"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Screenshot ${index + 1}`}
                                                    className="w-full h-32 object-cover"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23f0f0f0" width="100" height="100"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%23999">Error</text></svg>';
                                                    }}
                                                />
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={() => removeScreenshot(index)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                                <div className="p-2 text-xs text-muted-foreground truncate">
                                                    {url}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
                                        <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                                        <p className="text-muted-foreground">Нет скриншотов</p>
                                        <p className="text-sm text-muted-foreground">
                                            Добавьте URL изображений выше
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Documentation Tab */}
                    <TabsContent value="docs" className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Документация</CardTitle>
                                <CardDescription>
                                    Техническая документация модуля (поддерживает Markdown)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="documentation">Документация (Markdown)</Label>
                                    <Textarea
                                        id="documentation"
                                        value={data.documentation}
                                        onChange={(e) => setData('documentation', e.target.value)}
                                        placeholder="# Установка&#10;&#10;Инструкция по установке модуля...&#10;&#10;## API&#10;&#10;Описание API..."
                                        rows={12}
                                        className="font-mono text-sm"
                                    />
                                    {errors.documentation && (
                                        <p className="text-sm text-destructive">{errors.documentation}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>История изменений</CardTitle>
                                <CardDescription>
                                    Changelog модуля (поддерживает Markdown)
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="changelog">Changelog (Markdown)</Label>
                                    <Textarea
                                        id="changelog"
                                        value={data.changelog}
                                        onChange={(e) => setData('changelog', e.target.value)}
                                        placeholder="## v1.0.0&#10;- Первый релиз&#10;&#10;## v1.1.0&#10;- Добавлена новая функция..."
                                        rows={8}
                                        className="font-mono text-sm"
                                    />
                                    {errors.changelog && (
                                        <p className="text-sm text-destructive">{errors.changelog}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </form>
        </AdminLayout>
    );
}
