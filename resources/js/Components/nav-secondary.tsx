import * as React from "react"
import { Badge } from "@/Components/ui/badge"
import { usePage } from "@inertiajs/react"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/Components/ui/sidebar"
import { ModeToggle } from "@/Components/mode-toggle"

export function NavSecondary({
  items,
  unreadCount,
  activeModulesCount,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: React.ElementType
    id?: string
  }[]
  unreadCount?: number
  activeModulesCount?: number
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  const { url } = usePage()

  const isActive = (itemUrl: string) => {
    return url.startsWith(itemUrl)
  }

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title} onClick={handleClick}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className="text-sm font-medium"
                id={item.id}
                isActive={isActive(item.url)}
              >
                <a href={item.url} onClick={handleClick}>
                  <item.icon className={isActive(item.url) ? "h-4 w-4 !text-primary" : "h-4 w-4"} />
                  <span>{item.title}</span>
                  {item.id === 'support-link' && unreadCount && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs rounded-full"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                  {item.id === 'modules-link' && activeModulesCount && activeModulesCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-auto h-5 min-w-5 flex items-center justify-center px-1.5 text-xs rounded-full"
                    >
                      {activeModulesCount}
                    </Badge>
                  )}
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
          <SidebarMenuItem>
            <div className="px-2 py-1.5">
              <ModeToggle />
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
