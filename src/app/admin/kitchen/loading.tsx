import { Skeleton } from '@/components/ui/skeleton'

/** KDS loading state keeps the dark theme so the screen does not flash white. */
export default function KitchenLoading() {
  return (
    <div className="min-h-screen bg-kds-bg p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-11 w-11 rounded-sm bg-kds-raised" />
          <Skeleton className="h-7 w-44 bg-kds-raised" />
        </div>
        <Skeleton className="h-7 w-24 rounded-sm bg-kds-raised" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-panel border border-kds-border bg-kds-sunken">
            <div className="border-b border-kds-border bg-kds-raised p-4">
              <Skeleton className="h-5 w-40 bg-kds-border" />
            </div>
            <div className="space-y-4 p-4">
              <Skeleton className="h-40 rounded-sm bg-kds-raised" />
              <Skeleton className="h-40 rounded-sm bg-kds-raised" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
