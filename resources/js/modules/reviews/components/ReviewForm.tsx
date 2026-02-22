import React, { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import { Star } from 'lucide-react';
import type { ReviewFormData } from '../types';

interface ReviewFormProps {
  initialData?: Partial<ReviewFormData>;
  onSubmit: (data: ReviewFormData) => void;
  onCancel?: () => void;
  isLoading?: boolean;
  submitLabel?: string;
}

export default function ReviewForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  submitLabel = 'Сохранить',
}: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    author_name: initialData?.author_name || '',
    author_email: initialData?.author_email || '',
    author_phone: initialData?.author_phone || '',
    rating: initialData?.rating || 5,
    text: initialData?.text || '',
  });

  const [hoveredRating, setHoveredRating] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleRatingClick = (rating: number) => {
    setFormData((prev) => ({ ...prev, rating }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="author_name">Имя автора *</Label>
        <Input
          id="author_name"
          value={formData.author_name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, author_name: e.target.value }))
          }
          placeholder="Введите имя"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="author_email">Email</Label>
          <Input
            id="author_email"
            type="email"
            value={formData.author_email || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, author_email: e.target.value }))
            }
            placeholder="email@example.com"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="author_phone">Телефон</Label>
          <Input
            id="author_phone"
            value={formData.author_phone || ''}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, author_phone: e.target.value }))
            }
            placeholder="+7 (999) 123-45-67"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Оценка *</Label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRatingClick(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(null)}
              className="p-1 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-8 w-8 ${
                  star <= (hoveredRating ?? formData.rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="text">Текст отзыва</Label>
        <Textarea
          id="text"
          value={formData.text || ''}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, text: e.target.value }))
          }
          placeholder="Напишите отзыв..."
          rows={4}
        />
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
        )}
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Сохранение...' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
