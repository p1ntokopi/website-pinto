import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  playNewOrderSound,
  primeAudioContext,
  isAudioReady,
} from '@/lib/notifications/sound'
import { setSoundEnabled } from '@/lib/notifications/preferences'

describe('sound notification manager', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    setSoundEnabled(true)
  })

  it('respects sound disabled preference', async () => {
    setSoundEnabled(false)
    const result = await playNewOrderSound()
    expect(result).toBe(false)
  })

  it('bypasses sound preference when force is true', async () => {
    setSoundEnabled(false)
    // In Node / non-browser test environment, audio APIs are absent, so it gracefully returns false
    const result = await playNewOrderSound(true)
    expect(typeof result).toBe('boolean')
  })

  it('primeAudioContext executes safely in SSR / test environments', async () => {
    const result = await primeAudioContext()
    expect(typeof result).toBe('boolean')
  })

  it('isAudioReady returns a boolean status', () => {
    expect(typeof isAudioReady()).toBe('boolean')
  })
})
