import { PropsWithChildren } from 'react';
import { Head } from '@inertiajs/react';
import { SidebarInset } from '@/Components/ui/sidebar';
import { AppSidebarProvider } from '@/Components/AppSidebarProvider';
import { AppSidebar } from '@/Components/app-sidebar';
import { SiteHeader } from '@/Components/site-header';
import { Toaster } from '@/Components/ui/sonner';

interface AppPageLayoutProps extends PropsWithChildren {
  title?: string;
}

export default function AppPageLayout({ title, children }: AppPageLayoutProps) {
  return (
    <AppSidebarProvider>
      {title && <Head title={title} />}
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 md:p-6">
          {children}
        </div>
      </SidebarInset>
      <Toaster richColors position="top-right" />
    </AppSidebarProvider>
  );
}
