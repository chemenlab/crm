import { useState } from 'react';
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
import { Plus, Scissors } from 'lucide-react';
import { showAchievementToast } from '@/Components/Onboarding/AchievementToast';

// @ts-ignore
declare const route: any;

interface QuickCreateServiceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onServiceCreated: (service: any) => void;
}

export function QuickCreateServiceDialog({
    open,
    onOpenChange,
    onServiceCreated,
}: QuickCreateServiceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: '60',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await axios.post(route('services.store'), formData);
            toast.success('Услуга создана');
            
            // Показываем achievement toast для онбординга
            showAchievementToast({
                step: 'first_service',
                message: 'Отлично! Вы создали первую услугу',
            });
            
            onServiceCreated(response.data);
            setFormData({ name: '', price: '', duration: '60' });
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Не удалось создать услугу', {
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
                        <Scissors className="w-5 h-5 text-primary" />
                        Быстрое создание услуги
                    </DialogTitle>
                    <DialogDescription>
                        Добавьте новую услугу для записи
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="service-name">
                            Название услуги <span className="text-destructive">*</span>
                        </Label>
                        <Input
                            id="service-name"
                            placeholder="Стрижка, Окрашивание..."
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">
                                Цена (₽) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="price"
                                type="number"
                                placeholder="1000"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                required
                                min="0"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="duration">
                                Длительность (мин) <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="duration"
                                type="number"
                                placeholder="60"
                                value={formData.duration}
                                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                                required
                                min="15"
                                step="15"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Отмена
                        </Button>
                        <Button type="submit" disabled={loading || !formData.name || !formData.price}>
                            <Plus className="w-4 h-4 mr-2" />
                            {loading ? 'Создание...' : 'Создать услугу'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
