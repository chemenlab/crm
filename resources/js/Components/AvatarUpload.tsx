import { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/Components/ui/avatar';
import { UploadIcon } from 'lucide-react';

interface AvatarUploadProps {
    user: {
        id: number;
        name: string;
        avatar: string | null;
    };
}

export function AvatarUpload({ user }: AvatarUploadProps) {
    const [preview, setPreview] = useState<string | null>(
        user.avatar ? `/storage/${user.avatar}` : null
    );
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Sync preview with user prop when it changes (e.g. after successful upload)
    useEffect(() => {
        if (user.avatar) {
            setPreview(`/storage/${user.avatar}`);
        }
    }, [user.avatar]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Create preview
        const objectUrl = URL.createObjectURL(file);
        setPreview(objectUrl);

        // Upload immediately
        const formData = new FormData();
        formData.append('avatar', file);

        router.post('/app/settings/profile/avatar', formData, {
            forceFormData: true,
            onSuccess: () => {
                // Success notification handled by global layout
            },
            onError: () => {
                // Revert preview on error
                setPreview(user.avatar ? `/storage/${user.avatar}` : null);
            },
        });
    };

    const handleTriggerClick = () => {
        fileInputRef.current?.click();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .substring(0, 2);
    };

    return (
        <div className="flex items-center gap-6">
            <Avatar className="h-24 w-24">
                <AvatarImage src={preview || ''} alt={user.name} />
                <AvatarFallback className="text-lg">{getInitials(user.name)}</AvatarFallback>
            </Avatar>

            <div className="space-y-2">
                <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={handleTriggerClick}>
                        <UploadIcon className="h-4 w-4 mr-2" />
                        Загрузить фото
                    </Button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>
                <p className="text-xs text-muted-foreground">
                    JPG, PNG или GIF. Фото будет автоматически сжато.
                </p>
            </div>
        </div>
    );
}
