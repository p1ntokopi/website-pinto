'use client'

import { Download } from 'lucide-react'
import { downloadCsv } from '@/lib/finance/csv'
import { Button } from '@/components/ui/button'

export function DownloadCsvButton({
  filename,
  content,
  label,
}: {
  filename: string
  content: string
  label: string
}) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => downloadCsv(filename, content)}
      disabled={content.length === 0}
    >
      <Download className="h-3.5 w-3.5" aria-hidden="true" />
      {label}
    </Button>
  )
}
