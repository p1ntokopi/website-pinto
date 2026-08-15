import { Skeleton } from "@/components/ui/skeleton"

export default function ProductDetailLoading() {
  return (
    <div className="min-h-screen bg-white pb-28">
      <div className="sticky top-0 z-40 flex h-14 items-center border-b border-border/60 bg-background/85 px-4 backdrop-blur-md">
        <Skeleton className="h-6 w-40" />
      </div>

      <Skeleton className="aspect-square w-full rounded-none" />

      <div className="space-y-8 p-4">
        <div>
          <Skeleton className="mb-2 h-8 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>

        <div className="space-y-2">
          <Skeleton className="mb-3 h-5 w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>

        <div className="space-y-2">
          <Skeleton className="mb-3 h-5 w-32" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    </div>
  )
}
