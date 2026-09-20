'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

/**
 * Confirmation shell for destructive actions.
 *
 * Destructive controls live in overflow menus, so this dialog is where the
 * consequence is spelled out before the write happens. It owns the pending
 * state so callers only supply the work and an error message.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  detail,
  confirmLabel,
  pendingLabel,
  cancelLabel = 'Batal',
  onConfirm,
  onOpenChange,
}: {
  trigger: React.ReactNode
  title: string
  description: React.ReactNode
  /** Optional extra context (what will be freed, kept, or lost). */
  detail?: React.ReactNode
  confirmLabel: string
  pendingLabel?: string
  cancelLabel?: string
  /** Resolve with `{ error }` to keep the dialog open; resolve cleanly to close it. */
  onConfirm: () => Promise<{ error?: string } | void>
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpenState] = useState(false)
  const [pending, setPending] = useState(false)

  function setOpen(next: boolean) {
    setOpenState(next)
    onOpenChange?.(next)
  }

  async function handleConfirm() {
    setPending(true)
    const result = await onConfirm()
    setPending(false)
    if (result && 'error' in result && result.error) return
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {detail ? (
          <div className="rounded-panel border border-border-custom bg-muted/30 px-4 py-3 text-xs text-muted-text">
            {detail}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {pending ? (pendingLabel ?? confirmLabel) : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}