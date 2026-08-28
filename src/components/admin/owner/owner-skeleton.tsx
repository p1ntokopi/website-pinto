import { Skeleton } from '@/components/ui/skeleton'

/** Layout-stable skeleton shared by every owner route's loading.tsx. */
export function OwnerPageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-9 w-full max-w-xl" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-32 rounded-sm" />
        <Skeleton className="h-32 rounded-sm" />
      </div>
      <div className="grid grid-cols-1 divide-y divide-border-custom/60 rounded-sm border border-border-custom sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-6 w-24" />
          </div>
        ))}
      </div>
      <Skeleton className="h-72 rounded-sm" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-64 rounded-sm" />
        <Skeleton className="h-64 rounded-sm" />
      </div>
    </div>
  )
}
