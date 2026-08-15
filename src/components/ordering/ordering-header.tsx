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
        "sticky top-0 z-40 bg-background/85 backdrop-blur-md border-b border-border/60",
        className
      )}
    >
      <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between gap-3">
        <div className="flex items-center min-w-0">
          {backHref && (
            <Link
              href={backHref}
              aria-label="Kembali"
              className="-ml-2 mr-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-ink transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 outline-none"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
          {title ? (
            <h1 className="truncate font-semibold">{title}</h1>
          ) : (
            <div className="flex flex-col leading-none">
              <span className="font-display text-lg font-bold tracking-[0.2em] uppercase text-primary">
                P1NTO
              </span>
              <span className="mt-1 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                Kopi
              </span>
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {tableNumber && (
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold">
              Meja {tableNumber}
            </span>
          )}
          {right}
        </div>
      </div>
    </header>
  )
}
