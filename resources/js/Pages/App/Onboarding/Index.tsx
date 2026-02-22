import { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Progress } from '@/Components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/Components/ui/select';
import { Badge } from '@/Components/ui/badge';
import { Checkbox } from '@/Components/ui/checkbox';
import { Switch } from '@/Components/ui/switch';
import { cn } from '@/lib/utils';
import {
    Scissors,
    Car,
    Wrench,
    GraduationCap,
    Laptop,
    MoreHorizontal,
    Check,
    AlertCircle,
    Loader2,
    ChevronRight,
    ChevronLeft,
    Clock,
    MapPin,
    Globe,
    Plus,
    Trash2,
    HelpCircle
} from 'lucide-react';

interface Props {
    user: any;
}

// Custom field type
interface CustomField {
    id: string;
    name: string;
    type: 'text' | 'number' | 'select' | 'checkbox' | 'date' | 'photo';
    is_required: boolean;
    is_public: boolean;
    options?: string[];
}

// Industry options
const industries = [
    { id: 'beauty', label: 'Бьюти', icon: Scissors, description: 'Салоны, мастера маникюра, парикмахеры' },
    { id: 'auto', label: 'Авто', icon: Car, description: 'Автосервисы, детейлинг, мойки' },
    { id: 'repair', label: 'Ремонт', icon: Wrench, description: 'Ремонт техники, бытовые услуги' },
    { id: 'education', label: 'Обучение', icon: GraduationCap, description: 'Репетиторы, курсы, тренинги' },
    { id: 'freelance', label: 'Фриланс', icon: Laptop, description: 'Дизайнеры, разработчики, консультанты' },
    { id: 'other', label: 'Другое', icon: MoreHorizontal, description: 'Любая другая сфера услуг' },
];

// Recommended fields by industry
const recommendedFields: Record<string, CustomField[]> = {
    beauty: [
        { id: 'allergy', name: 'Есть ли аллергия на материалы?', type: 'checkbox', is_required: false, is_public: true },
        { id: 'wishes', name: 'Пожелания к процедуре', type: 'text', is_required: false, is_public: true },
        { id: 'reference_photo', name: 'Референс / Пример (фото)', type: 'photo', is_required: false, is_public: true },
    ],
    auto: [
        { id: 'car_model', name: 'Марка и модель авто', type: 'text', is_required: true, is_public: true },
        { id: 'car_number', name: 'Госномер', type: 'text', is_required: false, is_public: true },
        { id: 'problem', name: 'Описание проблемы', type: 'text', is_required: false, is_public: true },
    ],
    repair: [
        { id: 'device_type', name: 'Тип устройства', type: 'text', is_required: true, is_public: true },
        { id: 'problem', name: 'Описание проблемы', type: 'text', is_required: true, is_public: true },
    ],
    education: [
        { id: 'level', name: 'Уровень подготовки', type: 'select', is_required: true, is_public: true, options: ['Начальный', 'Средний', 'Продвинутый'] },
        { id: 'goal', name: 'Цель обучения', type: 'text', is_required: false, is_public: true },
    ],
    freelance: [
        { id: 'task_link', name: 'Ссылка на ТЗ', type: 'text', is_required: false, is_public: true },
        { id: 'deadline', name: 'Желаемый срок', type: 'date', is_required: false, is_public: true },
        { id: 'budget', name: 'Бюджет', type: 'text', is_required: false, is_public: true },
        { id: 'reference', name: 'Референс (фото)', type: 'photo', is_required: false, is_public: true },
    ],
    other: [
        { id: 'comment', name: 'Комментарий к записи', type: 'text', is_required: false, is_public: true },
    ],
};

// Field type labels
const fieldTypeLabels: Record<string, string> = {
    text: 'Текст',
    number: 'Число',
    select: 'Выбор',
    checkbox: 'Галочка',
    date: 'Дата',
    photo: 'Фото',
};

