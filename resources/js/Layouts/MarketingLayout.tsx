import { Link, usePage } from '@inertiajs/react';
import { User, Send, Instagram } from 'lucide-react';
import { PropsWithChildren } from 'react';

interface PageProps {
    auth?: {
        user: {
            name: string;
            avatar?: string;
        } | null;
    };
    [key: string]: unknown;
}

export default function MarketingLayout({ children }: PropsWithChildren) {
    const { auth } = usePage<PageProps>().props;

    return (
        <div className="antialiased overflow-x-hidden relative min-h-screen bg-[#0a0a0a]" style={{ fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
                <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 rounded-full px-6 py-4 flex items-center justify-between shadow-lg">
                    <Link href="/" className="flex items-center gap-2 cursor-pointer group relative">
                        <div className="w-10 h-10 relative flex items-center justify-center -translate-y-[2.5px]">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                className="text-[#c4eb5a] group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-[0_0_10px_rgba(196,235,90,0.5)]">
                                <path d="M4 20V8L12 16L20 8V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                <path d="M4 20H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                            </svg>
                            <div className="absolute inset-0 bg-[#c4eb5a]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        </div>
                        <span className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#c4eb5a]" style={{ fontFamily: 'Outfit, sans-serif' }}>MClient</span>
                    </Link>

                    <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                        <Link href="/#features" className="hover:text-[#c4eb5a] transition-colors duration-300">Возможности</Link>
                        <Link href="/#pricing" className="hover:text-[#c4eb5a] transition-colors duration-300">Тарифы</Link>
                        <Link href="/news" className="hover:text-[#c4eb5a] transition-colors duration-300">Новости</Link>
                    </nav>

                    <div className="flex items-center gap-4">
                        {auth?.user ? (
                            <Link href="/dashboard" className="flex items-center gap-2 group">
                                <span className="text-sm font-medium text-zinc-400 group-hover:text-[#c4eb5a] transition-colors hidden sm:block">
                                    {auth.user.name}
                                </span>
                                {auth.user.avatar ? (
                                    <img
                                        src={`/storage/${auth.user.avatar}`}
                                        alt={auth.user.name}
                                        className="w-10 h-10 rounded-full object-cover border-2 border-[#c4eb5a]/30 transition-all group-hover:scale-105 group-hover:border-[#c4eb5a]/60 shadow-[0_0_15px_rgba(196,235,90,0.2)]"
                                    />
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-[#c4eb5a]/10 flex items-center justify-center text-[#c4eb5a] border border-[#c4eb5a]/30 transition-all group-hover:scale-105 group-hover:border-[#c4eb5a]/60">
                                        <User size={20} />
                                    </div>
                                )}
                            </Link>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">
                                    Вход
                                </Link>
                                <Link href="/register" className="px-5 py-2.5 rounded-full bg-[#c4eb5a] text-black text-sm font-semibold transition-all hover:scale-105 hover:bg-[#d4f278] shadow-[0_0_30px_rgba(196,235,90,0.3)]">
                                    Начать бесплатно
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main>
                {children}
            </main>

            {/* Footer */}
            <footer className="pt-32 pb-12 bg-[#0a0a0a] relative overflow-hidden">
                <div className="absolute bottom-0 left-0 w-full h-[600px] z-0 pointer-events-none">
                    <div className="absolute bottom-0 left-0 w-full h-full opacity-20" style={{ background: 'radial-gradient(circle at 50% 100%, rgba(196, 235, 90, 0.4) 0%, rgba(196, 235, 90, 0.1) 30%, rgba(0, 0, 0, 0) 70%)', filter: 'blur(60px)' }}></div>
                </div>
                {/* Giant Background Text */}
                <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none opacity-[0.02]">
                    <span className="text-[25vw] font-black text-white leading-none block text-center transform translate-y-[20%] tracking-tighter">MCLIENT</span>
                </div>

                <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-20">
                        <div className="col-span-12 md:col-span-4">
                            <h3 className="text-2xl font-bold text-white mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>Готовы<br />Автоматизировать?</h3>
                            <div className="flex items-center gap-2 cursor-pointer group relative mt-8">
                                <div className="w-10 h-10 relative flex items-center justify-center -translate-y-[2.5px]">
                                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#c4eb5a] group-hover:scale-110 transition-transform duration-300 relative z-10">
                                        <path d="M4 20V8L12 16L20 8V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M4 20H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                                    </svg>
                                </div>
                                <span className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#c4eb5a]" style={{ fontFamily: 'Outfit, sans-serif' }}>MClient</span>
                            </div>
                        </div>

                        <div className="col-span-12 md:col-span-8">
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                <div>
                                    <h4 className="text-white font-semibold mb-4">Продукт</h4>
                                    <ul className="space-y-3 text-sm text-zinc-500">
                                        <li><Link href="/#features" className="hover:text-[#c4eb5a] transition-colors">Возможности</Link></li>
                                        <li><Link href="/#pricing" className="hover:text-[#c4eb5a] transition-colors">Тарифы</Link></li>
                                        <li><Link href="/news" className="hover:text-[#c4eb5a] transition-colors">Новости</Link></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-4">Ресурсы</h4>
                                    <ul className="space-y-3 text-sm text-zinc-500">
                                        <li><a href="#" className="hover:text-[#c4eb5a] transition-colors">Документация</a></li>
                                        <li><a href="#" className="hover:text-[#c4eb5a] transition-colors">API</a></li>
                                        <li><a href="#" className="hover:text-[#c4eb5a] transition-colors">Поддержка</a></li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-4">Компания</h4>
                                    <ul className="space-y-3 text-sm text-zinc-500">
                                        <li><a href="#" className="hover:text-[#c4eb5a] transition-colors">О нас</a></li>
                                        <li><a href="#" className="hover:text-[#c4eb5a] transition-colors">Контакты</a></li>
                                        <li><a href="#" className="hover:text-[#c4eb5a] transition-colors">Политика</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5">
                        <div className="flex gap-4 mb-4 md:mb-0">
                            <span className="text-[10px] text-zinc-600">Сделано с любовью для мастеров</span>
                        </div>
                        <div className="flex gap-2">
                            <a href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:bg-[#c4eb5a] hover:text-black transition-colors hover:border-[#c4eb5a]"><Send className="w-3 h-3" /></a>
                            <a href="#" className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-zinc-500 hover:bg-[#c4eb5a] hover:text-black transition-colors hover:border-[#c4eb5a]"><Instagram className="w-3 h-3" /></a>
                        </div>
                    </div>
                    <div className="flex justify-between items-center mt-8 opacity-40 text-[10px] text-zinc-500">
                        <div>© 2026 MClient Inc.</div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
