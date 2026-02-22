import * as React from "react"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/Components/ui/card"

/**
 * Responsive Table Component
 * - Desktop: Shows standard table layout
 * - Mobile: Converts to card-based layout for better usability
 */

interface ResponsiveTableContextType {
  isMobile: boolean
}

const ResponsiveTableContext = React.createContext<ResponsiveTableContextType>({ isMobile: false })

const ResponsiveTable = React.forwardRef<
  HTMLTableElement,
  React.HTMLAttributes<HTMLTableElement> & { mobileBehavior?: 'cards' | 'scroll' }
>(({ className, children, mobileBehavior = 'cards', ...props }, ref) => {
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  if (mobileBehavior === 'scroll') {
    return (
      <div className="relative w-full overflow-auto">
        <table
          ref={ref}
          className={cn("w-full caption-bottom text-sm", className)}
          {...props}
        >
          {children}
        </table>
      </div>
    )
  }

  return (
    <ResponsiveTableContext.Provider value={{ isMobile }}>
      {isMobile ? (
        <div className="space-y-3" {...props}>
          {children}
        </div>
      ) : (
        <div className="relative w-full overflow-auto">
          <table
            ref={ref}
            className={cn("w-full caption-bottom text-sm", className)}
            {...props}
          >
            {children}
          </table>
        </div>
      )}
    </ResponsiveTableContext.Provider>
  )
})
ResponsiveTable.displayName = "ResponsiveTable"

const ResponsiveTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => {
  const { isMobile } = React.useContext(ResponsiveTableContext)
  
  if (isMobile) {
    return null // Hide headers on mobile in card mode
  }

  return (
    <thead ref={ref} className={cn("[&_tr]:border-b", className)} {...props} />
  )
})
ResponsiveTableHeader.displayName = "ResponsiveTableHeader"

const ResponsiveTableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, children, ...props }, ref) => {
  const { isMobile } = React.useContext(ResponsiveTableContext)
  
  if (isMobile) {
    return <>{children}</>
  }

  return (
    <tbody
      ref={ref}
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    >
      {children}
    </tbody>
  )
})
ResponsiveTableBody.displayName = "ResponsiveTableBody"

const ResponsiveTableRow = React.forwardRef<
  HTMLTableRowElement,
  React.HTMLAttributes<HTMLTableRowElement> & { 
    mobileCardContent?: React.ReactNode 
  }
>(({ className, children, mobileCardContent, ...props }, ref) => {
  const { isMobile } = React.useContext(ResponsiveTableContext)
  
  if (isMobile) {
    return (
      <Card className="overflow-hidden hover:bg-accent/50 transition-colors">
        <CardContent className="p-4">
          {mobileCardContent || children}
        </CardContent>
      </Card>
    )
  }

  return (
    <tr
      ref={ref}
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </tr>
  )
})
ResponsiveTableRow.displayName = "ResponsiveTableRow"

const ResponsiveTableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-2 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
ResponsiveTableHead.displayName = "ResponsiveTableHead"

const ResponsiveTableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className
    )}
    {...props}
  />
))
ResponsiveTableCell.displayName = "ResponsiveTableCell"

export {
  ResponsiveTable,
  ResponsiveTableHeader,
  ResponsiveTableBody,
  ResponsiveTableRow,
  ResponsiveTableHead,
  ResponsiveTableCell,
}
