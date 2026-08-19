const NOTIF_ENABLED_KEY = 'p1nto:notif-enabled'
const SOUND_ENABLED_KEY = 'p1nto:notif-sound'
const BROWSER_ENABLED_KEY = 'p1nto:notif-browser'

function readFlag(key: string, fallback: boolean): boolean {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return raw === 'true'
  } catch {
    return fallback
  }
}

function writeFlag(key: string, value: boolean): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, value ? 'true' : 'false')
  } catch {
    // Storage unavailable (private mode / blocked) - ignore silently.
  }
}

export function getNotificationsEnabled(): boolean {
  return readFlag(NOTIF_ENABLED_KEY, true)
}

export function setNotificationsEnabled(value: boolean): void {
  writeFlag(NOTIF_ENABLED_KEY, value)
}

export function getSoundEnabled(): boolean {
  return readFlag(SOUND_ENABLED_KEY, true)
}

export function setSoundEnabled(value: boolean): void {
  writeFlag(SOUND_ENABLED_KEY, value)
}

export function getBrowserNotificationsEnabled(): boolean {
  return readFlag(BROWSER_ENABLED_KEY, false)
}

export function setBrowserNotificationsEnabled(value: boolean): void {
  writeFlag(BROWSER_ENABLED_KEY, value)
}