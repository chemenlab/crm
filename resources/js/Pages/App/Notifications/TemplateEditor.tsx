import React, { useRef } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AppPageLayout from '@/Layouts/AppPageLayout';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/Components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Switch } from '@/Components/ui/switch';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import VariableSelector from '@/Components/Notifications/VariableSelector';

interface NotificationTemplate {
  id: number;
  name: string;
  type: string;
  channel: string;
  subject: string | null;
  content: string;
  is_system: boolean;
  is_active: boolean;
}

interface Props {
  template?: NotificationTemplate;
  isEdit?: boolean;
}

const typeOptions = [
  { value: 'appointment_created', label: 'Запись создана' },
  { value: 'appointment_confirmed', label: 'Запись подтверждена' },
  { value: 'appointment_rescheduled', label: 'Запись перенесена' },
  { value: 'appointment_cancelled', label: 'Запись отменена' },
  { value: 'reminder_24h', label: 'Напоминание за 24ч' },
  { value: 'reminder_2h', label: 'Напоминание за 2ч' },
  { value: 'master_new_appointment', label: 'Новая запись (мастеру)' },
  { value: 'master_appointment_cancelled', label: 'Отмена записи (мастеру)' },
];

const channelOptions = [
  { value: 'vk', label: 'VK' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'sms', label: 'SMS' },
  { value: 'email', label: 'Email' },
];

export default function TemplateEditor({ template, isEdit = false }: Props) {
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  const { data, setData, post, put, processing, errors } = useForm({
    name: template?.name || '',
    type: template?.type || '',
    channel: template?.channel || 'vk',
    subject: template?.subject || '',
    content: template?.content || '',
    is_active: template?.is_active ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEdit && template) {
      put(`/app/notifications/templates/${template.id}`);
    } else {
      post('/app/notifications/templates');
    }
  };

  const handleVariableInsert = (variable: string, field: 'content' | 'subject') => {
    if (field === 'content' && contentRef.current) {
      const textarea = contentRef.current;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = data.content;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setData('content', newText);
      
      // Set cursor position after inserted variable
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    } else if (field === 'subject' && subjectRef.current) {
      const input = subjectRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const text = data.subject;
      const newText = text.substring(0, start) + variable + text.substring(end);
      setData('subject', newText);
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + variable.length, start + variable.length);
      }, 0);
    }
  };

  const isSystemTemplate = template?.is_system ?? false;
  const showSubject = data.channel === 'email';

  return (
    <AppPageLayout title={isEdit ? 'Редактировать шаблон' : 'Создать шаблон'}>

      <div className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.get('/app/notifications/templates')}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к шаблонам
            </Button>
            <h1 className="text-2xl font-semibold text-gray-900">
              {isEdit ? 'Редактировать шаблон' : 'Создать шаблон'}
            </h1>
          </div>

          {isSystemTemplate && (
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Это системный шаблон. Вы можете изменить только содержимое и статус активности.
              </AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Настройки шаблона</CardTitle>
              <CardDescription>
                Используйте переменные для динамической подстановки данных
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label htmlFor="name">Название шаблона</Label>
                  <Input
                    id="name"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    disabled={isSystemTemplate}
                    required
                  />
                  {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name}</p>}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="type">Тип уведомления</Label>
                    <Select
                      value={data.type}
                      onValueChange={(value) => setData('type', value)}
                      disabled={isSystemTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {typeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.type && <p className="text-sm text-red-500 mt-1">{errors.type}</p>}
                  </div>

                  <div>
                    <Label htmlFor="channel">Канал отправки</Label>
                    <Select
                      value={data.channel}
                      onValueChange={(value) => setData('channel', value)}
                      disabled={isSystemTemplate}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите канал" />
                      </SelectTrigger>
                      <SelectContent>
                        {channelOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.channel && (
                      <p className="text-sm text-red-500 mt-1">{errors.channel}</p>
                    )}
                  </div>
                </div>

                {showSubject && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <Label htmlFor="subject">Тема письма</Label>
                      <VariableSelector onSelect={(v) => handleVariableInsert(v, 'subject')} />
                    </div>
                    <Input
                      id="subject"
                      ref={subjectRef}
                      type="text"
                      value={data.subject}
                      onChange={(e) => setData('subject', e.target.value)}
                    />
                    {errors.subject && (
                      <p className="text-sm text-red-500 mt-1">{errors.subject}</p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="content">Содержимое</Label>
                    <VariableSelector onSelect={(v) => handleVariableInsert(v, 'content')} />
                  </div>
                  <Textarea
                    id="content"
                    ref={contentRef}
                    value={data.content}
                    onChange={(e) => setData('content', e.target.value)}
                    rows={8}
                    required
                  />
                  {errors.content && <p className="text-sm text-red-500 mt-1">{errors.content}</p>}
                  <p className="text-sm text-gray-500 mt-1">
                    Используйте кнопку "Вставить переменную" для добавления динамических данных
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={data.is_active}
                    onCheckedChange={(checked) => setData('is_active', checked)}
                  />
                  <Label htmlFor="is_active" className="cursor-pointer">
                    Шаблон активен
                  </Label>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.get('/app/notifications/templates')}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppPageLayout>
  );
}
