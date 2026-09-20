import { Skeleton } from '@/components/ui/skeleton'

export default function SessionDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-8 w-36" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <section className="grid gap-3 border border-border-custom/70 bg-card p-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-28" />
          </div>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-56 rounded-sm" />
          <Skeleton className="h-24 rounded-sm" />
        </div>
        <Skeleton className="h-80 rounded-sm" />
      </div>
    </div>
  )
}
