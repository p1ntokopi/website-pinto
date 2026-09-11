"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { startOrResumeDiningSession } from "@/app/t/[slug]/actions"

type LandingState = { error?: string } | null

/**
 * Resumes the cashier-opened session for this table. The QR never opens a
 * session, so nothing orderable is rendered when the table has none.
 */
export function TableLandingForm({
  tableSlug,
  hasActiveSession,
}: {
  tableSlug: string
  hasActiveSession: boolean
}) {
  const [state, formAction, isPending] = useActionState(
    async (prev: LandingState, formData: FormData): Promise<LandingState> => {
      // The slug travels with the submission rather than being captured from the
      // render, so a stale form cannot resume a different table's session.
      const slug = String(formData.get("table_slug") ?? "")
      if (!slug) return prev
      return (await startOrResumeDiningSession(slug)) ?? null
    },
    null
  )

  if (!hasActiveSession) return null

  return (
    <form action={formAction} className="w-full space-y-3">
      <input type="hidden" name="table_slug" value={tableSlug} />
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-14 text-base font-semibold shadow-card transition-transform active:scale-[0.99]"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Membuka menu...
          </>
        ) : (
          "Tambah Pesanan"
        )}
      </Button>
      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
    </form>
  )
}
