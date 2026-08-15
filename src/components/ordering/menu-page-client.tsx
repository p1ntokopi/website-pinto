"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag } from "lucide-react"

import { MenuCategoryNav } from "@/components/ordering/menu-category-nav"
import { MenuProductRow } from "@/components/ordering/menu-product-row"
import { MenuBeanSection, type MenuBean } from "@/components/ordering/menu-bean-section"
import { CartBar } from "@/components/ordering/cart-bar"
import { useCart } from "@/components/ordering/cart-context"
import { cn } from "@/lib/utils"

export type MenuCategoryData = {
  id: string
  name: string
  description: string | null
  products: {
    id: string
    name: string
    slug: string
    description: string | null
    base_price: number
    image_url: string | null
    variants_count: number
  }[]
}

interface MenuPageClientProps {
  tableSlug: string
  tableNumber: string | null
  categories: MenuCategoryData[]
  beans: MenuBean[]
  beanCategoryId?: string
}

export function MenuPageClient({
  tableSlug,
  tableNumber,
  categories,
  beans,
  beanCategoryId,
}: MenuPageClientProps) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.id || "")
  const { cartCount } = useCart()

  useEffect(() => {
    if (categories.length === 0) return

    const sections = categories
      .map((cat) => document.getElementById(`category-${cat.id}`))
      .filter((el): el is HTMLElement => Boolean(el))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible.length > 0) {
          const id = visible[0].target.id.replace("category-", "")
          setActiveCategory(id)
        }
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 }
    )

    sections.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [categories])

  return (
    <div className="pb-28 lg:pb-0">
      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-ink/[0.08] bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <span className="font-display text-lg font-bold uppercase tracking-[0.22em] text-ink">
              P1NTO
            </span>
            <span className="hidden text-[10px] uppercase tracking-[0.3em] text-muted-foreground sm:inline">
              Kopi
            </span>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {tableNumber && (
              <span className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                <span className="h-1 w-1 rounded-full bg-coffee" aria-hidden="true" />
                Meja {tableNumber}
              </span>
            )}
            <Link
              href={`/t/${tableSlug}/cart`}
              aria-label={`Keranjang, ${cartCount} item`}
              className="relative flex h-9 w-9 items-center justify-center rounded-sm border border-ink/15 text-ink transition-colors hover:border-coffee hover:text-coffee focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coffee/40"
            >
              <ShoppingBag className="h-[18px] w-[18px]" aria-hidden="true" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-coffee px-1 text-[10px] font-bold text-paper">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <MenuCategoryNav
        categories={categories}
        activeCategory={activeCategory}
        onSelect={setActiveCategory}
      />

      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-8 lg:grid lg:grid-cols-[180px_1fr] lg:gap-16 lg:pt-14">
        <MenuCategoryNav
          categories={categories}
          activeCategory={activeCategory}
          onSelect={setActiveCategory}
        />

        <main className="min-w-0">
          {/* Table context + hero */}
          <section className="mb-14" aria-labelledby="menu-heading">
            <p className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
              <span>Dari meja {tableNumber ?? "kamu"}</span>
              <span aria-hidden="true" className="h-px w-8 bg-coffee/40" />
            </p>
            <h1
              id="menu-heading"
              className="font-display text-5xl leading-[1.02] tracking-tight text-ink md:text-6xl"
            >
              Menu
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
              Pesan langsung dari meja Anda — aroma segar dari dapur dan bar, disiapkan saat
              dipesan.
            </p>
          </section>

          {categories.length === 0 ? (
            <div className="flex min-h-[40vh] flex-col items-center justify-center text-center">
              <h2 className="font-display text-3xl text-ink">
                Nothing brewing here yet.
              </h2>
              <p className="mt-3 max-w-sm text-muted-foreground">
                Nantikan sebentar — kami sedang menyeduh sesuatu yang baru untuk Anda.
              </p>
            </div>
          ) : (
            categories.map((category, index) => (
              <section
                key={category.id}
                id={`category-${category.id}`}
                aria-labelledby={`heading-${category.id}`}
                className={cn("scroll-mt-24", index > 0 && "mt-16")}
              >
                <div className="mb-6 border-b border-ink/10 pb-5">
                  <p className="mb-2 text-[11px] font-medium tabular-nums text-coffee">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2
                    id={`heading-${category.id}`}
                    className="font-display text-3xl text-ink md:text-4xl"
                  >
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="mt-2 max-w-lg text-sm leading-relaxed text-muted-foreground">
                      {category.description}
                    </p>
                  )}
                </div>

                <div>
                  {category.products.map((product) => (
                    <MenuProductRow
                      key={product.id}
                      product={product}
                      tableSlug={tableSlug}
                    />
                  ))}
                </div>
              </section>
            ))
          )}

          <MenuBeanSection tableSlug={tableSlug} beans={beans} beanCategoryId={beanCategoryId} />

          <footer className="mt-20 border-t border-ink/10 py-8 text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              P1NTO Coffee
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Dipanggang & diseduh dengan penuh perhatian.
            </p>
          </footer>
        </main>
      </div>

      <CartBar tableSlug={tableSlug} />
    </div>
  )
}