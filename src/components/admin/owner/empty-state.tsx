import type { ElementType } from 'react'
import { cn } from '@/lib/utils'

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon: ElementType
  title: string
  description?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-sm border border-dashed border-border-custom px-6 py-14 text-center',
        className,
      )}
    >
      <Icon className="mx-auto h-7 w-7 text-muted-text/60" aria-hidden="true" />
      <p className="mt-3 font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 text-sm text-muted-text">{description}</p>}
    </div>
  )
}
