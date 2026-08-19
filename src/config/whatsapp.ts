const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ''

export const DEFAULT_WA_MESSAGE =
  'Halo Pinto Coffee, saya ingin bertanya / memesan biji kopi.'

export function waLink(message: string = DEFAULT_WA_MESSAGE): string {
  const number = WHATSAPP_NUMBER.replace(/\D/g, '')
  if (!number) return 'https://wa.me/'
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`
}