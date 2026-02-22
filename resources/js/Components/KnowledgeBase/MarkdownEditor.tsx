import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Textarea } from '@/Components/ui/textarea';
import { Button } from '@/Components/ui/button';
import { Card, CardContent } from '@/Components/ui/card';
import { Bold, Italic, Link as LinkIcon, Image, List, ListOrdered, Code, Heading } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  onUploadImage?: (file: File) => Promise<string>;
}

export function MarkdownEditor({ value, onChange, onUploadImage }: MarkdownEditorProps) {
  const insertMarkdown = (before: string, after: string = '') => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Восстанавливаем фокус и выделение
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        start + before.length + selectedText.length
      );
    }, 0);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadImage) return;

    try {
      const url = await onUploadImage(file);
      insertMarkdown(`![${file.name}](${url})`);
    } catch (error) {
      console.error('Failed to upload image:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-900">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('# ', '')}
          title="Заголовок"
        >
          <Heading className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('**', '**')}
          title="Жирный"
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('*', '*')}
          title="Курсив"
        >
          <Italic className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('[', '](url)')}
          title="Ссылка"
        >
          <LinkIcon className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('- ', '')}
          title="Список"
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('1. ', '')}
          title="Нумерованный список"
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => insertMarkdown('`', '`')}
          title="Код"
        >
          <Code className="h-4 w-4" />
        </Button>
        {onUploadImage && (
          <label>
            <Button type="button" variant="ghost" size="sm" asChild>
              <span>
                <Image className="h-4 w-4" />
              </span>
            </Button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit">Редактирование</TabsTrigger>
          <TabsTrigger value="preview">Предпросмотр</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Введите текст статьи в формате Markdown..."
            className="min-h-[500px] font-mono"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <Card>
            <CardContent className="pt-6">
              <div className="prose prose-gray dark:prose-invert max-w-none min-h-[500px]">
                {value ? (
                  <ReactMarkdown>{value}</ReactMarkdown>
                ) : (
                  <p className="text-gray-400">Предпросмотр появится здесь...</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Markdown Help */}
      <details className="text-sm text-gray-600 dark:text-gray-400">
        <summary className="cursor-pointer hover:text-gray-900 dark:hover:text-white">
          Справка по Markdown
        </summary>
        <div className="mt-2 space-y-1 pl-4">
          <p># Заголовок 1</p>
          <p>## Заголовок 2</p>
          <p>**жирный текст**</p>
          <p>*курсив*</p>
          <p>[текст ссылки](url)</p>
          <p>![alt текст](url изображения)</p>
          <p>- элемент списка</p>
          <p>1. нумерованный список</p>
          <p>`код`</p>
          <p>```язык</p>
          <p>блок кода</p>
          <p>```</p>
        </div>
      </details>
    </div>
  );
}
