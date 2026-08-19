import { DEFAULT_PAPER_WIDTH, ReceiptData, ThermalPaperWidth } from '@/lib/receipt/receipt-types'
import { formatReceiptText } from '@/lib/receipt/receipt-service'

/**
 * Render a thermal receipt as a standalone, monochrome HTML document.
 * The text layout comes from formatReceiptText (single source of truth),
 * so the browser-print fallback and future ESC/POS output stay identical.
 */
export function renderReceiptHtml(
  data: ReceiptData,
  paperWidth: ThermalPaperWidth = DEFAULT_PAPER_WIDTH
): string {
  const is58 = paperWidth === 58
  const bodyWidth = is58 ? '58mm' : '80mm'
  const fontSize = is58 ? '11px' : '13px'

  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Struk ${data.orderNumber}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  body { display: flex; justify-content: center; padding: 8px 4px; }
  pre {
    width: ${bodyWidth};
    max-width: 100%;
    font-family: 'Courier New', Courier, monospace;
    font-size: ${fontSize};
    line-height: 1.35;
    color: #000;
    white-space: pre-wrap;
    word-break: break-word;
  }
  @media print {
    body { padding: 0; }
    @page { margin: 0; }
  }
</style>
</head>
<body>
<pre>${escapeHtml(formatReceiptText(data, paperWidth))}</pre>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}