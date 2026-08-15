"use client"

import { useActionState } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { startOrResumeDiningSession } from "@/app/t/[slug]/actions"

export function TableLandingForm({ tableSlug }: { tableSlug: string }) {
  const [state, formAction, isPending] = useActionState(
    async (_prev: { error?: string } | null, _form: FormData) =>
      startOrResumeDiningSession(tableSlug),
    null
  )

  return (
    <form action={formAction} className="w-full space-y-3">
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-14 text-base font-semibold shadow-card transition-transform active:scale-[0.99]"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Memulai sesi...
          </>
        ) : (
          "Lihat Menu & Pesan"
        )}
      </Button>
      {state?.error && (
        <p className="text-sm font-medium text-destructive">{state.error}</p>
      )}
    </form>
  )
}
