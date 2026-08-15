import { Skeleton } from "@/components/ui/skeleton"

export default function MenuLoading() {
  return (
    <div className="pb-32">
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-background/85 px-4 backdrop-blur-md">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="sticky top-14 z-30 border-b border-border/60 bg-background/90 py-2.5">
        <div className="mx-auto flex max-w-2xl gap-2 px-4">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-full" />
        </div>
      </div>

      <main className="mx-auto max-w-2xl px-4 py-6">
        <Skeleton className="mb-2 h-9 w-28" />
        <Skeleton className="mb-8 h-4 w-64" />

        <Skeleton className="mb-4 h-6 w-32" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-stretch gap-4 border border-border/60 bg-white p-3">
              <Skeleton className="h-24 w-24 shrink-0" />
              <div className="flex flex-col flex-grow gap-2 py-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-full" />
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
