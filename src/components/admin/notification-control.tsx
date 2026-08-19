'use client'

import { useState } from 'react'
import { Bell, BellRing, CheckCheck, Wifi, WifiOff, Loader2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { useBrowserNotifications } from '@/hooks/use-browser-notifications'
import { useToast } from '@/hooks/use-toast'
import {
  getNotificationsEnabled,
  getSoundEnabled,
  setNotificationsEnabled,
  setSoundEnabled,
} from '@/lib/notifications/preferences'

type NotificationControlProps = {
  unreadCount: number
  isConnected: boolean
  onMarkAllRead: () => void
}

const PERMISSION_LABEL: Record<string, string> = {
  granted: 'Diaktifkan',
  denied: 'Diblokir browser',
  default: 'Belum diizinkan',
  unsupported: 'Tidak didukung perangkat',
}

export function NotificationControl({
  unreadCount,
  isConnected,
  onMarkAllRead,
}: NotificationControlProps) {
  const [notifEnabled, setNotifEnabled] = useState(getNotificationsEnabled)
  const [soundEnabled, setSoundEnabledState] = useState(getSoundEnabled)
  const [requesting, setRequesting] = useState(false)

  const browser = useBrowserNotifications()
  const { toast } = useToast()

  const handleToggleNotifications = (value: boolean) => {
    setNotifEnabled(value)
    setNotificationsEnabled(value)
  }

  const handleToggleSound = (value: boolean) => {
    setSoundEnabledState(value)
    setSoundEnabled(value)
  }

  const handleEnableDesktop = async () => {
    setRequesting(true)
    const result = await browser.requestPermission()
    setRequesting(false)

    if (result === 'granted') {
      browser.toggleEnabled(true)
      toast({
        title: 'Notifikasi desktop aktif',
        description: 'Pesanan baru akan muncul sebagai notifikasi browser.',
      })
    } else if (result === 'denied') {
      browser.toggleEnabled(false)
      toast({
        variant: 'destructive',
        title: 'Notifikasi diblokir',
        description: 'Izinkan notifikasi di pengaturan situs browser Anda.',
      })
    } else {
      toast({
        title: 'Menunggu izin browser',
        description: 'Gunakan tombol ini lagi setelah mengizinkan notifikasi.',
      })
    }
  }

  const badgeCount = unreadCount > 99 ? '99+' : String(unreadCount)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label={`Notifikasi pesanan${unreadCount > 0 ? ` (${unreadCount} belum dibaca)` : ''}`}
            className="relative flex min-h-11 min-w-11 items-center justify-center rounded-sm text-muted-text transition-colors hover:bg-muted hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
          >
            {unreadCount > 0 ? (
              <BellRing className="h-5 w-5 text-coffee" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-paper">
                {badgeCount}
              </span>
            )}
          </button>
        }
      />

      <DropdownMenuContent align="end" sideOffset={10} className="w-80 [--anchor-width:20rem] rounded-lg p-2">
        <div className="flex items-center justify-between px-2 py-1.5">
          <div>
            <p className="text-sm font-semibold text-ink">Notifikasi</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-text">
              {isConnected ? (
                <>
                  <Wifi className="h-3.5 w-3.5 text-success" />
                  Langsung
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5 animate-pulse text-danger" />
                  Terputus · menghubungkan ulang
                </>
              )}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="inline-flex items-center gap-1.5 rounded-sm px-2 py-1.5 text-xs font-semibold text-coffee transition-colors hover:bg-coffee/10 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Tandai dibaca
            </button>
          )}
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        <div className="space-y-1 py-1">
          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <div>
              <p className="text-sm font-medium text-ink">Suara & notifikasi desktop</p>
              <p className="text-xs text-muted-text">Matikan untuk membungkam peringatan.</p>
            </div>
            <Switch
              checked={notifEnabled}
              onCheckedChange={handleToggleNotifications}
              aria-label="Aktifkan suara dan notifikasi desktop"
            />
          </div>

          <div className="flex items-center justify-between gap-3 px-2 py-1.5">
            <div>
              <p className="text-sm font-medium text-ink">Suara</p>
              <p className="text-xs text-muted-text">Nada pendek saat pesanan baru masuk.</p>
            </div>
            <Switch
              checked={soundEnabled}
              onCheckedChange={handleToggleSound}
              disabled={!notifEnabled}
              aria-label="Aktifkan suara pesanan baru"
            />
          </div>
        </div>

        <DropdownMenuSeparator className="my-1.5" />

        <div className="px-2 py-1.5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-ink">Notifikasi desktop</p>
              <p className="text-xs text-muted-text">{PERMISSION_LABEL[browser.permission]}</p>
            </div>
            {browser.isSupported ? (
              browser.permission === 'granted' ? (
                <Switch
                  checked={browser.enabled}
                  onCheckedChange={browser.toggleEnabled}
                  disabled={!notifEnabled}
                  aria-label="Aktifkan notifikasi desktop"
                />
              ) : (
                <button
                  type="button"
                  onClick={handleEnableDesktop}
                  disabled={requesting || !notifEnabled}
                  className="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-sm border border-coffee/30 bg-coffee/5 px-3 py-2 text-xs font-bold uppercase tracking-wide text-coffee transition-colors hover:bg-coffee/10 disabled:opacity-50 focus-visible:ring-3 focus-visible:ring-ring/40 outline-none"
                >
                  {requesting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {browser.permission === 'denied' ? 'Buka Pengaturan' : 'Aktifkan'}
                </button>
              )
            ) : (
              <span
                className={cn(
                  'inline-flex min-h-11 items-center rounded-sm px-3 text-xs font-semibold',
                  'text-muted-text'
                )}
              >
                Tidak tersedia
              </span>
            )}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}