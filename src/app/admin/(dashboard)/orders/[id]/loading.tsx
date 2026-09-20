import { Skeleton } from '@/components/ui/skeleton'

export default function OrderDetailLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>

      <div className="flex flex-col gap-4 border border-border-custom/70 bg-card p-5 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-11 w-full max-w-sm" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Skeleton className="h-64 rounded-sm" />
          <Skeleton className="h-32 rounded-sm" />
        </div>
        <Skeleton className="h-72 rounded-sm" />
      </div>
    </div>
  )
}
