import { Bell, CirclePlus, Search } from "lucide-react"
import { Link, usePage } from "@inertiajs/react"
import { useState } from "react"

import { Button } from "@/Components/ui/button"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/Components/ui/sidebar"

import { ClientSearchPalette } from "@/Components/ClientSearchPalette"
import { NotificationsModal } from "@/Components/NotificationsModal"
import { useNotifications } from "@/hooks/useNotifications"

export function NavMain({
  items,
}: {
  items: {
    title: string
    url: string
    icon?: React.ElementType
    id?: string
  }[]
}) {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const { unreadCount, refreshCount } = useNotifications()
  const { url } = usePage()

  const handleNotificationsClose = () => {
    setIsNotificationsOpen(false)
    refreshCount() // Refresh count when modal closes
  }

  // Check if menu item is active
  const isActive = (itemUrl: string) => {
    return url.startsWith(itemUrl)
  }

  // Prevent sidebar from expanding on click - do nothing, let navigation happen
  const handleMenuClick = (e: React.MouseEvent) => {
    // Don't stop propagation - let the link work normally
    // The sidebar state is already saved in cookie
  }

  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        {/* Search - hide in icon mode */}
        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarMenu>
            <SidebarMenuItem>
              <Button
                onClick={() => setIsSearchOpen(true)}
                variant="outline"
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
                title="Поиск клиентов (⌘K)"
              >
                <Search className="h-4 w-4" />
                <span>Поиск клиентов...</span>
                <kbd className="ml-auto rounded border border-border/60 bg-muted px-1.5 py-0.5 text-xs">
                  ⌘K
                </kbd>
              </Button>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        {/* Search icon only - show in icon mode */}
        <div className="hidden group-data-[collapsible=icon]:block">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                onClick={() => setIsSearchOpen(true)}
                tooltip="Поиск клиентов (⌘K)"
              >
                <Search className="h-4 w-4" />
                <span>Поиск</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </div>

        <SidebarMenu>
          <SidebarMenuItem className="flex items-center gap-2">
            <SidebarMenuButton
              asChild
              tooltip="Сделать запись"
              className="min-w-8 bg-primary text-primary-foreground duration-200 ease-linear hover:bg-primary/90 hover:text-primary-foreground active:bg-primary/90 active:text-primary-foreground"
            >
              <Link href="/app/calendar">
                <CirclePlus className="h-4 w-4" />
                <span>Сделать запись</span>
              </Link>
            </SidebarMenuButton>

            <Button
              size="icon"
              className={`relative h-9 w-9 shrink-0 group-data-[collapsible=icon]:hidden ${isNotificationsOpen ? 'border-primary' : ''}`}
              variant="outline"
              onClick={() => setIsNotificationsOpen(true)}
            >
              <Bell className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className="sr-only">Уведомления</span>
            </Button>
          </SidebarMenuItem>
        </SidebarMenu>



        {/* Client Search Palette */}
        <ClientSearchPalette
          isOpen={isSearchOpen}
          onClose={() => setIsSearchOpen(false)}
        />

        {/* Notifications Modal */}
        <NotificationsModal
          isOpen={isNotificationsOpen}
          onClose={handleNotificationsClose}
        />

        {/* Navigation Menu */}
        <SidebarMenu>
          {items.map((item) => {
            const active = isActive(item.url)
            return (
              <SidebarMenuItem key={item.title} onClick={handleMenuClick}>
                <SidebarMenuButton
                  tooltip={item.title}
                  asChild
                  className="text-[17px] font-semibold"
                  id={item.id}
                  isActive={active}
                >
                  <Link href={item.url}>
                    {item.icon && <item.icon className={`h-4 w-4 ${active ? '!text-primary' : ''}`} />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
