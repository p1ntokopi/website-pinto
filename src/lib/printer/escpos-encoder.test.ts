import { describe, it, expect } from 'vitest'
import {
  encodeReceipt,
  escposAlign,
  escposBold,
  escposCut,
  escposFeed,
  escposInit,
} from '@/lib/printer/escpos-encoder'

describe('ESC/POS command builders', () => {
  it('builds initialize, align, bold, feed, and cut commands', () => {
    expect(Array.from(escposInit())).toEqual([0x1b, 0x40])
    expect(Array.from(escposAlign('left'))).toEqual([0x1b, 0x61, 0x00])
    expect(Array.from(escposAlign('center'))).toEqual([0x1b, 0x61, 0x01])
    expect(Array.from(escposAlign('right'))).toEqual([0x1b, 0x61, 0x02])
    expect(Array.from(escposBold(true))).toEqual([0x1b, 0x45, 0x01])
    expect(Array.from(escposBold(false))).toEqual([0x1b, 0x45, 0x00])
    expect(Array.from(escposFeed(3))).toEqual([0x1b, 0x64, 0x03])
    expect(Array.from(escposCut())).toEqual([0x1d, 0x56, 0x01])
  })

  it('clamps feed line counts into the valid byte range', () => {
    expect(Array.from(escposFeed(999))).toEqual([0x1b, 0x64, 0xff])
    expect(Array.from(escposFeed(-5))).toEqual([0x1b, 0x64, 0x00])
  })
})

describe('encodeReceipt', () => {
  it('starts with initialize and ends with feed + partial cut by default', () => {
    const bytes = encodeReceipt('TOTAL')
    expect(bytes[0]).toBe(0x1b)
    expect(bytes[1]).toBe(0x40)
    const tail = Array.from(bytes.slice(-6))
    expect(tail).toEqual([0x1b, 0x64, 0x04, 0x1d, 0x56, 0x01])
  })

  it('encodes ASCII text verbatim and guarantees a trailing line feed', () => {
    const bytes = encodeReceipt('Pinto Coffee')
    const text = Array.from(bytes.slice(2, 2 + 13))
    expect(text).toEqual([...Array.from('Pinto Coffee').map((c) => c.charCodeAt(0)), 0x0a])
  })

  it('keeps line feeds inside multi-line text', () => {
    const bytes = encodeReceipt('A\nB')
    const text = Array.from(bytes.slice(2, 2 + 4))
    expect(text).toEqual([0x41, 0x0a, 0x42, 0x0a])
  })

  it('maps CP437 characters to their single-byte codes', () => {
    const bytes = encodeReceipt('é°±ñ')
    const text = Array.from(bytes.slice(2, 2 + 5))
    expect(text).toEqual([0x82, 0xf8, 0xf1, 0xa4, 0x0a])
  })

  it('maps common unicode symbols to closest CP437 equivalents', () => {
    const bytes = encodeReceipt('Kopi • Susu')
    const text = Array.from(bytes.slice(2, 2 + 12))
    expect(text).toContain(0xfa) // bullet -> middle dot
  })

  it('falls back to a single ? for unmapped characters', () => {
    const bytes = encodeReceipt('a😀b')
    const text = Array.from(bytes.slice(2, 2 + 4))
    expect(text).toEqual([0x61, 0x3f, 0x62, 0x0a])
  })

  it('omits alignment commands when left-aligned (default)', () => {
    const bytes = encodeReceipt('TOTAL')
    expect(Array.from(bytes)).not.toContain(0x61)
    expect(Array.from(bytes)).not.toContain(0x45)
  })

  it('wraps text with center alignment commands and restores left', () => {
    const bytes = Array.from(encodeReceipt('TOTAL', { align: 'center' }))
    expect(bytes.slice(0, 5)).toEqual([0x1b, 0x40, 0x1b, 0x61, 0x01])
    const restore = bytes.lastIndexOf(0x61)
    const restoreSeq = bytes.slice(restore - 1, restore + 2)
    expect(restoreSeq).toEqual([0x1b, 0x61, 0x00])
  })

  it('wraps text with bold on/off when bold is requested', () => {
    const bytes = Array.from(encodeReceipt('TOTAL', { bold: true }))
    const boldOn = bytes.indexOf(0x45)
    expect(bytes.slice(boldOn - 1, boldOn + 2)).toEqual([0x1b, 0x45, 0x01])
    const boldOff = bytes.lastIndexOf(0x45)
    expect(bytes.slice(boldOff - 1, boldOff + 2)).toEqual([0x1b, 0x45, 0x00])
  })

  it('supports custom feed counts and disabling the cut', () => {
    const bytes = Array.from(encodeReceipt('A', { feedLines: 6, cut: false }))
    expect(bytes.slice(-3)).toEqual([0x1b, 0x64, 0x06])
    expect(bytes).not.toContain(0x1d)
  })

  it('does not double the trailing line feed for text ending in LF', () => {
    const bytes = encodeReceipt('A\n')
    const text = Array.from(bytes.slice(2, 2 + 2))
    expect(text).toEqual([0x41, 0x0a])
  })
})
