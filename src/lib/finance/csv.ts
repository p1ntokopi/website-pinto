/**
 * Minimal CSV export. Uses ';' as the column delimiter (Excel Indonesian
 * locale default) and a UTF-8 BOM so accented text opens correctly.
 */

export type CsvCell = string | number | null | undefined

function escapeCell(cell: CsvCell): string {
  const value = cell === null || cell === undefined ? '' : String(cell)
  if (/[",;\r\n]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`
  }
  return value
}

export function toCsv(headers: string[], rows: CsvCell[][]): string {
  const lines = [headers, ...rows].map((row) => row.map(escapeCell).join(';'))
  return `\uFEFF${lines.join('\r\n')}\r\n`
}

/** Triggers a browser download. Client components only. */
export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}
