import { useState, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, Send, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';

interface LeadFormField {
  id: number;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox' | 'email' | 'url';
  options: string[] | null;
  is_required: boolean;
}

interface Service {
  id: number;
  name: string;
  duration: number;
  price: number;
  description: string | null;
}

interface Props {
  service: Service;
  formFields: LeadFormField[];
  slug: string;
  onBack: () => void;
  onClose: () => void;
}

export default function PublicLeadForm({ service, formFields, slug, onBack, onClose }: Props) {
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<{
    name: string;
    phone: string;
    message: string;
    customFields: Record<number, any>;
  }>({
    name: '',
    phone: '',
    message: '',
    customFields: {},
  });

  // Phone mask formatter - formats as +7 (999) 123-45-67
  const formatPhone = useCallback((value: string) => {
    const digits = value.replace(/\D/g, '');
    const limited = digits.slice(0, 11);
    
    if (limited.length === 0) return '';
    if (limited.length <= 1) return `+${limited}`;
    if (limited.length <= 4) return `+${limited[0]} (${limited.slice(1)}`;
    if (limited.length <= 7) return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4)}`;
    if (limited.length <= 9) return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7)}`;
    return `+${limited[0]} (${limited.slice(1, 4)}) ${limited.slice(4, 7)}-${limited.slice(7, 9)}-${limited.slice(9, 11)}`;
  }, []);

  const handlePhoneChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
  }, [formatPhone]);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) {
      toast.error('Заполните обязательные поля');
      return;
    }

    // Validate required custom fields
    for (const field of formFields) {
      if (field.is_required && !formData.customFields[field.id]) {
        toast.error(`Поле "${field.label}" обязательно для заполнения`);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      router.post(`/m/${slug}/lead`, {
        service_id: service.id,
        name: formData.name,
        phone: formData.phone,
        message: formData.message || null,
        custom_fields: formData.customFields,
      }, {
        onSuccess: () => {
          setStep('success');
        },
        onError: (errors) => {
          console.error('Lead submission failed:', errors);
          const errorMessage = Object.values(errors)[0] as string || 'Ошибка при отправке заявки';
          toast.error(errorMessage);
        },
        onFinish: () => {
          setIsSubmitting(false);
        },
      });
    } catch (error) {
      console.error('Lead submission error:', error);
      setIsSubmitting(false);
    }
  };

  const renderField = (field: LeadFormField) => {
    const value = formData.customFields[field.id] || '';
    const onChange = (newValue: any) => {
      setFormData(prev => ({
        ...prev,
        customFields: { ...prev.customFields, [field.id]: newValue }
      }));
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'url':
        return (
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
            placeholder={field.label + (field.is_required ? ' *' : '')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      case 'textarea':
        return (
          <textarea
            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900 min-h-[100px] resize-none"
            placeholder={field.label + (field.is_required ? ' *' : '')}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold text-zinc-900"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">{field.label}{field.is_required ? ' *' : ''}</option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        );
      
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 cursor-pointer hover:border-zinc-400 transition-all">
            <input
              type="checkbox"
              className="w-5 h-5 rounded"
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span className="font-bold text-zinc-900">{field.label}{field.is_required ? ' *' : ''}</span>
          </label>
        );
      
      default:
        return null;
    }
  };

  if (step === 'success') {
    return (
      <div className="text-center py-8 animate-in zoom-in duration-500">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black mb-2 text-zinc-900">Заявка отправлена!</h2>
        <p className="text-zinc-600 text-sm mb-8">Мы свяжемся с вами в ближайшее время.</p>
        
        <div className="border border-zinc-200 bg-white/50 p-6 rounded-[32px] text-left mb-8">
          <p className="text-lg font-black text-zinc-900">{service.name}</p>
          <div className="flex gap-4 text-xs font-bold text-zinc-600 mt-2">
            <div className="flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              Заявка без даты
            </div>
          </div>
        </div>

        <button 
          onClick={onClose} 
          className="w-full py-4 border border-zinc-200 bg-white/50 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:border-zinc-400 transition-all text-zinc-900"
        >
          Закрыть
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 hover:bg-black/5 rounded-full transition-colors">
          <ChevronLeft className="w-5 h-5 text-zinc-900" />
        </button>
        <h2 className="text-2xl font-black text-zinc-900">Оставить заявку</h2>
      </div>

      {/* Selected service summary */}
      <div className="border border-zinc-200 bg-white/50 p-4 rounded-2xl mb-6">
        <p className="font-bold text-zinc-900">{service.name}</p>
        <p className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
          <ClipboardList className="w-3.5 h-3.5" />
          Заявка без привязки к дате
        </p>
      </div>

      <div className="space-y-4 mb-6 max-h-[50vh] overflow-y-auto pr-2 overscroll-contain">
        {/* Required fields */}
        <input
          className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
          placeholder="Ваше имя *"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
        />
        <input
          className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900"
          placeholder="+7 (___) ___-__-__ *"
          type="tel"
          value={formData.phone}
          onChange={handlePhoneChange}
        />
        <textarea
          className="w-full px-6 py-4 rounded-2xl border border-zinc-200 bg-white/50 outline-none focus:border-zinc-900 transition-all font-bold placeholder:text-zinc-400 text-zinc-900 min-h-[100px] resize-none"
          placeholder="Сообщение (необязательно)"
          value={formData.message}
          onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
        />

        {/* Custom fields */}
        {formFields.length > 0 && (
          <>
            <div className="pt-2">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3">Дополнительная информация</p>
            </div>
            {formFields.map((field) => (
              <div key={field.id}>
                {renderField(field)}
              </div>
            ))}
          </>
        )}
      </div>

      <button
        disabled={!formData.name || !formData.phone || isSubmitting}
        onClick={handleSubmit}
        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold transition-all disabled:opacity-30 shadow-xl shadow-zinc-900/20 flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          'Отправка...'
        ) : (
          <>
            <Send className="w-4 h-4" />
            Отправить заявку
          </>
        )}
      </button>
    </div>
  );
}
