import { Skeleton } from '@/components/ui/skeleton'

export default function SettingsLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-4 w-80" />
      </div>

      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-4 rounded-sm border border-border-custom bg-card p-5">
            <div className="space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-72" />
            </div>
            <Skeleton className="h-11 w-full max-w-md" />
            <Skeleton className="h-11 w-full max-w-sm" />
          </div>
        ))}
      </div>
    </div>
  )
}
