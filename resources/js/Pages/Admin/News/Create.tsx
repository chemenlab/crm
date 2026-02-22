import { Head, useForm, Link } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import AdminLayout from '@/Layouts/AdminLayout';
import { ArrowLeft, Save, ImagePlus, X } from 'lucide-react';
import { useState } from 'react';

interface Props {
    categories: Record<string, string>;
}

export default function Create({ categories }: Props) {
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const { data, setData, post, processing, errors } = useForm({
        title: '',
        excerpt: '',
        content: '',
        category: 'Обновление',
        cover_image: null as File | null,
        is_published: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('admin.news.store'), {
            forceFormData: true,
        });
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setData('cover_image', file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setData('cover_image', null);
        setImagePreview(null);
    };

    return (
        <AdminLayout>
            <Head title="Создать новость" />

            <div className="mx-auto w-full max-w-4xl">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Link href={route('admin.news.index')}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            Создать новость
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Добавьте новую статью для лендинга
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Основная информация</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <Label htmlFor="title">Заголовок *</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) => setData('title', e.target.value)}
                                    placeholder="Введите заголовок новости"
                                    className={errors.title ? 'border-red-500' : ''}
                                />
                                {errors.title && (
                                    <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="category">Категория *</Label>
                                <Select
                                    value={data.category}
                                    onValueChange={(value) => setData('category', value)}
                                >
                                    <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(categories).map(([key, label]) => (
                                            <SelectItem key={key} value={key}>
                                                {label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {errors.category && (
                                    <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="excerpt">Краткое описание *</Label>
                                <Textarea
                                    id="excerpt"
                                    value={data.excerpt}
                                    onChange={(e) => setData('excerpt', e.target.value)}
                                    placeholder="Краткое описание для превью (до 500 символов)"
                                    rows={3}
                                    className={errors.excerpt ? 'border-red-500' : ''}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    {data.excerpt.length}/500 символов
                                </p>
                                {errors.excerpt && (
                                    <p className="text-sm text-red-500 mt-1">{errors.excerpt}</p>
                                )}
                            </div>

                            <div>
                                <Label htmlFor="content">Содержание *</Label>
                                <Textarea
                                    id="content"
                                    value={data.content}
                                    onChange={(e) => setData('content', e.target.value)}
                                    placeholder="Полный текст статьи (поддерживается HTML)"
                                    rows={15}
                                    className={errors.content ? 'border-red-500' : ''}
                                />
                                {errors.content && (
                                    <p className="text-sm text-red-500 mt-1">{errors.content}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Обложка</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {imagePreview ? (
                                <div className="relative inline-block">
                                    <img
                                        src={imagePreview}
                                        alt="Превью"
                                        className="max-w-md rounded-lg border"
                                    />
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2"
                                        onClick={removeImage}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <ImagePlus className="h-10 w-10 text-gray-400 mb-2" />
                                    <span className="text-sm text-gray-500">
                                        Нажмите для загрузки изображения
                                    </span>
                                    <span className="text-xs text-gray-400 mt-1">
                                        JPG, PNG или WebP (макс. 5MB)
                                    </span>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </label>
                            )}
                            {errors.cover_image && (
                                <p className="text-sm text-red-500 mt-1">{errors.cover_image}</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Публикация</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="is_published">Опубликовать сразу</Label>
                                    <p className="text-sm text-gray-500">
                                        Статья будет доступна на сайте сразу после сохранения
                                    </p>
                                </div>
                                <Switch
                                    id="is_published"
                                    checked={data.is_published}
                                    onCheckedChange={(checked) => setData('is_published', checked)}
                                />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end gap-4">
                        <Link href={route('admin.news.index')}>
                            <Button variant="outline">Отмена</Button>
                        </Link>
                        <Button type="submit" disabled={processing}>
                            <Save className="h-4 w-4 mr-2" />
                            {processing ? 'Сохранение...' : 'Сохранить'}
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