// Timezone options
const timezones = [
    { value: 'Europe/Kaliningrad', label: 'Калининград (GMT+2)' },
    { value: 'Europe/Moscow', label: 'Москва (GMT+3)' },
    { value: 'Europe/Samara', label: 'Самара (GMT+4)' },
    { value: 'Asia/Yekaterinburg', label: 'Екатеринбург (GMT+5)' },
    { value: 'Asia/Omsk', label: 'Омск (GMT+6)' },
    { value: 'Asia/Krasnoyarsk', label: 'Красноярск (GMT+7)' },
    { value: 'Asia/Irkutsk', label: 'Иркутск (GMT+8)' },
    { value: 'Asia/Yakutsk', label: 'Якутск (GMT+9)' },
    { value: 'Asia/Vladivostok', label: 'Владивосток (GMT+10)' },
    { value: 'Asia/Magadan', label: 'Магадан (GMT+11)' },
    { value: 'Asia/Kamchatka', label: 'Камчатка (GMT+12)' },
];

// Currency options
const currencies = [
    { value: 'RUB', label: 'RUB (₽)', symbol: '₽' },
    { value: 'USD', label: 'USD ($)', symbol: '$' },
    { value: 'EUR', label: 'EUR (€)', symbol: '€' },
];

// Tax regime options
const taxRegimes = [
    { value: 'self_employed', label: 'Самозанятый (НПД)', rate: '4-6%', description: 'Налог на профессиональный доход' },
    { value: 'ip_usn', label: 'ИП (УСН)', rate: '6%', description: 'Упрощенная система налогообложения' },
    { value: 'custom', label: 'Свой режим', rate: 'Своя ставка', description: 'Укажите свою налоговую ставку' },
];

// Days of week for schedule
const daysOfWeek = [
    { value: 0, label: 'Вс', full: 'Воскресенье' },
    { value: 1, label: 'Пн', full: 'Понедельник' },
    { value: 2, label: 'Вт', full: 'Вторник' },
    { value: 3, label: 'Ср', full: 'Среда' },
    { value: 4, label: 'Чт', full: 'Четверг' },
    { value: 5, label: 'Пт', full: 'Пятница' },
    { value: 6, label: 'Сб', full: 'Суббота' },
];

