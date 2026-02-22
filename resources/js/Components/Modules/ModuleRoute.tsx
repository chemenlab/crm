import React from 'react';
import { useModules } from '@/contexts/ModuleContext';
import { Alert, AlertDescription, AlertTitle } from '@/Components/ui/alert';
import { Button } from '@/Components/ui/button';
import { Link } from '@inertiajs/react';
import { AlertCircle, Lock, ShoppingCart } from 'lucide-react';

interface ModuleRouteProps {
  /** The module slug to check */
  moduleSlug: string;
  /** Content to render if module is active */
  children: React.ReactNode;
  /** Custom component to show when module is not active */
  fallback?: React.ReactNode;
  /** Whether to show a message when module is not accessible */
  showMessage?: boolean;
}

/**
 * ModuleRoute - Wrapper component for module routes that checks if module is active
 * 
 * Use this component to wrap module pages/routes. It will:
 * - Show children if module is active for the user
 * - Show appropriate message if module is not accessible
 * - Provide actions to enable or purchase the module
 * 
 * @example
 * // Basic usage
 * <ModuleRoute moduleSlug="reviews">
 *   <ReviewsPage />
 * </ModuleRoute>
 * 
 * @example
 * // With custom fallback
 * <ModuleRoute moduleSlug="reviews" fallback={<CustomNotAvailable />}>
 *   <ReviewsPage />
 * </ModuleRoute>
 */
export function ModuleRoute({
  moduleSlug,
  children,
  fallback,
  showMessage = true,
}: ModuleRouteProps) {
  const { 
    isModuleActive, 
    canAccessModule, 
    getModuleStatus, 
    getModule,
    enableModule,
    isLoading,
  } = useModules();

  // If module is active, render children
  if (isModuleActive(moduleSlug)) {
    return <>{children}</>;
  }

  // If custom fallback provided, use it
  if (fallback) {
    return <>{fallback}</>;
  }

  // If we shouldn't show message, return null
  if (!showMessage) {
    return null;
  }

  const status = getModuleStatus(moduleSlug);
  const module = getModule(moduleSlug);

  // Module not found
  if (!status || status.reason === 'not_found') {
    return (
      <ModuleNotFoundMessage />
    );
  }

  // Module globally disabled
  if (status.reason === 'globally_disabled') {
    return (
      <ModuleDisabledMessage moduleName={module?.name ?? moduleSlug} />
    );
  }

  // User can access but hasn't enabled
  if (status.can_access && !status.is_enabled) {
    return (
      <ModuleNotEnabledMessage 
        moduleName={module?.name ?? moduleSlug}
        moduleSlug={moduleSlug}
        onEnable={() => enableModule(moduleSlug)}
        isLoading={isLoading}
      />
    );
  }

  // Needs purchase
  if (status.reason === 'purchase_required') {
    return (
      <ModulePurchaseRequiredMessage 
        moduleName={module?.name ?? moduleSlug}
        moduleSlug={moduleSlug}
        price={module?.formatted_price ?? `${status.price} ₽`}
      />
    );
  }

  // Needs higher plan
  if (status.reason === 'plan_required') {
    return (
      <ModulePlanRequiredMessage 
        moduleName={module?.name ?? moduleSlug}
        requiredPlan={status.min_plan ?? 'Pro'}
      />
    );
  }

  // Generic not accessible
  return (
    <ModuleNotAccessibleMessage moduleName={module?.name ?? moduleSlug} />
  );
}

// Sub-components for different states

function ModuleNotFoundMessage() {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Модуль не найден</AlertTitle>
        <AlertDescription>
          Запрашиваемый модуль не существует или был удалён.
        </AlertDescription>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/app/modules">Перейти в каталог</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}

function ModuleDisabledMessage({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Модуль временно недоступен</AlertTitle>
        <AlertDescription>
          Модуль «{moduleName}» временно отключён администратором. 
          Пожалуйста, попробуйте позже.
        </AlertDescription>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/app/modules">Перейти в каталог</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}

interface ModuleNotEnabledMessageProps {
  moduleName: string;
  moduleSlug: string;
  onEnable: () => void;
  isLoading: boolean;
}

function ModuleNotEnabledMessage({ 
  moduleName, 
  moduleSlug, 
  onEnable, 
  isLoading 
}: ModuleNotEnabledMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Модуль не включён</AlertTitle>
        <AlertDescription>
          Модуль «{moduleName}» доступен вам, но не включён. 
          Включите его, чтобы начать использовать.
        </AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button onClick={onEnable} disabled={isLoading}>
            {isLoading ? 'Включение...' : 'Включить модуль'}
          </Button>
          <Button asChild variant="outline">
            <Link href={`/app/modules/${moduleSlug}`}>Подробнее</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}

interface ModulePurchaseRequiredMessageProps {
  moduleName: string;
  moduleSlug: string;
  price: string;
}

function ModulePurchaseRequiredMessage({ 
  moduleName, 
  moduleSlug, 
  price 
}: ModulePurchaseRequiredMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert className="max-w-md">
        <ShoppingCart className="h-4 w-4" />
        <AlertTitle>Требуется покупка</AlertTitle>
        <AlertDescription>
          Модуль «{moduleName}» является платным. 
          Приобретите его, чтобы получить доступ к функционалу.
        </AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href={`/app/modules/${moduleSlug}`}>
              Купить за {price}
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/modules">Каталог модулей</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}

interface ModulePlanRequiredMessageProps {
  moduleName: string;
  requiredPlan: string;
}

function ModulePlanRequiredMessage({ 
  moduleName, 
  requiredPlan 
}: ModulePlanRequiredMessageProps) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert className="max-w-md">
        <Lock className="h-4 w-4" />
        <AlertTitle>Требуется подписка</AlertTitle>
        <AlertDescription>
          Модуль «{moduleName}» доступен на тарифе «{requiredPlan}» и выше. 
          Обновите подписку, чтобы получить доступ.
        </AlertDescription>
        <div className="mt-4 flex gap-2">
          <Button asChild>
            <Link href="/app/subscription">Обновить подписку</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/modules">Каталог модулей</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}

function ModuleNotAccessibleMessage({ moduleName }: { moduleName: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px] p-8">
      <Alert className="max-w-md">
        <Lock className="h-4 w-4" />
        <AlertTitle>Доступ ограничен</AlertTitle>
        <AlertDescription>
          У вас нет доступа к модулю «{moduleName}». 
          Обратитесь в поддержку для получения информации.
        </AlertDescription>
        <div className="mt-4">
          <Button asChild variant="outline">
            <Link href="/app/modules">Перейти в каталог</Link>
          </Button>
        </div>
      </Alert>
    </div>
  );
}

export default ModuleRoute;
