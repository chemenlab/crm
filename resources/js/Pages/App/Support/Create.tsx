import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
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
import { ArrowLeft, Upload, X } from 'lucide-react';
import { FormEventHandler, useState } from 'react';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import {
  SidebarInset,
} from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';

export default function Create() {
  const { data, setData, post, processing, errors } = useForm({
    subject: '',
    category: 'technical',
    priority: 'medium',
    message: '',
    attachments: [] as File[],
  });

  const [fileNames, setFileNames] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setData('attachments', files);
      setFileNames(files.map((f) => f.name));
    }
  };

  const removeFile = (index: number) => {
    const newFiles = data.attachments.filter((_, i) => i !== index);
    setData('attachments', newFiles);
    setFileNames(newFiles.map((f) => f.name));
  };

  const submit: FormEventHandler = (e) => {
    e.preventDefault();
    post(route('app.support.store'));
  };

  return (
    <AppSidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <Head title="Создать тикет" />

        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto w-full max-w-3xl">
            {/* Header */}
            <div className="mb-6">
              <Link href={route('app.support.index')}>
                <Button variant="ghost" size="sm" className="mb-4">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Назад к списку
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Создать тикет
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Опишите вашу проблему, и мы поможем вам решить её
              </p>
            </div>

            {/* Form */}
            <Card>
            <CardContent className="pt-6">
              <form onSubmit={submit} className="space-y-6">
                {/* Subject */}
                <div>
                  <Label htmlFor="subject">Тема *</Label>
                  <Input
                    id="subject"
                    value={data.subject}
                    onChange={(e) => setData('subject', e.target.value)}
                    placeholder="Кратко опишите проблему"
                    className="mt-1"
                  />
                  {errors.subject && (
                    <p className="text-sm text-red-600 mt-1">{errors.subject}</p>
                  )}
                </div>

                {/* Category */}
                <div>
                  <Label htmlFor="category">Категория *</Label>
                  <Select
                    value={data.category}
                    onValueChange={(value) => setData('category', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">
                        Техническая проблема
                      </SelectItem>
                      <SelectItem value="billing">Вопрос по оплате</SelectItem>
                      <SelectItem value="feature_request">
                        Запрос функции
                      </SelectItem>
                      <SelectItem value="other">Другое</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-red-600 mt-1">{errors.category}</p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <Label htmlFor="priority">Приоритет *</Label>
                  <Select
                    value={data.priority}
                    onValueChange={(value) => setData('priority', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Низкий</SelectItem>
                      <SelectItem value="medium">Средний</SelectItem>
                      <SelectItem value="high">Высокий</SelectItem>
                      <SelectItem value="critical">Критический</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.priority && (
                    <p className="text-sm text-red-600 mt-1">{errors.priority}</p>
                  )}
                </div>

                {/* Message */}
                <div>
                  <Label htmlFor="message">Описание проблемы *</Label>
                  <Textarea
                    id="message"
                    value={data.message}
                    onChange={(e) => setData('message', e.target.value)}
                    placeholder="Подробно опишите вашу проблему..."
                    rows={6}
                    className="mt-1"
                  />
                  {errors.message && (
                    <p className="text-sm text-red-600 mt-1">{errors.message}</p>
                  )}
                </div>

                {/* File Upload */}
                <div>
                  <Label htmlFor="attachments">Прикрепить файлы</Label>
                  <div className="mt-1">
                    <label
                      htmlFor="attachments"
                      className="flex items-center justify-center w-full h-32 px-4 transition bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500 focus:outline-none"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Upload className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          Нажмите для загрузки файлов
                        </span>
                        <span className="text-xs text-gray-500">
                          JPG, PNG, PDF, TXT, LOG (макс. 10MB)
                        </span>
                      </div>
                      <input
                        id="attachments"
                        type="file"
                        multiple
                        accept=".jpg,.jpeg,.png,.pdf,.txt,.log"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* File List */}
                  {fileNames.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {fileNames.map((name, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {name}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {errors.attachments && (
                    <p className="text-sm text-red-600 mt-1">
                      {errors.attachments}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  <Link href={route('app.support.index')}>
                    <Button type="button" variant="outline">
                      Отмена
                    </Button>
                  </Link>
                  <Button type="submit" disabled={processing}>
                    {processing ? 'Создание...' : 'Создать тикет'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
          </div>
        </div>
      </SidebarInset>
    </AppSidebarProvider>
  );
}
