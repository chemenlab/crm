import { SidebarProvider } from '@/Components/ui/sidebar'
import { useSidebarState } from '@/hooks/use-sidebar-state'

export function AppSidebarProvider({ children, ...props }: React.ComponentProps<typeof SidebarProvider>) {
  const defaultOpen = useSidebarState()
  
  return (
    <SidebarProvider defaultOpen={defaultOpen} {...props}>
      {children}
    </SidebarProvider>
  )
}
