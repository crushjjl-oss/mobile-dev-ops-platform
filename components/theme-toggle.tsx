"use client"

import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Monitor, Check } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const options = [
  { value: "light", label: "\u6D45\u8272", icon: Sun },
  { value: "dark", label: "\u6DF1\u8272", icon: Moon },
  { value: "system", label: "\u8DDF\u968F\u7CFB\u7EDF", icon: Monitor },
] as const

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Server render and first client paint must match: theme is unknown until mounted.
  if (!mounted) {
    return (
      <div
        aria-hidden="true"
        className={cn("h-8 w-8 rounded-md border border-border bg-secondary/50", className)}
      />
    )
  }

  const isDark = resolvedTheme === "dark"
  const activeLabel = options.find((o) => o.value === theme)?.label ?? "\u8DDF\u968F\u7CFB\u7EDF"

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-border bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
            className,
          )}
          aria-label={`\u5F53\u524D\u4E3B\u9898\uFF1A${activeLabel}`}
        >
          {isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          {/* Auto indicator: theme is derived from the OS, not pinned by the user */}
          {theme === "system" && (
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full border border-card bg-primary">
              <Monitor className="h-1.5 w-1.5 text-primary-foreground" />
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
            className="text-xs cursor-pointer"
          >
            <option.icon className="mr-2 h-3.5 w-3.5" />
            <span className="flex-1">{option.label}</span>
            {theme === option.value && <Check className="h-3.5 w-3.5 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
