import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export function SectionHeader({
  title,
  action,
}: {
  title: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="font-display text-xl font-bold tracking-tight text-ink">{title}</h2>
      {action && (
        <Link
          href={action.href}
          className="inline-flex items-center gap-1 text-xs font-semibold text-coffee transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none rounded-sm"
        >
          {action.label}
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      )}
    </div>
  )
}
