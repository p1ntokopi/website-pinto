'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { saveAppSettings, type AppSettingsInput } from '@/app/admin/(dashboard)/settings/actions'

type BusinessSettings = AppSettingsInput

const FIELDS: { key: keyof BusinessSettings; label: string; placeholder?: string; multiline?: boolean }[] = [
  { key: 'businessName', label: 'Nama Bisnis', placeholder: 'Pinto Coffee' },
  { key: 'tagline', label: 'Tagline', placeholder: 'Kopi • Makanan • Biji Kopi' },
  { key: 'address', label: 'Alamat', multiline: true },
  { key: 'website', label: 'Website', placeholder: 'www.pintokopi.web.id' },
  { key: 'openingHours', label: 'Jam Buka', placeholder: '13.00 – 24.00 (Setiap hari)' },
  { key: 'wifiName', label: 'Nama WiFi', placeholder: 'P1NTO' },
  { key: 'wifiPassword', label: 'Password WiFi', placeholder: 'terimakasih' },
  { key: 'footerMessage', label: 'Pesan Footer Struk', multiline: true },
]

export function BusinessSettingsForm({ initialSettings }: { initialSettings: BusinessSettings }) {
  const [values, setValues] = useState<BusinessSettings>(initialSettings)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  function setField(key: keyof BusinessSettings, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit() {
    setSaving(true)
    setMessage(null)
    const result = await saveAppSettings(values)
    setSaving(false)
    if (!result.ok) {
      setMessage({ type: 'error', text: result.error ?? 'Terjadi kesalahan.' })
      return
    }
    setMessage({ type: 'ok', text: 'Pengaturan tersimpan dan langsung berlaku di seluruh situs.' })
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        submit()
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {FIELDS.map((field) => (
          <label
            key={field.key}
            className={cn('flex flex-col gap-1 text-xs font-semibold text-muted-text', field.multiline && 'sm:col-span-2')}
          >
            {field.label}
            {field.multiline ? (
              <Textarea rows={2} value={values[field.key]} onChange={(e) => setField(field.key, e.target.value)} />
            ) : (
              <Input
                value={values[field.key]}
                onChange={(e) => setField(field.key, e.target.value)}
                placeholder={field.placeholder}
              />
            )}
          </label>
        ))}
      </div>

      {message && (
        <p
          role="status"
          className={cn(
            'rounded-sm border px-3 py-2 text-sm',
            message.type === 'ok'
              ? 'border-success/30 bg-success/10 text-success'
              : 'border-danger/30 bg-danger/10 text-danger',
          )}
        >
          {message.text}
        </p>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          Simpan Pengaturan
        </Button>
      </div>
    </form>
  )
}
