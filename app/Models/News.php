<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class News extends Model
{
    protected $table = 'news';

    protected $fillable = [
        'title',
        'slug',
        'excerpt',
        'content',
        'cover_image',
        'category',
        'is_published',
        'published_at',
        'view_count',
        'reading_time',
    ];

    protected $casts = [
        'is_published' => 'boolean',
        'published_at' => 'datetime',
        'view_count' => 'integer',
        'reading_time' => 'integer',
    ];

    /**
     * Available categories
     */
    public const CATEGORIES = [
        'Советы' => 'Советы',
        'Обновление' => 'Обновление',
        'Кейс' => 'Кейс',
    ];

    /**
     * Category colors for frontend
     */
    public const CATEGORY_COLORS = [
        'Советы' => 'c4eb5a',
        'Обновление' => '60a5fa',
        'Кейс' => 'facc15',
    ];

    /**
     * Scope for published news
     */
    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->whereNotNull('published_at');
    }

    /**
     * Scope for ordering by latest
     */
    public function scopeLatest($query)
    {
        return $query->orderBy('published_at', 'desc');
    }

    /**
     * Increment view count
     */
    public function incrementViewCount(): void
    {
        $this->increment('view_count');
    }

    /**
     * Calculate reading time based on content
     */
    public function calculateReadingTime(): int
    {
        $wordCount = str_word_count(strip_tags($this->content));
        return max(1, (int) ceil($wordCount / 200)); // 200 words per minute
    }

    /**
     * Generate unique slug from title
     */
    public static function generateUniqueSlug(string $title, ?int $excludeId = null): string
    {
        $slug = Str::slug($title);
        $originalSlug = $slug;
        $counter = 1;

        while (true) {
            $query = static::where('slug', $slug);

            if ($excludeId) {
                $query->where('id', '!=', $excludeId);
            }

            if (!$query->exists()) {
                break;
            }

            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }

    /**
     * Get formatted date for display
     */
    public function getFormattedDateAttribute(): string
    {
        if (!$this->published_at) {
            return '';
        }

        $months = [
            1 => 'января',
            2 => 'февраля',
            3 => 'марта',
            4 => 'апреля',
            5 => 'мая',
            6 => 'июня',
            7 => 'июля',
            8 => 'августа',
            9 => 'сентября',
            10 => 'октября',
            11 => 'ноября',
            12 => 'декабря',
        ];

        return $this->published_at->day . ' ' . $months[$this->published_at->month] . ' ' . $this->published_at->year;
    }

    /**
     * Get category color
     */
    public function getCategoryColorAttribute(): string
    {
        return self::CATEGORY_COLORS[$this->category] ?? 'c4eb5a';
    }

    /**
     * Get cover image URL
     */
    public function getCoverImageUrlAttribute(): ?string
    {
        if (!$this->cover_image) {
            return null;
        }

        return '/storage/' . $this->cover_image;
    }
}
