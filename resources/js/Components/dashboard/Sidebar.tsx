import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  DollarSign,
  Settings,
  BarChart3,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface SidebarProps {
  className?: string;
}

interface NavItem {
  icon: React.ElementType;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

/**
 * Sidebar Component - Estate Dashboard Style
 * 
 * Light floating sidebar with rounded corners
 * Features: collapsible, vertical icon menu, active state, hover effects
 */
export function Sidebar({ className }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems: NavItem[] = [
    { icon: LayoutDashboard, label: 'Главная', active: true },
    { icon: Calendar, label: 'Календарь' },
    { icon: Users, label: 'Клиенты' },
    { icon: Scissors, label: 'Услуги' },
    { icon: DollarSign, label: 'Финансы' },
    { icon: BarChart3, label: 'Аналитика' },
    { icon: FileText, label: 'Отчеты' },
    { icon: Settings, label: 'Настройки' },
  ];

  return (
    <aside
      className={cn(
        'fixed left-6 top-6 bottom-6 bg-white/90 backdrop-blur-md',
        'rounded-3xl shadow-xl border border-gray-200/50',
        'flex flex-col items-center py-6 space-y-2',
        'z-50 transition-all duration-300',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      {/* Logo */}
      <div className={cn(
        "mb-6 flex items-center transition-all duration-300",
        isCollapsed ? "justify-center w-full px-0" : "px-4 gap-3"
      )}>
        <img
          src="/images/logo.svg"
          alt="MClient Logo"
          className="w-10 h-10 object-contain"
          width="40"
          height="40"
        />

        {!isCollapsed && (
          <span className="text-xl font-bold tracking-tight text-gray-900">
            MClient
          </span>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3 h-3 text-gray-600" />
        ) : (
          <ChevronLeft className="w-3 h-3 text-gray-600" />
        )}
      </button>

      {/* Navigation Items */}
      <nav className="flex-1 flex flex-col items-center space-y-2 w-full px-3">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.onClick}
              className={cn(
                'w-full rounded-xl flex items-center transition-all duration-200',
                'group relative overflow-hidden',
                isCollapsed ? 'h-12 justify-center' : 'h-12 px-4 gap-3',
                item.active
                  ? 'bg-dashboard-heading text-white shadow-lg'
                  : 'text-gray-600 hover:bg-gray-100'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />

              {!isCollapsed && (
                <span className="text-sm font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}

              {/* Tooltip for collapsed state */}
              {isCollapsed && (
                <span className={cn(
                  'absolute left-full ml-4 px-3 py-2 rounded-lg',
                  'bg-gray-900 text-white text-sm whitespace-nowrap',
                  'opacity-0 group-hover:opacity-100 pointer-events-none',
                  'transition-opacity duration-200',
                  'shadow-lg'
                )}>
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Avatar */}
      <div className="mt-auto pt-4 border-t border-gray-200/50 w-full px-3">
        <button className={cn(
          'w-full rounded-xl flex items-center transition-all',
          'hover:bg-gray-100',
          isCollapsed ? 'h-12 justify-center' : 'h-12 px-3 gap-3'
        )}>
          <div className="w-8 h-8 rounded-full bg-dashboard-primary flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            АИ
          </div>
          {!isCollapsed && (
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-gray-900">Анна Иванова</p>
              <p className="text-xs text-gray-500">Мастер</p>
            </div>
          )}
        </button>
      </div>
    </aside>
  );
}
