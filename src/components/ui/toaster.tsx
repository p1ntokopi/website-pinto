"use client"

import { X } from "lucide-react"

import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts, dismiss } = useToast()

  return (
    <div
      className="pointer-events-none fixed inset-x-4 top-4 z-[100] flex flex-col items-center gap-2 sm:left-auto sm:right-6 sm:top-6 sm:items-end"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map(({ id, title, description, variant }) => (
        <div
          key={id}
          className={cn(
            "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-popover p-4 text-popover-foreground shadow-popover",
            variant === "destructive" && "border-destructive/30",
            variant === "success" && "border-success/30",
            variant === "info" && "border-info/30"
          )}
        >
          <div className="min-w-0 flex-1">
            {title && <p className="text-sm font-semibold">{title}</p>}
            {description && (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismiss(id)}
            className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
