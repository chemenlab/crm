import { Card, CardContent } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Progress } from '@/Components/ui/progress';
import { Badge } from '@/Components/ui/badge';
import { Input } from '@/Components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/Components/ui/dialog';
import { Upload, X, Image as ImageIcon, Video, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/Components/ConfirmDialog';

interface Media {
  id: number;
  type: 'image' | 'video' | 'video_embed';
  filename: string;
  url: string;
  thumbnail_url?: string;
  size: number;
  order: number;
}

interface MediaUploaderProps {
  articleId: number;
  media: Media[];
  onUpload?: (file: File) => Promise<void>;
  onDelete?: (mediaId: number) => Promise<void>;
}

export function MediaUploader({ articleId, media, onUpload, onDelete }: MediaUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedUrl, setEmbedUrl] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({
    open: false,
    id: null,
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Определение типа файла
    const fileType = file.type.startsWith('image/') ? 'image' : 'video';

    // Валидация размера
    const maxSize = fileType === 'image' ? 5 * 1024 * 1024 : 50 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(
        `Файл слишком большой. Максимальный размер: ${
          fileType === 'image' ? '5' : '50'
        } МБ`
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', fileType);

    console.log('Uploading file:', {
      name: file.name,
      size: file.size,
      type: file.type,
      fileType: fileType
    });

    try {
      // Симуляция прогресса
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await fetch(route('admin.knowledge-base.articles.upload-media', articleId), {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Upload error:', errorData);
        console.error('File errors:', errorData.errors?.file);
        
        // Показываем детальные ошибки валидации
        if (errorData.errors) {
          const errorMessages = Object.values(errorData.errors).flat().join(', ');
          toast.error(`Ошибка валидации: ${errorMessages}`);
        } else {
          toast.error(errorData.message || 'Не удалось загрузить файл');
        }
        
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await response.json();
      
      if (data.success) {
        setUploadProgress(100);
        toast.success('Файл загружен');
        // Перезагрузка страницы для обновления списка медиа
        router.reload({ only: ['article'] });
      } else {
        throw new Error(data.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleEmbedSubmit = async () => {
    if (!embedUrl.trim()) {
      toast.error('Введите URL видео');
      return;
    }

    try {
      const response = await fetch(route('admin.knowledge-base.articles.upload-media', articleId), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({ video_url: embedUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to add video');
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success('Видео добавлено');
        setShowEmbedDialog(false);
        setEmbedUrl('');
        router.reload({ only: ['article'] });
      } else {
        throw new Error(data.message || 'Failed to add video');
      }
    } catch (error) {
      toast.error('Не удалось добавить видео');
      console.error(error);
    }
  };

  const handleDelete = (mediaId: number) => {
    setDeleteConfirm({ open: true, id: mediaId });
  };

  const confirmDelete = () => {
    if (!deleteConfirm.id) return;
    router.delete(route('admin.knowledge-base.articles.delete-media', deleteConfirm.id), {
      preserveScroll: true,
      onSuccess: () => {
        toast.success('Файл удален');
        setDeleteConfirm({ open: false, id: null });
      },
      onError: () => {
        toast.error('Не удалось удалить файл');
      },
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-4">
      {/* Upload Buttons */}
      <div className="flex gap-2">
        <label>
          <Button type="button" variant="outline" asChild disabled={isUploading}>
            <span>
              <ImageIcon className="h-4 w-4 mr-2" />
              Загрузить изображение
            </span>
          </Button>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        <label>
          <Button type="button" variant="outline" asChild disabled={isUploading}>
            <span>
              <Video className="h-4 w-4 mr-2" />
              Загрузить видео
            </span>
          </Button>
          <input
            type="file"
            accept="video/mp4"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />
        </label>

        <Dialog open={showEmbedDialog} onOpenChange={setShowEmbedDialog}>
          <DialogTrigger asChild>
            <Button type="button" variant="outline">
              <LinkIcon className="h-4 w-4 mr-2" />
              Вставить видео (YouTube/Vimeo)
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Вставить видео</DialogTitle>
              <DialogDescription>
                Введите URL видео с YouTube или Vimeo
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={embedUrl}
                onChange={(e) => setEmbedUrl(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEmbedDialog(false);
                    setEmbedUrl('');
                  }}
                >
                  Отмена
                </Button>
                <Button onClick={handleEmbedSubmit}>Добавить</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Загрузка...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Media List */}
      {media.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {media.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="relative">
                  {/* Preview */}
                  {item.type === 'image' && (
                    <img
                      src={item.url}
                      alt={item.filename}
                      className="w-full h-32 object-cover rounded-lg mb-2"
                    />
                  )}
                  {(item.type === 'video' || item.type === 'video_embed') && (
                    <div className="w-full h-32 bg-gray-100 dark:bg-gray-800 rounded-lg mb-2 flex items-center justify-center">
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  )}

                  {/* Delete Button */}
                  <Button
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => handleDelete(item.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {/* Info */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {item.type === 'image' && 'Изображение'}
                      {item.type === 'video' && 'Видео'}
                      {item.type === 'video_embed' && 'Embed'}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatFileSize(item.size)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {item.filename}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {media.length === 0 && !isUploading && (
        <Card>
          <CardContent className="py-12 text-center">
            <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Нет загруженных файлов
            </p>
          </CardContent>
        </Card>
      )}
      
      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ ...deleteConfirm, open })}
        onConfirm={confirmDelete}
        title="Удаление файла"
        description="Удалить этот файл?"
      />
    </div>
  );
}
