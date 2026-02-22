/**
 * Module system types
 */

export interface ModulePricing {
  type: 'free' | 'subscription' | 'one_time';
  price?: number;
}

export interface Module {
  id: number;
  slug: string;
  name: string;
  description: string;
  long_description?: string;
  documentation?: string;
  changelog?: string;
  version: string;
  author?: string;
  category: string;
  category_label: string;
  icon?: string;
  screenshots?: string[];
  pricing_type: 'free' | 'subscription' | 'one_time';
  pricing_type_label: string;
  price: number;
  formatted_price: string;
  subscription_period?: 'monthly' | 'yearly';
  min_plan?: string;
  is_featured: boolean;
  installs_count: number;
  rating: number;
  reviews_count?: number;
  dependencies?: string[]
  permissions?: string[];
  status: ModuleAccessStatus;
}

export interface ModuleAccessStatus {
  can_access: boolean;
  reason: 'free' | 'grant' | 'purchased' | 'purchase_required' | 'plan_required' | 'globally_disabled' | 'not_found';
  is_enabled: boolean;
  is_free?: boolean;
  min_plan?: string;
  grant_expires_at?: string;
  purchase_expires_at?: string;
  auto_renew?: boolean;
  price?: number;
  pricing_type?: string;
}

export interface UserModule {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  category?: string;
  category_label?: string;
  is_enabled: boolean;
  enabled_at?: string;
  last_used_at?: string;
  usage_count: number;
  status: ModuleAccessStatus;
}

export interface ModulePurchase {
  id: number;
  module_slug: string;
  module_name: string;
  module_icon?: string;
  price: number;
  formatted_price: string;
  currency: string;
  pricing_type: 'subscription' | 'one_time';
  pricing_type_label: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded' | 'cancelled';
  status_label: string;
  purchased_at?: string;
  expires_at?: string;
  auto_renew: boolean;
  is_active: boolean;
  is_expired: boolean;
  created_at: string;
}

export interface HookResult {
  module: string;
  data: any;
}

export interface HookContext {
  user?: any;
  client?: any;
  appointment?: any;
  period?: string;
  master?: any;
  services?: any[];
  [key: string]: any;
}

export type HookPoint =
  | 'sidebar.menu'
  | 'sidebar.menu.bottom'
  | 'dashboard.widgets'
  | 'dashboard.stats'
  | 'client.card.tabs'
  | 'client.card.actions'
  | 'appointment.form.fields'
  | 'appointment.card.info'
  | 'settings.sections'
  | 'public.page.sections'
  | 'public.page.booking';

export interface ModuleHookComponent {
  moduleSlug: string;
  component: React.ComponentType<any>;
  priority?: number;
}
