import { useState, useEffect, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { Calendar, Clock, CheckCircle2, ChevronRight, ChevronLeft, X, Camera, ImageIcon, Loader2, ClipboardList } from 'lucide-react';
import axios from 'axios';
import { toast } from 'sonner';
import { Progress } from '@/Components/ui/progress';
import PublicLeadForm from '@/Pages/Modules/Leads/components/PublicLeadForm';

type BookingStep = 'service' | 'options' | 'date' | 'time' | 'contact' | 'success';

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

interface BookingData {
  service?: Service;
  selectedOptions?: number[];
  date?: Date;
  timeSlot?: string;
  customerName?: string;
  customerPhone?: string;
  customFields?: Record<number, any>;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialService?: Service;
  services: Service[];
  customFields?: CustomField[];
  leadFormFields?: LeadFormField[];
  slug: string;
}

export default function BookingModal({ isOpen, onClose, initialService, services, customFields = [], leadFormFields = [], slug }: Props) {
  const [step, setStep] = useState<BookingStep>(initialService ? 'options' : 'service');
  const [data, setData] = useState<BookingData>({ service: initialService, selectedOptions: [], customFields: {} });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  
  // Track uploaded temp files for cleanup
  const [uploadedFiles, setUploadedFiles] = useState<Record<number, { path: string; name: string; url: string; localPreview?: string }>>({});
  const [uploadingFields, setUploadingFields] = useState<Record<number, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<number, number>>({});

  // Phone mask formatter - formats as +7 (999) 123-45-67
  const formatPhone = useCallback((value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Limit to 11 digits (Russian phone)
    const limited = digits.slice(0, 11);
    
    // Format the phone number
    if (limited.length === 0) return '';
    if (limited.length <= 1) return `+${limited}`;
    if (limited.length <= 4) return `+${limited[0]} (${limited.slice(1)}`;
    if (limited.length <= 7) return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
    if (limited.length <= 9) return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7)}`;
    return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7, 9)}-${limited.slice(9, 11)}`;
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setData(prev => ({ ...prev, customerPhone: formatted }));
  }, [formatPhone]);

  // Upload file immediately when selected
  const handleFileUpload = useCallback(async (fieldId: number, file: File) => {
    setUploadingFields(prev => ({ ...prev, [fieldId]: true }));
    setUploadProgress(prev => ({ ...prev, [fieldId]: 0 }));
    
    // Create local preview immediately
    const localPreview = URL.createObjectURL(file);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`/m/${slug}/upload-temp`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(prev => ({ ...prev, [fieldId]: progress }));
        }
      });
      
      const uploadedFile = {
        path: response.data.path,
        name: response.data.name,
        url: response.data.url,
        localPreview, // Use local preview for display
      };
      
      setUploadedFiles(prev => ({ ...prev, [fieldId]: uploadedFile }));
      setData(prev => ({
        ...prev,
        customFields: { ...prev.customFields, [fieldId]: response.data.path }
      }));
      
      toast.success('Фото загружено');
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error('Ошибка загрузки фото');
      URL.revokeObjectURL(localPreview);
    } finally {
      setUploadingFields(prev => ({ ...prev, [fieldId]: false }));
      setUploadProgress(prev => ({ ...prev, [fieldId]: 0 }));
    }
  }, [slug]);

  // Delete uploaded file
  const handleFileDelete = useCallback(async (fieldId: number) => {
    const uploadedFile = uploadedFiles[fieldId];
    if (!uploadedFile) return;
    
    // Revoke local preview URL
    if (uploadedFile.localPreview) {
      URL.revokeObjectURL(uploadedFile.localPreview);
    }
    
    try {
      await axios.delete(`/m/${slug}/delete-temp`, {
        data: { path: uploadedFile.path }
      });
    } catch (error) {
      console.error('Delete failed:', error);
    }
    
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[fieldId];
      return newFiles;
    });
    setData(prev => {
      const newCustomFields = { ...prev.customFields };
      delete newCustomFields[fieldId];
      return { ...prev, customFields: newCustomFields };
    });
  }, [slug, uploadedFiles]);

  // Cleanup uploaded files when modal closes without submitting
  const cleanupUploadedFiles = useCallback(async () => {
    const filesToDelete = Object.values(uploadedFiles);
    for (const file of filesToDelete) {
      try {
        await axios.delete(`/m/${slug}/delete-temp`, {
          data: { path: file.path }
        });
      } catch (error) {
        console.error('Cleanup failed:', error);
      }
    }
    setUploadedFiles({});
  }, [slug, uploadedFiles]);

  // Handle modal close - cleanup files if not success
  const handleClose = useCallback(() => {
    if (step !== 'success') {
      cleanupUploadedFiles();
    }
    onClose();
  }, [step, cleanupUploadedFiles, onClose]);

  // Calculate total price and duration based on selected options
  const calculateTotals = () => {
    if (!data.service) return { price: 0, duration: 0 };
    
    const basePrice = Number(data.service.price);
    const baseDuration = Number(data.service.duration);
    
    let price = isNaN(basePrice) ? 0 : basePrice;
    let duration = isNaN(baseDuration) ? 0 : baseDuration;
    
    if (data.selectedOptions && data.service.options) {
      data.service.options
        .filter(opt => data.selectedOptions?.includes(opt.id))
        .forEach(opt => {
          const priceChange = Number(opt.price_change);
          const durationChange = Number(opt.duration_change);
          price += isNaN(priceChange) ? 0 : priceChange;
          duration += isNaN(durationChange) ? 0 : durationChange;
        });
    }
    
    return { price, duration };
  };

  const totals = calculateTotals();

  // Filter public custom fields (show all active fields for now)
  const publicFields = customFields;

  // Reset step and data when modal opens with a new service
  useEffect(() => {
    if (isOpen) {
      if (initialService) {
        // Check if this is a lead service
        if (initialService.booking_type === 'lead') {
          setShowLeadForm(true);
          setData({ service: initialService, selectedOptions: [], customFields: {} });
        } else {
          setShowLeadForm(false);
          // If service has options, show options step; otherwise skip to date
          const hasOptions = initialService.options && initialService.options.length > 0;
          setStep(hasOptions ? 'options' : 'date');
          setData({ service: initialService, selectedOptions: [], customFields: {} });
        }
      } else {
        setShowLeadForm(false);
        setStep('service');
        setData({ selectedOptions: [], customFields: {} });
      }
      setAvailableSlots([]);
      setUploadedFiles({});
      setUploadingFields({});
      setUploadProgress({});
    }
  }, [isOpen, initialService]);

  // Load available time slots when date is selected
  useEffect(() => {
    if (data.date && data.service) {
      loadTimeSlots();
    }
  }, [data.date, data.service]);

  const loadTimeSlots = async () => {
    if (!data.date || !data.service) return;

    setIsLoadingSlots(true);
    try {
      // Format date in local timezone (YYYY-MM-DD)
      const year = data.date.getFullYear();
      const month = String(data.date.getMonth() + 1).padStart(2, '0');
      const day = String(data.date.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;

      const response = await axios.get(`/m/${slug}/slots`, {
        params: {
          date: localDate,
          service_id: data.service.id,
          duration: data.service.duration,
        },
      });
      setAvailableSlots(response.data);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setAvailableSlots([]);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  const handleNext = () => {
    if (step === 'service') {
      // Check if selected service is a lead type
      if (data.service?.booking_type === 'lead') {
        setShowLeadForm(true);
        return;
      }
      // After selecting service, check if it has options
      const hasOptions = data.service?.options && data.service.options.length > 0;
      setStep(hasOptions ? 'options' : 'date');
    }
    else if (step === 'options') setStep('date');
    else if (step === 'date') setStep('time');
    else if (step === 'time') setStep('contact');
    else if (step === 'contact') handleSubmit();
  };

  const handleBack = () => {
    if (step === 'options') setStep('service');
    else if (step === 'date') {
      const hasOptions = data.service?.options && data.service.options.length > 0;
      setStep(hasOptions ? 'options' : 'service');
    }
    else if (step === 'time') setStep('date');
    else if (step === 'contact') setStep('time');
  };

  const toggleOption = (optionId: number) => {
    const current = data.selectedOptions || [];
    const newOptions = current.includes(optionId)
      ? current.filter(id => id !== optionId)
      : [...current, optionId];
    setData({ ...data, selectedOptions: newOptions });
  };

  const handleSubmit = async () => {
    if (!data.service || !data.date || !data.timeSlot || !data.customerName || !data.customerPhone) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Format date in local timezone (YYYY-MM-DD)
      const year = data.date.getFullYear();
      const month = String(data.date.getMonth() + 1).padStart(2, '0');
      const day = String(data.date.getDate()).padStart(2, '0');
      const localDate = `${year}-${month}-${day}`;

      await router.post(`/m/${slug}/book`, {
        service_id: data.service.id,
        date: localDate,
        time: data.timeSlot,
        name: data.customerName,
        phone: data.customerPhone,
        option_ids: data.selectedOptions || [],
        custom_fields: data.customFields || {},
      }, {
        onSuccess: () => {
          setStep('success');
        },
        onError: (errors) => {
          console.error('Booking failed:', errors);
          toast.error('Ошибка при записи. Попробуйте еще раз.');
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('Booking error:', error);
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xl" onClick={handleClose} />
      
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-[48px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
        <button onClick={handleClose} className="absolute right-6 top-6 p-2 hover:bg-black/5 rounded-full transition-all z-10">
          <X className="w-5 h-5 text-zinc-400" />
        </button>

        <div className="p-8 overflow-y-auto flex-1 overscroll-contain">
          {/* Show lead form for lead services */}
          {showLeadForm && data.service && (
            <PublicLeadForm
              service={data.service}
              formFields={leadFormFields}
              slug={slug}
              onBack={() => {
                setShowLeadForm(false);
                setStep('service');
              }}
              onClose={onClose}
            />
          )}

          {/* Regular booking flow */}
          {!showLeadForm && step !== 'success' && (
            <div className="flex gap-1.5 mb-8">
              {(['service', 'options', 'date', 'time', 'contact'] as BookingStep[]).map((s) => {
                // Skip options step in progress if service has no options
                if (s === 'options' && (!data.service?.options || data.service.options.length === 0)) {
                  return null;
                }
                const steps = data.service?.options?.length 
                  ? ['service', 'options', 'date', 'time', 'contact']
                  : ['service', 'date', 'time', 'contact'];
                const currentIdx = steps.indexOf(step);
                const stepIdx = steps.indexOf(s);
                return (
                  <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-700 ${
                    currentIdx >= stepIdx ? 'bg-zinc-900' : 'bg-black/5'
                  }`} />
                );
              })}
            </div>
          )}

          {!showLeadForm && step === 'service' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-2xl font-black mb-6 text-zinc-900">Выберите услугу</h2>
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar overscroll-contain">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setData({ ...data, service: s }); handleNext(); }}
                    className="w-full text-left p-5 rounded-3xl border border-zinc-200 hover:border-zinc-400 bg-white/50 transition-all group flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-zinc-900">{s.name}</h3>
                        {s.booking_type === 'lead' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[9px] font-bold uppercase tracking-wider">
                            <ClipboardList className="w-3 h-3" />
                            Заявка
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                        {s.booking_type === 'lead' ? (
                          <span>{Number(s.price).toLocaleString('ru-RU')} ₽</span>
                        ) : (
                          <span>{s.duration} мин • {Number(s.price).toLocaleString('ru-RU')} ₽</span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 'options' && data.service && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-zinc-900" />
                </button>
                <h2 className="text-2xl font-black text-zinc-900">Дополнительно</h2>
              </div>

              {/* Selected service summary */}
              <div className="border border-zinc-200 bg-white/50 p-4 rounded-2xl mb-6">
                <p className="font-bold text-zinc-900">{data.service.name}</p>
                <p className="text-xs text-zinc-500">{data.service.duration} мин • {Number(data.service.price).toLocaleString('ru-RU')} ₽</p>
              </div>

              {/* Service options */}
              {data.service.options && data.service.options.length > 0 && (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Опции услуги</p>
                  {data.service.options.map((option) => {
                    const isSelected = data.selectedOptions?.includes(option.id);
                    return (
                      <button
                        key={option.id}
                        onClick={() => toggleOption(option.id)}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex justify-between items-center ${
                          isSelected ? 'bg-zinc-900 text-white' : 'border border-zinc-200 bg-white/50 hover:border-zinc-400'
                        }`}
                      >
                        <div>
                          <p className={`font-bold ${isSelected ? 'text-white' : 'text-zinc-900'}`}>{option.name}</p>
                          <p className={`text-xs ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`}>
                            {option.price_change > 0 ? '+' : ''}{Number(option.price_change).toLocaleString('ru-RU')} ₽
                            {option.duration_change !== 0 && ` • ${option.duration_change > 0 ? '+' : ''}${option.duration_change} мин`}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-white bg-white' : 'border-zinc-300'
                        }`}>
                          {isSelected && <div className="w-3 h-3 rounded-full bg-zinc-900" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Total */}
              <div className="border border-zinc-200 bg-white/50 p-4 rounded-2xl mb-6 flex justify-between items-center">
                <span className="text-zinc-600 font-medium">Итого:</span>
                <div className="text-right">
                  <p className="font-black text-zinc-900">{Number(totals.price).toLocaleString('ru-RU')} ₽</p>
                  <p className="text-xs text-zinc-500">{totals.duration} мин</p>
                </div>
              </div>

              <button
                onClick={handleNext}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold transition-all"
              >
                Далее
              </button>
            </div>
          )}

          {step === 'date' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-zinc-900" />
                </button>
                <h2 className="text-2xl font-black text-zinc-900">Выберите дату</h2>
              </div>
              
              {/* Месяц и год */}
              <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-zinc-900">
                  {new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}
                </h3>
              </div>

              <div className="grid grid-cols-7 gap-2 mb-8 text-center">
                {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((d, i) => (
                  <div key={i} className="text-[9px] font-black text-zinc-500 tracking-widest uppercase">{d}</div>
                ))}
                {(() => {
                  const today = new Date();
                  const year = today.getFullYear();
                  const month = today.getMonth();
                  
                  // Первый день месяца
                  const firstDay = new Date(year, month, 1);
                  // Последний день месяца
                  const lastDay = new Date(year, month + 1, 0);
                  
                  // День недели первого дня (0 = воскресенье, нужно конвертировать в понедельник = 0)
                  let firstDayOfWeek = firstDay.getDay();
                  firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
                  
                  const daysInMonth = lastDay.getDate();
                  const cells = [];
                  
                  // Пустые ячейки до первого дня
                  for (let i = 0; i < firstDayOfWeek; i++) {
                    cells.push(<div key={`empty-${i}`} className="py-3" />);
                  }
                  
                  // Дни месяца
                  for (let day = 1; day <= daysInMonth; day++) {
                    const d = new Date(year, month, day);
                    const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                    const isSelected = data.date?.toDateString() === d.toDateString();
                    
                    cells.push(
                      <button
                        key={day}
                        onClick={() => !isPast && setData({ ...data, date: d })}
                        disabled={isPast}
                        className={`py-3 rounded-2xl transition-all ${
                          isSelected 
                            ? 'bg-zinc-900 text-white shadow-lg scale-105' 
                            : isPast 
                              ? 'text-zinc-300 cursor-not-allowed' 
                              : 'text-zinc-900 hover:bg-black/5'
                        }`}
                      >
                        <div className="text-[10px] font-bold">{day}</div>
                      </button>
                    );
                  }
                  
                  return cells;
                })()}
              </div>
              <button
                disabled={!data.date}
                onClick={handleNext}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold transition-all disabled:opacity-30"
              >
                Далее
              </button>
            </div>
          )}

          {step === 'time' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-zinc-900" />
                </button>
                <h2 className="text-2xl font-black text-zinc-900">Выберите время</h2>
              </div>
              
              {isLoadingSlots ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
                  <p className="mt-4 text-sm text-zinc-600">Загрузка доступных слотов...</p>
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-zinc-600">На выбранную дату нет доступных слотов</p>
                  <button
                    onClick={handleBack}
                    className="mt-4 text-sm text-zinc-900 underline font-bold"
                  >
                    Выбрать другую дату
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        onClick={() => setData({ ...data, timeSlot: slot })}
                        className={`py-4 rounded-2xl font-bold transition-all ${
                          data.timeSlot === slot 
                            ? 'bg-zinc-900 text-white ring-2 ring-zinc-900 ring-offset-2' 
                            : 'border border-zinc-200 text-zinc-900 hover:border-zinc-400 bg-white/50'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!data.timeSlot}
                    onClick={handleNext}
                    className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold transition-all disabled:opacity-30"
                  >
                    Подтвердить время
                  </button>
                </>
              )}
            </div>
          )}

          {step === 'contact' && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <button onClick={handleBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                  <ChevronLeft className="w-5 h-5 text-zinc-900" />
                </button>
                <h2 className="text-2xl font-black text-zinc-900">Ваши контакты</h2>
              </div>
              <div className="space-y-4 mb-6 max-h-[40vh] overflow-y-auto pr-2 overscroll-contain">
                {/* Required fields */}
                <input
                  className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
                  placeholder="Ваше имя *"
                  value={data.customerName || ''}
                  onChange={(e) => setData({ ...data, customerName: e.target.value })}
                />
                <input
                  className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
                  placeholder="+7 (___) ___-__-__ *"
                  type="tel"
                  value={data.customerPhone || ''}
                  onChange={handlePhoneChange}
                />

                {/* Custom fields */}
                {publicFields.length > 0 && (
                  <>
                    <div className="pt-2">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Дополнительная информация</p>
                    </div>
                    {publicFields.map((field) => (
                      <div key={field.id}>
                        {field.type === 'text' && (
                          <input
                            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
                            placeholder={field.name + (field.is_required ? ' *' : '')}
                            value={data.customFields?.[field.id] || ''}
                            onChange={(e) => setData({ 
                              ...data, 
                              customFields: { ...data.customFields, [field.id]: e.target.value } 
                            })}
                          />
                        )}
                        {field.type === 'number' && (
                          <input
                            type="number"
                            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
                            placeholder={field.name + (field.is_required ? ' *' : '')}
                            value={data.customFields?.[field.id] || ''}
                            onChange={(e) => setData({ 
                              ...data, 
                              customFields: { ...data.customFields, [field.id]: e.target.value } 
                            })}
                          />
                        )}
                        {field.type === 'select' && field.options && (
                          <select
                            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold text-zinc-900"
                            value={data.customFields?.[field.id] || ''}
                            onChange={(e) => setData({ 
                              ...data, 
                              customFields: { ...data.customFields, [field.id]: e.target.value } 
                            })}
                          >
                            <option value="">{field.name}{field.is_required ? ' *' : ''}</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        )}
                        {field.type === 'checkbox' && (
                          <label className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 cursor-pointer">
                            <input
                              type="checkbox"
                              className="w-5 h-5 rounded"
                              checked={data.customFields?.[field.id] || false}
                              onChange={(e) => setData({ 
                                ...data, 
                                customFields: { ...data.customFields, [field.id]: e.target.checked } 
                              })}
                            />
                            <span className="font-bold text-zinc-900">{field.name}</span>
                          </label>
                        )}
                        {field.type === 'date' && (
                          <div className="relative">
                            <input
                              type="date"
                              className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold text-zinc-900"
                              value={data.customFields?.[field.id] || ''}
                              onChange={(e) => setData({ 
                                ...data, 
                                customFields: { ...data.customFields, [field.id]: e.target.value } 
                              })}
                            />
                            <span className="absolute left-6 top-1 text-[10px] text-zinc-500">{field.name}</span>
                          </div>
                        )}
                        {(field.type === 'photo' || field.type === 'image') && (
                          <div className="border border-zinc-200 bg-white/50 rounded-2xl p-4">
                            <p className="text-sm font-bold text-zinc-900 mb-3">{field.name}{field.is_required ? ' *' : ''}</p>
                            
                            {uploadingFields[field.id] ? (
                              <div className="relative overflow-hidden rounded-xl bg-zinc-100">
                                {/* Show preview while uploading */}
                                <div className="w-full h-40 bg-zinc-100 flex items-center justify-center">
                                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/80 backdrop-blur-sm z-10">
                                    <div className="relative">
                                      <div className="w-14 h-14 rounded-full bg-zinc-900/10 flex items-center justify-center">
                                        <Loader2 className="w-7 h-7 text-zinc-900 animate-spin" />
                                      </div>
                                    </div>
                                    <div className="w-32">
                                      <Progress value={uploadProgress[field.id] || 0} className="h-1.5" />
                                    </div>
                                    <span className="text-xs font-medium text-zinc-600">
                                      {uploadProgress[field.id] || 0}% загружено
                                    </span>
                                  </div>
                                  <ImageIcon className="w-12 h-12 text-zinc-300" />
                                </div>
                              </div>
                            ) : uploadedFiles[field.id] ? (
                              <div className="relative group">
                                <div className="relative overflow-hidden rounded-xl">
                                  <img 
                                    src={uploadedFiles[field.id].localPreview || uploadedFiles[field.id].url} 
                                    alt="Preview" 
                                    className="w-full h-40 object-cover"
                                  />
                                  {/* Hover overlay */}
                                  <div 
                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                    onClick={() => handleFileDelete(field.id)}
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <X className="w-5 h-5 text-white" />
                                      </div>
                                      <span className="text-white text-xs font-medium">Удалить</span>
                                    </div>
                                  </div>
                                  {/* Success badge */}
                                  <div className="absolute top-2 left-2 bg-emerald-500 text-white px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Загружено
                                  </div>
                                </div>
                                <p className="text-xs text-zinc-500 mt-2 truncate px-1">
                                  {uploadedFiles[field.id].name}
                                </p>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed border-zinc-300 cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all">
                                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                                  <Camera className="w-6 h-6 text-zinc-400" />
                                </div>
                                <span className="text-sm font-medium text-zinc-600">Нажмите чтобы выбрать фото</span>
                                <span className="text-xs text-zinc-400 mt-1">JPG, PNG — сжимается автоматически</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      handleFileUpload(field.id, file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <button
                disabled={!data.customerName || !data.customerPhone || isSubmitting}
                onClick={handleNext}
                className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold transition-all disabled:opacity-30 shadow-xl shadow-zinc-900/20"
              >
                {isSubmitting ? 'Отправка...' : 'Забронировать'}
              </button>
            </div>
          )}

          {step === 'success' && (
            <div className="text-center py-8 animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-3xl font-black mb-2 text-zinc-900">Готово!</h2>
              <p className="text-zinc-600 text-sm mb-8">Вы успешно записаны на прием.</p>
              
              <div className="border border-zinc-200 bg-white/50 p-6 rounded-[32px] text-left mb-8">
                <p className="text-lg font-black text-zinc-900">{data.service?.name}</p>
                <div className="flex gap-4 text-xs font-bold text-zinc-600 mt-2">
                  <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> {data.date?.toLocaleDateString('ru')}</div>
                  <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {data.timeSlot}</div>
                </div>
              </div>

              <button onClick={onClose} className="w-full py-4 border border-zinc-200 bg-white/50 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-zinc-400 transition-all text-zinc-900">
                Закрыть
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
