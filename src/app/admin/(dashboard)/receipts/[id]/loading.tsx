import { Skeleton } from '@/components/ui/skeleton'

export default function ReceiptLoading() {
  return (
    <div className="mx-auto w-full max-w-[1240px] space-y-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-9 w-9" />
        <div className="space-y-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-8 w-44" />
        </div>
      </div>

      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <Skeleton className="mx-auto h-[480px] w-72 rounded-sm" />
      </div>
    </div>
  )
}
