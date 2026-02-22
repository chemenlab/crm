import { useState } from 'react';
import { Head } from '@inertiajs/react';
import {
  Phone,
  MapPin,
  Clock,
  ChevronRight,
  LayoutGrid,
  Share2,
  PhoneCall,
  CalendarDays,
  ArrowUpRight,
  Star,
  MessageSquare,
  X,
  ChevronLeft
} from 'lucide-react';
import BookingModal from '@/Components/BookingModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/Components/ui/dialog';
import { Button } from '@/Components/ui/button';
import { Input } from '@/Components/ui/input';
import { Textarea } from '@/Components/ui/textarea';
import { Label } from '@/Components/ui/label';
import axios from 'axios';

// VK Icon component
const VkIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M15.073 2H8.937C3.333 2 2 3.333 2 8.927v6.136C2 20.667 3.333 22 8.927 22h6.146C20.667 22 22 20.667 22 15.073V8.937C22 3.333 20.667 2 15.073 2zm3.4 14.533h-1.6c-.6 0-.787-.48-1.867-1.573-1.013-.96-1.44-1.093-1.693-1.093-.347 0-.453.1-.453.573v1.44c0 .4-.133.64-1.2.64-1.76 0-3.72-1.067-5.093-3.067C4.693 10.693 4 8.4 4 7.933c0-.253.1-.48.573-.48h1.6c.427 0 .587.187.747.64.827 2.373 2.187 4.453 2.747 4.453.213 0 .307-.1.307-.64V9.72c-.067-1.093-.64-1.187-.64-1.573 0-.187.16-.373.413-.373h2.507c.347 0 .48.187.48.613v2.987c0 .347.16.48.253.48.213 0 .387-.133.787-.533 1.213-1.36 2.08-3.453 2.08-3.453.12-.253.307-.48.733-.48h1.6c.48 0 .587.253.48.6-.2.933-2.133 3.653-2.133 3.653-.173.267-.24.387 0 .693.173.227.733.693 1.107 1.12.693.773 1.227 1.427 1.373 1.88.133.453-.107.693-.56.693z" />
  </svg>
);

// Telegram Icon component
const TelegramIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

// WhatsApp Icon component  
const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

interface Review {
  id: number;
  author_name: string;
  rating: number;
  text: string | null;
  is_verified: boolean;
  is_featured: boolean;
  created_at: string;
  response: string | null;
}

interface ModuleData {
  reviews?: {
    reviews: Review[];
    average_rating: number;
    total_reviews: number;
  };
}

interface ActiveModule {
  slug: string;
  name: string;
  hooks: Record<string, boolean>;
}

interface ServiceOption {
  id: number;
  name: string;
  price_change: number;
  duration_change: number;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  options?: ServiceOption[];
  booking_type?: 'appointment' | 'lead';
}

interface CustomField {
  id: number;
  name: string;
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'image' | 'photo' | 'file';
  is_required: boolean;
  options?: string[];
}

interface LeadFormField {
  id: number;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'email' | 'url';
  options: string[] | null;
  is_required: boolean;
}

interface Props {
  master: {
    name: string;
    username: string;
    avatar: string | null;
    phone: string;
    niche: string;
    site_title: string;
    site_description: string;
    theme_color: string;
    site_bio: string | null;
    site_location: string | null;
    site_address: string | null;
    site_gradient_from: string | null;
    site_gradient_to: string | null;
    social_links: {
      instagram?: string;
      vk?: string;
      telegram?: string;
      whatsapp?: string;
    };
  };
  services: Service[];
  custom_fields?: CustomField[];
  lead_form_fields?: LeadFormField[];
  portfolio_items: Array<{
    id: number;
    title: string;
    description: string | null;
    thumbnail_url: string;
    image_url: string;
    tag: string | null;
  }>;
  slug: string;
  seo: {
    title: string;
    description: string;
    image: string | null;
    url: string;
    type: string;
  };
  schema: any;
  activeModules?: ActiveModule[];
  moduleData?: ModuleData;
}

