import { Badge } from '@/Components/ui/badge';
import { Check, Clock, AlertTriangle, ShoppingCart, X } from 'lucide-react';
import type { ModuleAccessStatus } from '@/types/modules';

interface ModuleStatusBadgeProps {
  status: ModuleAccessStatus;
  size?: 'sm' | 'default';
  showIcon?: boolean;
}

/**
 * ModuleStatusBadge displays the current status of a module
 * with appropriate styling and icons.
 * 
 * Statuses:
 * - Установлен (enabled)
 * - Не установлен (not enabled, can access)
 * - Требует оплаты (purchase required)
 * - Подписка истекает (expiring soon)
 * - Требуется тариф (plan required)
 */
export function ModuleStatusBadge({ status, size = 'default', showIcon = true }: ModuleStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'text-xs px-2 py-0.5' : 'px-3 py-1';
  
  // Check if subscription is expiring within 7 days
  const isExpiringSoon = () => {
    const expiresAt = status.purchase_expires_at || status.grant_expires_at;
    if (!expiresAt) return false;
    
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    return daysUntilExpiry > 0 && daysUntilExpiry <= 7;
  };

  if (status.is_enabled) {
    if (isExpiringSoon()) {
      return (
        <Badge variant="outline" className={`text-amber-600 border-amber-600 ${sizeClasses}`}>
          {showIcon && <AlertTriangle className="h-3 w-3 mr-1" />}
          Подписка истекает
        </Badge>
      );
    }
    
    return (
      <Badge variant="outline" className={`text-green-600 border-green-600 ${sizeClasses}`}>
        {showIcon && <Check className="h-3 w-3 mr-1" />}
        Установлен
      </Badge>
    );
  }

  if (status.reason === 'purchase_required') {
    return (
      <Badge variant="outline" className={`text-blue-600 border-blue-600 ${sizeClasses}`}>
        {showIcon && <ShoppingCart className="h-3 w-3 mr-1" />}
        Требует оплаты
      </Badge>
    );
  }

  if (status.reason === 'plan_required') {
    return (
      <Badge variant="outline" className={`text-purple-600 border-purple-600 ${sizeClasses}`}>
        {showIcon && <AlertTriangle className="h-3 w-3 mr-1" />}
        Требуется тариф
      </Badge>
    );
  }

  if (status.can_access) {
    return (
      <Badge variant="outline" className={`text-muted-foreground ${sizeClasses}`}>
        {showIcon && <Clock className="h-3 w-3 mr-1" />}
        Не установлен
      </Badge>
    );
  }

  return null;
}

export default ModuleStatusBadge;
