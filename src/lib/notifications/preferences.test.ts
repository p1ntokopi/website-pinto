import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  getNotificationsEnabled,
  getSoundEnabled,
  getBrowserNotificationsEnabled,
  setNotificationsEnabled,
  setSoundEnabled,
  setBrowserNotificationsEnabled,
} from '@/lib/notifications/preferences'

function createStorage(): Storage {
  const store = new Map<string, string>()
  return {
    get length() {
      return store.size
    },
    clear: () => store.clear(),
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => void store.delete(key),
    setItem: (key: string, value: string) => void store.set(key, value),
  }
}

describe('notification preferences', () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
    vi.stubGlobal('window', { localStorage: createStorage() })
  })

  it('defaults to enabled when nothing is stored', () => {
    expect(getNotificationsEnabled()).toBe(true)
    expect(getSoundEnabled()).toBe(true)
    expect(getBrowserNotificationsEnabled()).toBe(false)
  })

  it('round-trips the flags through localStorage', () => {
    setNotificationsEnabled(false)
    setSoundEnabled(false)
    setBrowserNotificationsEnabled(true)

    expect(getNotificationsEnabled()).toBe(false)
    expect(getSoundEnabled()).toBe(false)
    expect(getBrowserNotificationsEnabled()).toBe(true)
  })

  it('persists values across reads', () => {
    setSoundEnabled(false)
    expect(getSoundEnabled()).toBe(false)
    setSoundEnabled(true)
    expect(getSoundEnabled()).toBe(true)
  })

  it('falls back safely when storage is unavailable', () => {
    vi.stubGlobal('window', {})
    expect(() => setNotificationsEnabled(false)).not.toThrow()
    expect(getNotificationsEnabled()).toBe(true)
  })
})