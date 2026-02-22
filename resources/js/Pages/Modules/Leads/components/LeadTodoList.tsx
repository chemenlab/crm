import { useState } from 'react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Checkbox } from '@/Components/ui/checkbox';
import { cn } from '@/lib/utils';
import { Plus, Trash2, Calendar } from 'lucide-react';
import type { LeadTodo } from '../Index';

interface LeadTodoListProps {
  todos: LeadTodo[];
  onAdd: (title: string) => void;
  onToggle: (todoId: number, isCompleted: boolean) => void;
  onDelete: (todoId: number) => void;
}

export default function LeadTodoList({ todos, onAdd, onToggle, onDelete }: LeadTodoListProps) {
  const [newTodo, setNewTodo] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodo.trim()) {
      onAdd(newTodo.trim());
      setNewTodo('');
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  const completedCount = todos.filter(t => t.is_completed).length;

  return (
    <div className="space-y-3">
      {/* Progress */}
      {todos.length > 0 && (
        <div className="text-xs text-muted-foreground">
          Выполнено: {completedCount} из {todos.length}
        </div>
      )}

      {/* Todo List */}
      <div className="space-y-2">
        {todos.map(todo => (
          <div
            key={todo.id}
            className={cn(
              'flex items-center gap-2 p-2 rounded-lg border bg-background',
              todo.is_completed && 'bg-muted/50'
            )}
          >
            <Checkbox
              checked={todo.is_completed}
              onCheckedChange={(checked) => onToggle(todo.id, checked as boolean)}
            />
            <span
              className={cn(
                'flex-1 text-sm',
                todo.is_completed && 'line-through text-muted-foreground'
              )}
            >
              {todo.title}
            </span>
            {todo.due_date && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(todo.due_date)}
              </span>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => onDelete(todo.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add Todo Form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          placeholder="Новая задача..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!newTodo.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      {/* Empty State */}
      {todos.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-2">
          Нет задач
        </p>
      )}
    </div>
  );
}
