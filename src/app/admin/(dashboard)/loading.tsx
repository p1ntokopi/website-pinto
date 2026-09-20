import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-11 w-44" />
      </div>

      <div className="flex flex-wrap items-center gap-x-10 gap-y-5 border-y border-border-custom/70 py-5">
        <Skeleton className="h-10 w-16" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid gap-10 lg:grid-cols-3 lg:gap-6">
        <div className="space-y-3 lg:col-span-2">
          <Skeleton className="h-6 w-56" />
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-sm" />
          ))}
        </div>
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-64 rounded-sm" />
        </div>
      </div>

      <div className="space-y-3">
        <Skeleton className="h-6 w-44" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14 rounded-sm" />
        ))}
      </div>
    </div>
  )
}
