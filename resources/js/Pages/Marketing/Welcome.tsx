import { Link, Head, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    PlayCircle,
    Search,
    Calendar,
    TrendingUp,
    Bell,
    Check,
    CheckCircle2,
    ShieldCheck,
    Lock,
    MessageCircle,
    BookOpen,
    User,
    Users,
    UserPlus,
    Settings,
    Plus,
    Send,
    Instagram
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { motion, useInView, useMotionValue, animate } from 'framer-motion';

function AnimatedStat({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    const isInView = useInView(ref, { once: true, margin: '-100px' });
    const motionVal = useMotionValue(0);

    useEffect(() => {
        if (!isInView) return;
        const controls = animate(motionVal, value, {
            duration: 2,
            ease: [0.16, 1, 0.3, 1],
            onUpdate(v) {
                if (ref.current) {
                    ref.current.textContent = `${prefix}${Math.round(v).toLocaleString('ru-RU')}${suffix}`;
                }
            },
        });
        return () => controls.stop();
    }, [isInView, value, suffix, prefix, motionVal]);

    return <span ref={ref}>{prefix}0{suffix}</span>;
}

interface Plan {
    id: number;
    name: string;
    slug: string;
    description: string;
    price: number;
    price_formatted: string;
    limits: {
        clients?: number;
        services?: number;
        bookings_per_month?: number;
        [key: string]: number | undefined;
    } | null;
    features: {
        analytics?: boolean;
        telegram_notifications?: boolean;
        priority_support?: boolean;
        api_access?: boolean;
        [key: string]: boolean | undefined;
    } | null;
    is_featured: boolean;
}

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    category_color: string;
    cover_image_url: string | null;
    formatted_date: string;
}

interface Props {
    landingSettings?: Record<string, string>;
    plans?: Plan[];
    news?: NewsItem[];
}

export default function Welcome({ plans = [], news = [] }: Props) {
    const { auth } = usePage().props as any;

    // Simple scroll animation hook for other elements
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.fade-up, .features-card, .for-whom-card').forEach((el) => {
            observer.observe(el);
        });

        return () => observer.disconnect();
    }, []);

    return (
        <>
            <Head>
                <title>MClient — CRM для мастеров и сферы услуг</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <style>{`
                    body {
                        font-family: 'Inter', sans-serif;
                        background-color: #0a0a0a;
                        color: #fafafa;
                    }
                    h1, h2, h3, h4, button {
                        font-family: 'Outfit', sans-serif;
                    }
                    
                    /* Lime accent color: hsl(82, 84%, 67%) = #c4eb5a */
                    :root {
                        --lime: #c4eb5a;
                        --lime-light: #d4f278;
                        --lime-dark: #9bc93e;
                        --lime-glow: rgba(196, 235, 90, 0.4);
                    }
                    
                    .mesh-gradient-top {
                        background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(196, 235, 90, 0.15) 0%, transparent 50%);
                    }
                    .mesh-accent-1 {
                        background: radial-gradient(circle, rgba(196, 235, 90, 0.2) 0%, transparent 70%);
                        filter: blur(80px);
                    }
                    .mesh-accent-2 {
                        background: radial-gradient(circle, rgba(163, 230, 53, 0.15) 0%, transparent 70%);
                        filter: blur(100px);
                    }
                    .glass-nav {
                        background: rgba(10, 10, 10, 0.8);
                        backdrop-filter: blur(20px);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        box-shadow: 0 4px 30px rgba(0, 0, 0, 0.3);
                    }
                    .glass-card {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        backdrop-filter: blur(10px);
                    }
                    
                    /* Advanced Animations */
                    @keyframes float {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-15px) rotate(1deg); }
                    }
                    @keyframes shimmer {
                        0% { background-position: -200% 0; }
                        100% { background-position: 200% 0; }
                    }
                    @keyframes glow-pulse {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                    }
                    @keyframes gradient-shift {
                        0%, 100% { background-position: 0% 50%; }
                        50% { background-position: 100% 50%; }
                    }
                    @keyframes fade-in-up {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes scale-in {
                        from { opacity: 0; transform: scale(0.9); }
                        to { opacity: 1; transform: scale(1); }
                    }
                    @keyframes border-dance {
                        0%, 100% { border-color: rgba(196, 235, 90, 0.3); }
                        50% { border-color: rgba(196, 235, 90, 0.6); }
                    }
                    
                    .animate-float { animation: float 6s ease-in-out infinite; }
                    .animate-shimmer { 
                        background: linear-gradient(90deg, transparent 0%, rgba(196, 235, 90, 0.1) 50%, transparent 100%);
                        background-size: 200% 100%;
                        animation: shimmer 3s ease-in-out infinite;
                    }
                    .animate-glow { animation: glow-pulse 3s ease-in-out infinite; }
                    .animate-gradient { 
                        background-size: 200% 200%;
                        animation: gradient-shift 4s ease infinite;
                    }
                    .animate-border { animation: border-dance 2s ease-in-out infinite; }

                    /* Marquee */
                    @keyframes marquee-left {
                        0% { transform: translateX(0); }
                        100% { transform: translateX(-50%); }
                    }
                    @keyframes marquee-right {
                        0% { transform: translateX(-50%); }
                        100% { transform: translateX(0); }
                    }
                    .marquee-track {
                        display: flex;
                        width: max-content;
                    }
                    .marquee-left .marquee-track {
                        animation: marquee-left 40s linear infinite;
                    }
                    .marquee-right .marquee-track {
                        animation: marquee-right 40s linear infinite;
                    }
                    .marquee-left:hover .marquee-track,
                    .marquee-right:hover .marquee-track {
                        animation-play-state: paused;
                    }
                    .marquee-mask {
                        -webkit-mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
                        mask-image: linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%);
                    }
                    
                    .fade-up {
                        opacity: 0;
                        transform: translateY(30px);
                        transition: opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1), transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .fade-up.visible {
                        opacity: 1;
                        transform: translateY(0);
                    }

                    .for-whom-card {
                        opacity: 0;
                        transform: translateY(40px);
                        transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .for-whom-card.visible {
                        opacity: 1;
                        transform: translateY(0);
                    }
                    .for-whom-card:hover {
                        transform: translateY(-8px) !important;
                    }
                    
                    .features-card {
                        opacity: 0;
                        transform: translateY(40px);
                        transition: all 0.7s cubic-bezier(0.16, 1, 0.3, 1);
                    }
                    .features-card.visible {
                        opacity: 1;
                        transform: translateY(0);
                    }

                    .stack-card {
                        position: sticky;
                    }
                    
                    /* Gradient text */
                    .text-gradient {
                        background: linear-gradient(135deg, #c4eb5a 0%, #a3e635 50%, #84cc16 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }
                    
                    /* Premium button glow */
                    .btn-glow {
                        position: relative;
                        overflow: hidden;
                    }
                    .btn-glow::before {
                        content: '';
                        position: absolute;
                        inset: -2px;
                        background: linear-gradient(135deg, #c4eb5a, #84cc16, #c4eb5a);
                        border-radius: inherit;
                        z-index: -1;
                        opacity: 0;
                        transition: opacity 0.3s;
                        filter: blur(10px);
                    }
                    .btn-glow:hover::before {
                        opacity: 0.6;
                    }
                    
                    /* Card hover glow */
                    .card-glow {
                        position: relative;
                    }
                    .card-glow::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(196, 235, 90, 0.1) 0%, transparent 50%);
                        opacity: 0;
                        transition: opacity 0.3s;
                        pointer-events: none;
                        border-radius: inherit;
                    }
                    .card-glow:hover::before {
                        opacity: 1;
                    }
                    
                    /* Noise texture overlay */
                    .noise-overlay {
                        position: fixed;
                        inset: 0;
                        pointer-events: none;
                        opacity: 0.03;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                        z-index: 1000;
                    }
                `}</style>
            </Head>

            <div className="antialiased overflow-x-hidden relative min-h-screen bg-[#0a0a0a]">
                {/* Noise Overlay */}
                <div className="noise-overlay" />

                {/* Top Mesh Background */}
                <div className="absolute top-0 left-0 w-full h-[120vh] z-0 pointer-events-none overflow-hidden">
                    <div className="mesh-gradient-top w-full h-full absolute top-0"></div>
                    <div className="mesh-accent-1 w-[800px] h-[800px] absolute top-[-200px] left-[-200px]"></div>
                    <div className="mesh-accent-2 w-[600px] h-[600px] absolute top-[100px] right-[-100px]"></div>
                </div>

                {/* Header */}
                <header className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-5xl">
                    <div className="glass-nav rounded-full px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 cursor-pointer group relative">
                            {/* M Logo with glow */}
                            <div className="w-10 h-10 relative flex items-center justify-center -translate-y-[2.5px]">
                                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                    className="text-[#c4eb5a] group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-[0_0_10px_rgba(196,235,90,0.5)]">
                                    <path d="M4 20V8L12 16L20 8V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                    <path d="M4 20H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                                </svg>
                                <div className="absolute inset-0 bg-[#c4eb5a]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-glow"></div>
                            </div>
                            <span className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#c4eb5a]">MClient</span>
                        </Link>

                        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
                            <a href="#features" className="hover:text-[#c4eb5a] transition-colors duration-300">Возможности</a>
                            <a href="#pricing" className="hover:text-[#c4eb5a] transition-colors duration-300">Тарифы</a>
                            <a href="#testimonials" className="hover:text-[#c4eb5a] transition-colors duration-300">Отзывы</a>
                            <Link href="/news" className="hover:text-[#c4eb5a] transition-colors duration-300">Новости</Link>
                        </nav>

                        <div className="flex items-center gap-4">
                            {auth.user ? (
                                <Link href={route('dashboard')} className="flex items-center gap-2 group">
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
                                    <Link href={route('login')} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors hidden sm:block">
                                        Вход
                                    </Link>
                                    <Link href={route('register')} className="btn-glow px-5 py-2.5 rounded-full bg-[#c4eb5a] text-black text-sm font-semibold transition-all hover:scale-105 hover:bg-[#d4f278] shadow-[0_0_30px_rgba(196,235,90,0.3)]">
                                        Начать бесплатно
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Hero Section */}
                <section className="relative pt-36 pb-24 z-10">
                    <div className="max-w-[1200px] mx-auto px-6 text-center">
                        <div className="fade-up inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-[#c4eb5a]/30 bg-[#c4eb5a]/5 backdrop-blur-sm">
                            <span className="w-2 h-2 rounded-full bg-[#c4eb5a] animate-pulse"></span>
                            <span className="text-xs font-semibold text-[#c4eb5a] uppercase tracking-widest">Помощник для мастеров</span>
                        </div>

                        <h1 className="fade-up text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter mb-8 leading-[0.95]" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            <span className="text-white">Ваш цифровой</span><br />
                            <span className="text-gradient">администратор</span>
                        </h1>

                        <p className="fade-up text-base md:text-lg text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
                            Больше ни один клиент не потеряется. Современная облачная система для мастеров — онлайн-запись, финансы и аналитика в одном месте.
                        </p>

                        <div className="fade-up flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                            <Link href={auth.user ? route('dashboard') : route('register')} className="btn-glow group px-8 py-4 rounded-full bg-[#c4eb5a] text-black font-semibold text-base shadow-[0_0_40px_rgba(196,235,90,0.4)] hover:shadow-[0_0_60px_rgba(196,235,90,0.5)] transition-all hover:scale-105 flex items-center gap-3">
                                {auth.user ? 'Перейти в кабинет' : 'Попробовать бесплатно'}
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a href="#" className="group px-8 py-4 rounded-full bg-white/5 text-white border border-white/10 font-medium text-base hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-3">
                                <PlayCircle className="w-5 h-5 text-[#c4eb5a]" />
                                Посмотреть демо
                            </a>
                        </div>

                        {/* Dashboard Mockup */}
                        <div className="fade-up relative max-w-5xl mx-auto">
                            {/* Glow behind mockup */}
                            <div className="absolute -inset-4 bg-gradient-to-b from-[#c4eb5a]/20 via-transparent to-transparent blur-3xl opacity-50"></div>

                            <div className="relative glass-card rounded-[2.5rem] p-6 md:p-8 border border-white/10 shadow-2xl text-left overflow-hidden">
                                {/* Shimmer overlay */}
                                <div className="absolute inset-0 animate-shimmer pointer-events-none rounded-[2.5rem]"></div>

                                {/* Mockup Top Bar */}
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl md:text-2xl font-bold text-white">Обзор Бизнеса</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="relative hidden sm:block">
                                            <Search className="w-5 h-5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                            <input type="text" placeholder="Найти клиента..." className="pl-10 pr-4 py-2 rounded-full bg-white/5 text-sm w-64 border border-white/10 outline-none focus:ring-1 focus:ring-[#c4eb5a]/50 focus:border-[#c4eb5a]/50 text-white placeholder-zinc-500 transition-all" />
                                        </div>
                                        <button className="w-10 h-10 rounded-full bg-[#c4eb5a] text-black flex items-center justify-center shadow-[0_0_20px_rgba(196,235,90,0.4)] hover:scale-110 transition-transform">
                                            <Bell className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Mockup Main Grid */}
                                <div className="grid grid-cols-12 gap-6">
                                    <div className="col-span-12 md:col-span-8 space-y-6">
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-[#c4eb5a]/10 flex items-center justify-center text-[#c4eb5a]">
                                                    <Calendar className="w-4 h-4" />
                                                </div>
                                                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-white">Онлайн Запись</span>
                                                <span className="w-2 h-2 rounded-full bg-[#c4eb5a] animate-pulse"></span>
                                            </div>
                                            <div className="flex gap-2">
                                                <span className="px-3 py-1 rounded-full bg-[#c4eb5a] text-black text-xs font-medium shadow-[0_0_15px_rgba(196,235,90,0.3)]">Сегодня</span>
                                                <span className="px-3 py-1 rounded-full bg-white/5 text-zinc-400 text-xs font-medium">Завтра</span>
                                            </div>
                                        </div>
                                        <div className="flex items-end gap-12 mt-4">
                                            <div>
                                                <div className="flex items-center gap-2 text-zinc-500 text-sm mb-2">
                                                    <span className="w-2 h-2 rounded-full bg-[#c4eb5a]"></span> Доход за месяц
                                                </div>
                                                <div className="text-5xl md:text-6xl font-bold text-white tracking-tighter">₽ 124k</div>
                                                <div className="text-sm text-zinc-500 mt-3 flex items-center gap-2">
                                                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#c4eb5a]/10 text-[#c4eb5a]">
                                                        <TrendingUp className="w-3 h-3" />
                                                        +18%
                                                    </span>
                                                    к прошлому месяцу
                                                </div>
                                            </div>
                                            <div className="flex items-end gap-2 h-24 pb-2">
                                                <div className="w-3 bg-[#c4eb5a]/20 rounded-full h-[30%] transition-all hover:bg-[#c4eb5a]/40"></div>
                                                <div className="w-3 bg-[#c4eb5a]/30 rounded-full h-[50%] transition-all hover:bg-[#c4eb5a]/50"></div>
                                                <div className="w-3 bg-[#c4eb5a]/50 rounded-full h-[70%] transition-all hover:bg-[#c4eb5a]/70"></div>
                                                <div className="w-3 bg-[#c4eb5a] rounded-full h-[100%] shadow-[0_0_20px_rgba(196,235,90,0.5)]"></div>
                                                <div className="w-3 bg-[#c4eb5a]/40 rounded-full h-[60%] transition-all hover:bg-[#c4eb5a]/60"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-span-12 md:col-span-4">
                                        <div className="bg-gradient-to-br from-[#c4eb5a]/20 to-[#c4eb5a]/5 rounded-[2rem] p-6 h-full flex flex-col justify-between relative overflow-hidden group border border-[#c4eb5a]/20 hover:border-[#c4eb5a]/40 transition-colors">
                                            <div>
                                                <div className="text-sm font-semibold text-white mb-1">Новые Клиенты</div>
                                                <div className="text-xs text-zinc-400 uppercase tracking-wider">База</div>
                                            </div>
                                            <div className="mt-8">
                                                <div className="text-4xl font-bold text-[#c4eb5a] tracking-tight">+ 24</div>
                                                <div className="text-xs text-zinc-400 mt-1">за эту неделю</div>
                                            </div>
                                            <svg className="absolute bottom-0 right-0 w-24 h-24 text-[#c4eb5a] opacity-10" viewBox="0 0 24 24" fill="currentColor">
                                                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Services / For Whom Section */}
                <section id="for-whom" className="py-28 bg-[#0f0f0f] border-t border-white/5">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
                            <div>
                                <span className="text-[#c4eb5a] font-mono text-sm font-medium tracking-wider uppercase mb-4 block">Целевая аудитория</span>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Создано для тех,<br />кто ценит своё время
                                </h2>
                            </div>
                            <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                                Универсальная система, которая адаптируется под специфику вашего бизнеса
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Card 1 */}
                            <div className="for-whom-card lg:col-span-2 lg:row-span-2 group card-glow">
                                <div className="bg-white/[0.03] rounded-3xl p-8 lg:p-10 h-full relative overflow-hidden border border-white/5 hover:border-[#c4eb5a]/20 transition-all duration-500">
                                    <span className="absolute top-6 right-8 text-8xl font-black text-white/[0.03] font-mono">01</span>
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c4eb5a]/10 rounded-full text-xs font-medium text-[#c4eb5a] mb-6">
                                            <span className="w-2 h-2 bg-[#c4eb5a] rounded-full animate-pulse"></span>
                                            Самый популярный сегмент
                                        </div>
                                        <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Бьюти-индустрия</h3>
                                        <p className="text-zinc-400 text-lg mb-8 max-w-lg">Салоны красоты, барбершопы, студии маникюра, косметологии и все бьюти-услуги</p>
                                    </div>
                                </div>
                            </div>
                            {/* Card 2 */}
                            <div className="for-whom-card group card-glow" style={{ transitionDelay: '0.1s' }}>
                                <div className="bg-[#c4eb5a] rounded-3xl p-6 h-full relative overflow-hidden text-black hover:bg-[#d4f278] transition-colors duration-500">
                                    <span className="absolute top-4 right-6 text-6xl font-black text-black/10 font-mono">02</span>
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/10 rounded-full text-xs font-medium text-black backdrop-blur-sm mb-4">
                                            <span className="w-2 h-2 bg-black rounded-full animate-pulse"></span>
                                            Бесплатно навсегда
                                        </div>
                                        <h3 className="text-2xl font-bold text-black mb-2">Частные мастера</h3>
                                        <p className="text-black/70 text-sm leading-relaxed">Массажисты, визажисты, мастера на дому</p>
                                    </div>
                                </div>
                            </div>
                            {/* Card 3 */}
                            <div className="for-whom-card group card-glow" style={{ transitionDelay: '0.2s' }}>
                                <div className="bg-white/[0.03] rounded-3xl p-6 h-full relative overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500">
                                    <span className="absolute top-4 right-6 text-6xl font-black text-white/[0.03] font-mono">03</span>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-white mb-2">Репетиторы</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">Коучи, тренеры, преподаватели</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">Расписание</span>
                                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">Оплаты</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Card 4 - Photo */}
                            <div className="for-whom-card group card-glow" style={{ transitionDelay: '0.3s' }}>
                                <div className="bg-zinc-900/80 rounded-3xl p-6 h-full relative overflow-hidden text-white border border-white/5 hover:border-white/10 transition-all duration-500">
                                    <span className="absolute top-4 right-6 text-6xl font-black text-white/5 font-mono">04</span>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-white mb-2">Фотостудии</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">Лофты, аренда локаций</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs text-zinc-300">Почасовая</span>
                                            <span className="px-2 py-1 bg-white/5 rounded text-xs text-zinc-300">Боксы</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Card 5 - Medical */}
                            <div className="for-whom-card group card-glow" style={{ transitionDelay: '0.4s' }}>
                                <div className="bg-white/[0.03] rounded-3xl p-6 h-full relative overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500">
                                    <span className="absolute top-4 right-6 text-6xl font-black text-white/[0.03] font-mono">05</span>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-white mb-2">Косметологи</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">Клиники, медицинские специалисты</p>
                                        <div className="flex gap-2">
                                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">Карточки</span>
                                            <span className="px-2 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300">История</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Card 6 - More */}
                            <div className="for-whom-card group card-glow" style={{ transitionDelay: '0.5s' }}>
                                <div className="bg-gradient-to-br from-[#c4eb5a]/10 to-[#c4eb5a]/5 rounded-3xl p-6 h-full relative overflow-hidden border border-[#c4eb5a]/20 hover:border-[#c4eb5a]/40 transition-all duration-500">
                                    <span className="absolute top-4 right-6 text-6xl font-black text-[#c4eb5a]/10 font-mono">+</span>
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-[#c4eb5a] mb-2">И ещё 200+</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">Автосервисы, ремонт, консультанты...</p>
                                        <a href="#pricing" className="inline-flex items-center gap-2 text-sm font-semibold text-[#c4eb5a] hover:text-[#d4f278] transition-colors">
                                            Все профессии
                                            <span>→</span>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Stats — animated counters */}
                        <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5 }}
                                className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                            >
                                <div className="text-4xl font-bold text-white mb-2">
                                    <AnimatedStat value={15000} suffix="+" />
                                </div>
                                <div className="text-sm text-zinc-500">Активных пользователей</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5, delay: 0.1 }}
                                className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                            >
                                <div className="text-4xl font-bold text-white mb-2">
                                    <AnimatedStat value={200} suffix="+" />
                                </div>
                                <div className="text-sm text-zinc-500">Профессий</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="text-center p-6 rounded-2xl bg-white/[0.02] border border-white/5"
                            >
                                <div className="text-4xl font-bold text-white mb-2">
                                    <AnimatedStat value={98} suffix="%" />
                                </div>
                                <div className="text-sm text-zinc-500">Довольных клиентов</div>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true, margin: '-80px' }}
                                transition={{ duration: 0.5, delay: 0.3 }}
                                className="text-center p-6 rounded-2xl bg-[#c4eb5a]/5 border border-[#c4eb5a]/20"
                            >
                                <div className="text-4xl font-bold text-[#c4eb5a] mb-2">
                                    <AnimatedStat value={0} suffix="₽" />
                                </div>
                                <div className="text-sm text-zinc-400">Стартовый тариф</div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* How It Works Section */}
                <section className="py-28 bg-[#0a0a0a] relative overflow-hidden" id="how-it-works">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="text-center mb-20">
                            <span className="text-[#c4eb5a] font-mono text-sm font-medium tracking-wider uppercase mb-4 block">Быстрый старт</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Как это работает
                            </h2>
                        </div>

                        <div className="relative max-w-3xl mx-auto">
                            {/* Vertical line */}
                            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-[#c4eb5a]/30 to-transparent hidden md:block" />

                            {[
                                {
                                    icon: <UserPlus className="w-6 h-6" />,
                                    title: 'Регистрация',
                                    desc: 'Создайте аккаунт за 30 секунд. Никаких карт и сложных форм — только имя и email.',
                                    step: 1,
                                },
                                {
                                    icon: <Settings className="w-6 h-6" />,
                                    title: 'Настройка',
                                    desc: 'Добавьте услуги, укажите расписание и получите уникальную ссылку для онлайн-записи.',
                                    step: 2,
                                },
                                {
                                    icon: <Users className="w-6 h-6" />,
                                    title: 'Клиенты',
                                    desc: 'Делитесь ссылкой — клиенты записываются сами. Вы получаете уведомления и управляете бизнесом.',
                                    step: 3,
                                },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 40 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true, margin: '-80px' }}
                                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                                    className={`relative flex flex-col md:flex-row items-center gap-8 mb-16 last:mb-0 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}
                                >
                                    {/* Content card */}
                                    <div className={`flex-1 ${idx % 2 === 1 ? 'md:text-right' : ''}`}>
                                        <div className="bg-white/[0.03] rounded-2xl p-6 border border-white/5 hover:border-[#c4eb5a]/20 transition-colors duration-300">
                                            <div className={`inline-flex items-center gap-3 mb-3 ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                                                <div className="w-10 h-10 rounded-xl bg-[#c4eb5a]/10 flex items-center justify-center text-[#c4eb5a]">
                                                    {item.icon}
                                                </div>
                                                <h3 className="text-xl font-bold text-white">{item.title}</h3>
                                            </div>
                                            <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
                                        </div>
                                    </div>

                                    {/* Center dot */}
                                    <div className="relative z-10 flex-shrink-0 w-12 h-12 rounded-full bg-[#c4eb5a] text-black flex items-center justify-center font-bold text-lg shadow-[0_0_30px_rgba(196,235,90,0.4)]">
                                        {item.step}
                                    </div>

                                    {/* Spacer for opposite side */}
                                    <div className="flex-1 hidden md:block" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* Features Section - Bento Grid */}
                <section className="py-28 bg-[#0f0f0f]" id="features">
                    <div className="max-w-[1200px] mx-auto px-6">
                        {/* Header */}
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
                            <div>
                                <span className="text-[#c4eb5a] font-mono text-sm font-medium tracking-wider uppercase mb-4 block">Функционал</span>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Всё что нужно<br />в одном месте
                                </h2>
                            </div>
                            <p className="text-zinc-400 max-w-md text-lg leading-relaxed">
                                Мощные инструменты для роста вашего бизнеса — без лишней сложности
                            </p>
                        </div>

                        {/* Bento Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Card 1: Calendar (Hero - Large) */}
                            <div className="lg:col-span-2 lg:row-span-2 group features-card card-glow">
                                <div className="bg-white/[0.03] rounded-3xl p-8 lg:p-10 h-full relative overflow-hidden border border-white/5 hover:border-[#c4eb5a]/20 transition-all duration-500 hover:-translate-y-1">
                                    <div className="relative z-10">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#c4eb5a]/10 rounded-full text-xs font-medium text-[#c4eb5a] mb-6">
                                            <span className="w-2 h-2 bg-[#c4eb5a] rounded-full animate-pulse"></span>
                                            Самое важное
                                        </div>
                                        <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Умный Календарь</h3>
                                        <p className="text-zinc-400 text-lg mb-8 max-w-lg">
                                            Онлайн-запись клиентов 24/7. Защита от накладок. Гибкое расписание для любого графика работы.
                                        </p>
                                        {/* Mini Calendar UI */}
                                        <div className="bg-[#1a1a1a] rounded-2xl p-4 border border-white/10 max-w-md">
                                            <div className="flex items-center justify-between mb-4">
                                                <span className="text-sm font-semibold text-white">Среда, 15 января</span>
                                                <div className="flex gap-1">
                                                    <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs text-zinc-500">←</span>
                                                    <span className="w-6 h-6 rounded bg-white/5 flex items-center justify-center text-xs text-zinc-500">→</span>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-500 w-12">10:00</span>
                                                    <div className="flex-1 bg-[#c4eb5a]/10 p-2 rounded-lg border-l-4 border-[#c4eb5a]">
                                                        <div className="text-sm font-medium text-[#c4eb5a]">Стрижка + Борода</div>
                                                        <div className="text-xs text-[#c4eb5a]/70">Иван Иванов</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-500 w-12">11:30</span>
                                                    <div className="flex-1 bg-blue-500/10 p-2 rounded-lg border-l-4 border-blue-500">
                                                        <div className="text-sm font-medium text-blue-400">Маникюр</div>
                                                        <div className="text-xs text-blue-400/70">Анна Петрова</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs text-zinc-500 w-12">14:00</span>
                                                    <div className="flex-1 bg-white/5 p-2 rounded-lg border-l-4 border-zinc-600 border-dashed">
                                                        <div className="text-sm font-medium text-zinc-500">Свободно</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 2: Finance */}
                            <div className="group features-card card-glow" style={{ transitionDelay: '0.1s' }}>
                                <div className="bg-[#c4eb5a] rounded-3xl p-6 h-full relative overflow-hidden text-black hover:bg-[#d4f278] transition-all duration-500 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#c4eb5a]/30">
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-black mb-2">Финансы</h3>
                                        <p className="text-black/70 text-sm leading-relaxed mb-6">
                                            Доходы, расходы, налоги — всё под контролем
                                        </p>
                                        <div className="bg-black/10 backdrop-blur-sm rounded-xl p-3">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-xs text-black/70">Прибыль</span>
                                                <span className="text-lg font-bold text-black">₽ 84,200</span>
                                            </div>
                                            <div className="w-full bg-black/10 h-1.5 rounded-full">
                                                <div className="w-3/4 h-full bg-black rounded-full"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 3: Notifications */}
                            <div className="group features-card card-glow" style={{ transitionDelay: '0.2s' }}>
                                <div className="bg-white/[0.03] rounded-3xl p-6 h-full relative overflow-hidden border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-1">
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-white mb-2">Уведомления</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                            Telegram, SMS, Email, VK
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-xs font-medium">Telegram</span>
                                            <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-lg text-xs font-medium">SMS</span>
                                            <span className="px-2 py-1 bg-white/10 text-zinc-300 rounded-lg text-xs font-medium">Email</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 4: Personal Page */}
                            <div className="lg:col-span-2 group features-card card-glow" style={{ transitionDelay: '0.3s' }}>
                                <div className="bg-[#141414] rounded-3xl p-6 lg:p-8 h-full relative overflow-hidden text-white border border-white/5 hover:border-white/10 transition-all duration-500 hover:-translate-y-1">
                                    <div className="relative z-10 flex flex-col lg:flex-row lg:items-center gap-6">
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-white mb-2">Персональная Страница</h3>
                                            <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                                Ваш сайт с портфолио, отзывами и онлайн-записью
                                            </p>
                                            <div className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 rounded-lg border border-white/10">
                                                <span className="w-2 h-2 rounded-full bg-[#c4eb5a] animate-pulse"></span>
                                                <span className="text-sm text-zinc-300 font-mono">mclient.pro/your-name</span>
                                            </div>
                                        </div>
                                        <div className="bg-white/5 rounded-xl p-3 w-full lg:w-48 border border-white/10">
                                            <div className="w-full h-2 bg-white/10 rounded mb-2 w-2/3"></div>
                                            <div className="flex gap-1 mb-2">
                                                <div className="w-8 h-8 bg-white/10 rounded"></div>
                                                <div className="w-8 h-8 bg-white/10 rounded"></div>
                                                <div className="w-8 h-8 bg-white/10 rounded"></div>
                                            </div>
                                            <div className="w-full h-6 bg-[#c4eb5a] rounded text-[10px] text-black font-semibold flex items-center justify-center">
                                                Записаться
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Card 5: Clients Database */}
                            <div className="group features-card card-glow" style={{ transitionDelay: '0.4s' }}>
                                <div className="bg-gradient-to-br from-[#c4eb5a]/10 to-[#c4eb5a]/5 rounded-3xl p-6 h-full relative overflow-hidden border border-[#c4eb5a]/20 hover:border-[#c4eb5a]/40 transition-all duration-500 hover:-translate-y-1">
                                    <div className="relative z-10">
                                        <h3 className="text-2xl font-bold text-[#c4eb5a] mb-2">База Клиентов</h3>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                            История визитов, заметки, аналитика
                                        </p>
                                        <div className="flex -space-x-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 border-2 border-[#0f0f0f]"></div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-[#0f0f0f]"></div>
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-2 border-[#0f0f0f]"></div>
                                            <div className="w-8 h-8 rounded-full bg-[#c4eb5a]/20 border-2 border-[#0f0f0f] flex items-center justify-center text-xs font-bold text-[#c4eb5a]">
                                                +42
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-28 bg-[#0a0a0a] relative overflow-hidden" id="pricing">
                    <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                        <div className="text-center mb-16 fade-up">
                            <h2 className="text-4xl font-bold text-white tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Гибкие Тарифы
                            </h2>
                            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                                Выберите подходящий план для вашего бизнеса
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {plans.map((plan) => {
                                const isFeatured = plan.is_featured;
                                const isFree = plan.price === 0;
                                const isMaximum = plan.slug === 'maximum';

                                // Safe access to limits and features
                                const limits = plan.limits || {};
                                const features = plan.features || {};

                                // Generate features list
                                const featuresList: { text: string; highlight?: boolean }[] = [];

                                // Clients limit
                                if (limits.clients === -1) {
                                    featuresList.push({ text: 'Неограниченно клиентов', highlight: true });
                                } else if (limits.clients && limits.clients > 0) {
                                    featuresList.push({ text: `До ${limits.clients} клиентов` });
                                }

                                // Features
                                if (features.analytics) {
                                    featuresList.push({ text: 'Расширенная аналитика' });
                                }
                                if (features.telegram_notifications) {
                                    featuresList.push({ text: 'Telegram уведомления' });
                                }
                                if (features.priority_support) {
                                    featuresList.push({ text: 'Приоритетная поддержка' });
                                }
                                if (features.api_access) {
                                    featuresList.push({ text: 'API доступ' });
                                }

                                // If no features, add basic
                                if (featuresList.length === 0 || (featuresList.length === 1 && isFree)) {
                                    featuresList.push({ text: 'Базовые функции' });
                                }

                                return (
                                    <div
                                        key={plan.id}
                                        className={`fade-up rounded-[2rem] p-8 shadow-xl flex flex-col relative overflow-hidden transition-colors ${isFeatured
                                            ? 'bg-gradient-to-br from-[#c4eb5a] to-[#a3e635] shadow-2xl shadow-[#c4eb5a]/20 transform md:-translate-y-4 z-10'
                                            : 'bg-[#141414] border border-white/5 group hover:border-white/10'
                                            }`}
                                    >
                                        {isFeatured && (
                                            <div className="absolute top-0 right-0 bg-black text-[#c4eb5a] text-[10px] font-bold px-3 py-1 rounded-bl-xl">ХИТ</div>
                                        )}
                                        {isMaximum && (
                                            <div className="absolute top-0 right-0 bg-[#c4eb5a] text-black text-[10px] font-bold px-3 py-1 rounded-bl-xl">14 ДНЕЙ БЕСПЛАТНО</div>
                                        )}

                                        <div className="mb-6">
                                            <div className={`text-lg font-bold mb-2 ${isFeatured ? 'text-black' : 'text-white'}`}>
                                                {plan.name}
                                            </div>
                                            <div className={`text-sm ${isFeatured ? 'text-black/60' : 'text-zinc-500'}`}>
                                                {plan.description}
                                            </div>
                                        </div>

                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-1">
                                                <span className={`font-bold ${isFeatured ? 'text-5xl text-black' : 'text-4xl text-white'}`}>
                                                    {plan.price_formatted}
                                                </span>
                                                <span className={isFeatured ? 'text-black/60' : 'text-zinc-500'}>/мес</span>
                                            </div>
                                        </div>

                                        <ul className="space-y-4 mb-8 flex-1">
                                            {featuresList.map((feature, idx) => (
                                                <li
                                                    key={idx}
                                                    className={`flex items-center gap-3 text-sm ${isFeatured ? 'text-black' : 'text-zinc-300'
                                                        }`}
                                                >
                                                    <Check className={`w-5 h-5 rounded-full p-1 ${isFeatured
                                                        ? 'text-black bg-black/10'
                                                        : 'text-[#c4eb5a] bg-[#c4eb5a]/10'
                                                        }`} />
                                                    {feature.highlight ? <strong>{feature.text}</strong> : feature.text}
                                                </li>
                                            ))}
                                        </ul>

                                        <Link
                                            href="/register"
                                            className={`w-full py-3 rounded-full font-bold text-center transition-colors block ${isFeatured
                                                ? 'bg-black text-[#c4eb5a] hover:bg-zinc-800'
                                                : 'border border-white/10 text-white hover:bg-white hover:text-black'
                                                }`}
                                        >
                                            {isMaximum ? 'Попробовать 14 дней' : isFree ? 'Начать бесплатно' : 'Попробовать'}
                                        </Link>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Testimonials Section — Marquee */}
                <section className="py-28 bg-[#0f0f0f] overflow-hidden" id="testimonials">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="text-[#c4eb5a] font-medium text-sm tracking-wider uppercase mb-3 block">Отзывы</span>
                            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                                Доверие профессионалов
                            </h2>
                            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                                Тысячи мастеров используют MClient каждый день. Вот что они говорят
                            </p>
                        </div>
                    </div>

                    {(() => {
                        const testimonials = [
                            { name: 'Анна Козлова', role: 'Мастер маникюра', text: 'Идеальный сервис для мастера. Всё просто и понятно. Клиенты записываются сами, а я просто получаю уведомления. Очень экономит время!', bg: '1a2e1a', color: 'c4eb5a' },
                            { name: 'Дмитрий Орлов', role: 'Барбер', text: 'Искал простую CRM без лишних наворотов. MClient подошла идеально. Особенно радует финансовая статистика — сразу видно, сколько заработал.', bg: '1a1a2e', color: '60a5fa' },
                            { name: 'Елена Волкова', role: 'Косметолог', text: 'Мои клиенты в восторге от онлайн-записи. Говорят, что это очень удобно. А мне нравится, что не нужно ночью отвечать на сообщения.', bg: '2e2e1a', color: 'facc15' },
                            { name: 'Мария Петрова', role: 'Визажист', text: 'Перепробовала много разных программ, но остановилась на этой. Интуитивно понятно, красиво и работает быстро. Техподдержка отвечает мгновенно.', bg: '2e1a2e', color: 'e879f9' },
                            { name: 'Алексей Смирнов', role: 'Репетитор', text: 'Очень удобно вести расписание занятий. Ученики получают напоминания и не забывают приходить. Система окупила себя в первый же месяц.', bg: '1a1a1a', color: 'a8a29e' },
                            { name: 'Ольга Новикова', role: 'Стилист', text: 'Нравится, что можно настроить всё под себя. Цвета, услуги, график. Клиентская база теперь в полном порядке, ничего не теряется.', bg: '2e1a1a', color: 'fb923c' }
                        ];
                        const row1 = testimonials.slice(0, 3);
                        const row2 = testimonials.slice(3, 6);

                        const renderCard = (t: typeof testimonials[0], idx: number) => (
                            <div key={idx} className="bg-[#141414] rounded-2xl p-6 border border-white/5 w-[360px] flex-shrink-0 mx-3 hover:border-white/10 transition-colors duration-300">
                                <div className="flex items-center gap-4 mb-4">
                                    <img
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=${t.bg}&color=${t.color}`}
                                        className="w-10 h-10 rounded-full"
                                        alt={t.name}
                                    />
                                    <div>
                                        <div className="font-bold text-white text-sm">{t.name}</div>
                                        <div className="text-xs text-zinc-500">{t.role}</div>
                                    </div>
                                </div>
                                <p className="text-zinc-400 text-sm leading-relaxed">&ldquo;{t.text}&rdquo;</p>
                            </div>
                        );

                        return (
                            <div className="space-y-6">
                                {/* Row 1 — scrolls left */}
                                <div className="marquee-left marquee-mask overflow-hidden">
                                    <div className="marquee-track">
                                        {[...row1, ...row1, ...row1, ...row1].map((t, i) => renderCard(t, i))}
                                    </div>
                                </div>
                                {/* Row 2 — scrolls right */}
                                <div className="marquee-right marquee-mask overflow-hidden">
                                    <div className="marquee-track">
                                        {[...row2, ...row2, ...row2, ...row2].map((t, i) => renderCard(t, i))}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </section>

                {/* News Section */}
                <section className="py-28 bg-[#0a0a0a]" id="news">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-16">
                            <div>
                                <span className="text-[#c4eb5a] font-mono text-sm font-medium tracking-wider uppercase mb-4 block">Блог</span>
                                <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                    Новости и статьи
                                </h2>
                            </div>
                            <Link href="/news" className="inline-flex items-center gap-2 text-[#c4eb5a] font-semibold hover:text-[#d4f278] transition-colors">
                                Все статьи
                                <span>→</span>
                            </Link>
                        </div>

                        {news.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {news.map((article) => (
                                    <Link key={article.id} href={`/news/${article.slug}`} className="group">
                                        <article>
                                            <div className="bg-[#141414] rounded-2xl aspect-video mb-4 overflow-hidden border border-white/5">
                                                {article.cover_image_url ? (
                                                    <img
                                                        src={article.cover_image_url}
                                                        alt={article.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                        style={{
                                                            background: `linear-gradient(135deg, #${article.category_color}30 0%, #${article.category_color}10 100%)`
                                                        }}
                                                    />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                                                <span
                                                    className="px-2 py-1 rounded font-medium"
                                                    style={{ backgroundColor: `#${article.category_color}20`, color: `#${article.category_color}` }}
                                                >
                                                    {article.category}
                                                </span>
                                                <span>{article.formatted_date}</span>
                                            </div>
                                            <h3 className="font-bold text-lg text-white mb-2 group-hover:text-[#c4eb5a] transition-colors">
                                                {article.title}
                                            </h3>
                                            <p className="text-sm text-zinc-500 leading-relaxed line-clamp-2">{article.excerpt}</p>
                                        </article>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[
                                    { category: 'Советы', categoryColor: 'c4eb5a', date: 'Скоро', title: 'Как увеличить поток клиентов с помощью онлайн-записи', desc: '5 проверенных способов привлечь больше клиентов...', gradient: 'from-[#c4eb5a]/30 to-[#c4eb5a]/10' },
                                    { category: 'Обновление', categoryColor: '60a5fa', date: 'Скоро', title: 'Новый модуль аналитики: отслеживайте KPI', desc: 'Представляем расширенную аналитику для Pro тарифов...', gradient: 'from-blue-500/30 to-blue-500/10' },
                                    { category: 'Кейс', categoryColor: 'facc15', date: 'Скоро', title: 'История успеха: как барбершоп увеличил выручку', desc: 'Реальный кейс внедрения MClient...', gradient: 'from-amber-500/30 to-amber-500/10' }
                                ].map((article, idx) => (
                                    <article key={idx} className="group opacity-60">
                                        <div className="bg-[#141414] rounded-2xl aspect-video mb-4 overflow-hidden border border-white/5">
                                            <div className={`w-full h-full bg-gradient-to-br ${article.gradient}`}></div>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mb-2">
                                            <span className="px-2 py-1 rounded font-medium" style={{ backgroundColor: `#${article.categoryColor}20`, color: `#${article.categoryColor}` }}>{article.category}</span>
                                            <span>{article.date}</span>
                                        </div>
                                        <h3 className="font-bold text-lg text-white mb-2">
                                            {article.title}
                                        </h3>
                                        <p className="text-sm text-zinc-500 leading-relaxed">{article.desc}</p>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* FAQ Section */}
                <section className="py-28 bg-[#0f0f0f] relative" id="faq">
                    <div className="max-w-[1000px] mx-auto px-6">
                        <div className="text-center mb-16">
                            <span className="text-[#c4eb5a] font-mono text-sm font-medium tracking-wider uppercase mb-4 block">Поддержка</span>
                            <h2 className="text-4xl md:text-5xl font-bold text-white tracking-tight mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Частые вопросы
                            </h2>
                            <p className="text-zinc-400 text-lg">Не нашли ответ? <a href="#" className="text-[#c4eb5a] font-medium hover:underline">Напишите нам</a></p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { q: 'Могу ли я попробовать бесплатно?', a: 'Да, у нас есть пробный период 14 дней на всех тарифах, а также полностью бесплатный тариф для начинающих мастеров.' },
                                { q: 'Нужно ли устанавливать программу?', a: 'Нет, MClient работает в облаке. Заходите с любого устройства — телефона, планшета или ноутбука — через браузер.' },
                                { q: 'Как настроить онлайн-запись?', a: 'Пошаговый мастер настройки поможет за 2 минуты создать профиль, добавить услуги и получить уникальную ссылку для записи.' },
                                { q: 'Могу ли я отменить подписку?', a: 'Да, отменить подписку можно в любой момент. Средства за неиспользованный период возвращаются на карту.' },
                                { q: 'Как работают уведомления клиентам?', a: 'Система автоматически отправляет напоминания через Telegram, SMS или Email за 24 часа и за 2 часа до записи.' },
                                { q: 'Есть ли мобильное приложение?', a: 'Веб-версия адаптирована для мобильных устройств. Нативное приложение для iOS и Android — в разработке и выйдет в 2026 году.' }
                            ].map((faq, idx) => (
                                <details key={idx} className="faq-item bg-[#141414] rounded-2xl overflow-hidden group border border-white/5 hover:border-[#c4eb5a]/30 transition-all duration-300">
                                    <summary className="flex justify-between items-center p-6 cursor-pointer list-none">
                                        <h3 className="font-bold text-white pr-4">{faq.q}</h3>
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-zinc-400 group-open:bg-[#c4eb5a] group-open:text-black transition-all flex-shrink-0 group-open:rotate-45">
                                            <Plus className="w-4 h-4" />
                                        </div>
                                    </summary>
                                    <div className="px-6 pb-6">
                                        <p className="text-zinc-400 leading-relaxed">{faq.a}</p>
                                    </div>
                                </details>
                            ))}
                        </div>

                        <div className="text-center mt-12">
                            <p className="text-zinc-500 mb-4">Остались вопросы?</p>
                            <a href="#" className="inline-flex items-center gap-2 px-6 py-3 bg-[#c4eb5a] text-black font-semibold rounded-full hover:bg-[#d4f278] transition-colors">
                                Написать в поддержку
                                <MessageCircle className="w-4 h-4" />
                            </a>
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-28 bg-[#0a0a0a] relative overflow-hidden">
                    {/* Glow blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-[#c4eb5a]/15 rounded-full blur-[120px] pointer-events-none" />

                    <div className="max-w-[800px] mx-auto px-6 relative z-10 text-center">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-80px' }}
                            transition={{ duration: 0.7 }}
                        >
                            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                <span className="text-white">Начните бесплатно</span>{' '}
                                <span className="text-gradient">уже сегодня</span>
                            </h2>
                            <p className="text-zinc-400 text-lg mb-10 max-w-lg mx-auto">
                                Без привязки карты. Настройка за 2 минуты. Присоединяйтесь к тысячам мастеров, которые уже автоматизировали свой бизнес.
                            </p>
                            <Link
                                href={auth.user ? route('dashboard') : route('register')}
                                className="btn-glow inline-flex items-center gap-3 px-10 py-4 rounded-full bg-[#c4eb5a] text-black font-semibold text-lg shadow-[0_0_50px_rgba(196,235,90,0.4)] hover:shadow-[0_0_80px_rgba(196,235,90,0.5)] transition-all hover:scale-105"
                            >
                                {auth.user ? 'Перейти в кабинет' : 'Создать аккаунт'}
                                <ArrowRight className="w-5 h-5" />
                            </Link>
                            <p className="text-zinc-600 text-sm mt-6">Без привязки карты &middot; Настройка за 2 минуты</p>
                        </motion.div>
                    </div>
                </section>

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
                                <h3 className="text-2xl font-bold text-white mb-6">Готовы<br />Автоматизировать?</h3>
                                <div className="flex items-center gap-2 cursor-pointer group relative mt-8">
                                    <div className="w-10 h-10 relative flex items-center justify-center -translate-y-[2.5px]">
                                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#c4eb5a] group-hover:scale-110 transition-transform duration-300 relative z-10">
                                            <path d="M4 20V8L12 16L20 8V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                            <path d="M4 20H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                                        </svg>
                                    </div>
                                    <span className="text-xl font-bold tracking-tight text-white transition-colors group-hover:text-[#c4eb5a]">MClient</span>
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
        </>
    );
}
