import { Head, router, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Toaster } from '@/Components/ui/sonner';
import { toast } from 'sonner';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Separator } from '@/Components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { CustomFieldsManager } from '@/Components/CustomFieldsManager';
import { ClientTagsManager } from '@/Components/ClientTagsManager';
import { WorkSchedule } from '@/Components/WorkSchedule';
import { NotificationSettings } from '@/Components/NotificationSettings';
import { AvatarUpload } from '@/Components/AvatarUpload';
import { PortfolioUpload } from '@/Components/PortfolioUpload';
import ConnectedAccounts from '@/Components/Settings/ConnectedAccounts';
import TwoFactorSettings from '@/Components/Settings/TwoFactorSettings';
import TelegramIntegration from '@/Components/Settings/TelegramIntegration';
import TelegramNotificationSettings from '@/Components/Settings/TelegramNotificationSettings';
import { showAchievementToast } from '@/Components/Onboarding/AchievementToast';
import { cn } from '@/lib/utils';
import {
    User,
    FileText,
    Tag,
    Bell,
    Globe,
    Link as LinkIcon,
    Shield,
    Clock
} from 'lucide-react';

// @ts-ignore
declare const route: any;

interface PortfolioItem {
    id: number;
    title: string;
    description: string | null;
    image_path: string;
    thumbnail_path: string;
    tag: string | null;
    sort_order: number;
    is_visible: boolean;
}

interface Props {
    auth: any;
    user: any;
    schedule: any[];
    notifications: any;
    oauthProviders?: {
        google?: { connected: boolean; email?: string };
        yandex?: { connected: boolean; email?: string };
    };
    twoFactor?: {
        enabled: boolean;
        enabledAt?: string;
        unusedRecoveryCodesCount: number;
    };
    portfolioItems?: PortfolioItem[];
    remainingPortfolioSlots?: number;
    bookingSettings?: {
        slot_step: number;
        buffer_time: number;
    };
}

type TabValue = 'profile' | 'fields' | 'client-tags' | 'notifications' | 'security' | 'public_page' | 'integrations' | 'booking';

const tabs = [
    { value: 'profile' as TabValue, label: 'Профиль', icon: User },
    { value: 'fields' as TabValue, label: 'Кастомные поля', icon: FileText },
    { value: 'client-tags' as TabValue, label: 'Теги клиентов', icon: Tag },
    { value: 'notifications' as TabValue, label: 'Уведомления', icon: Bell },
    { value: 'security' as TabValue, label: 'Безопасность', icon: Shield },
    { value: 'public_page' as TabValue, label: 'Публичная страница', icon: Globe },
    { value: 'booking' as TabValue, label: 'Настройки записи', icon: Clock },
    { value: 'integrations' as TabValue, label: 'Интеграции', icon: LinkIcon },
];

