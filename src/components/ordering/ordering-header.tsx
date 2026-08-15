"use client"

import Link from "next/link"
import { ChevronLeft } from "lucide-react"

import { cn } from "@/lib/utils"

interface OrderingHeaderProps {
  backHref?: string
  title?: string
  tableNumber?: string
  right?: React.ReactNode
  className?: string
}

export function OrderingHeader({
  backHref,
  title,
  tableNumber,
  right,
  className,
}: OrderingHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b border-ink/[0.08] bg-paper/85 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-3 px-4 md:px-6">
        <div className="flex min-w-0 items-center">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Kembali"
              className="-ml-2 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-sm text-ink transition-colors hover:bg-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          {title ? (
            <h1 className="truncate font-display text-xl font-semibold text-ink">{title}</h1>
          ) : (
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold uppercase tracking-[0.22em] text-ink">
                P1NTO
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Kopi
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          {tableNumber && (
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="h-1 w-1 rounded-full bg-coffee" aria-hidden="true" />
              Meja {tableNumber}
            </span>
          )}
          {right}
        </div>
      </div>
    </header>
  )
}