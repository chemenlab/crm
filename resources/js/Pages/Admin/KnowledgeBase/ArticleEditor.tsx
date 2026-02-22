import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import AdminLayout from '@/Layouts/AdminLayout';
import { MarkdownEditor } from '@/Components/KnowledgeBase/MarkdownEditor';
import { MediaUploader } from '@/Components/KnowledgeBase/MediaUploader';
import { Save, ArrowLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
}

interface Media {
  id: number;
  type: 'image' | 'video' | 'video_embed';
  filename: string;
  url: string;
  thumbnail_url?: string;
  size: number;
  order: number;
}

interface Article {
  id?: number;
  title: string;
  slug: string;
  category_id: number;
  content: string;
  excerpt: string;
  is_featured: boolean;
  is_published: boolean;
  media?: Media[];
}

interface Props {
  article?: Article;
  categories: Category[];
}

export default function ArticleEditor({ article, categories }: Props) {
  const [formData, setFormData] = useState<Article>({
    title: article?.title || '',
    slug: article?.slug || '',
    category_id: article?.category_id || (categories[0]?.id || 0),
    content: article?.content || '',
    excerpt: article?.excerpt || '',
    is_featured: article?.is_featured || false,
    is_published: article?.is_published || false,
  });

  const [isSaving, setIsSaving] = useState(false);

  // Обновляем formData когда приходит новая статья (после создания)
  useEffect(() => {
    console.log('useEffect triggered, article:', article);
    if (article) {
      setFormData({
        title: article.title,
        slug: article.slug,
        category_id: article.category_id,
        content: article.content,
        excerpt: article.excerpt,
        is_featured: article.is_featured,
        is_published: article.is_published,
      });
    }
  }, [article?.id]); // Отслеживаем изменение ID статьи

  const handleSubmit = () => {
    console.log('handleSubmit called', formData);

    if (!formData.title.trim()) {
      toast.error('Введите название статьи');
      return;
    }

    if (!formData.content.trim()) {
      toast.error('Введите содержание статьи');
      return;
    }

    if (!formData.category_id || formData.category_id === 0) {
      toast.error('Выберите категорию');
      return;
    }

    setIsSaving(true);

    const endpoint = article?.id
      ? route('admin.knowledge-base.articles.update', article.id)
      : route('admin.knowledge-base.articles.store');

    const method = article?.id ? 'put' : 'post';

    console.log('Sending request:', { endpoint, method, data: formData });

    router[method](endpoint, formData as any, {
      onSuccess: (page) => {
        console.log('Success!', page);
        toast.success(article?.id ? 'Статья обновлена' : 'Статья создана');
        
        // Если создали новую статью, перекидываем на список статей
        if (!article?.id) {
          router.visit(route('admin.knowledge-base.articles.index'));
        }
      },
      onError: (errors) => {
        console.error('Errors:', errors);
        toast.error('Не удалось сохранить статью');
      },
      onFinish: () => {
        console.log('Request finished');
        setIsSaving(false);
      },
    });
  };

  const generateSlug = (title: string) => {
    // Простая транслитерация для slug
    const translitMap: Record<string, string> = {
      а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
      з: 'z', и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
      п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts',
      ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    };

    return title
      .toLowerCase()
      .split('')
      .map((char) => translitMap[char] || char)
      .join('')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title });
    if (!article?.id) {
      // Автогенерация slug только для новых статей
      setFormData({ ...formData, title, slug: generateSlug(title) });
    }
  };

  const handleImageUpload = async (file: File): Promise<string> => {
    // Эта функция будет вызвана из MarkdownEditor
    // В реальности нужно загрузить файл и вернуть URL
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      if (!article?.id) {
        reject(new Error('Сначала сохраните статью'));
        return;
      }

      router.post(
        route('admin.knowledge-base.articles.upload-media', article.id),
        formData,
        {
          preserveScroll: true,
          onSuccess: (page: any) => {
            // Предполагаем, что backend возвращает URL в response
            const media = page.props.article?.media;
            if (media && media.length > 0) {
              resolve(media[media.length - 1].url);
            } else {
              reject(new Error('Failed to get URL'));
            }
          },
          onError: () => {
            reject(new Error('Upload failed'));
          },
        }
      );
    });
  };

  return (
    <AdminLayout>
      <Head title={article?.id ? 'Редактирование статьи' : 'Создание статьи'} />

      <div className="mx-auto w-full max-w-6xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.visit(route('admin.knowledge-base.articles.index'))}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад
                </Button>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {article?.id ? 'Редактирование статьи' : 'Создание статьи'}
                </h1>
              </div>
              <Button onClick={handleSubmit} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </div>

        <div onSubmit={handleSubmit}>
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="content">Содержание</TabsTrigger>
              <TabsTrigger value="settings">Настройки</TabsTrigger>
              <TabsTrigger value="media" disabled={!article?.id}>
                Медиа {!article?.id && '(сохраните статью)'}
              </TabsTrigger>
            </TabsList>

            {/* Content Tab */}
            <TabsContent value="content" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Основная информация</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Название статьи *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Введите название статьи"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="slug">URL (slug) *</Label>
                    <Input
                      id="slug"
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value })
                      }
                      placeholder="url-statyi"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Используется в URL: /knowledge-base/{formData.slug}
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="excerpt">Краткое описание</Label>
                    <Input
                      id="excerpt"
                      value={formData.excerpt}
                      onChange={(e) =>
                        setFormData({ ...formData, excerpt: e.target.value })
                      }
                      placeholder="Краткое описание статьи (опционально)"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Содержание статьи *</CardTitle>
                </CardHeader>
                <CardContent>
                  <MarkdownEditor
                    value={formData.content}
                    onChange={(content) => setFormData({ ...formData, content })}
                    onUploadImage={article?.id ? handleImageUpload : undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Настройки публикации</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="category">Категория *</Label>
                    <Select
                      value={formData.category_id.toString()}
                      onValueChange={(value) =>
                        setFormData({ ...formData, category_id: parseInt(value) })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_published">Опубликовать статью</Label>
                      <p className="text-sm text-gray-500">
                        Статья будет видна пользователям
                      </p>
                    </div>
                    <Switch
                      id="is_published"
                      checked={formData.is_published}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_published: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="is_featured">Избранная статья</Label>
                      <p className="text-sm text-gray-500">
                        Показывать на главной странице базы знаний
                      </p>
                    </div>
                    <Switch
                      id="is_featured"
                      checked={formData.is_featured}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_featured: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Media Tab */}
            <TabsContent value="media">
              {article?.id ? (
                <Card>
                  <CardHeader>
                    <CardTitle>Медиа файлы</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MediaUploader
                      articleId={article.id}
                      media={article.media || []}
                    />
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-gray-600 dark:text-gray-400">
                      Сохраните статью, чтобы загружать медиа файлы
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AdminLayout>
  );
}
