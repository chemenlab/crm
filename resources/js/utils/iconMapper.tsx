import {
  Rocket,
  Calendar,
  Users,
  Briefcase,
  DollarSign,
  UserPlus,
  Footprints,
  Folder,
  BookOpen,
  FileText,
  Settings,
  HelpCircle,
  Star,
  Heart,
  Home,
  Mail,
  Phone,
  MapPin,
  Clock,
  Bell,
  Search,
  Filter,
  Download,
  Upload,
  Edit,
  Trash2,
  Plus,
  Minus,
  Check,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';

// Маппинг названий иконок на компоненты lucide-react
const iconMap: Record<string, LucideIcon> = {
  rocket: Rocket,
  calendar: Calendar,
  users: Users,
  briefcase: Briefcase,
  'dollar-sign': DollarSign,
  'user-plus': UserPlus,
  footprints: Footprints,
  folder: Folder,
  'book-open': BookOpen,
  'file-text': FileText,
  settings: Settings,
  'help-circle': HelpCircle,
  star: Star,
  heart: Heart,
  home: Home,
  mail: Mail,
  phone: Phone,
  'map-pin': MapPin,
  clock: Clock,
  bell: Bell,
  search: Search,
  filter: Filter,
  download: Download,
  upload: Upload,
  edit: Edit,
  trash2: Trash2,
  plus: Plus,
  minus: Minus,
  check: Check,
  x: X,
  'chevron-right': ChevronRight,
  'chevron-left': ChevronLeft,
  'chevron-up': ChevronUp,
  'chevron-down': ChevronDown,
};

interface IconProps {
  name?: string;
  className?: string;
  size?: number;
}

/**
 * Компонент для рендеринга иконки по названию
 */
export function Icon({ name, className = 'h-5 w-5', size }: IconProps) {
  if (!name) {
    return <Folder className={className} size={size} />;
  }

  // Если это emoji, просто возвращаем текст
  if (/[\u{1F300}-\u{1F9FF}]/u.test(name)) {
    return <span className={className}>{name}</span>;
  }

  const IconComponent = iconMap[name.toLowerCase()] || Folder;
  return <IconComponent className={className} size={size} />;
}

/**
 * Получить компонент иконки по названию
 */
export function getIconComponent(name?: string): LucideIcon {
  if (!name) {
    return Folder;
  }

  return iconMap[name.toLowerCase()] || Folder;
}
