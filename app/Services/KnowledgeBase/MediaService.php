<?php

namespace App\Services\KnowledgeBase;

use App\Models\KnowledgeBaseArticle;
use App\Models\KnowledgeBaseArticleMedia;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;

class MediaService
{
    /**
     * Загрузить изображение
     */
    public function uploadImage(UploadedFile $file, KnowledgeBaseArticle $article): KnowledgeBaseArticleMedia
    {
        // Валидация
        $this->validateImage($file);
        
        // Генерация имени файла
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = "knowledge-base/articles/{$article->id}/images/{$filename}";
        
        // Сохранение оригинала
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));
        
        // Оптимизация изображения
        $this->optimizeImage(storage_path('app/public/' . $path));
        
        // Генерация миниатюры
        $thumbnailPath = $this->generateThumbnail(storage_path('app/public/' . $path), $article->id);
        
        // Получение размеров
        $imageSize = getimagesize(storage_path('app/public/' . $path));
        
        // Создание записи в БД
        return $article->media()->create([
            'type' => 'image',
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'url' => Storage::url($path),
            'size' => $file->getSize(),
            'metadata' => [
                'width' => $imageSize[0] ?? null,
                'height' => $imageSize[1] ?? null,
                'mime_type' => $file->getMimeType(),
            ],
            'order' => $article->media()->count(),
        ]);
    }
    
    /**
     * Загрузить видео
     */
    public function uploadVideo(UploadedFile $file, KnowledgeBaseArticle $article): KnowledgeBaseArticleMedia
    {
        // Валидация
        $this->validateVideo($file);
        
        // Генерация имени файла
        $filename = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path = "knowledge-base/articles/{$article->id}/videos/{$filename}";
        
        // Сохранение файла
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));
        
        // Создание записи в БД
        return $article->media()->create([
            'type' => 'video',
            'filename' => $file->getClientOriginalName(),
            'path' => $path,
            'url' => Storage::url($path),
            'size' => $file->getSize(),
            'metadata' => [
                'mime_type' => $file->getMimeType(),
            ],
            'order' => $article->media()->count(),
        ]);
    }
    
    /**
     * Создать embed видео (YouTube/Vimeo)
     */
    public function createVideoEmbed(string $url, KnowledgeBaseArticle $article): KnowledgeBaseArticleMedia
    {
        $embedData = $this->parseVideoUrl($url);
        
        if (!$embedData) {
            throw new \InvalidArgumentException('Неподдерживаемый URL видео. Поддерживаются только YouTube и Vimeo.');
        }
        
        return $article->media()->create([
            'type' => 'video_embed',
            'filename' => $embedData['provider'] . '_' . $embedData['video_id'],
            'path' => '',
            'url' => $url,
            'size' => 0,
            'metadata' => [
                'provider' => $embedData['provider'],
                'embed_id' => $embedData['video_id'],
                'embed_url' => $embedData['embed_url'],
            ],
            'order' => $article->media()->count(),
        ]);
    }
    
    /**
     * Удалить медиа
     */
    public function deleteMedia(KnowledgeBaseArticleMedia $media): bool
    {
        // Удаление файлов с диска
        if ($media->type !== 'video_embed' && Storage::disk('public')->exists($media->path)) {
            Storage::disk('public')->delete($media->path);
            
            // Удаление миниатюры для изображений
            if ($media->type === 'image') {
                $pathInfo = pathinfo($media->path);
                $thumbnailPath = $pathInfo['dirname'] . '/thumbnails/' . $pathInfo['basename'];
                
                if (Storage::disk('public')->exists($thumbnailPath)) {
                    Storage::disk('public')->delete($thumbnailPath);
                }
            }
        }
        
        // Удаление записи из БД
        return $media->delete();
    }
    
    /**
     * Оптимизировать изображение
     */
    public function optimizeImage(string $path): void
    {
        try {
            $manager = new ImageManager(new Driver());
            $image = $manager->read($path);
            
            // Ограничение максимального размера
            if ($image->width() > 1920 || $image->height() > 1920) {
                $image->scale(width: 1920, height: 1920);
            }
            
            // Сохранение с оптимизацией качества
            $image->save($path, quality: 85);
        } catch (\Exception $e) {
            // Если Intervention Image не установлен, пропускаем оптимизацию
            \Log::warning('Image optimization failed: ' . $e->getMessage());
        }
    }
    
    /**
     * Генерировать миниатюру
     */
    public function generateThumbnail(string $path, int $articleId): string
    {
        try {
            $pathInfo = pathinfo($path);
            $thumbnailDir = storage_path("app/public/knowledge-base/articles/{$articleId}/images/thumbnails");
            
            // Создание директории для миниатюр
            if (!file_exists($thumbnailDir)) {
                mkdir($thumbnailDir, 0755, true);
            }
            
            $thumbnailPath = $thumbnailDir . '/' . $pathInfo['basename'];
            
            // Создание миниатюры
            $manager = new ImageManager(new Driver());
            $image = $manager->read($path);
            $image->cover(300, 300);
            $image->save($thumbnailPath, quality: 80);
            
            return str_replace(storage_path('app/public/'), '', $thumbnailPath);
        } catch (\Exception $e) {
            \Log::warning('Thumbnail generation failed: ' . $e->getMessage());
            return '';
        }
    }
    
    /**
     * Валидация изображения
     */
    private function validateImage(UploadedFile $file): void
    {
        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
        $maxSize = 5 * 1024 * 1024; // 5MB
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Неподдерживаемый формат изображения. Разрешены: JPG, PNG, WebP');
        }
        
        if ($file->getSize() > $maxSize) {
            throw new \InvalidArgumentException('Размер изображения превышает 5MB');
        }
    }
    
    /**
     * Валидация видео
     */
    private function validateVideo(UploadedFile $file): void
    {
        $allowedMimes = ['video/mp4'];
        $maxSize = 50 * 1024 * 1024; // 50MB
        
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            throw new \InvalidArgumentException('Неподдерживаемый формат видео. Разрешены: MP4');
        }
        
        if ($file->getSize() > $maxSize) {
            throw new \InvalidArgumentException('Размер видео превышает 50MB');
        }
    }
    
    /**
     * Парсинг URL видео
     */
    private function parseVideoUrl(string $url): ?array
    {
        // YouTube
        if (preg_match('/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/', $url, $matches)) {
            return [
                'provider' => 'youtube',
                'video_id' => $matches[1],
                'embed_url' => "https://www.youtube.com/embed/{$matches[1]}",
            ];
        }
        
        // Vimeo
        if (preg_match('/vimeo\.com\/(\d+)/', $url, $matches)) {
            return [
                'provider' => 'vimeo',
                'video_id' => $matches[1],
                'embed_url' => "https://player.vimeo.com/video/{$matches[1]}",
            ];
        }
        
        return null;
    }
}
