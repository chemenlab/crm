import AdminLayout from '@/Layouts/AdminLayout';
import { Head, router } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/Components/ui/card';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { Textarea } from '@/Components/ui/textarea';
import { Switch } from '@/Components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/Components/ui/tabs';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

interface LandingSetting {
    id: number;
    section: string;
    key: string;
    value: any;
    is_active: boolean;
    order: number;
}

interface Props {
    settings: Record<string, LandingSetting[]>;
}

export default function Index({ settings }: Props) {
    const [editedSettings, setEditedSettings] = useState<Record<number, any>>({});
    const [processing, setProcessing] = useState(false);

    const handleSave = () => {
        const settingsToUpdate = Object.entries(editedSettings).map(([id, value]) => ({
            id: parseInt(id),
            value,
            is_active: true,
        }));

        setProcessing(true);
        router.put(route('admin.landing-settings.update'), {
            settings: settingsToUpdate,
        }, {
            onFinish: () => {
                setProcessing(false);
                setEditedSettings({});
            },
        });
    };

    const updateSetting = (id: number, newValue: any) => {
        setEditedSettings(prev => ({
            ...prev,
            [id]: newValue,
        }));
    };

    const renderValueEditor = (setting: LandingSetting) => {
        const currentValue = editedSettings[setting.id] ?? setting.value;

        // Простой текст
        if (typeof currentValue === 'string' || (currentValue.text && !Array.isArray(currentValue))) {
            return (
                <div className="space-y-2">
                    <Label>Текст</Label>
                    <Textarea
                        value={currentValue.text || currentValue}
                        onChange={(e) => updateSetting(setting.id, { ...currentValue, text: e.target.value })}
                        rows={3}
                    />
                </div>
            );
        }

        // Массив элементов
        if (Array.isArray(currentValue)) {
            return (
                <div className="space-y-4">
                    {currentValue.map((item, index) => (
                        <Card key={index}>
                            <CardContent className="pt-6 space-y-3">
                                {Object.entries(item).map(([key, value]) => (
                                    <div key={key} className="space-y-2">
                                        <Label className="capitalize">{key}</Label>
                                        <Input
                                            value={value as string}
                                            onChange={(e) => {
                                                const newArray = [...currentValue];
                                                newArray[index] = { ...newArray[index], [key]: e.target.value };
                                                updateSetting(setting.id, newArray);
                                            }}
                                        />
                                    </div>
                                ))}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => {
                                        const newArray = currentValue.filter((_, i) => i !== index);
                                        updateSetting(setting.id, newArray);
                                    }}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Удалить
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                            const newItem = Object.keys(currentValue[0] || {}).reduce((acc, key) => ({ ...acc, [key]: '' }), {});
                            updateSetting(setting.id, [...currentValue, newItem]);
                        }}
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Добавить элемент
                    </Button>
                </div>
            );
        }

        // JSON объект
        return (
            <div className="space-y-2">
                <Label>JSON данные</Label>
                <Textarea
                    value={JSON.stringify(currentValue, null, 2)}
                    onChange={(e) => {
                        try {
                            const parsed = JSON.parse(e.target.value);
                            updateSetting(setting.id, parsed);
                        } catch (err) {
                            // Ignore parse errors while typing
                        }
                    }}
                    rows={8}
                    className="font-mono text-sm"
                />
            </div>
        );
    };

    const sections = Object.keys(settings);
    const hasChanges = Object.keys(editedSettings).length > 0;

    // Русские названия секций
    const sectionNames: Record<string, string> = {
        'hero': 'Главный экран',
        'services': 'Услуги',
        'for_whom': 'Для кого',
        'why_us': 'Почему мы',
        'features': 'Возможности',
        'pricing': 'Тарифы',
        'testimonials': 'Отзывы',
        'news': 'Новости',
        'faq': 'Частые вопросы',
        'footer': 'Подвал',
    };

    const getSectionName = (section: string) => {
        return sectionNames[section] || section;
    };

    return (
        <AdminLayout>
            <Head title="Настройки лендинга" />

            <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Настройки лендинга</h1>
                <Button
                    onClick={handleSave}
                    disabled={!hasChanges || processing}
                >
                    <Save className="w-4 h-4 mr-2" />
                    Сохранить изменения
                </Button>
            </div>

            <Tabs defaultValue={sections[0]} className="w-full">
                <TabsList className="mb-6">
                    {sections.map((section) => (
                        <TabsTrigger key={section} value={section}>
                            {getSectionName(section)}
                        </TabsTrigger>
                    ))}
                </TabsList>

                {sections.map((section) => (
                    <TabsContent key={section} value={section}>
                        <div className="space-y-6">
                            {settings[section].map((setting) => (
                                <Card key={setting.id}>
                                    <CardHeader>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-lg">{setting.key}</CardTitle>
                                                <CardDescription>
                                                    Секция: {setting.section} | Порядок: {setting.order}
                                                </CardDescription>
                                            </div>
                                            <Switch
                                                checked={setting.is_active}
                                                onCheckedChange={() => {
                                                    // Handle active toggle
                                                }}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        {renderValueEditor(setting)}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </AdminLayout>
    );
}
