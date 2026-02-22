import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Textarea } from '@/Components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { Send, Trash2 } from 'lucide-react';
import type { LeadComment } from '../Index';

interface LeadCommentsProps {
  comments: LeadComment[];
  onAdd: (content: string) => void;
  onDelete: (commentId: number) => void;
}

export default function LeadComments({ comments, onAdd, onDelete }: LeadCommentsProps) {
  const [newComment, setNewComment] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.trim()) {
      onAdd(newComment.trim());
      setNewComment('');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="space-y-3">
      {/* Comments List */}
      <div className="space-y-3">
        {comments.map(comment => (
          <div key={comment.id} className="flex gap-3 group">
            <Avatar className="h-8 w-8">
              <AvatarImage src={comment.user.avatar || undefined} />
              <AvatarFallback className="text-xs">
                {getInitials(comment.user.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{comment.user.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDate(comment.created_at)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto"
                  onClick={() => onDelete(comment.id)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Нет комментариев
        </p>
      )}

      {/* Add Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Написать комментарий..."
          rows={2}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={!newComment.trim()}>
            <Send className="h-4 w-4 mr-2" />
            Отправить
          </Button>
        </div>
      </form>
    </div>
  );
}
