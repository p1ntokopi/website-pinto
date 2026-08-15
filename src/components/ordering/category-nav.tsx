"use client"

import { useRef, useState } from "react"

import { cn } from "@/lib/utils"

export function CategoryNav({
  categories,
}: {
  categories: { id: string; name: string }[]
}) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "")
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleScrollTo = (id: string) => {
    setActiveCategory(id)
    const element = document.getElementById(`category-${id}`)
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140
      window.scrollTo({ top: y, behavior: "smooth" })
    }
  }

  return (
    <div
      ref={scrollRef}
      className="sticky top-14 z-30 border-b border-border/60 bg-background/90 py-2.5 backdrop-blur-md"
    >
      <div className="mx-auto flex max-w-2xl gap-2 overflow-x-auto px-4 no-scrollbar">
        {categories.map((cat) => {
          const isActive = activeCategory === cat.id
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleScrollTo(cat.id)}
              aria-pressed={isActive}
              className={cn(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/50 outline-none",
                isActive
                  ? "bg-ink text-paper"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
            >
              {cat.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}
