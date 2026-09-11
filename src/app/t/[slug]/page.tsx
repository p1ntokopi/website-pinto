import Link from "next/link"
import { AlertCircle } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getSessionToken } from "@/lib/ordering/session"
import { Button } from "@/components/ui/button"
import { TableLandingForm } from "@/components/ordering/table-landing-form"

type TableSessionStatus = {
  success?: boolean
  table_number?: string
  has_active_session?: boolean
}

export default async function TableLandingPage({
  params,
}: {
  params: { slug: string }
}) {
  const resolvedParams = await params
  const supabase = await createClient()

  let { data: table, error } = await supabase
    .from("tables")
    .select("*")
    .eq("slug", resolvedParams.slug)
    .single()

  if (!table) {
    const alternateSlug = resolvedParams.slug.match(/^table-(\d)$/)
      ? `table-0${resolvedParams.slug.split("-")[1]}`
      : resolvedParams.slug.match(/^table-0(\d)$/)
        ? `table-${resolvedParams.slug.replace(/^table-0/, "")}`
        : null

    if (alternateSlug) {
      const fallback = await supabase
        .from("tables")
        .select("*")
        .eq("slug", alternateSlug)
        .single()
      if (fallback.data) {
        table = fallback.data
        error = null
      }
    }
  }

  if (error || !table) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-destructive" />
        <h1 className="mb-2 text-2xl font-display font-bold">Meja Tidak Ditemukan</h1>
        <p className="mb-8 text-muted-foreground">
          Kode QR ini mungkin tidak valid atau meja tidak tersedia.
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Kembali ke Pinto
        </Button>
      </div>
    )
  }

  if (!table.is_active) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-10 w-10 text-muted-foreground" />
        <h1 className="mb-2 text-2xl font-display font-bold">Meja Tidak Tersedia</h1>
        <p className="mb-8 text-muted-foreground">
          Meja ini saat ini tidak menerima pesanan.
        </p>
        <Button render={<Link href="/" />} variant="outline">
          Kembali ke Pinto
        </Button>
      </div>
    )
  }

  // The QR is a secondary channel: it resumes the session the cashier opened
  // and never opens one itself. Anything other than an explicit "a session is
  // open" is treated as no session, so the page fails closed.
  const { data: statusData } = await supabase.rpc("get_table_session_status", {
    p_table_slug: table.slug,
  })
  const status = statusData as TableSessionStatus | null
  const hasActiveSession =
    status?.success === true && status.has_active_session === true

  // "Pesanan Saya" needs the session token, which a freshly scanned device does
  // not have yet — so it only appears once there is something to show. The token
  // gate stays exactly as strict as before.
  let latestOrderNumber: string | null = null
  if (hasActiveSession) {
    const sessionToken = await getSessionToken()
    if (sessionToken) {
      const { data: summaryData } = await supabase.rpc(
        "get_dining_session_summary",
        { p_table_slug: table.slug, p_session_token: sessionToken }
      )
      const orders = (
        summaryData as { orders?: Array<{ order_number?: string }> } | null
      )?.orders
      latestOrderNumber = orders?.length
        ? (orders[orders.length - 1]?.order_number ?? null)
        : null
    }
  }

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-3">
          Pinto Coffee
        </p>
        <h1 className="font-display text-5xl font-bold tracking-tight text-ink leading-none">
          Pinto
        </h1>
      </div>

      <div className="w-full border border-border/60 bg-white p-8 mb-6">
        <h2 className="text-2xl font-bold mb-1">Meja {table.table_number}</h2>
        {hasActiveSession ? (
          <>
            <p className="text-sm text-muted-foreground">Selamat menikmati.</p>
            <p className="text-sm text-muted-foreground">
              Tambah pesanan kapan saja.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Belum ada sesi aktif.
            </p>
            <p className="text-sm text-muted-foreground">
              Silakan melakukan pemesanan di kasir terlebih dahulu.
            </p>
          </>
        )}
      </div>

      <TableLandingForm
        tableSlug={table.slug}
        hasActiveSession={hasActiveSession}
      />

      {latestOrderNumber && (
        <Button
          render={
            <Link href={`/t/${table.slug}/order/${latestOrderNumber}`} />
          }
          variant="outline"
          className="w-full h-12 mt-3"
        >
          Pesanan Saya
        </Button>
      )}
    </div>
  )
}
