import { Head, Link } from '@inertiajs/react';
import { Card, CardContent } from '@/Components/ui/card';
import { Badge } from '@/Components/ui/badge';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/Components/ui/breadcrumb';
import { Dialog, DialogContent, DialogTrigger } from '@/Components/ui/dialog';
import { Clock, Eye, ChevronRight, ThumbsUp } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArticleRating } from '@/Components/KnowledgeBase/ArticleRating';

interface Category {
  id: number;
  name: string;
  slug: string;
}

interface Media {
  id: number;
  type: 'image' | 'video_embed';
  filename: string;
  path: string;
  url: string;
  size: number;
  metadata?: {
    width?: number;
    height?: number;
    thumbnail_path?: string;
  };
  order: number;
}

interface Article {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  reading_time: number;
  view_count: number;
  helpful_percentage?: number;
  category: Category;
  media?: Media[];
  created_at: string;
  updated_at: string;
}

interface Props {
  article: Article;
  relatedArticles: Article[];
  breadcrumbs: Array<{ name: string; slug?: string }>;
  userRating?: { is_helpful: boolean };
}

export default function Show({ article, relatedArticles, breadcrumbs, userRating }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <Head title={article.title} />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-4xl">
            {/* Breadcrumbs */}
            <Breadcrumb className="mb-4">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href={route('knowledge-base.index')}>
                    База знаний
                  </BreadcrumbLink>
                </BreadcrumbItem>
                {breadcrumbs.map((crumb, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {crumb.slug ? (
                        <BreadcrumbLink href={route('knowledge-base.category', crumb.slug)}>
                          {crumb.name}
                        </BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{crumb.name}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                  </div>
                ))}
              </BreadcrumbList>
            </Breadcrumb>

            {/* Article Header */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <Badge variant="outline">{article.category.name}</Badge>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  {article.title}
                </h1>
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {article.reading_time} мин чтения
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="h-4 w-4" />
                    {article.view_count} просмотров
                  </div>
                  {article.helpful_percentage !== undefined && (
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {Math.round(article.helpful_percentage)}% полезно
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Article Content */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="prose prose-gray dark:prose-invert max-w-none">
                  <ReactMarkdown>{article.content}</ReactMarkdown>
                </div>

                {/* Media Gallery */}
                {article.media && article.media.length > 0 && (
                  <div className="mt-8 pt-6 border-t">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Прикрепленные файлы
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {article.media.map((media) => (
                        <div key={media.id} className="relative group">
                          {media.type === 'image' ? (
                            <Dialog>
                              <DialogTrigger asChild>
                                <button
                                  className="block w-full overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors cursor-pointer"
                                  onClick={() => setSelectedImage(`/storage/${media.path}`)}
                                >
                                  <img
                                    src={`/storage/${media.path}`}
                                    alt={media.filename}
                                    className="w-full h-48 object-cover"
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-opacity" />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-4xl">
                                <img
                                  src={`/storage/${media.path}`}
                                  alt={media.filename}
                                  className="w-full h-auto"
                                />
                              </DialogContent>
                            </Dialog>
                          ) : media.type === 'video_embed' ? (
                            <div className="aspect-video rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                              <iframe
                                src={media.url}
                                title={media.filename}
                                className="w-full h-full"
                                allowFullScreen
                              />
                            </div>
                          ) : null}
                          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 truncate">
                            {media.filename}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Article Rating */}
            <ArticleRating
              articleId={article.id}
              currentRating={userRating?.is_helpful}
            />

            {/* Related Articles */}
            {relatedArticles.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Похожие статьи
                </h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {relatedArticles.map((related) => (
                    <Link
                      key={related.id}
                      href={route('knowledge-base.show', related.slug)}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                                {related.title}
                              </h3>
                              <div className="flex items-center gap-3 text-sm text-gray-500">
                                <span>{related.category.name}</span>
                                <span>•</span>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {related.reading_time} мин
                                </div>
                              </div>
                            </div>
                            <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
