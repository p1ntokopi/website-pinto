/**
 * ESC/POS encoder — converts receipt text into printer-ready bytes.
 *
 * Pure functions only: no browser or printer APIs live here, which keeps the
 * command output unit-testable. The provider feeds it the output of
 * `formatReceiptText()`; line centering is already baked into the text as
 * padding, so receipts print byte-for-byte like the on-screen preview.
 *
 * Reference: Epson ESC/POS command set (the de-facto standard for 58mm
 * thermal printers, including the PandaPrinter PRJ-58D).
 */

const ESC = 0x1b
const GS = 0x1d
const QUESTION_MARK = 0x3f

/**
 * CP437 (IBM PC) upper half, 0x80-0xFF — the default character table on
 * ESC/POS printers. Index 0 maps to byte 0x80, index 127 to 0xFF.
 */
const CP437_HIGH =
  'ÇüéâäàåçêëèïîìÄÅ' +
  'ÉæÆôöòûùÿÖÜ¢£¥₧ƒ' +
  'áíóúñÑªº¿⌐¬½¼¡«»' +
  '░▒▓│┤╡╢╖╕╣║╗╝╜╛┐' +
  '└┴┬├─┼╞╟╚╔╩╦╠═╬╧' +
  '╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀' +
  'αßΓπΣσµτΦΘΩδ∞φε∩' +
  '≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ '

const CP437_BY_CODEPOINT = new Map<number, number>()
for (let i = 0; i < CP437_HIGH.length; i++) {
  CP437_BY_CODEPOINT.set(CP437_HIGH.codePointAt(i)!, 0x80 + i)
}

/**
 * Unicode characters outside CP437 that appear in Indonesian receipt text,
 * mapped to their closest printable CP437/ASCII equivalents. Anything else
 * falls back to '?'.
 */
const FALLBACKS: Record<string, string> = {
  '•': '·',
  '…': '...',
  '–': '-',
  '—': '-',
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2192': '->',
}

function pushText(bytes: number[], text: string): void {
  for (const ch of text) {
    const code = ch.codePointAt(0)!
    if (code < 0x80) {
      bytes.push(code)
    } else if (CP437_BY_CODEPOINT.has(code)) {
      bytes.push(CP437_BY_CODEPOINT.get(code)!)
    } else if (ch in FALLBACKS) {
      pushText(bytes, FALLBACKS[ch])
    } else {
      bytes.push(QUESTION_MARK)
    }
  }
}

export type EscPosAlign = 'left' | 'center' | 'right'

const ALIGN_CODES: Record<EscPosAlign, number> = {
  left: 0x00,
  center: 0x01,
  right: 0x02,
}

export type EncodeReceiptOptions = {
  /** Text alignment applied to the whole payload. Default: left. */
  align?: EscPosAlign
  /** Bold (double-strike) applied to the whole payload. Default: false. */
  bold?: boolean
  /** Lines fed after the receipt, before cutting. Default: 4. */
  feedLines?: number
  /** Partial paper cut at the end. Default: true. */
  cut?: boolean
}

function command(bytes: number[]): Uint8Array {
  return new Uint8Array(bytes)
}

/** ESC @ — initialize printer (clears alignment, bold, and codepage state). */
export function escposInit(): Uint8Array {
  return command([ESC, 0x40])
}

/** ESC a n — set justification (0 left, 1 center, 2 right). */
export function escposAlign(mode: EscPosAlign): Uint8Array {
  return command([ESC, 0x61, ALIGN_CODES[mode]])
}

/** ESC E n — turn bold (double-strike) on/off. */
export function escposBold(on: boolean): Uint8Array {
  return command([ESC, 0x45, on ? 0x01 : 0x00])
}

/** ESC d n — feed n lines. */
export function escposFeed(lines: number): Uint8Array {
  return command([ESC, 0x64, Math.max(0, Math.min(255, Math.round(lines)))])
}

/** GS V m — partial paper cut. */
export function escposCut(): Uint8Array {
  return command([GS, 0x56, 0x01])
}

/**
 * Encode monospace receipt text (e.g. `formatReceiptText()` output) into an
 * ESC/POS byte payload: init, optional alignment/bold, the text lines, then
 * feed + partial cut. The payload always ends with a line feed so the last
 * line actually prints.
 */
export function encodeReceipt(text: string, options: EncodeReceiptOptions = {}): Uint8Array {
  const { align = 'left', bold = false, feedLines = 4, cut = true } = options

  const normalized = text.endsWith('\n') ? text : `${text}\n`
  const textBytes: number[] = []
  pushText(textBytes, normalized)

  const bytes: number[] = []
  bytes.push(...escposInit())
  if (align !== 'left') bytes.push(...escposAlign(align))
  if (bold) bytes.push(...escposBold(true))
  bytes.push(...textBytes)
  if (bold) bytes.push(...escposBold(false))
  if (align !== 'left') bytes.push(...escposAlign('left'))
  bytes.push(...escposFeed(feedLines))
  if (cut) bytes.push(...escposCut())

  return new Uint8Array(bytes)
}
