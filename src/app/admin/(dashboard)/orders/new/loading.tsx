import { Skeleton } from '@/components/ui/skeleton'

export default function PosLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-4">
          <Skeleton className="h-11 w-full max-w-xs" />
          <div className="flex gap-1.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-11 w-24 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-sm" />
            ))}
          </div>
        </div>

        <div className="space-y-4 rounded-sm border border-border-custom bg-card p-4 lg:sticky lg:top-24 lg:self-start">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}
