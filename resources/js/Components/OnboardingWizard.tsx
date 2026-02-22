import { useState } from 'react';
import { router } from '@inertiajs/react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Progress } from '@/Components/ui/progress';
import { Badge } from '@/Components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { PlusIcon, TrashIcon, Sparkles, User, Calendar, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingWizardProps {
    open: boolean;
    onComplete: () => void;
}

interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'date' | 'select' | 'checkbox';
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
    const [step, setStep] = useState(1);
    const [customFields, setCustomFields] = useState<CustomField[]>([]);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        bio: '',
    });

    const totalSteps = 4;
    const progress = (step / totalSteps) * 100;

    const addCustomField = () => {
        setCustomFields([...customFields, {
            id: Date.now().toString(),
            name: '',
            type: 'text',
        }]);
    };

    const removeCustomField = (id: string) => {
        setCustomFields(customFields.filter(field => field.id !== id));
    };

    const updateCustomField = (id: string, key: keyof CustomField, value: string) => {
        setCustomFields(customFields.map(field =>
            field.id === id ? { ...field, [key]: value } : field
        ));
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleComplete();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleComplete = () => {
        const fieldsToSend = customFields
            .filter(field => field.name.trim() !== '')
            .map(field => ({
                name: field.name,
                type: field.type,
                is_required: false,
                is_public: true,
            }));

        router.post('/app/onboarding/complete', {
            profile: profileData,
            custom_fields: fieldsToSend,
        }, {
            onSuccess: () => {
                onComplete();
            },
        });
    };

    const getStepIcon = (stepNumber: number) => {
        switch (stepNumber) {
            case 1: return Sparkles;
            case 2: return Calendar;
            case 3: return User;
            case 4: return CheckCircle2;
            default: return Sparkles;
        }
    };

    const renderStep = () => {
        const StepIcon = getStepIcon(step);
        
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                <div className="relative bg-primary/10 p-4 rounded-full">
                                    <Sparkles className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Добро пожаловать! 👋</h2>
                            <p className="text-muted-foreground">
                                Давайте настроим ваш профиль за несколько простых шагов
                            </p>
                        </div>
                        <Card className="border-primary/20 bg-primary/5">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base">Что мы настроим:</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Кастомные поля для клиентов</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>Информацию профиля</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <CheckCircle2 className="h-4 w-4 text-primary" />
                                    <span>График работы</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                <div className="relative bg-primary/10 p-4 rounded-full">
                                    <Calendar className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Кастомные поля</h3>
                            <p className="text-sm text-muted-foreground">
                                Создайте поля для сбора информации от клиентов при записи
                            </p>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
                            {customFields.map((field) => (
                                <Card key={field.id} className="border-muted">
                                    <CardContent className="p-3">
                                        <div className="flex gap-2 items-start">
                                            <div className="flex-1 space-y-2">
                                                <Input
                                                    placeholder="Название поля (например: Дата рождения)"
                                                    value={field.name}
                                                    onChange={(e) => updateCustomField(field.id, 'name', e.target.value)}
                                                />
                                                <Select
                                                    value={field.type}
                                                    onValueChange={(value) => updateCustomField(field.id, 'type', value)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="text">Текст</SelectItem>
                                                        <SelectItem value="number">Число</SelectItem>
                                                        <SelectItem value="date">Дата</SelectItem>
                                                        <SelectItem value="select">Выбор</SelectItem>
                                                        <SelectItem value="checkbox">Чекбокс</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => removeCustomField(field.id)}
                                                className="shrink-0"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            onClick={addCustomField}
                            className="w-full border-dashed"
                        >
                            <PlusIcon className="h-4 w-4 mr-2" />
                            Добавить поле
                        </Button>

                        <Card className="border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20">
                            <CardContent className="p-3">
                                <div className="flex items-start gap-2">
                                    <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
                                    <div className="space-y-1 text-xs">
                                        <p className="font-medium text-blue-900 dark:text-blue-100">Примеры полей:</p>
                                        <p className="text-blue-700 dark:text-blue-300">Дата рождения • Предпочтения • Аллергии • Особые пожелания</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                                <div className="relative bg-primary/10 p-4 rounded-full">
                                    <User className="h-8 w-8 text-primary" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-xl font-semibold">Ваш профиль</h3>
                            <p className="text-sm text-muted-foreground">
                                Расскажите о себе
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-medium">
                                    Имя <Badge variant="destructive" className="ml-1 text-xs">обязательно</Badge>
                                </Label>
                                <Input
                                    id="name"
                                    value={profileData.name}
                                    onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                                    placeholder="Ваше имя"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone" className="text-sm font-medium">
                                    Телефон <Badge variant="destructive" className="ml-1 text-xs">обязательно</Badge>
                                </Label>
                                <Input
                                    id="phone"
                                    value={profileData.phone}
                                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                                    placeholder="+7 (999) 123-45-67"
                                    className="h-10"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio" className="text-sm font-medium">О себе</Label>
                                <Textarea
                                    id="bio"
                                    value={profileData.bio}
                                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                                    placeholder="Расскажите о своих услугах и опыте..."
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-center">
                            <div className="relative">
                                <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full animate-pulse" />
                                <div className="relative bg-emerald-500/10 p-6 rounded-full">
                                    <CheckCircle2 className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                                </div>
                            </div>
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold">Готово! 🎉</h2>
                            <p className="text-muted-foreground">
                                Ваш профиль настроен. Теперь вы можете начать работу!
                            </p>
                        </div>
                        <Card className="border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base text-emerald-900 dark:text-emerald-100">Что дальше:</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                                    <ArrowRight className="h-4 w-4" />
                                    <span>Добавьте свои услуги</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                                    <ArrowRight className="h-4 w-4" />
                                    <span>Настройте график работы</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-emerald-700 dark:text-emerald-300">
                                    <ArrowRight className="h-4 w-4" />
                                    <span>Поделитесь ссылкой для записи с клиентами</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    const canProceed = () => {
        if (step === 3) {
            return profileData.name.trim() !== '' && profileData.phone.trim() !== '';
        }
        return true;
    };

    return (
        <Dialog open={open} onOpenChange={() => { }}>
            <DialogContent className="sm:max-w-[550px] gap-0 p-0" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader className="px-6 pt-6 pb-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 w-12 rounded-full transition-all ${
                                        s <= step 
                                            ? 'bg-primary' 
                                            : 'bg-muted'
                                    }`}
                                />
                            ))}
                        </div>
                        <Badge variant="secondary" className="text-xs">
                            {step} / {totalSteps}
                        </Badge>
                    </div>
                    <DialogTitle className="sr-only">Настройка профиля - Шаг {step} из {totalSteps}</DialogTitle>
                </DialogHeader>

                <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
                    {renderStep()}
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-muted/30 flex-row justify-between sm:justify-between gap-2">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Назад
                    </Button>
                    <Button
                        onClick={handleNext}
                        disabled={!canProceed()}
                        className="gap-2"
                    >
                        {step === totalSteps ? (
                            <>
                                Завершить
                                <CheckCircle2 className="h-4 w-4" />
                            </>
                        ) : (
                            <>
                                Далее
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
