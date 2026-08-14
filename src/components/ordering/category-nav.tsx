'use client'

import { useRef, useEffect, useState } from 'react'

export function CategoryNav({ categories }: { categories: { id: string, name: string }[] }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || '')
  
  // Implementation of scrollspy is simplified for M3
  const handleScrollTo = (id: string) => {
    setActiveCategory(id)
    const element = document.getElementById(`category-${id}`)
    if (element) {
      const y = element.getBoundingClientRect().top + window.scrollY - 140
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  return (
    <div className="sticky top-[60px] z-30 bg-background/95 backdrop-blur-md border-b border-border/50 py-3 overflow-x-auto no-scrollbar shadow-sm">
      <div className="flex gap-2 px-4 min-w-max max-w-md mx-auto">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => handleScrollTo(cat.id)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
              activeCategory === cat.id 
                ? 'bg-ink text-paper' 
                : 'bg-muted/50 text-muted-foreground hover:bg-muted'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  )
}
