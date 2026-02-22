import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Alert, AlertDescription } from '@/Components/ui/alert';
import { Badge } from '@/Components/ui/badge';
import { Plus, User, Phone, Mail, Tag, X, MessageSquare, AlertCircle, ExternalLink } from 'lucide-react';
import { showAchievementToast } from '@/Components/Onboarding/AchievementToast';

// @ts-ignore
declare const route: any;

interface QuickCreateClientDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onClientCreated: (client: any) => void;
    availableTags?: any[];
    initialPhone?: string;
}

export function QuickCreateClientDialog({
    open,
    onOpenChange,
    onClientCreated,
    availableTags = [],
    initialPhone = '',
}: QuickCreateClientDialogProps) {
    const [loading, setLoading] = useState(false);
    const [existingClient, setExistingClient] = useState<any>(null);
    const [checkingPhone, setCheckingPhone] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: initialPhone,
        email: '',
        telegram_id: '',
        notes: '',
        tag_ids: [] as number[],
    });

    // Update phone when initialPhone changes
    useEffect(() => {
        if (initialPhone) {
            setFormData(prev => ({ ...prev, phone: initialPhone }));
        }
    }, [initialPhone]);

    // Check phone uniqueness when user stops typing
    useEffect(() => {
        if (!formData.phone || formData.phone.length < 5) {
            setExistingClient(null);
            return;
        }

        const timeoutId = setTimeout(async () => {
            setCheckingPhone(true);
            try {
                const response = await axios.post(route('clients.checkPhone'), {
                    phone: formData.phone,
                });
                
                if (response.data.exists) {
                    setExistingClient(response.data.client);
                } else {
                    setExistingClient(null);
                }
            } catch (error) {
                console.error('Error checking phone:', error);
            } finally {
                setCheckingPhone(false);
            }
        }, 500); // Debounce 500ms

        return () => clearTimeout(timeoutId);
    }, [formData.phone]);

    const handleUseExistingClient = () => {
        if (existingClient) {
            onClientCreated(existingClient);
            setFormData({ name: '', phone: '', email: '', telegram_id: '', notes: '', tag_ids: [] });
            setExistingClient(null);
            onOpenChange(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(route('clients.store'), formData);
            toast.success('Клиент создан');
            
            // Показываем achievement toast для онбординга
            showAchievementToast({
                step: 'first_client',
                message: 'Отлично! Вы добавили первого клиента',
            });
            
            onClientCreated(response.data);
            setFormData({ name: '', phone: '', email: '', telegram_id: '', notes: '', tag_ids: [] });
            setExistingClient(null);
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Не удалось создать клиента', {
                description: error.response?.data?.message || 'Попробуйте еще раз',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="w-5 h-5 text-primary" />
                        Быстрое создание клиента
                    </DialogTitle>
                    <DialogDescription>
                        Добавьте нового клиента для записи
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {/* Existing Client Alert */}
                    {existingClient && (
                        <Alert className="border-amber-500/50 bg-amber-50/50 dark:bg-amber-950/50">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="space-y-3">
                                <div>
                                    <p className="font-medium text-amber-900 dark:text-amber-100">
                                        Клиент с таким номером уже существует:
                                    </p>
                                    <p className="text-sm mt-1 text-amber-800 dark:text-amber-200">
                                        <strong>{existingClient.name}</strong>
                                        {existingClient.phone && ` • ${existingClient.phone}`}
                                        {existingClient.email && ` • ${existingClient.email}`}
                                    </p>
                                    {existingClient.tags && existingClient.tags.length > 0 && (
                                        <div className="flex gap-1 mt-2">
                                            {existingClient.tags.map((tag: any) => (
                                                <Badge
                                                    key={tag.id}
                                                    variant="outline"
                                                    className="text-xs"
                                                    style={{ borderColor: tag.color, color: tag.color }}
                                                >
                                                    {tag.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={handleUseExistingClient}
                                    >
                                        Добавить к записи
                                    </Button>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(`/app/clients/${existingClient.id}`, '_blank')}
                                    >
                                        <ExternalLink className="w-3 h-3 mr-1" />
                                        Открыть профиль
                                    </Button>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="name">
                            Имя <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="name"
                            placeholder="Иван Иванов"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Телефон</Label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="phone"
                                type="tel"
                                placeholder="+7 999 123-45-67"
                                className="pl-10"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="email@example.com"
                                className="pl-10"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="telegram_id">Telegram</Label>
                        <div className="relative">
                            <MessageSquare className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="telegram_id"
                                type="text"
                                placeholder="@username или ID"
                                className="pl-10"
                                value={formData.telegram_id}
                                onChange={(e) => setFormData({ ...formData, telegram_id: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Заметки</Label>
                        <Textarea
                            id="notes"
                            placeholder="Дополнительная информация..."
                            rows={3}
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>

                    {availableTags.length > 0 && (
                        <div className="space-y-2">
                            <Label>
                                <Tag className="w-4 h-4 inline mr-1" />
                                Теги
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {availableTags.map((tag: any) => {
                                    const isSelected = formData.tag_ids.includes(tag.id);
                                    return (
                                        <Badge
                                            key={tag.id}
                                            variant={isSelected ? "default" : "outline"}
                                            className="cursor-pointer transition-all hover:scale-105"
                                            style={isSelected ? {
                                                backgroundColor: tag.color,
                                                borderColor: tag.color,
                                                color: 'white',
                                            } : {
                                                borderColor: tag.color,
                                                color: tag.color,
                                            }}
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    tag_ids: isSelected
                                                        ? prev.tag_ids.filter(id => id !== tag.id)
                                                        : [...prev.tag_ids, tag.id]
                                                }));
                                            }}
                                        >
                                            {tag.name}
                                            {isSelected && <X className="w-3 h-3 ml-1" />}
                                        </Badge>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={loading || !formData.name}>
                            <Plus className="w-4 h-4 mr-2" />
                            {loading ? 'Создание...' : 'Создать клиента'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
