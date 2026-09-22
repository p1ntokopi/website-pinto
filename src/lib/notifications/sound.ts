import { getSoundEnabled } from '@/lib/notifications/preferences'

const AUDIO_PATH_PRIMARY = '/notification-order.wav'
const AUDIO_PATH_FALLBACK = '/notification -order.wav'

let audioContext: AudioContext | null = null
let audioBuffer: AudioBuffer | null = null
let isBufferLoading = false
let audioElement: HTMLAudioElement | null = null
let isPrimed = false

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!audioContext) {
    try {
      audioContext = new Ctor()
    } catch {
      // AudioContext creation failed
      return null
    }
  }
  return audioContext
}

function getAudioElement(): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null
  if (!audioElement) {
    try {
      audioElement = new Audio(AUDIO_PATH_PRIMARY)
      audioElement.preload = 'auto'
      audioElement.onerror = () => {
        // Fallback to secondary filename if primary fails
        if (audioElement && !audioElement.src.includes(encodeURIComponent('notification -order.wav'))) {
          audioElement.src = AUDIO_PATH_FALLBACK
          audioElement.load()
        }
      }
    } catch {
      // Audio constructor failed in restricted environment
      return null
    }
  }
  return audioElement
}

/**
 * Pre-fetch and decode the WAV audio into a Web Audio AudioBuffer.
 * This allows zero-latency playback that bypasses HTMLAudioElement restrictions once unlocked.
 */
async function loadAudioBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (audioBuffer) return audioBuffer
  if (isBufferLoading) return null
  isBufferLoading = true

  try {
    let res = await fetch(AUDIO_PATH_PRIMARY).catch(() => null)
    if (!res || !res.ok) {
      res = await fetch(AUDIO_PATH_FALLBACK).catch(() => null)
    }
    if (res && res.ok) {
      const arrayBuffer = await res.arrayBuffer()
      audioBuffer = await new Promise<AudioBuffer>((resolve, reject) => {
        ctx.decodeAudioData(arrayBuffer, resolve, reject)
      })
      return audioBuffer
    }
  } catch {
    // Decoding or network fetch failed - fallback to HTMLAudioElement or tone
  } finally {
    isBufferLoading = false
  }
  return null
}

/**
 * Unlock and prime both Web Audio Context and HTMLAudioElement from a user gesture.
 * Mobile browsers (iOS Safari, Android Chrome, Samsung Internet) strictly require
 * user interaction (touch/click) to unlock audio playback for background/WebSocket events.
 */
export async function primeAudioContext(): Promise<boolean> {
  if (typeof window === 'undefined') return false

  let unlocked = false

  // 1. Prime Web Audio Context
  const ctx = getContext()
  if (ctx) {
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume()
        unlocked = (ctx.state as string) === 'running'
      } catch {
        // Continue to audio element
      }
    } else if (ctx.state === 'running') {
      unlocked = true
    }

    // Preload and decode the audio buffer
    if (!audioBuffer) {
      loadAudioBuffer(ctx).catch(() => {})
    }
  }

  // 2. Prime HTMLAudioElement (crucial for mobile Safari/WebKit)
  const el = getAudioElement()
  if (el && !isPrimed) {
    try {
      el.volume = 0.001
      const p = el.play()
      if (p !== undefined) {
        await p
        el.pause()
        el.currentTime = 0
        el.volume = 1.0
        isPrimed = true
        unlocked = true
      }
    } catch {
      // Autoplay blocked by user-agent
    }
  }

  return unlocked
}

/**
 * Checks whether audio has been primed/unlocked and is ready for playback on this device.
 */
export function isAudioReady(): boolean {
  if (typeof window === 'undefined') return false
  const ctx = getContext()
  return (ctx !== null && ctx.state === 'running') || isPrimed
}

/**
 * Fallback synthesizer tone if the audio file fails to load or cannot be decoded.
 */
function playSynthesizedTone(ctx: AudioContext): void {
  try {
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(880, now)
    osc.frequency.exponentialRampToValueAtTime(1318.5, now + 0.15)
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(0.3, now + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.45)
  } catch {
    // Ignore audio synthesis errors
  }
}

/**
 * Plays the new order notification sound from public/notification-order.wav.
 * Works seamlessly across both desktop and mobile devices.
 * 
 * @param force If true, ignores the mute sound preference (e.g. for testing/preview).
 * @returns true if sound was successfully played.
 */
export async function playNewOrderSound(force = false): Promise<boolean> {
  if (!force && !getSoundEnabled()) return false

  // Method 1: Web Audio Buffer (instant, lowest latency, supports overlapping plays)
  const ctx = getContext()
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }

      if (ctx.state === 'running') {
        const buffer = audioBuffer || (await loadAudioBuffer(ctx))
        if (buffer) {
          const source = ctx.createBufferSource()
          const gain = ctx.createGain()
          gain.gain.value = 1.0
          source.buffer = buffer
          source.connect(gain)
          gain.connect(ctx.destination)
          source.start(0)
          return true
        }
      }
    } catch {
      // Fall through to Method 2
    }
  }

  // Method 2: HTMLAudioElement (broadest mobile browser compatibility)
  try {
    const el = getAudioElement()
    if (el) {
      el.pause()
      el.currentTime = 0
      el.volume = 1.0
      const playPromise = el.play()
      if (playPromise !== undefined) {
        await playPromise
        return true
      }
    }
  } catch {
    // Fall through to Method 3
  }

  // Method 3: Fallback synthesized oscillator chime
  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume()
      }
      if (ctx.state === 'running') {
        playSynthesizedTone(ctx)
        return true
      }
    } catch {
      // Audio completely unavailable
    }
  }

  return false
}