export default function Show({ master, services, custom_fields = [], lead_form_fields = [], portfolio_items, slug, seo, schema, activeModules = [], moduleData = {} }: Props) {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedInitialService, setSelectedInitialService] = useState<typeof services[0] | undefined>();
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({ author_name: '', rating: 5, text: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSubmitSuccess, setReviewSubmitSuccess] = useState(false);
  const [selectedPortfolioIndex, setSelectedPortfolioIndex] = useState<number | null>(null);

  // Check if reviews module is active
  const hasReviewsModule = activeModules.some(m => m.slug === 'reviews');
  const reviewsData = moduleData.reviews;

  const handleBooking = (service?: typeof services[0]) => {
    setSelectedInitialService(service);
    setIsBookingOpen(true);
  };

  const handleReviewSubmit = async () => {
    if (!reviewForm.author_name.trim()) return;

    setIsSubmittingReview(true);
    try {
      await axios.post(`/api/modules/reviews/public/${master.username}`, reviewForm);
      setReviewSubmitSuccess(true);
      setReviewForm({ author_name: '', rating: 5, text: '' });
      setTimeout(() => {
        setIsReviewDialogOpen(false);
        setReviewSubmitSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit review:', error);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      <Head>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />

        {/* Open Graph */}
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:type" content={seo.type} />
        <meta property="og:url" content={seo.url} />
        {seo.image && <meta property="og:image" content={seo.image} />}

        {/* Schema.org */}
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>

        {/* Glass Morphism Styles */}
        <style>{`
          body {
            background-color: #f8fafc;
          }

          .glass-card {
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(24px) saturate(180%);
            -webkit-backdrop-filter: blur(24px) saturate(180%);
            border: 1px solid rgba(255, 255, 255, 0.6);
            box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.04);
          }

          .glass-icon {
            background: rgba(255, 255, 255, 0.6);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.8);
          }

          .floating-dock {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.8);
            box-shadow: 0 -10px 40px rgba(0,0,0,0.06);
          }

          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
            100% { transform: translateY(0px); }
          }


        `}</style>
      </Head>

      <div className="min-h-screen pb-32">
        {/* Шапка */}
        <header className="fixed top-6 left-0 right-0 z-50 px-4">
          <div className="max-w-xl mx-auto glass-card rounded-full px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full overflow-hidden border border-white">
                {master.avatar ? (
                  <img src={master.avatar} className="w-full h-full object-cover" alt={master.name} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                )}
              </div>
              <span className="font-bold text-sm tracking-tight text-zinc-900">{master.name}</span>
            </div>
            <button className="p-2 hover:bg-white/40 rounded-full transition-colors">
              <Share2 className="w-4 h-4 text-zinc-900" />
            </button>
          </div>
        </header>

        <main className="max-w-xl mx-auto px-4 pt-28 space-y-8">

          {/* Карточка профиля */}
          <section className="glass-card rounded-[40px] p-8 text-center ">
            <div className="relative inline-block mb-6">
              <div className="w-32 h-32 rounded-[32px] overflow-hidden border-4 border-white shadow-2xl relative z-10">
                {master.avatar ? (
                  <img src={master.avatar} className="w-full h-full object-cover" alt={master.name} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-500 to-purple-500" />
                )}
              </div>
            </div>

            <h1 className="text-4xl font-black tracking-tighter mb-2 text-zinc-900">{master.name}</h1>
            <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-6">{master.niche}</p>

            {master.site_location && (
              <div className="flex items-center justify-center gap-2 text-zinc-700 text-xs font-semibold">
                {(() => {
                  const fullAddress = [master.site_location, master.site_address].filter(Boolean).join(', ');
                  const yandexMapsUrl = `https://yandex.ru/maps/?text=${encodeURIComponent(fullAddress)}`;

                  return (
                    <a
                      href={yandexMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 hover:text-zinc-900 transition-colors"
                    >
                      <MapPin className="w-4 h-4" />
                      <span className="underline decoration-dotted underline-offset-2">{fullAddress}</span>
                    </a>
                  );
                })()}
              </div>
            )}
          </section>

          {/* Биография и Соцсети */}
          <div className="grid grid-cols-1 gap-4">
            {master.site_bio && (
              <section className="glass-card rounded-[32px] p-6 space-y-4">
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-600">О специалисте</h2>
                <p className="text-zinc-900 leading-relaxed font-medium">{master.site_bio}</p>
              </section>
            )}

            {(() => {
              const socials = [
                { id: 'tg', icon: TelegramIcon, link: master.social_links.telegram ? `https://t.me/${master.social_links.telegram}` : null, color: 'text-[#0088cc]', label: 'Telegram' },
                { id: 'vk', icon: VkIcon, link: master.social_links.vk ? `https://vk.com/${master.social_links.vk}` : null, color: 'text-[#0077ff]', label: 'VK' },
                { id: 'wa', icon: WhatsAppIcon, link: master.social_links.whatsapp ? `https://wa.me/${master.social_links.whatsapp}` : null, color: 'text-[#25D366]', label: 'WhatsApp' }
              ].filter(social => social.link);

              if (socials.length === 0) return null;

              return (
                <div className="flex gap-3">
                  {socials.map((social) => (
                    <a
                      key={social.id}
                      href={social.link!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 glass-card h-14 rounded-2xl flex items-center justify-center hover:scale-[1.02] active:scale-95 transition-all"
                      title={social.label}
                    >
                      <social.icon className={`w-6 h-6 ${social.color}`} />
                    </a>
                  ))}
                </div>
              );
            })()}

            <a href={`tel:${master.phone}`} className="glass-card rounded-[32px] p-6 flex items-center justify-between group hover:bg-white/60 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
                  <PhoneCall className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Прямая связь</p>
                  <p className="font-bold text-zinc-900">{master.phone}</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-zinc-600 group-hover:text-zinc-900 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
            </a>
          </div>

          {/* Секция услуг */}
          <section className="space-y-4">
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 px-4">Доступные услуги</h2>
            <div className="space-y-3">
              {services.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleBooking(s)}
                  className="glass-card p-6 rounded-[32px] hover:bg-white/90 transition-all cursor-pointer group flex justify-between items-center"
                >
                  <div className="space-y-1">
                    <h3 className="font-extrabold text-lg tracking-tight text-zinc-900">{s.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {s.duration} МИН</span>
                      <span className="text-zinc-900">{s.price} ₽</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-xl glass-icon flex items-center justify-center group-hover:bg-zinc-900 group-hover:text-white transition-all">
                    <ChevronRight className="w-5 h-5 text-zinc-700" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Портфолио */}
          {portfolio_items.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Портфолио</h2>
                <LayoutGrid className="w-4 h-4 text-zinc-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                {portfolio_items.map((item, index) => (
                  <div
                    key={item.id}
                    className="glass-card p-2 rounded-[32px] group overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPortfolioIndex(index)}
                  >
                    <div className="aspect-[4/5] rounded-[24px] overflow-hidden relative">
                      <img src={item.thumbnail_url} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={item.title} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <p className="text-white text-[10px] font-black uppercase tracking-widest">{item.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Лайтбокс портфолио */}
          {selectedPortfolioIndex !== null && (
            <div
              className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center"
              onClick={() => setSelectedPortfolioIndex(null)}
            >
              {/* Кнопка закрытия */}
              <button
                className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                onClick={() => setSelectedPortfolioIndex(null)}
              >
                <X className="w-6 h-6 text-white" />
              </button>

              {/* Навигация влево */}
              {selectedPortfolioIndex > 0 && (
                <button
                  className="absolute left-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPortfolioIndex(selectedPortfolioIndex - 1);
                  }}
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Изображение */}
              <div
                className="max-w-4xl max-h-[85vh] px-16"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={portfolio_items[selectedPortfolioIndex].image_url}
                  alt={portfolio_items[selectedPortfolioIndex].title}
                  className="max-w-full max-h-[85vh] object-contain rounded-lg"
                />
                {portfolio_items[selectedPortfolioIndex].title && (
                  <p className="text-white text-center mt-4 font-medium">
                    {portfolio_items[selectedPortfolioIndex].title}
                  </p>
                )}
              </div>

              {/* Навигация вправо */}
              {selectedPortfolioIndex < portfolio_items.length - 1 && (
                <button
                  className="absolute right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPortfolioIndex(selectedPortfolioIndex + 1);
                  }}
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              )}

              {/* Счётчик */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
                {selectedPortfolioIndex + 1} / {portfolio_items.length}
              </div>
            </div>
          )}

          {/* Секция отзывов (модуль) */}
          {hasReviewsModule && (
            <section className="space-y-4">
              <div className="flex items-center justify-between px-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">Отзывы клиентов</h2>
                {reviewsData && reviewsData.total_reviews > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-zinc-900">{reviewsData.average_rating}</span>
                    <span className="text-xs text-zinc-500">({reviewsData.total_reviews})</span>
                  </div>
                )}
              </div>

              {/* Список отзывов */}
              {reviewsData && reviewsData.reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviewsData.reviews.slice(0, 5).map((review) => (
                    <div key={review.id} className="glass-card p-5 rounded-[28px] space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            {review.author_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-zinc-900">{review.author_name}</p>
                            {review.is_verified && (
                              <p className="text-[10px] text-emerald-600 font-semibold">Проверенный клиент</p>
                            )}
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${star <= review.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-zinc-300'
                                }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.text && (
                        <p className="text-sm text-zinc-700 leading-relaxed">{review.text}</p>
                      )}
                      {review.response && (
                        <div className="bg-zinc-100 rounded-xl p-3 mt-2">
                          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Ответ мастера</p>
                          <p className="text-sm text-zinc-700">{review.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="glass-card p-6 rounded-[28px] text-center">
                  <MessageSquare className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                  <p className="text-zinc-600 text-sm">Пока нет отзывов. Будьте первым!</p>
                </div>
              )}

              {/* Кнопка оставить отзыв */}
              <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                <DialogTrigger asChild>
                  <button className="w-full glass-card p-4 rounded-[24px] flex items-center justify-center gap-2 hover:bg-white/60 transition-all group">
                    <Star className="w-5 h-5 text-indigo-500" />
                    <span className="font-bold text-sm text-zinc-900">Оставить отзыв</span>
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Оставить отзыв о {master.name}</DialogTitle>
                  </DialogHeader>
                  {reviewSubmitSuccess ? (
                    <div className="py-8 text-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star className="w-8 h-8 text-emerald-600" />
                      </div>
                      <p className="font-bold text-lg text-zinc-900">Спасибо за отзыв!</p>
                      <p className="text-sm text-zinc-500 mt-1">Ваш отзыв отправлен на модерацию</p>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="author_name">Ваше имя</Label>
                        <Input
                          id="author_name"
                          value={reviewForm.author_name}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, author_name: e.target.value }))}
                          placeholder="Как вас зовут?"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Оценка</Label>
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                              className="p-1 hover:scale-110 transition-transform"
                            >
                              <Star
                                className={`w-8 h-8 ${star <= reviewForm.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-zinc-300'
                                  }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="text">Ваш отзыв</Label>
                        <Textarea
                          id="text"
                          value={reviewForm.text}
                          onChange={(e) => setReviewForm(prev => ({ ...prev, text: e.target.value }))}
                          placeholder="Расскажите о вашем опыте..."
                          rows={4}
                        />
                      </div>
                      <Button
                        onClick={handleReviewSubmit}
                        disabled={!reviewForm.author_name.trim() || isSubmittingReview}
                        className="w-full"
                      >
                        {isSubmittingReview ? 'Отправка...' : 'Отправить отзыв'}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </section>
          )}

          <footer className="py-12 text-center opacity-30">
            <p className="text-[8px] font-black uppercase tracking-[0.6em]">MasterLink • Публичная страница мастера</p>
          </footer>
        </main>

        {/* Плавающая панель записи */}
        <div className="fixed bottom-6 left-4 right-4 z-[100]">
          <div className="max-w-sm mx-auto floating-dock rounded-[28px] p-2 flex gap-2">
            <button
              onClick={() => handleBooking()}
              className="flex-1 py-4 bg-zinc-900 text-white rounded-[22px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-zinc-900/30"
            >
              <CalendarDays className="w-5 h-5" />
              <span className="text-xs font-black uppercase tracking-widest">Записаться сейчас</span>
            </button>
            <a href={`tel:${master.phone}`} className="w-14 h-14 glass-card rounded-[22px] flex items-center justify-center active:scale-95 transition-all">
              <Phone className="w-5 h-5 text-zinc-900" />
            </a>
          </div>
        </div>

        <BookingModal
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
          initialService={selectedInitialService}
          services={services}
          customFields={custom_fields}
          leadFormFields={lead_form_fields}
          slug={slug}
        />
      </div>
    </>
  );
}