export default function OnboardingIndex({ user }: Props) {
    const [step, setStep] = useState(1);
    const totalSteps = 5; // Now 5 steps with custom fields
    const progress = (step / totalSteps) * 100;

    // Form state
    const [formData, setFormData] = useState({
        // Step 1
        industry: '',
        // Step 2
        business_name: user?.name || '',
        timezone: 'Europe/Moscow',
        currency: 'RUB',
        tax_regime: '',
        tax_rate: '',
        // Step 3
        service: {
            name: '',
            price: '',
            duration: '60',
            description: '',
        },
        slug: '',
        enable_online_booking: true,
        // Step 4 - Custom fields
        custom_fields: [] as CustomField[],
        // Step 5
        phone: user?.phone || '',
        address: '',
        city: '',
        instagram: '',
        telegram: '',
        whatsapp: '',
        schedule: daysOfWeek.map(day => ({
            day_of_week: day.value,
            is_working: [1, 2, 3, 4, 5].includes(day.value),
            start_time: '09:00',
            end_time: '18:00',
        })),
    });

    // Slug validation state
    const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
    const [slugDebounce, setSlugDebounce] = useState<ReturnType<typeof setTimeout> | null>(null);

    // Check slug availability
    const checkSlug = async (slug: string) => {
        if (!slug || slug.length < 3) {
            setSlugStatus('idle');
            return;
        }

        setSlugStatus('checking');

        try {
            const response = await fetch('/app/onboarding/check-slug', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                credentials: 'same-origin',
                body: JSON.stringify({ slug }),
            });

            if (response.ok) {
                const data = await response.json();
                setSlugStatus(data.available ? 'available' : 'taken');
            } else {
                console.error('Slug check failed:', response.status);
                setSlugStatus('idle');
            }
        } catch (error) {
            console.error('Slug check error:', error);
            setSlugStatus('idle');
        }
    };

    // Handle slug change with debounce
    const handleSlugChange = (value: string) => {
        const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
        setFormData({ ...formData, slug: sanitized });

        if (slugDebounce) clearTimeout(slugDebounce);
        const timeout = setTimeout(() => checkSlug(sanitized), 500);
        setSlugDebounce(timeout);
    };

    // Add recommended fields for industry
    const addRecommendedFields = () => {
        const fields = recommendedFields[formData.industry] || [];
        const newFields = fields.map(f => ({ ...f, id: `${f.id}_${Date.now()}` }));
        setFormData({ ...formData, custom_fields: [...formData.custom_fields, ...newFields] });
    };

    // Add custom field
    const addCustomField = () => {
        const newField: CustomField = {
            id: `field_${Date.now()}`,
            name: '',
            type: 'text',
            is_required: false,
            is_public: true,
        };
        setFormData({ ...formData, custom_fields: [...formData.custom_fields, newField] });
    };

    // Remove custom field
    const removeCustomField = (id: string) => {
        setFormData({
            ...formData,
            custom_fields: formData.custom_fields.filter(f => f.id !== id)
        });
    };

    // Update custom field
    const updateCustomField = (id: string, updates: Partial<CustomField>) => {
        setFormData({
            ...formData,
            custom_fields: formData.custom_fields.map(f =>
                f.id === id ? { ...f, ...updates } : f
            ),
        });
    };

    // Validation
    const canProceed = () => {
        switch (step) {
            case 1:
                return formData.industry !== '';
            case 2:
                return (
                    formData.business_name.trim() !== '' &&
                    formData.timezone !== '' &&
                    formData.currency !== '' &&
                    formData.tax_regime !== '' &&
                    (formData.tax_regime !== 'custom' || formData.tax_rate !== '')
                );
            case 3:
                const serviceValid =
                    formData.service.name.trim() !== '' &&
                    formData.service.price !== '' &&
                    formData.service.duration !== '';

                if (formData.enable_online_booking) {
                    return serviceValid && formData.slug.length >= 3 && slugStatus === 'available';
                }
                return serviceValid;
            case 4:
                // Custom fields step - always can proceed (fields are optional)
                // But if there are fields, they should have names
                return formData.custom_fields.every(f => f.name.trim() !== '');
            case 5:
                return formData.phone.trim() !== '';
            default:
                return true;
        }
    };

    // Navigation
    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        } else {
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    // Submit
    const handleSubmit = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.post('/app/onboarding/complete', formData as any);
    };

    // Render steps
    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Расскажите о себе</h1>
                            <p className="text-muted-foreground">
                                Мы настроим категории услуг под вашу сферу
                            </p>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {industries.map((industry) => {
                                const Icon = industry.icon;
                                const isSelected = formData.industry === industry.id;
                                return (
                                    <Card
                                        key={industry.id}
                                        className={cn(
                                            "cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
                                            isSelected && "border-primary ring-2 ring-primary/20 bg-primary/5"
                                        )}
                                        onClick={() => setFormData({ ...formData, industry: industry.id })}
                                    >
                                        <CardContent className="p-4 text-center space-y-2">
                                            <div className={cn(
                                                "mx-auto w-12 h-12 rounded-full flex items-center justify-center transition-colors",
                                                isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                                            )}>
                                                <Icon className="w-6 h-6" />
                                            </div>
                                            <h3 className="font-semibold">{industry.label}</h3>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                                {industry.description}
                                            </p>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                );

            case 2:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Настройки бизнеса</h1>
                            <p className="text-muted-foreground">
                                Чтобы правильно считать время и деньги
                            </p>
                        </div>
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="business_name">Название (видят клиенты)</Label>
                                <Input
                                    id="business_name"
                                    value={formData.business_name}
                                    onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                                    placeholder="Имя Мастера или нейминг"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Часовой пояс</Label>
                                    <Select
                                        value={formData.timezone}
                                        onValueChange={(value) => setFormData({ ...formData, timezone: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timezones.map((tz) => (
                                                <SelectItem key={tz.value} value={tz.value}>
                                                    {tz.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Валюта</Label>
                                    <Select
                                        value={formData.currency}
                                        onValueChange={(value) => setFormData({ ...formData, currency: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currencies.map((cur) => (
                                                <SelectItem key={cur.value} value={cur.value}>
                                                    {cur.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label>Налоговый режим</Label>
                                <div className="grid gap-3">
                                    {taxRegimes.map((regime) => (
                                        <Card
                                            key={regime.value}
                                            className={cn(
                                                "cursor-pointer transition-all hover:border-primary/50",
                                                formData.tax_regime === regime.value && "border-primary ring-2 ring-primary/20"
                                            )}
                                            onClick={() => setFormData({ ...formData, tax_regime: regime.value, tax_rate: '' })}
                                        >
                                            <CardContent className="p-4 flex items-center justify-between">
                                                <div className="space-y-0.5">
                                                    <div className="font-medium">{regime.label}</div>
                                                    <div className="text-xs text-muted-foreground">{regime.description}</div>
                                                </div>
                                                <Badge variant="secondary">{regime.rate}</Badge>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>

                                {formData.tax_regime === 'custom' && (
                                    <div className="space-y-2 pt-2">
                                        <Label htmlFor="tax_rate">Ваша налоговая ставка (%)</Label>
                                        <Input
                                            id="tax_rate"
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={formData.tax_rate}
                                            onChange={(e) => setFormData({ ...formData, tax_rate: e.target.value })}
                                            placeholder="Введите процент"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );

            case 3:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Создайте первую услугу</h1>
                            <p className="text-muted-foreground">
                                Вы сможете добавить больше услуг позже
                            </p>
                        </div>

                        <Card>
                            <CardContent className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="service_name">Название услуги *</Label>
                                    <Input
                                        id="service_name"
                                        value={formData.service.name}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            service: { ...formData.service, name: e.target.value }
                                        })}
                                        placeholder="Например: Маникюр с покрытием"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="service_price">Цена (₽) *</Label>
                                        <Input
                                            id="service_price"
                                            type="number"
                                            value={formData.service.price}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                service: { ...formData.service, price: e.target.value }
                                            })}
                                            placeholder="1500"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="service_duration">Длительность *</Label>
                                        <Select
                                            value={formData.service.duration}
                                            onValueChange={(value) => setFormData({
                                                ...formData,
                                                service: { ...formData.service, duration: value }
                                            })}
                                        >
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="15">15 минут</SelectItem>
                                                <SelectItem value="30">30 минут</SelectItem>
                                                <SelectItem value="45">45 минут</SelectItem>
                                                <SelectItem value="60">1 час</SelectItem>
                                                <SelectItem value="90">1.5 часа</SelectItem>
                                                <SelectItem value="120">2 часа</SelectItem>
                                                <SelectItem value="180">3 часа</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="service_description">Описание</Label>
                                    <Textarea
                                        id="service_description"
                                        value={formData.service.description}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            service: { ...formData.service, description: e.target.value }
                                        })}
                                        placeholder="Краткое описание услуги..."
                                        rows={2}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-4 space-y-4">
                                <div className="flex items-center gap-3">
                                    <Checkbox
                                        id="enable_online_booking"
                                        checked={formData.enable_online_booking}
                                        onCheckedChange={(checked) => setFormData({
                                            ...formData,
                                            enable_online_booking: !!checked
                                        })}
                                    />
                                    <div>
                                        <Label htmlFor="enable_online_booking" className="font-semibold cursor-pointer">
                                            Включить онлайн-запись
                                        </Label>
                                        <p className="text-xs text-muted-foreground">
                                            Мини-сайт для клиентов
                                        </p>
                                    </div>
                                </div>

                                {formData.enable_online_booking && (
                                    <div className="space-y-2">
                                        <Label htmlFor="slug">Ссылка на мини-сайт *</Label>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm text-muted-foreground whitespace-nowrap">
                                                /m/
                                            </span>
                                            <div className="relative flex-1">
                                                <Input
                                                    id="slug"
                                                    value={formData.slug}
                                                    onChange={(e) => handleSlugChange(e.target.value)}
                                                    placeholder="your-name"
                                                    className={cn(
                                                        slugStatus === 'available' && "border-emerald-500 focus-visible:ring-emerald-500",
                                                        slugStatus === 'taken' && "border-red-500 focus-visible:ring-red-500"
                                                    )}
                                                />
                                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                                    {slugStatus === 'checking' && (
                                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                    )}
                                                    {slugStatus === 'available' && (
                                                        <Check className="h-4 w-4 text-emerald-500" />
                                                    )}
                                                    {slugStatus === 'taken' && (
                                                        <AlertCircle className="h-4 w-4 text-red-500" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        {slugStatus === 'taken' && (
                                            <p className="text-xs text-red-500">
                                                Эта ссылка уже занята, попробуйте другую
                                            </p>
                                        )}
                                        {slugStatus === 'available' && (
                                            <p className="text-xs text-emerald-600">
                                                Отлично! Ссылка свободна
                                            </p>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                );

            case 4:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Кастомные поля</h1>
                            <p className="text-muted-foreground">
                                Какую информацию собирать от клиентов при записи?
                            </p>
                        </div>

                        {/* Info card */}
                        <Card className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
                            <CardContent className="p-4 flex gap-3">
                                <HelpCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                                <div className="text-sm">
                                    <p className="font-medium text-blue-900 dark:text-blue-100">Зачем нужны кастомные поля?</p>
                                    <p className="text-blue-700 dark:text-blue-300 mt-1">
                                        Клиенты заполнят эти поля при записи. Вы получите нужную информацию заранее —
                                        марка авто, аллергии, пожелания и т.д.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Recommended fields */}
                        {formData.custom_fields.length === 0 && recommendedFields[formData.industry] && (
                            <Card>
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Рекомендуем для вашей сферы</CardTitle>
                                    <CardDescription>
                                        Популярные поля для {industries.find(i => i.id === formData.industry)?.label.toLowerCase() || 'вашей сферы'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-0">
                                    <div className="space-y-2 mb-4">
                                        {recommendedFields[formData.industry].map((field) => (
                                            <div key={field.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded">
                                                <span>{field.name}</span>
                                                <Badge variant="outline">{fieldTypeLabels[field.type]}</Badge>
                                            </div>
                                        ))}
                                    </div>
                                    <Button
                                        type="button"
                                        onClick={addRecommendedFields}
                                        className="w-full"
                                    >
                                        <Plus className="h-4 w-4 mr-2" />
                                        Добавить рекомендуемые поля
                                    </Button>
                                </CardContent>
                            </Card>
                        )}

                        {/* Current fields */}
                        {formData.custom_fields.length > 0 && (
                            <div className="space-y-3">
                                {formData.custom_fields.map((field
                                ) => (
                                    <Card key={field.id}>
                                        <CardContent className="p-4">
                                            <div className="flex items-start gap-3">
                                                <div className="flex-1 space-y-3">
                                                    <Input
                                                        value={field.name}
                                                        onChange={(e) => updateCustomField(field.id, { name: e.target.value })}
                                                        placeholder="Название поля"
                                                    />
                                                    <div className="flex items-center gap-4">
                                                        <Select
                                                            value={field.type}
                                                            onValueChange={(value) => updateCustomField(field.id, { type: value as CustomField['type'] })}
                                                        >
                                                            <SelectTrigger className="w-32">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="text">Текст</SelectItem>
                                                                <SelectItem value="number">Число</SelectItem>
                                                                <SelectItem value="checkbox">Галочка</SelectItem>
                                                                <SelectItem value="date">Дата</SelectItem>
                                                                <SelectItem value="photo">Фото</SelectItem>
                                                                <SelectItem value="select">Выбор</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                id={`required_${field.id}`}
                                                                checked={field.is_required}
                                                                onCheckedChange={(checked) => updateCustomField(field.id, { is_required: checked })}
                                                            />
                                                            <Label htmlFor={`required_${field.id}`} className="text-xs">
                                                                Обязательное
                                                            </Label>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Switch
                                                                id={`public_${field.id}`}
                                                                checked={field.is_public}
                                                                onCheckedChange={(checked) => updateCustomField(field.id, { is_public: checked })}
                                                            />
                                                            <Label htmlFor={`public_${field.id}`} className="text-xs">
                                                                На сайте
                                                            </Label>
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => removeCustomField(field.id)}
                                                    className="text-muted-foreground hover:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}

                        {/* Add field button */}
                        <Button
                            type="button"
                            variant="outline"
                            onClick={addCustomField}
                            className="w-full"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Добавить своё поле
                        </Button>

                        {formData.custom_fields.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground">
                                Можно пропустить и настроить позже в настройках
                            </p>
                        )}
                    </div>
                );

            case 5:
                return (
                    <div className="space-y-6">
                        <div className="text-center space-y-2">
                            <h1 className="text-2xl font-bold">Адрес и контакты</h1>
                            <p className="text-muted-foreground">
                                Укажите как с вами связаться и график работы
                            </p>
                        </div>

                        <div className="grid gap-6 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Контакты
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Телефон *</Label>
                                        <Input
                                            id="phone"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            placeholder="+7 (999) 123-45-67"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="city">Город</Label>
                                        <Input
                                            id="city"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            placeholder="Москва"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="address">Адрес</Label>
                                        <Input
                                            id="address"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            placeholder="ул. Примерная, д. 1"
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Globe className="h-4 w-4" />
                                        Социальные сети
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="instagram">Instagram</Label>
                                        <Input
                                            id="instagram"
                                            value={formData.instagram}
                                            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                                            placeholder="@username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="telegram">Telegram</Label>
                                        <Input
                                            id="telegram"
                                            value={formData.telegram}
                                            onChange={(e) => setFormData({ ...formData, telegram: e.target.value })}
                                            placeholder="@username"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="whatsapp">WhatsApp</Label>
                                        <Input
                                            id="whatsapp"
                                            value={formData.whatsapp}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            placeholder="+7 (999) 123-45-67"
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    График работы
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {daysOfWeek.map((day) => {
                                        const scheduleItem = formData.schedule.find(s => s.day_of_week === day.value);
                                        return (
                                            <div key={day.value} className="flex items-center gap-4">
                                                <div className="w-8">
                                                    <Checkbox
                                                        checked={scheduleItem?.is_working}
                                                        onCheckedChange={(checked) => {
                                                            const newSchedule = [...formData.schedule];
                                                            const idx = newSchedule.findIndex(s => s.day_of_week === day.value);
                                                            if (idx !== -1) {
                                                                newSchedule[idx].is_working = !!checked;
                                                            }
                                                            setFormData({ ...formData, schedule: newSchedule });
                                                        }}
                                                    />
                                                </div>
                                                <span className={cn(
                                                    "w-24 font-medium",
                                                    !scheduleItem?.is_working && "text-muted-foreground"
                                                )}>
                                                    {day.full}
                                                </span>
                                                {scheduleItem?.is_working ? (
                                                    <div className="flex items-center gap-2">
                                                        <Input
                                                            type="time"
                                                            value={scheduleItem.start_time}
                                                            onChange={(e) => {
                                                                const newSchedule = [...formData.schedule];
                                                                const idx = newSchedule.findIndex(s => s.day_of_week === day.value);
                                                                if (idx !== -1) {
                                                                    newSchedule[idx].start_time = e.target.value;
                                                                }
                                                                setFormData({ ...formData, schedule: newSchedule });
                                                            }}
                                                            className="w-28"
                                                        />
                                                        <span className="text-muted-foreground">—</span>
                                                        <Input
                                                            type="time"
                                                            value={scheduleItem.end_time}
                                                            onChange={(e) => {
                                                                const newSchedule = [...formData.schedule];
                                                                const idx = newSchedule.findIndex(s => s.day_of_week === day.value);
                                                                if (idx !== -1) {
                                                                    newSchedule[idx].end_time = e.target.value;
                                                                }
                                                                setFormData({ ...formData, schedule: newSchedule });
                                                            }}
                                                            className="w-28"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">Выходной</span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <>
            <Head title="Настройка профиля" />
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    {/* Progress */}
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">
                                Шаг {step} из {totalSteps}
                            </span>
                            <span className="text-sm font-medium">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>

                    {/* Content */}
                    <div className="bg-card border rounded-2xl shadow-lg p-6 md:p-8">
                        {renderStep()}

                        {/* Navigation */}
                        <div className="flex items-center justify-between mt-8 pt-6 border-t">
                            <Button
                                variant="ghost"
                                onClick={handleBack}
                                disabled={step === 1}
                                className="gap-2"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                Назад
                            </Button>
                            <Button
                                onClick={handleNext}
                                disabled={!canProceed()}
                                className="gap-2"
                            >
                                {step === totalSteps ? 'Начать работу' : 'Продолжить'}
                                {step < totalSteps && <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
