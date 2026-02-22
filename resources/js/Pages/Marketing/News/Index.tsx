import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Eye, ArrowRight } from 'lucide-react';
import MarketingLayout from '@/Layouts/MarketingLayout';

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    category: string;
    category_color: string;
    cover_image_url: string | null;
    formatted_date: string;
    reading_time: number;
    view_count: number;
}

interface Props {
    news: {
        data: NewsItem[];
        current_page: number;
        last_page: number;
        total: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}

export default function Index({ news }: Props) {
    const newsData = news?.data || [];

    return (
        <MarketingLayout>
            <Head title="Новости и статьи — MClient">
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            {/* Hero Section */}
            <section className="pt-36 pb-16">
                <div className="max-w-[1200px] mx-auto px-6">
                    <Link href="/" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#c4eb5a] transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        На главную
                    </Link>

                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-6" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Новости и <span className="bg-gradient-to-r from-[#c4eb5a] to-[#a3e635] bg-clip-text text-transparent">статьи</span>
                    </h1>
                    <p className="text-xl text-zinc-400 max-w-2xl">
                        Полезные советы, обновления платформы и истории успеха наших клиентов
                    </p>
                </div>
            </section>

            {/* News Grid */}
            <section className="pb-28">
                <div className="max-w-[1200px] mx-auto px-6">
                    {newsData.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-white/5 flex items-center justify-center">
                                <Calendar className="w-10 h-10 text-zinc-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                Скоро здесь появятся новости
                            </h2>
                            <p className="text-zinc-500">
                                Мы готовим для вас интересные материалы
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {newsData.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={`/news/${item.slug}`}
                                        className="group"
                                    >
                                        <article className="bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#c4eb5a]/30 transition-all duration-300 h-full flex flex-col">
                                            {/* Cover Image */}
                                            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-white/5 to-white/[0.02]">
                                                {item.cover_image_url ? (
                                                    <img
                                                        src={item.cover_image_url}
                                                        alt={item.title}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                ) : (
                                                    <div
                                                        className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                                                        style={{
                                                            background: `linear-gradient(135deg, #${item.category_color}30 0%, #${item.category_color}10 100%)`
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="p-6 flex-1 flex flex-col">
                                                <div className="flex items-center gap-3 text-xs mb-4">
                                                    <span
                                                        className="px-2.5 py-1 rounded-full font-medium"
                                                        style={{
                                                            backgroundColor: `#${item.category_color}20`,
                                                            color: `#${item.category_color}`
                                                        }}
                                                    >
                                                        {item.category}
                                                    </span>
                                                    <span className="text-zinc-500">{item.formatted_date}</span>
                                                </div>

                                                <h2 className="text-lg font-bold text-white mb-3 group-hover:text-[#c4eb5a] transition-colors line-clamp-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                                    {item.title}
                                                </h2>

                                                <p className="text-sm text-zinc-500 leading-relaxed line-clamp-3 flex-1">
                                                    {item.excerpt}
                                                </p>

                                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-xs text-zinc-500">
                                                    <div className="flex items-center gap-4">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {item.reading_time} мин
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Eye className="w-3.5 h-3.5" />
                                                            {item.view_count}
                                                        </span>
                                                    </div>
                                                    <span className="flex items-center gap-1 text-[#c4eb5a] font-medium group-hover:gap-2 transition-all">
                                                        Читать
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            </div>
                                        </article>
                                    </Link>
                                ))}
                            </div>

                            {/* Pagination */}
                            {(news?.last_page || 1) > 1 && (
                                <div className="flex justify-center gap-2 mt-12">
                                    {(news?.links || []).map((link, index) => {
                                        if (!link.url) return null;

                                        // Skip prev/next labels
                                        if (link.label.includes('Previous') || link.label.includes('Next')) {
                                            return null;
                                        }

                                        return (
                                            <Link
                                                key={index}
                                                href={link.url}
                                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all ${link.active
                                                    ? 'bg-[#c4eb5a] text-black'
                                                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white'
                                                    }`}
                                            >
                                                {link.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </section>
        </MarketingLayout>
    );
}
