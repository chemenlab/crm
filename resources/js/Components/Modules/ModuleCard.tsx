import { Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/Components/ui/card';
import { Button } from '@/Components/ui/button';
import { Badge } from '@/Components/ui/badge';
import { Star, Download, Check, ShoppingCart, Settings, Package } from 'lucide-react';
import { ModuleStatusBadge } from './ModuleStatusBadge';
import { DynamicIcon } from '@/Components/DynamicIcon';
import type { Module } from '@/types/modules';

interface ModuleCardProps {
  module: Module;
  onEnable?: () => void;
  onDisable?: () => void;
  showActions?: boolean;
}

/**
 * ModuleCard component displays a module in a card format
 * with status badges, pricing info, and action buttons.
 * 
 * Action buttons based on state:
 * - Free, not installed → "Установить бесплатно" (quick action)
 * - Paid, not purchased → "Купить" → goes to module page
 * - Installed → "Настройки" → goes to settings page
 */
export function ModuleCard({ module, onEnable, onDisable, showActions = true }: ModuleCardProps) {
  const { status } = module;

  // Get first screenshot as preview
  const previewImage = module.screenshots && module.screenshots.length > 0
    ? module.screenshots[0]
    : null;

  const getPricingBadge = () => {
    if (module.pricing_type === 'free') {
      return <Badge variant="secondary">Бесплатно</Badge>;
    }
    if (module.pricing_type === 'subscription') {
      return <Badge variant="default">{module.formatted_price}/мес</Badge>;
    }
    return <Badge variant="default">{module.formatted_price}</Badge>;
  };

  const getActionButton = () => {
    if (!showActions) {
      return (
        <Button size="sm" variant="outline" asChild>
          <Link href={`/app/modules/${module.slug}`}>Подробнее</Link>
        </Button>
      );
    }

    // Если установлен - кнопка "Настройки"
    if (status.is_enabled) {
      return (
        <Button size="sm" variant="outline" asChild>
          <Link href={`/app/modules/${module.slug}/settings`}>
            <Settings className="h-4 w-4 mr-1" />
            Настройки
          </Link>
        </Button>
      );
    }

    // Если бесплатный и можно установить - быстрая установка
    if (module.pricing_type === 'free' && status.can_access) {
      return (
        <Button size="sm" onClick={onEnable}>
          <Check className="h-4 w-4 mr-1" />
          Установить
        </Button>
      );
    }

    // Если платный и не куплен - переход на страницу модуля
    if (status.reason === 'purchase_required') {
      return (
        <Button size="sm" asChild>
          <Link href={`/app/modules/${module.slug}`}>
            <ShoppingCart className="h-4 w-4 mr-1" />
            Купить
          </Link>
        </Button>
      );
    }

    // Если куплен, но не включён
    if (status.can_access) {
      return (
        <Button size="sm" onClick={onEnable}>
          <Check className="h-4 w-4 mr-1" />
          Включить
        </Button>
      );
    }

    return (
      <Button size="sm" variant="outline" asChild>
        <Link href={`/app/modules/${module.slug}`}>Подробнее</Link>
      </Button>
    );
  };

  return (
    <Card className="flex flex-col overflow-hidden group hover:shadow-md transition-shadow">
      {/* Preview Image / Placeholder */}
      <Link href={`/app/modules/${module.slug}`} className="block">
        {previewImage ? (
          <div className="relative h-32 overflow-hidden bg-muted">
            <img
              src={previewImage}
              alt={`${module.name} preview`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        ) : (
          <div className="h-32 bg-gradient-to-br from-primary/5 to-primary/10 flex items-center justify-center">
            <Package className="h-12 w-12 text-primary/30" />
          </div>
        )}
      </Link>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <DynamicIcon name={module.icon} className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">
                <Link
                  href={`/app/modules/${module.slug}`}
                  className="hover:underline"
                >
                  {module.name}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs">{module.author}</CardDescription>
            </div>
          </div>
          <ModuleStatusBadge status={status} size="sm" showIcon={false} />
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {module.description}
        </p>
        <div className="flex items-center gap-2 mt-3">
          {getPricingBadge()}
          {module.is_featured && (
            <Badge variant="outline" className="text-yellow-600 border-yellow-600">
              <Star className="h-3 w-3 mr-1" />
              Рекомендуем
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0 flex items-center justify-between">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Download className="h-3 w-3" />
          <span>{module.installs_count}</span>
          {module.rating > 0 && (
            <>
              <span className="mx-1">•</span>
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{module.rating.toFixed(1)}</span>
            </>
          )}
        </div>
        {getActionButton()}
      </CardFooter>
    </Card>
  );
}

export default ModuleCard;
