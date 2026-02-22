import { useState, useRef } from 'react';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/Components/ui/button';
import { cn } from '@/lib/utils';
import axios from 'axios';
import { toast } from 'sonner';

// @ts-ignore
declare const route: any;

interface ImageFieldUploadProps {
    fieldId: number;
    value: string | string[];
    onChange: (value: string | string[]) => void;
    allowMultiple?: boolean;
    maxFiles?: number;
}

// Helper to convert storage path to full URL
const getImageUrl = (path: string): string => {
    if (!path) return '';
    // Already a full URL
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/storage/')) {
        return path;
    }
    // Relative path - prepend /storage/
    return `/storage/${path}`;
};

export function ImageFieldUpload({
    fieldId,
    value,
    onChange,
    allowMultiple = false,
    maxFiles = 5
}: ImageFieldUploadProps) {
    const [uploading, setUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Normalize value to array for easier handling
    const images = Array.isArray(value) ? value : value ? [value] : [];

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = async (files: File[]) => {
        if (!allowMultiple && images.length >= 1) {
            return;
        }

        const maxAllowed = allowMultiple ? maxFiles - images.length : 1;
        const filesToUpload = files.slice(0, maxAllowed);

        setUploading(true);

        try {
            const uploadedPaths: string[] = [];

            for (const file of filesToUpload) {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('field_id', fieldId.toString());

                const response = await axios.post(route('calendar.uploadFieldImage'), formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                });

                if (response.data.url) {
                    uploadedPaths.push(response.data.url);
                }
            }

            if (allowMultiple) {
                onChange([...images, ...uploadedPaths]);
            } else {
                onChange(uploadedPaths[0] || '');
            }
        } catch (error) {
            console.error('Failed to upload image:', error);
            toast.error('Не удалось загрузить изображение');
        } finally {
            setUploading(false);
        }
    };

    const handleRemove = (index: number) => {
        const newImages = images.filter((_, i) => i !== index);
        if (allowMultiple) {
            onChange(newImages);
        } else {
            onChange('');
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    const canUploadMore = allowMultiple ? images.length < maxFiles : images.length === 0;

    return (
        <div className="space-y-3">
            {/* Preview Grid */}
            {images.length > 0 && (
                <div className={cn(
                    "grid gap-3",
                    allowMultiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1"
                )}>
                    {images.map((imgUrl, index) => (
                        <div
                            key={index}
                            className="relative group aspect-square rounded-lg border-2 border-border overflow-hidden bg-muted"
                        >
                            <img
                                src={getImageUrl(imgUrl)}
                                alt={`Фото ${index + 1}`}
                                className="w-full h-full object-cover"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleRemove(index)}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Area */}
            {canUploadMore && (
                <div
                    className={cn(
                        "relative border-2 border-dashed rounded-lg p-6 transition-colors",
                        dragActive
                            ? "border-primary bg-primary/5"
                            : "border-muted-foreground/25 hover:border-muted-foreground/50"
                    )}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple={allowMultiple}
                        onChange={handleFileInput}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center justify-center text-center space-y-2">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                            {uploading ? (
                                <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <ImageIcon className="h-6 w-6 text-primary" />
                            )}
                        </div>

                        <div>
                            <p className="text-sm font-medium">
                                {uploading ? 'Загрузка...' : 'Перетащите изображение сюда'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                                или нажмите для выбора файла
                            </p>
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleClick}
                            disabled={uploading}
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Выбрать файл
                        </Button>

                        {allowMultiple && (
                            <p className="text-xs text-muted-foreground">
                                {images.length} из {maxFiles} загружено
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
