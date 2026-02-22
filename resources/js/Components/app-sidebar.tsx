import * as React from "react"
import {
  LayoutDashboard,
  Calendar,
  ClipboardList,
  Users,
  Wallet,
  // Puzzle, // TODO: unhide for production — modules hidden for MVP
  BookOpen,
  MessageSquare,
  Settings,
} from "lucide-react"
import { usePage } from "@inertiajs/react"

import { NavMain } from "@/Components/nav-main"
import { NavSecondary } from "@/Components/nav-secondary"
import { NavUser } from "@/Components/nav-user"
import { SubscriptionInfoSidebar } from "@/Components/subscription-info-sidebar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarGroup,        // TODO: unhide for production — modules hidden for MVP
  // SidebarGroupContent, // TODO: unhide for production — modules hidden for MVP
} from "@/Components/ui/sidebar"
// TODO: unhide for production — modules hidden for MVP
// import { SidebarModuleMenuItems, SidebarModuleMenuBottomItems } from "@/Components/Modules"

const navMain = [
  {
    title: "Главная",
    url: "/app/dashboard",
    icon: LayoutDashboard,
    id: "dashboard-link",
  },
  {
    title: "Календарь",
    url: "/app/calendar",
    icon: Calendar,
    id: "calendar-link",
  },
  {
    title: "Услуги",
    url: "/app/services",
    icon: ClipboardList,
    id: "services-link",
  },
  {
    title: "Клиенты",
    url: "/app/clients",
    icon: Users,
    id: "clients-link",
  },
  {
    title: "Финансы",
    url: "/app/finance",
    icon: Wallet,
    id: "finance-link",
  },
];

const navSecondary = [
  // TODO: unhide for production — modules hidden for MVP
  // {
  //   title: "Приложения",
  //   url: "/app/modules",
  //   icon: Puzzle,
  //   id: "modules-link",
  // },
  {
    title: "База знаний",
    url: "/app/knowledge-base",
    icon: BookOpen,
    id: "knowledge-base-link",
  },
  {
    title: "Поддержка",
    url: "/app/support",
    icon: MessageSquare,
    id: "support-link",
  },
  {
    title: "Настройки",
    url: "/app/settings",
    icon: Settings,
    id: "settings-link",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { auth, unreadTicketsCount } = usePage().props as any;
  const user = auth.user;

  // Transform user data for NavUser component if needed, or pass directly
  // NavUser typically expects { name, email, avatar }
  const userData = {
    name: user.name,
    email: user.email,
    avatar: user.avatar ? `/storage/${user.avatar}` : '', // Using avatar from database
  };

  // Get subscription and usage data from page props
  const subscription = (usePage().props as any).subscription;
  const usageStats = (usePage().props as any).usage_stats;

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              asChild
              className="data-[slot=sidebar-menu-button]:!p-2 h-auto hover:bg-transparent"
            >
              <a href="/app/dashboard" className="flex w-full flex-col gap-0.5 pl-2 transition-all group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:gap-0">
                <div className="flex w-full items-center gap-2 group-data-[collapsible=icon]:justify-center">
                  <div className="flex aspect-square size-8 items-center justify-center">
                    <img src="/images/logo.svg" className="size-8 object-contain" alt="MClient Logo" />
                  </div>
                  <span className="truncate font-bold text-2xl text-primary leading-none mt-1 group-data-[collapsible=icon]:hidden">MClient</span>
                </div>
                <div className="w-full text-left pl-1 group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-xs text-muted-foreground block">Управляй своим временем</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} />

        {/* TODO: unhide for production — modules hidden for MVP */}
        {/* <SidebarGroup>
          <SidebarGroupContent>
            <SidebarModuleMenuItems />
          </SidebarGroupContent>
        </SidebarGroup> */}

        <NavSecondary items={navSecondary} unreadCount={unreadTicketsCount} className="mt-auto" />

        {/* TODO: unhide for production — modules hidden for MVP */}
        {/* <SidebarGroup>
          <SidebarGroupContent>
            <SidebarModuleMenuBottomItems />
          </SidebarGroupContent>
        </SidebarGroup> */}
      </SidebarContent>
      <SidebarFooter>
        {/* Subscription Info - only visible when sidebar is expanded */}
        <div className="group-data-[collapsible=icon]:hidden mb-2">
          <SubscriptionInfoSidebar
            subscription={subscription}
            usageStats={usageStats}
          />
        </div>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  )
}
