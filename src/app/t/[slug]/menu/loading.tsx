import { Skeleton } from "@/components/ui/skeleton"

export default function MenuLoading() {
  return (
    <div className="pb-28 lg:pb-0">
      {/* Top nav */}
      <div className="sticky top-0 z-40 border-b border-ink/[0.08] bg-paper/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="hidden h-3 w-10 sm:block" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="hidden h-3 w-16 sm:block" />
            <Skeleton className="h-9 w-9" />
          </div>
        </div>
      </div>

      {/* Mobile category nav */}
      <div className="border-b border-ink/[0.08] bg-paper/90 lg:hidden">
        <div className="flex gap-6 overflow-hidden px-4 py-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-20 shrink-0" />
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-10 md:px-8 lg:grid lg:grid-cols-[180px_1fr] lg:gap-16 lg:pt-14">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <Skeleton className="mb-6 h-3 w-12" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-baseline gap-3">
                <Skeleton className="h-3 w-4" />
                <Skeleton className="h-5 w-24" />
              </div>
            ))}
          </div>
        </aside>

        <main className="min-w-0">
          <div className="mb-14">
            <Skeleton className="mb-4 h-3 w-32" />
            <Skeleton className="h-14 w-40" />
            <Skeleton className="mt-4 h-4 w-full max-w-md" />
            <Skeleton className="mt-2 h-4 w-2/3 max-w-xs" />
          </div>

          {Array.from({ length: 2 }).map((_, section) => (
            <section key={section} className="mb-14">
              <div className="mb-6 border-b border-ink/10 pb-5">
                <Skeleton className="mb-2 h-3 w-6" />
                <Skeleton className="h-8 w-44" />
                <Skeleton className="mt-2 h-3 w-64" />
              </div>
              <div>
                {Array.from({ length: 3 }).map((_, row) => (
                  <div
                    key={row}
                    className="flex items-center gap-5 border-b border-ink/[0.08] py-5 last:border-b-0"
                  >
                    <Skeleton className="h-16 w-16 shrink-0 rounded-sm" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="mt-2 h-3 w-2/3" />
                    </div>
                    <div className="shrink-0 text-right">
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-9 w-9 shrink-0" />
                  </div>
                ))}
              </div>
            </section>
          ))}
        </main>
      </div>
    </div>
  )
}