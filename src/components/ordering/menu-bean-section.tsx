import Link from "next/link"
import { ArrowRight } from "lucide-react"

export type MenuBean = {
  id: string
  slug: string
  name: string
  base_price: number
  description: string | null
  process: string | null
  roast_level: string | null
  origin: { country: string; region: string | null } | null
  flavorNotes: string[]
  variants: { price: number; weight_grams: number }[]
}

function displayName(name: string) {
  return name.replace(/\s*Beans?$/i, "").trim()
}

function formatRupiah(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

export function MenuBeanSection({
  tableSlug,
  beans,
  beanCategoryId,
}: {
  tableSlug: string
  beans: MenuBean[]
  beanCategoryId?: string
}) {
  if (beans.length === 0) return null

  return (
    <section className="mt-20 border-t border-ink/10 pt-14" aria-labelledby="roastery-heading">
      <div className="mb-10 flex items-end justify-between gap-6">
        <div>
          <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.25em] text-coffee">
            Dari Roastery Kami
          </p>
          <h2 id="roastery-heading" className="font-display text-4xl text-ink leading-none">
            Pilihan Roastery
          </h2>
        </div>
        {beanCategoryId && (
          <Link
            href={`#category-${beanCategoryId}`}
            className="hidden items-center gap-2 text-sm font-semibold text-coffee underline-offset-4 transition-colors hover:text-ink hover:underline sm:flex"
          >
            Lihat semua
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 gap-px overflow-hidden bg-ink/[0.08] sm:grid-cols-2">
        {beans.slice(0, 4).map((bean) => {
          const price = bean.variants[0]?.price ?? bean.base_price
          const weight = bean.variants[0]?.weight_grams
          const originLabel = bean.origin
            ? [bean.origin.country, bean.origin.region].filter(Boolean).join(" · ")
            : "Nusantara"
          const notes = bean.flavorNotes.slice(0, 3).join(" · ")
          const detail = [bean.process, bean.roast_level].filter(Boolean).join(" · ")

          return (
            <Link
              key={bean.id}
              href={`/t/${tableSlug}/product/${bean.slug}`}
              className="group flex flex-col bg-paper p-6 transition-colors duration-300 hover:bg-white sm:p-8"
            >
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-coffee">
                {originLabel}
              </p>
              <h3 className="font-display text-2xl text-ink transition-colors group-hover:text-coffee">
                {displayName(bean.name)}
              </h3>
              {detail && <p className="mt-1 text-sm text-muted-foreground">{detail}</p>}

              {notes && (
                <p className="mt-4 text-sm italic leading-relaxed text-ink/70">{notes}</p>
              )}

              <div className="mt-8 flex items-end justify-between border-t border-ink/10 pt-4">
                <div>
                  {weight && (
                    <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                      {weight}g
                    </span>
                  )}
                  <span className="block text-base font-semibold text-ink">
                    {formatRupiah(price)}
                  </span>
                </div>
                <span className="flex h-9 w-9 items-center justify-center rounded-sm border border-ink/20 text-ink transition-all duration-200 group-hover:border-coffee group-hover:bg-coffee group-hover:text-paper">
                  <ArrowRight className="h-4 w-4" />
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}