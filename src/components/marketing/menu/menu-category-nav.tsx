"use client"

import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { scrollToId } from "./scroll-to"

export type MenuNavItem = {
  id: string
  name: string
}

export function MenuCategoryNav({ items }: { items: MenuNavItem[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  useEffect(() => {
    if (items.length === 0) return

    const sections = items
      .map((i) => document.getElementById(`menu-${i.id}`))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = visible[0].target.id.replace("menu-", "")
          setActive(id)
        }
      },
      { rootMargin: "-180px 0px -60% 0px", threshold: 0 }
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [items])

  return (
    <nav
      aria-label="Navigasi menu"
      className="sticky top-16 z-30 border-b border-ink/10 bg-paper/90 backdrop-blur-md md:top-20"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-1 overflow-x-auto px-4 py-2.5 no-scrollbar md:px-8">
        {items.map((item, index) => {
          const isActive = active === item.id
          return (
            <button
              key={item.id}
              type="button"
              aria-pressed={isActive}
              onClick={() => scrollToId(`menu-${item.id}`)}
              className={cn(
                "group relative flex shrink-0 items-baseline gap-2 px-3 py-2 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40",
                isActive ? "text-ink" : "text-muted-foreground hover:text-ink"
              )}
            >
              <span
                className={cn(
                  "text-[10px] font-semibold tabular-nums transition-colors",
                  isActive ? "text-coffee" : "text-muted-foreground/60 group-hover:text-coffee"
                )}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="whitespace-nowrap font-medium">{item.name}</span>
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-x-3 -bottom-px h-0.5 origin-left bg-coffee transition-transform duration-300",
                  isActive ? "scale-x-100" : "scale-x-0"
                )}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
