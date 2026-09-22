import Link from "next/link"
import { AlertCircle, Receipt } from "lucide-react"

import { createClient } from "@/lib/supabase/server"
import { getSessionToken } from "@/lib/ordering/session"
import { Button } from "@/components/ui/button"
import { TableLandingForm } from "@/components/ordering/table-landing-form"

type TableSessionStatus = {
  success?: boolean
  table_number?: string
  has_active_session?: boolean
}

type SessionOrder = {
  id: string
  order_number: string
  status: string
  total: number
  created_at: string
}

function formatPrice(price: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(price)
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case "PREPARING":
      return {
        label: "Sedang Dibuat",
        className: "bg-amber-50 text-amber-800 border-amber-200/80",
      }
    case "READY":
      return {
        label: "Siap Diantar",
        className: "bg-emerald-50 text-emerald-800 border-emerald-200/80",
      }
    case "SERVED":
    case "COMPLETED":
      return {
        label: "Sudah Diantar",
        className: "bg-stone-100 text-stone-700 border-stone-200/80",
      }
    case "CANCELLED":
      return {
        label: "Dibatalkan",
        className: "bg-rose-50 text-rose-700 border-rose-200/80",
      }
    case "NEW":
    case "PENDING":
    case "CONFIRMED":
    default:
      return {
        label: "Diterima",
        className: "bg-blue-50 text-blue-700 border-blue-200/80",
      }
  }
}

export default async function TableLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
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

  let activeOrders: SessionOrder[] = []
  let sessionTotal = 0
  let isPaid = false
  let latestOrderNumber: string | null = null

  if (hasActiveSession) {
    const sessionToken = await getSessionToken()
    const { data: summaryData } = await supabase.rpc(
      "get_dining_session_summary",
      { p_table_slug: table.slug, p_session_token: sessionToken || "" }
    )

    const summary = summaryData as {
      success?: boolean
      session_status?: string
      total?: number
      payment_status?: string
      orders?: SessionOrder[]
    } | null

    if (summary?.success && summary.orders) {
      activeOrders = summary.orders.filter((ord) => ord.status !== "CANCELLED")
      sessionTotal = Number(summary.total ?? 0)
      isPaid = summary.payment_status === "PAID"
      if (activeOrders.length > 0) {
        latestOrderNumber = activeOrders[activeOrders.length - 1].order_number
      }
    }
  }

  return (
    <div className="flex min-h-[90vh] flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground mb-2">
          Pinto Kupi
        </p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-ink leading-none">
          Pinto
        </h1>
      </div>

      <div className="w-full border border-border/80 bg-card rounded-2xl p-6 shadow-sm mb-6 text-left">
        <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-border/60">
          <div>
            <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground block">
              Nomor Meja
            </span>
            <h2 className="text-2xl font-bold font-display text-foreground">
              Meja {table.table_number}
            </h2>
          </div>
          {hasActiveSession ? (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Sesi Aktif
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-stone-100 text-stone-600 border border-stone-200 rounded-full text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-stone-400" />
              Belum Ada Sesi
            </div>
          )}
        </div>

        {hasActiveSession ? (
          activeOrders.length > 0 ? (
            <div className="space-y-4">
              {/* Bill & Payment Status Box */}
              <div className="flex items-center justify-between p-3.5 bg-muted/50 rounded-xl border border-border/50">
                <div>
                  <span className="text-xs text-muted-foreground block font-medium">
                    Total Tagihan Meja
                  </span>
                  <span className="text-lg font-bold font-mono text-foreground">
                    {formatPrice(sessionTotal)}
                  </span>
                </div>
                <div>
                  {isPaid ? (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-full">
                      Lunas
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full">
                      Belum Bayar
                    </span>
                  )}
                </div>
              </div>

              {/* Running Orders for this Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Daftar Pesanan ({activeOrders.length})
                  </span>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {activeOrders.map((ord) => {
                    const badge = getOrderStatusBadge(ord.status)
                    return (
                      <Link
                        key={ord.id || ord.order_number}
                        href={`/t/${table.slug}/order/${ord.order_number}`}
                        className="flex items-center justify-between p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 transition-colors group"
                      >
                        <div className="flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          <span className="text-sm font-semibold text-foreground">
                            #{ord.order_number}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 text-xs font-medium border rounded-full ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-2 text-center">
              <p className="text-sm font-medium text-foreground">
                Sesi meja sudah dibuka oleh kasir.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Pilih menu favorit Anda untuk mulai memesan.
              </p>
            </div>
          )
        ) : (
          <div className="py-2 text-center">
            <p className="text-sm font-medium text-foreground">
              Belum ada sesi aktif di meja ini.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Silakan melakukan pemesanan di kasir terlebih dahulu.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {hasActiveSession ? (
        <div className="w-full space-y-3">
          {latestOrderNumber && (
            <Button
              render={
                <Link href={`/t/${table.slug}/order/${latestOrderNumber}`} />
              }
              variant="default"
              className="w-full h-14 text-base font-semibold shadow-card transition-transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Receipt className="w-5 h-5" />
              Lihat Detail Pesanan & Status
            </Button>
          )}

          <TableLandingForm
            tableSlug={table.slug}
            hasActiveSession={hasActiveSession}
            buttonLabel={
              activeOrders.length > 0
                ? "+ Tambah Pesanan Lain"
                : "Pilih Menu & Pesan"
            }
            buttonVariant={latestOrderNumber ? "outline" : "default"}
          />
        </div>
      ) : (
        <Button render={<Link href="/" />} variant="outline" className="w-full h-12">
          Kembali ke Pinto
        </Button>
      )}
    </div>
  )
}
