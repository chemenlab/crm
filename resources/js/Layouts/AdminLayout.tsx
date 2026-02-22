import { PropsWithChildren } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Button } from '@/Components/ui/button';
import {
    LayoutDashboard,
    Users,
    CreditCard,
    Tag,
    LogOut,
    Shield,
    Menu,
    Package,
    Wallet,
    MessageSquare,
    BookOpen,
    Puzzle,
    Settings,
    Newspaper,
} from 'lucide-react';
import { useState } from 'react';

export default function AdminLayout({ children }: PropsWithChildren) {
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const { url } = usePage();

    const navigation = [
        { name: 'Dashboard', href: route('admin.dashboard'), icon: LayoutDashboard },
        { name: 'Тарифы', href: route('admin.plans.index'), icon: Package },
        { name: 'Модули', href: route('admin.modules.index'), icon: Puzzle },
        { name: 'Подписки', href: route('admin.subscriptions.index'), icon: CreditCard },
        { name: 'Пользователи', href: route('admin.users.index'), icon: Users },
        { name: 'Промокоды', href: route('admin.promo-codes.index'), icon: Tag },
        { name: 'Платежи', href: route('admin.payments.index'), icon: Wallet },
        { name: 'Тикеты поддержки', href: route('admin.support.index'), icon: MessageSquare },
        { name: 'База знаний', href: route('admin.knowledge-base.articles.index'), icon: BookOpen },
        { name: 'Новости', href: route('admin.news.index'), icon: Newspaper },
        { name: 'Настройки лендинга', href: route('admin.landing-settings.index'), icon: Settings },
    ];

    const handleLogout = () => {
        router.post(route('admin.logout'));
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transform transition-transform duration-200 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    } lg:translate-x-0`}
            >
                <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-6 py-4 border-b border-slate-800">
                        <Shield className="h-6 w-6 text-blue-500" />
                        <span className="text-lg font-semibold">Admin Panel</span>
                    </div>

                    {/* Navigation */}
                    <nav className="flex-1 px-4 py-6 space-y-1">
                        {navigation.map((item) => {
                            const isActive = url.startsWith(item.href);
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                        ? 'bg-blue-600 text-white'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                        }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="px-4 py-4 border-t border-slate-800">
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-3 h-5 w-5" />
                            Выйти
                        </Button>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-64">
                {/* Mobile header */}
                <div className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        <Menu className="h-6 w-6" />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        <span className="font-semibold">Admin Panel</span>
                    </div>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>

                {/* Page content */}
                <main className="p-6">
                    {children}
                </main>
            </div>

            {/* Mobile sidebar overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}
        </div>
    );
}
