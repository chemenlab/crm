// Core components
export { HookRenderer, useHasHooks, ConditionalHookRenderer } from './HookRenderer';
export { ModuleRoute } from './ModuleRoute';
export { ModuleCard } from './ModuleCard';
export { PurchaseDialog } from './PurchaseDialog';
export { ModuleSettings } from './ModuleSettings';
export { ModuleStatusBadge } from './ModuleStatusBadge';
export { ScreenshotGallery } from './ScreenshotGallery';
export { InstallationProgress } from './InstallationProgress';
export { ReviewForm } from './ReviewForm';
export { ReviewsList } from './ReviewsList';
export { ModuleDocumentation } from './ModuleDocumentation';
export type { ModuleSettingsSchema, SettingFieldSchema } from './ModuleSettings';

// Sidebar hooks
export {
  SidebarModuleMenuItems,
  SidebarModuleMenuBottomItems,
  ModulesCatalogLink
} from './SidebarModuleHooks';

// Dashboard hooks
export {
  DashboardModuleWidgets,
  DashboardModuleStats
} from './DashboardModuleHooks';

// Client card hooks
export {
  ClientCardModuleTabs,
  ClientCardModuleActions,
  useClientCardHasModuleTabs,
  useClientCardHasModuleActions
} from './ClientCardModuleHooks';

// Settings hooks
export {
  SettingsModuleSections,
  useSettingsHasModuleSections,
  useModuleSettingsTabs
} from './SettingsModuleHooks';