export default function SettingsIndex({ auth, user, schedule, notifications, oauthProviders, twoFactor, portfolioItems = [], remainingPortfolioSlots = 0, bookingSettings }: Props) {
    const { flash } = usePage().props as any;

    // Получаем параметр tab из URL
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab') as TabValue | null;

    const [activeTab, setActiveTab] = useState<TabValue>(tabFromUrl || 'profile');
    const [timezone, setTimezone] = useState(auth.user?.timezone || 'Europe/Moscow');
    const [slotStep, setSlotStep] = useState(String(bookingSettings?.slot_step ?? 30));
    const [bufferTime, setBufferTime] = useState(String(bookingSettings?.buffer_time ?? 0));
    const [isBookingSubmitting, setIsBookingSubmitting] = useState(false);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success);
        }
        if (flash?.error) {
            toast.error(flash.error);
        }
    }, [flash]);

    return (
        <AppSidebarProvider>
            <Toaster />
            <Head title="Настройки" />
            <AppSidebar variant="inset" />
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col p-2 sm:p-4 lg:p-6 pt-0">
                    {/* Header */}
                    <div className="py-4 sm:py-6">
                        <h1 className="text-2xl sm:text-3xl font-bold">Настройки</h1>
                        <p className="text-sm text-muted-foreground mt-1">
                            Обновите настройки аккаунта и управляйте интеграциями.
                        </p>
                    </div>

                    {/* Main Layout: Sidebar + Content */}
                    <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
                        {/* Left Sidebar - Navigation */}
                        <aside className="lg:w-56 flex-shrink-0">
                            {/* Mobile: Horizontal scrollable tabs */}
                            <nav className="lg:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.value}
                                            onClick={() => setActiveTab(tab.value)}
                                            className={cn(
                                                "flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0",
                                                activeTab === tab.value
                                                    ? "bg-muted text-foreground"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "h-4 w-4",
                                                activeTab === tab.value && "text-primary"
                                            )} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>

                            {/* Desktop: Vertical tabs */}
                            <nav className="hidden lg:block space-y-1 lg:sticky lg:top-4">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.value}
                                            onClick={() => setActiveTab(tab.value)}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors",
                                                activeTab === tab.value
                                                    ? "bg-muted text-foreground"
                                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                            )}
                                        >
                                            <Icon className={cn(
                                                "h-4 w-4 flex-shrink-0",
                                                activeTab === tab.value && "text-primary"
                                            )} />
                                            <span className="truncate">{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </aside>

                        {/* Right Content Area */}
                        <div className="flex-1 min-w-0 max-w-5xl">
                            {/* Profile Tab */}
                            {activeTab === 'profile' && (
                                <div className="space-y-6">
                                    {/* Section Header */}
                                    <div>
                                        <h2 className="text-xl font-semibold">Профиль</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Настройки и опции для вашего аккаунта.
                                        </p>
                                    </div>

                                    {/* Profile Content */}
                                    <div className="space-y-6">
                                        {/* Верхний ряд: Личная информация слева, График работы справа */}
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Личная информация */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Личная информация</CardTitle>
                                                    <CardDescription>
                                                        Обновите информацию вашего профиля
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                    <AvatarUpload user={auth.user} />

                                                    <Separator />

                                                    <form method="POST" onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const formData = new FormData(e.currentTarget);
                                                        const data = Object.fromEntries(formData);
                                                        router.put('/app/settings/profile', data);
                                                    }}>
                                                        <div className="grid gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="name">Имя *</Label>
                                                                <Input id="name" name="name" defaultValue={auth.user?.name} required />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="email">Email *</Label>
                                                                <Input id="email" type="email" defaultValue={auth.user?.email} disabled className="bg-muted" />
                                                                <p className="text-xs text-muted-foreground">Email нельзя изменить</p>
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="phone">Телефон *</Label>
                                                                <Input id="phone" name="phone" defaultValue={auth.user?.phone} required />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="timezone">Часовой пояс *</Label>
                                                                <input type="hidden" name="timezone" value={timezone} />
                                                                <Select value={timezone} onValueChange={setTimezone}>
                                                                    <SelectTrigger>
                                                                        <SelectValue placeholder="Выберите часовой пояс" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        <SelectItem value="Europe/Kaliningrad">Калининград (GMT+2)</SelectItem>
                                                                        <SelectItem value="Europe/Moscow">Москва (GMT+3)</SelectItem>
                                                                        <SelectItem value="Europe/Samara">Самара (GMT+4)</SelectItem>
                                                                        <SelectItem value="Asia/Yekaterinburg">Екатеринбург (GMT+5)</SelectItem>
                                                                        <SelectItem value="Asia/Omsk">Омск (GMT+6)</SelectItem>
                                                                        <SelectItem value="Asia/Krasnoyarsk">Красноярск (GMT+7)</SelectItem>
                                                                        <SelectItem value="Asia/Irkutsk">Иркутск (GMT+8)</SelectItem>
                                                                        <SelectItem value="Asia/Yakutsk">Якутск (GMT+9)</SelectItem>
                                                                        <SelectItem value="Asia/Vladivostok">Владивосток (GMT+10)</SelectItem>
                                                                        <SelectItem value="Asia/Magadan">Магадан (GMT+11)</SelectItem>
                                                                        <SelectItem value="Asia/Kamchatka">Камчатка (GMT+12)</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Используется для записей и уведомлений. При переезде измените часовой пояс.
                                                                </p>
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="tax_rate">Налоговая ставка (%)</Label>
                                                                <Input id="tax_rate" name="tax_rate" type="number" step="0.1" defaultValue={auth.user?.tax_rate || '4'} placeholder="4" />
                                                                <p className="text-xs text-muted-foreground">Для расчета примерного налога на дашборде</p>
                                                            </div>
                                                            <Button type="submit" className="w-full sm:w-fit">Сохранить</Button>
                                                        </div>
                                                    </form>
                                                </CardContent>
                                            </Card>

                                            {/* График работы */}
                                            <WorkSchedule initialSchedule={schedule} />
                                        </div>

                                        {/* Нижний ряд: Смена пароля */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Смена пароля</CardTitle>
                                                <CardDescription>
                                                    Измените пароль для входа в аккаунт
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <form method="POST" onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const data = Object.fromEntries(formData);
                                                    router.put('/app/settings/profile/password', data, {
                                                        onSuccess: () => {
                                                            (e.target as HTMLFormElement).reset();
                                                        },
                                                    });
                                                }}>
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="current_password">Текущий пароль</Label>
                                                            <Input id="current_password" name="current_password" type="password" required />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="password">Новый пароль</Label>
                                                            <Input id="password" name="password" type="password" required />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="password_confirmation">Подтверждение пароля</Label>
                                                            <Input id="password_confirmation" name="password_confirmation" type="password" required />
                                                        </div>
                                                    </div>
                                                    <Button type="submit" className="w-full sm:w-fit mt-4">Изменить пароль</Button>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    </div>
                                </div>
                            )}

                            {/* Custom Fields Tab */}
                            {activeTab === 'fields' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Кастомные поля</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Создавайте дополнительные поля для сбора информации от клиентов
                                        </p>
                                    </div>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <CustomFieldsManager />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Client Tags Tab */}
                            {activeTab === 'client-tags' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Теги клиентов</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Создавайте метки для классификации клиентов: "VIP", "Постоянный", "Проблемный" и т.д.
                                        </p>
                                    </div>
                                    <Card>
                                        <CardContent className="pt-6">
                                            <ClientTagsManager />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Notifications Tab */}
                            {activeTab === 'notifications' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Уведомления</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Настройте параметры уведомлений
                                        </p>
                                    </div>

                                    <NotificationSettings settings={notifications} />
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Безопасность</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Управляйте настройками безопасности вашего аккаунта
                                        </p>
                                    </div>
                                    <div className="space-y-6">
                                        {/* Connected Accounts */}
                                        <ConnectedAccounts
                                            providers={oauthProviders || {}}
                                            hasPassword={!!auth.user?.has_password}
                                        />

                                        {/* Two-Factor Authentication */}
                                        {twoFactor && <TwoFactorSettings twoFactor={twoFactor} />}
                                    </div>
                                </div>
                            )}

                            {/* Public Page Tab */}
                            {activeTab === 'public_page' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Публичная страница</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Настройте внешний вид вашей страницы для онлайн-записи
                                        </p>
                                    </div>

                                    {/* Верхний ряд: 2 колонки */}
                                    <div className="grid gap-6 lg:grid-cols-2">
                                        {/* Левая колонка: Основная информация */}
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Основная информация</CardTitle>
                                                <CardDescription>
                                                    Заголовок и описание страницы
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <form method="POST" onSubmit={(e) => {
                                                    e.preventDefault();
                                                    const formData = new FormData(e.currentTarget);
                                                    const data = Object.fromEntries(formData);
                                                    router.put('/app/settings/public-page', data, {
                                                        preserveState: true,
                                                        preserveScroll: true,
                                                        onSuccess: () => {
                                                            showAchievementToast({
                                                                step: 'public_page_setup',
                                                                message: 'Отлично! Вы настроили публичную страницу',
                                                            });
                                                        },
                                                    });
                                                }}>
                                                    <div className="grid gap-4">
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="slug">Ссылка на страницу (slug)</Label>
                                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                                                <span className="text-muted-foreground text-sm whitespace-nowrap">masterplan.com/m/</span>
                                                                <Input id="slug" name="slug" defaultValue={user?.slug} placeholder="your-name" className="flex-1" />
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="site_title">Заголовок страницы</Label>
                                                            <Input id="site_title" name="site_title" defaultValue={user?.site_title} placeholder="Мастер маникюра Анна" />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label htmlFor="site_description">О себе</Label>
                                                            <textarea
                                                                id="site_description"
                                                                name="site_description"
                                                                defaultValue={user?.site_description || ''}
                                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                                placeholder="Расскажите о себе, своём опыте и услугах..."
                                                            />
                                                            <p className="text-xs text-muted-foreground">Отображается на публичной странице</p>
                                                        </div>
                                                        <Button type="submit" className="w-full sm:w-fit">Сохранить</Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>

                                        {/* Правая колонка: Адрес и Социальные сети */}
                                        <div className="space-y-6">
                                            {/* Адрес и контакты */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Адрес и контакты</CardTitle>
                                                    <CardDescription>
                                                        Укажите адрес и город
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <form method="POST" onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const formData = new FormData(e.currentTarget);
                                                        const data = Object.fromEntries(formData);
                                                        router.put('/app/settings/public-page', data, {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                showAchievementToast({
                                                                    step: 'public_page_setup',
                                                                    message: 'Отлично! Вы настроили публичную страницу',
                                                                });
                                                            },
                                                        });
                                                    }}>
                                                        <div className="grid gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="address">Адрес</Label>
                                                                <Input id="address" name="address" defaultValue={user?.address || ''} placeholder="ул. Примерная, д. 1" />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="city">Город</Label>
                                                                <Input id="city" name="city" defaultValue={user?.city || ''} placeholder="Москва" />
                                                            </div>
                                                            <Button type="submit" className="w-full sm:w-fit">Сохранить</Button>
                                                        </div>
                                                    </form>
                                                </CardContent>
                                            </Card>

                                            {/* Социальные сети */}
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Социальные сети</CardTitle>
                                                    <CardDescription>
                                                        Ссылки на ваши профили
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <form method="POST" onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const formData = new FormData(e.currentTarget);
                                                        const data = Object.fromEntries(formData);
                                                        router.put('/app/settings/public-page', data, {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                            onSuccess: () => {
                                                                // Показываем achievement toast для онбординга
                                                                showAchievementToast({
                                                                    step: 'public_page_setup',
                                                                    message: 'Отлично! Вы настроили публичную страницу',
                                                                });
                                                            },
                                                        });
                                                    }}>
                                                        <div className="grid gap-4">
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="social_telegram">Telegram</Label>
                                                                <Input id="social_telegram" name="social_telegram" defaultValue={user?.social_links?.telegram || ''} placeholder="username (без @)" />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="social_vk">ВКонтакте</Label>
                                                                <Input id="social_vk" name="social_vk" defaultValue={user?.social_links?.vk || ''} placeholder="username или id" />
                                                            </div>
                                                            <div className="grid gap-2">
                                                                <Label htmlFor="social_whatsapp">WhatsApp</Label>
                                                                <Input id="social_whatsapp" name="social_whatsapp" defaultValue={user?.social_links?.whatsapp || ''} placeholder="+79991234567" />
                                                            </div>
                                                            <Button type="submit" className="w-full sm:w-fit">Сохранить</Button>
                                                        </div>
                                                    </form>
                                                </CardContent>
                                            </Card>
                                        </div>
                                    </div>

                                    {/* Портфолио - на всю ширину */}
                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Портфолио</CardTitle>
                                            <CardDescription>
                                                Загрузите фотографии ваших работ (до {remainingPortfolioSlots + (portfolioItems?.length || 0)} фото)
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <PortfolioUpload
                                                items={portfolioItems || []}
                                                remainingSlots={remainingPortfolioSlots || 0}
                                            />
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Booking Settings Tab */}
                            {activeTab === 'booking' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Настройки записи</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Настройте интервалы времени для онлайн-записи клиентов
                                        </p>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                                <Clock className="h-5 w-5" />
                                                Интервалы записи
                                            </CardTitle>
                                            <CardDescription>
                                                Эти настройки влияют на отображение доступных слотов времени на вашей публичной странице
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <form onSubmit={(e) => {
                                                e.preventDefault();
                                                setIsBookingSubmitting(true);
                                                router.put('/app/settings/booking', {
                                                    slot_step: parseInt(slotStep),
                                                    buffer_time: parseInt(bufferTime),
                                                }, {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    onSuccess: () => {
                                                        setIsBookingSubmitting(false);
                                                    },
                                                    onError: () => {
                                                        setIsBookingSubmitting(false);
                                                        toast.error('Не удалось сохранить настройки');
                                                    },
                                                });
                                            }} className="space-y-6">
                                                <div className="grid gap-4">
                                                    <div className="grid gap-2">
                                                        <Label htmlFor="slot_step">Шаг сетки времени</Label>
                                                        <Select value={slotStep} onValueChange={setSlotStep}>
                                                            <SelectTrigger id="slot_step">
                                                                <SelectValue placeholder="Выберите интервал" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="15">15 минут</SelectItem>
                                                                <SelectItem value="30">30 минут</SelectItem>
                                                                <SelectItem value="45">45 минут</SelectItem>
                                                                <SelectItem value="60">60 минут</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">
                                                            Интервал между началами доступных слотов для записи. Например, при шаге 30 минут клиент увидит слоты: 10:00, 10:30, 11:00...
                                                        </p>
                                                    </div>

                                                    <div className="grid gap-2">
                                                        <Label htmlFor="buffer_time">Перерыв между записями</Label>
                                                        <Select value={bufferTime} onValueChange={setBufferTime}>
                                                            <SelectTrigger id="buffer_time">
                                                                <SelectValue placeholder="Выберите перерыв" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="0">Без перерыва</SelectItem>
                                                                <SelectItem value="5">5 минут</SelectItem>
                                                                <SelectItem value="10">10 минут</SelectItem>
                                                                <SelectItem value="15">15 минут</SelectItem>
                                                                <SelectItem value="30">30 минут</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <p className="text-xs text-muted-foreground">
                                                            Время на подготовку между клиентами. Система автоматически добавит этот перерыв после каждой записи.
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button type="submit" disabled={isBookingSubmitting}>
                                                    {isBookingSubmitting ? 'Сохранение...' : 'Сохранить настройки'}
                                                </Button>
                                            </form>
                                        </CardContent>
                                    </Card>

                                    {/* Info card */}
                                    <Card className="bg-muted/30">
                                        <CardContent className="pt-6">
                                            <div className="text-sm text-muted-foreground space-y-2">
                                                <p className="font-medium text-foreground">💡 Подсказка</p>
                                                <p>
                                                    Вы можете переопределить эти настройки для отдельных услуг.
                                                    Перейдите в раздел «Услуги» и отредактируйте нужную услугу,
                                                    чтобы задать индивидуальный шаг записи и перерыв.
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}

                            {/* Integrations Tab */}
                            {activeTab === 'integrations' && (
                                <div className="space-y-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">Интеграции</h2>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            Подключите внешние сервисы и интеграции
                                        </p>
                                    </div>
                                    <div className="grid gap-6 md:grid-cols-2">
                                        {/* Telegram Integration */}
                                        <TelegramIntegration user={auth.user} />

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>VK</CardTitle>
                                                <CardDescription>
                                                    Интеграция с ВКонтакте для уведомлений
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                    <div className="space-y-0.5">
                                                        <Label>Статус подключения</Label>
                                                        <p className="text-sm text-muted-foreground">
                                                            Скоро
                                                        </p>
                                                    </div>
                                                    <Button variant="outline" disabled className="w-full sm:w-auto">В разработке</Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Telegram Notification Settings */}
                                    <TelegramNotificationSettings
                                        isConnected={!!auth.user.telegram_verified_at}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SidebarInset>
        </AppSidebarProvider>
    );
}
