import { useState, FormEvent } from 'react';
import { router, Link, Head } from '@inertiajs/react';
import CodeInput from '@/Components/Auth/CodeInput';
import { Mail, CheckCircle2, AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

interface Props {
    email?: string;
    message?: string;
    error?: string;
}

export default function VerifyEmail({ email, message, error }: Props) {
    const [code, setCode] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [resending, setResending] = useState(false);
    const [successMessage, setSuccessMessage] = useState(message || '');
    const [errorMessage, setErrorMessage] = useState(error || '');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        if (code.length !== 6) {
            setErrors({ code: 'Введите 6-значный код' });
            return;
        }

        setProcessing(true);
        setErrors({});
        setErrorMessage('');

        router.post('/verify-email', { code }, {
            onError: (errors) => {
                setErrors(errors);
                if (errors.code) {
                    setErrorMessage(errors.code);
                }
                setProcessing(false);
            },
            onSuccess: () => {
                setProcessing(false);
            },
        });
    };

    const handleResend = () => {
        setResending(true);
        setErrors({});
        setErrorMessage('');
        setSuccessMessage('');

        router.post('/verify-email/resend', {}, {
            onError: (errors) => {
                if (errors.email) {
                    setErrorMessage(errors.email);
                }
                setResending(false);
            },
            onSuccess: () => {
                setSuccessMessage('Код отправлен повторно! Проверьте почту.');
                setResending(false);
            },
        });
    };

    return (
        <>
            <Head>
                <title>Подтверждение email — MClient</title>
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
                    @keyframes float {
                        0%, 100% { transform: translateY(0); }
                        50% { transform: translateY(-10px); }
                    }
                    .animate-glow { animation: glow-pulse 3s ease-in-out infinite; }
                    .animate-float { animation: float 4s ease-in-out infinite; }

                    /* Override CodeInput styles for dark theme */
                    .code-input-container input {
                        background: rgba(255, 255, 255, 0.05) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        color: #fafafa !important;
                        font-size: 1.5rem !important;
                        font-weight: 600 !important;
                    }
                    .code-input-container input:focus {
                        border-color: rgba(196, 235, 90, 0.5) !important;
                        box-shadow: 0 0 0 2px rgba(196, 235, 90, 0.1) !important;
                    }
                    .code-input-container input.error {
                        border-color: rgba(239, 68, 68, 0.5) !important;
                    }
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

                {/* Back to Home */}
                <div className="absolute top-6 left-6 z-50">
                    <Link
                        href="/"
                        className="flex items-center gap-2 text-zinc-400 hover:text-[#c4eb5a] transition-colors text-sm font-medium"
                    >
                        <ArrowLeft size={18} />
                        <span>На главную</span>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-16">
                    <div className="w-full max-w-md">
                        {/* Logo */}
                        <div className="text-center mb-8">
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
                            {/* Animated Mail Icon */}
                            <div className="flex justify-center mb-6">
                                <div className="w-20 h-20 rounded-2xl bg-[#c4eb5a]/10 flex items-center justify-center border border-[#c4eb5a]/20 animate-float">
                                    <Mail className="w-10 h-10 text-[#c4eb5a]" />
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-2xl font-bold text-white mb-3" style={{ fontFamily: 'Outfit, sans-serif' }}>Подтвердите email</h1>
                                <p className="text-zinc-400 text-sm">
                                    Мы отправили 6-значный код на
                                </p>
                                {email && (
                                    <p className="text-[#c4eb5a] font-medium mt-2">{email}</p>
                                )}
                            </div>

                            {/* Success Message */}
                            {successMessage && (
                                <div className="mb-6 p-4 rounded-xl bg-[#c4eb5a]/10 border border-[#c4eb5a]/20 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#c4eb5a] flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-[#c4eb5a]">{successMessage}</p>
                                </div>
                            )}

                            {/* Error Message */}
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-red-400">{errorMessage}</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <label className="text-sm font-medium text-zinc-400 text-center block">
                                        Введите код из письма
                                    </label>
                                    <div className="code-input-container">
                                        <CodeInput
                                            value={code}
                                            onChange={setCode}
                                            error={!!errors.code}
                                        />
                                    </div>
                                    {errors.code && (
                                        <p className="text-sm text-red-400 text-center">
                                            {errors.code}
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    className="btn-glow w-full h-12 rounded-xl bg-[#c4eb5a] text-black font-semibold text-base shadow-[0_0_30px_rgba(196,235,90,0.3)] hover:shadow-[0_0_40px_rgba(196,235,90,0.4)] transition-all hover:scale-[1.02] hover:bg-[#d4f278] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                    disabled={processing || code.length !== 6}
                                >
                                    {processing ? 'Проверка...' : 'Подтвердить'}
                                </button>
                            </form>

                            {/* Resend Section */}
                            <div className="mt-8 text-center">
                                <p className="text-sm text-zinc-500 mb-3">
                                    Не получили код?
                                </p>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={resending}
                                    className="inline-flex items-center gap-2 text-[#c4eb5a] hover:text-[#d4f278] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <RefreshCw size={16} className={resending ? 'animate-spin' : ''} />
                                    {resending ? 'Отправка...' : 'Отправить повторно'}
                                </button>
                            </div>

                            {/* Info */}
                            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                                <p className="text-xs text-zinc-600">
                                    Код действителен в течение 15 минут
                                </p>
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
