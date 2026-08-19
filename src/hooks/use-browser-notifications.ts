'use client'

import { useCallback, useState } from 'react'
import {
  getBrowserNotificationsEnabled,
  setBrowserNotificationsEnabled,
} from '@/lib/notifications/preferences'

export type NotificationPermissionState = 'granted' | 'denied' | 'default' | 'unsupported'

function getPermissionState(): NotificationPermissionState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission as NotificationPermissionState
}

/**
 * Browser Notification API helper.
 * Permission is only ever requested from a user gesture (the settings button),
 * never on page load. The app stays fully functional without permission.
 */
export function useBrowserNotifications() {
  const [permission, setPermission] = useState<NotificationPermissionState>(getPermissionState)
  const [enabled, setEnabled] = useState<boolean>(getBrowserNotificationsEnabled)

  const refreshPermission = useCallback(() => {
    setPermission(getPermissionState())
  }, [])

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    const current = getPermissionState()
    if (current !== 'default') {
      refreshPermission()
      return current
    }
    try {
      const result = (await Notification.requestPermission()) as NotificationPermissionState
      setPermission(result)
      return result
    } catch {
      return getPermissionState()
    }
  }, [refreshPermission])

  const toggleEnabled = useCallback((value: boolean) => {
    setEnabled(value)
    setBrowserNotificationsEnabled(value)
  }, [])

  return {
    permission,
    enabled,
    isSupported: permission !== 'unsupported',
    requestPermission,
    toggleEnabled,
    refreshPermission,
  }
}