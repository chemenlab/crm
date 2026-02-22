import { useState, FormEvent } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import { Input } from '@/Components/ui/input';
import { Label } from '@/Components/ui/label';
import { ArrowLeft, Eye, EyeOff, Lock, Check, X } from 'lucide-react';

interface Props {
    token: string;
    email?: string;
}

export default function ResetPassword({ token, email: initialEmail }: Props) {
    const [formData, setFormData] = useState({
        token,
        email: initialEmail || '',
        password: '',
        password_confirmation: '',
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Password strength checks
    const passwordChecks = {
        length: formData.password.length >= 8,
        hasNumber: /\d/.test(formData.password),
        hasLetter: /[a-zA-Z]/.test(formData.password),
        match: formData.password === formData.password_confirmation && formData.password_confirmation.length > 0,
    };

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        setErrors({});

        router.post('/reset-password', formData, {
            onError: (errors) => {
                setErrors(errors);
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    };

    return (
        <>
            <Head>
                <title>Новый пароль — MClient</title>
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
                    
                    :root {
                        --lime: #c4eb5a;
                        --lime-light: #d4f278;
                        --lime-dark: #9bc93e;
                        --lime-glow: rgba(196, 235, 90, 0.4);
                    }
                    
                    .mesh-gradient {
                        background: radial-gradient(ellipse 80% 50% at 50% -20%, rgba(196, 235, 90, 0.15) 0%, transparent 50%);
                    }
                    
                    .glass-card {
                        background: rgba(255, 255, 255, 0.03);
                        border: 1px solid rgba(255, 255, 255, 0.08);
                        backdrop-filter: blur(20px);
                    }
                    
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

                    .input-dark {
                        background: rgba(255, 255, 255, 0.05) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        color: #fafafa !important;
                        transition: all 0.3s ease !important;
                    }
                    .input-dark::placeholder {
                        color: #71717a !important;
                    }
                    .input-dark:focus {
                        border-color: rgba(196, 235, 90, 0.5) !important;
                        box-shadow: 0 0 0 2px rgba(196, 235, 90, 0.1) !important;
                        outline: none !important;
                    }
                    
                    .noise-overlay {
                        position: fixed;
                        inset: 0;
                        pointer-events: none;
                        opacity: 0.03;
                        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
                        z-index: 1000;
                    }

                    @keyframes glow-pulse {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.05); }
                    }
                    .animate-glow { animation: glow-pulse 3s ease-in-out infinite; }
                `}</style>
            </Head>

            <div className="min-h-screen bg-[#0a0a0a] antialiased overflow-x-hidden relative">
                {/* Noise Overlay */}
                <div className="noise-overlay" />

                {/* Background Effects */}
                <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none overflow-hidden">
                    <div className="mesh-gradient w-full h-full absolute top-0"></div>
                    <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#c4eb5a]/10 rounded-full blur-[100px] animate-glow"></div>
                </div>

                {/* Back to Login */}
                <div className="absolute top-6 left-6 z-50">
                    <Link
                        href="/login"
                        className="flex items-center gap-2 text-zinc-400 hover:text-[#c4eb5a] transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={18} />
                        <span>Назад ко входу</span>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
                    <div className="w-full max-w-md">
                        {/* Logo */}
                        <div className="text-center mb-10">
                            <Link href="/" className="inline-flex items-center gap-3 group">
                                <div className="w-14 h-14 relative flex items-center justify-center">
                                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"
                                        className="text-[#c4eb5a] group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-[0_0_15px_rgba(196,235,90,0.5)]">
                                        <path d="M4 20V8L12 16L20 8V20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"></path>
                                        <path d="M4 20H20" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"></path>
                                    </svg>
                                    <div className="absolute inset-0 bg-[#c4eb5a]/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-glow"></div>
                                </div>
                                <span className="text-3xl font-bold tracking-tight text-white transition-colors group-hover:text-[#c4eb5a]" style={{ fontFamily: 'Outfit, sans-serif' }}>MClient</span>
                            </Link>
                        </div>

                        {/* Card */}
                        <div className="glass-card rounded-3xl p-8 md:p-10 shadow-2xl">
                            {/* Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-16 h-16 rounded-2xl bg-[#c4eb5a]/10 flex items-center justify-center border border-[#c4eb5a]/20">
                                    <Lock className="w-8 h-8 text-[#c4eb5a]" />
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Outfit, sans-serif' }}>Новый пароль</h1>
                                <p className="text-zinc-400 text-sm">Придумайте новый надёжный пароль для вашего аккаунта</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-300 text-sm font-medium">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                        placeholder="ivan@example.com"
                                        className="input-dark h-12 rounded-xl px-4"
                                        required
                                    />
                                    {errors.email && (
                                        <p className="text-sm text-red-400">{errors.email}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-zinc-300 text-sm font-medium">Новый пароль</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPassword ? "text" : "password"}
                                            value={formData.password}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password: e.target.value })
                                            }
                                            placeholder="Минимум 8 символов"
                                            className="input-dark h-12 rounded-xl px-4 pr-12"
                                            required
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-sm text-red-400">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password_confirmation" className="text-zinc-300 text-sm font-medium">Подтвердите пароль</Label>
                                    <div className="relative">
                                        <Input
                                            id="password_confirmation"
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={formData.password_confirmation}
                                            onChange={(e) =>
                                                setFormData({ ...formData, password_confirmation: e.target.value })
                                            }
                                            placeholder="Повторите пароль"
                                            className="input-dark h-12 rounded-xl px-4 pr-12"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                        >
                                            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Password Strength Indicator */}
                                {formData.password.length > 0 && (
                                    <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
                                        <div className="text-xs text-zinc-400 mb-3 font-medium">Требования к паролю:</div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.length ? 'text-[#c4eb5a]' : 'text-zinc-500'}`}>
                                                {passwordChecks.length ? <Check size={14} /> : <X size={14} />}
                                                <span>Минимум 8 символов</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.hasLetter ? 'text-[#c4eb5a]' : 'text-zinc-500'}`}>
                                                {passwordChecks.hasLetter ? <Check size={14} /> : <X size={14} />}
                                                <span>Содержит буквы</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.hasNumber ? 'text-[#c4eb5a]' : 'text-zinc-500'}`}>
                                                {passwordChecks.hasNumber ? <Check size={14} /> : <X size={14} />}
                                                <span>Содержит цифры</span>
                                            </div>
                                            <div className={`flex items-center gap-2 text-xs ${passwordChecks.match ? 'text-[#c4eb5a]' : 'text-zinc-500'}`}>
                                                {passwordChecks.match ? <Check size={14} /> : <X size={14} />}
                                                <span>Пароли совпадают</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    className="btn-glow w-full h-12 rounded-xl bg-[#c4eb5a] text-black font-semibold text-base shadow-[0_0_30px_rgba(196,235,90,0.3)] hover:shadow-[0_0_40px_rgba(196,235,90,0.4)] transition-all hover:scale-[1.02] hover:bg-[#d4f278] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 mt-6"
                                    disabled={processing}
                                >
                                    {processing ? 'Сохранение...' : 'Сохранить пароль'}
                                </button>
                            </form>

                            <div className="mt-8 text-center">
                                <span className="text-zinc-500">Вспомнили пароль? </span>
                                <Link href="/login" className="text-[#c4eb5a] hover:text-[#d4f278] font-medium transition-colors">
                                    Войти
                                </Link>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="mt-8 text-center text-xs text-zinc-600">
                            © {new Date().getFullYear()} MClient. Все права защищены.
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
