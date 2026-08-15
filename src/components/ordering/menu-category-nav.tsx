"use client"

import { cn } from "@/lib/utils"

interface MenuCategoryNavProps {
  categories: { id: string; name: string }[]
  activeCategory: string
  onSelect: (id: string) => void
}

function scrollToCategory(id: string) {
  const element = document.getElementById(`category-${id}`)
  if (element) {
    const y = element.getBoundingClientRect().top + window.scrollY - 88
    window.scrollTo({ top: y, behavior: "smooth" })
  }
}

export function MenuCategoryNav({
  categories,
  activeCategory,
  onSelect,
}: MenuCategoryNavProps) {
  return (
    <>
      {/* Mobile: horizontal scrollable tab row */}
      <div className="sticky top-14 z-30 border-b border-ink/[0.08] bg-paper/90 backdrop-blur-md lg:hidden">
        <nav
          aria-label="Kategori menu"
          className="mx-auto flex max-w-2xl gap-6 overflow-x-auto px-4 py-3 no-scrollbar"
        >
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onSelect(cat.id)
                  scrollToCategory(cat.id)
                }}
                className={cn(
                  "shrink-0 border-b-2 pb-1 text-sm transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40",
                  isActive
                    ? "border-coffee font-semibold text-ink"
                    : "border-transparent text-muted-foreground hover:text-ink"
                )}
              >
                {cat.name}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Desktop: sticky editorial sidebar */}
      <aside className="sticky top-24 hidden max-h-[calc(100vh-7rem)] w-full self-start overflow-y-auto lg:block">
        <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
          Menu
        </p>
        <nav aria-label="Kategori menu" className="space-y-1">
          {categories.map((cat, index) => {
            const isActive = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => {
                  onSelect(cat.id)
                  scrollToCategory(cat.id)
                }}
                className={cn(
                  "group flex w-full items-baseline gap-3 py-1.5 text-left transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40",
                  isActive ? "text-ink" : "text-muted-foreground hover:text-ink"
                )}
              >
                <span
                  className={cn(
                    "text-[11px] font-medium tabular-nums transition-colors",
                    isActive ? "text-coffee" : "text-muted-foreground/60 group-hover:text-coffee"
                  )}
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span
                  className={cn(
                    "font-display text-xl leading-tight transition-colors",
                    isActive ? "text-ink" : "text-ink/70"
                  )}
                >
                  {cat.name}
                </span>
              </button>
            )
          })}
        </nav>
      </aside>
    </>
  )
}