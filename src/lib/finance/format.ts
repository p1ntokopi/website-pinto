export { formatIDR } from '@/lib/receipt/receipt-service'

/** Compact currency for chart axes: 1_200_000 -> 'Rp 1,2 jt'. */
export function formatIDRCompact(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `Rp ${new Intl.NumberFormat('id-ID', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)}`
  }
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`
}

export function formatNumberID(value: number): string {
  return value.toLocaleString('id-ID')
}
