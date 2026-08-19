import { getSoundEnabled } from '@/lib/notifications/preferences'

let audioContext: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) audioContext = new Ctor()
  return audioContext
}

/**
 * Unlock the WebAudio context from a user gesture.
 * Browsers block audio until the user has interacted with the page;
 * call this from the first pointer/keydown handler.
 */
export function primeAudioContext(): void {
  const ctx = getContext()
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {})
  }
}

function tone(
  ctx: AudioContext,
  frequency: number,
  startAt: number,
  duration: number,
  volume: number
): void {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'sine'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, ctx.currentTime + startAt)
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + startAt + 0.02)
  gain.gain.setValueAtTime(volume, ctx.currentTime + startAt + duration - 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + startAt)
  osc.stop(ctx.currentTime + startAt + duration + 0.05)
}

/**
 * Short two-note chime, clearly distinguishable but not annoying.
 * Returns true when the sound was actually played.
 */
export async function playNewOrderSound(): Promise<boolean> {
  if (!getSoundEnabled()) return false

  const ctx = getContext()
  if (!ctx) return false

  try {
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    tone(ctx, 880, 0, 0.16, 0.22)
    tone(ctx, 1318.5, 0.14, 0.22, 0.2)
    return true
  } catch {
    // Audio blocked by the browser or unavailable - never throw.
    return false
  }
}