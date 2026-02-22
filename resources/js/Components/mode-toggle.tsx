import { Moon, Sun } from "lucide-react"

import { Switch } from "@/Components/ui/switch"
import { useTheme } from "@/Components/ThemeProvider"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    const isDark = theme === "dark"

    const toggleTheme = () => {
        setTheme(isDark ? "light" : "dark")
    }

    return (
        <div className="flex items-center gap-2 w-full">
            <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Тема</span>
            <div className="flex items-center gap-1.5 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full">
                <Sun className="h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
                <Switch
                    checked={isDark}
                    onCheckedChange={toggleTheme}
                    aria-label="Переключить тему"
                    className="scale-75"
                />
                <Moon className="h-3.5 w-3.5 text-muted-foreground group-data-[collapsible=icon]:hidden" />
            </div>
        </div>
    )
}
