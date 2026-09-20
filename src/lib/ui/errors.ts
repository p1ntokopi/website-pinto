/**
 * Turns Supabase/PostgREST failures into Indonesian copy that is safe to show
 * a cashier. Raw driver messages name tables and grants ("permission denied for
 * table tables"), which is noise at best and an information leak at worst, so
 * the detail goes to the console and only the mapped message reaches the UI.
 */

type ErrorLike = {
  code?: string | null
  message?: string | null
  details?: string | null
  hint?: string | null
}

function asErrorLike(error: unknown): ErrorLike {
  if (typeof error === 'string') return { message: error }
  if (error && typeof error === 'object') return error as ErrorLike
  return {}
}

/** Postgres/PostgREST codes worth distinguishing for the operator. */
const CODE_MESSAGES: Record<string, string> = {
  '23505': 'Data dengan nama atau kode yang sama sudah ada.',
  '23503': 'Data ini masih dipakai di tempat lain, jadi belum bisa dihapus.',
  '23514': 'Data tidak memenuhi aturan yang berlaku. Periksa kembali isian Anda.',
  '42501': 'Anda tidak memiliki izin untuk tindakan ini.',
  '22007': 'Format tanggal atau waktu tidak valid.',
  'PGRST116': 'Data tidak ditemukan. Muat ulang halaman lalu coba lagi.',
}

/**
 * @param scope Short label for the console line, e.g. 'tables/page'.
 * @param error The raw error from Supabase, a server action, or a throw.
 * @param fallback Copy shown when the code is unknown.
 */
export function toFriendlyError(
  scope: string,
  error: unknown,
  fallback = 'Terjadi kesalahan. Coba lagi.'
): string {
  const { code, message, details, hint } = asErrorLike(error)

  // Preserve the real cause for debugging; the user never sees this line.
  console.error(`[${scope}]`, { code, message, details, hint })

  if (code && CODE_MESSAGES[code]) return CODE_MESSAGES[code]

  // Network hiccups surface as a bare "Failed to fetch" with no code.
  if (message && /failed to fetch|networkerror|load failed/i.test(message)) {
    return 'Koneksi bermasalah. Periksa jaringan lalu coba lagi.'
  }

  return fallback
}