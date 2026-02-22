import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, Clock, Eye, ArrowRight } from 'lucide-react';
import MarketingLayout from '@/Layouts/MarketingLayout';

interface NewsItem {
    id: number;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    category_color: string;
    cover_image_url: string | null;
    formatted_date: string;
    reading_time: number;
    view_count: number;
}

interface RelatedNewsItem {
    id: number;
    title: string;
    slug: string;
    category: string;
    category_color: string;
    cover_image_url: string | null;
    formatted_date: string;
}

interface Props {
    news: NewsItem;
    relatedNews: RelatedNewsItem[];
}

export default function Show({ news, relatedNews = [] }: Props) {
    if (!news) {
        return null;
    }

    return (
        <MarketingLayout>
            <Head title={`${news.title} — MClient`}>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Outfit:wght@400;500;600;700&display=swap" rel="stylesheet" />
            </Head>

            {/* Article Content */}
            <article className="pt-36 pb-20">
                <div className="max-w-[800px] mx-auto px-6">
                    {/* Back Link */}
                    <Link href="/news" className="inline-flex items-center gap-2 text-zinc-400 hover:text-[#c4eb5a] transition-colors mb-8">
                        <ArrowLeft className="w-4 h-4" />
                        Все новости
                    </Link>

                    {/* Category & Meta */}
                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <span
                            className="px-3 py-1.5 rounded-full text-sm font-medium"
                            style={{
                                backgroundColor: `#${news.category_color}20`,
                                color: `#${news.category_color}`
                            }}
                        >
                            {news.category}
                        </span>
                        <div className="flex items-center gap-4 text-sm text-zinc-500">
                            <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" />
                                {news.formatted_date}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4" />
                                {news.reading_time} мин чтения
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Eye className="w-4 h-4" />
                                {news.view_count} просмотров
                            </span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight mb-8 leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        {news.title}
                    </h1>

                    {/* Excerpt */}
                    <p className="text-xl text-zinc-400 mb-10 leading-relaxed">
                        {news.excerpt}
                    </p>

                    {/* Cover Image */}
                    {news.cover_image_url && (
                        <div className="aspect-video rounded-2xl overflow-hidden mb-12 border border-white/5">
                            <img
                                src={news.cover_image_url}
                                alt={news.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Content */}
                    <div
                        className="prose prose-invert prose-lg max-w-none
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-white
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-zinc-300 prose-p:leading-relaxed
            prose-a:text-[#c4eb5a] prose-a:no-underline hover:prose-a:underline
            prose-strong:text-white prose-strong:font-semibold
            prose-ul:text-zinc-300 prose-ol:text-zinc-300
            prose-li:marker:text-[#c4eb5a]
            prose-blockquote:border-l-[#c4eb5a] prose-blockquote:bg-white/5 prose-blockquote:rounded-r-xl prose-blockquote:py-4 prose-blockquote:px-6
            prose-code:bg-white/10 prose-code:text-[#c4eb5a] prose-code:px-2 prose-code:py-0.5 prose-code:rounded prose-code:font-normal
            prose-pre:bg-[#141414] prose-pre:border prose-pre:border-white/10"
                        dangerouslySetInnerHTML={{ __html: news.content }}
                    />
                </div>
            </article>

            {/* Related News */}
            {relatedNews.length > 0 && (
                <section className="py-20 border-t border-white/5">
                    <div className="max-w-[1200px] mx-auto px-6">
                        <h2 className="text-2xl font-bold text-white mb-8" style={{ fontFamily: 'Outfit, sans-serif' }}>
                            Похожие статьи
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {relatedNews.map((item) => (
                                <Link
                                    key={item.id}
                                    href={`/news/${item.slug}`}
                                    className="group"
                                >
                                    <article className="bg-[#141414] rounded-2xl overflow-hidden border border-white/5 hover:border-[#c4eb5a]/30 transition-all duration-300">
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

                                        <div className="p-5">
                                            <div className="flex items-center gap-3 text-xs mb-3">
                                                <span
                                                    className="px-2 py-1 rounded-full font-medium"
                                                    style={{
                                                        backgroundColor: `#${item.category_color}20`,
                                                        color: `#${item.category_color}`
                                                    }}
                                                >
                                                    {item.category}
                                                </span>
                                                <span className="text-zinc-500">{item.formatted_date}</span>
                                            </div>

                                            <h3 className="font-bold text-white group-hover:text-[#c4eb5a] transition-colors line-clamp-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
                                                {item.title}
                                            </h3>
                                        </div>
                                    </article>
                                </Link>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* CTA Section */}
            <section className="py-20 bg-[#0f0f0f]">
                <div className="max-w-[800px] mx-auto px-6 text-center">
                    <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: 'Outfit, sans-serif' }}>
                        Готовы начать?
                    </h2>
                    <p className="text-zinc-400 mb-8">
                        Попробуйте MClient бесплатно и убедитесь сами
                    </p>
                    <Link
                        href="/register"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-[#c4eb5a] text-black font-semibold text-lg transition-all hover:scale-105 hover:bg-[#d4f278] shadow-[0_0_40px_rgba(196,235,90,0.4)]"
                    >
                        Попробовать бесплатно
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </section>
        </MarketingLayout>
    );
}
