'use client'

import { QRCodeCanvas } from 'qrcode.react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'

interface QRPreviewProps {
  slug: string
  tableNumber: string
}

export function QRPreview({ slug, tableNumber }: QRPreviewProps) {
  const qrRef = useRef<HTMLDivElement>(null)
  
  // Use a fallback domain if NEXT_PUBLIC_SITE_URL is not set
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://pinto.id')
  const targetUrl = `${baseUrl}/t/${slug}`

  const downloadQR = () => {
    if (!qrRef.current) return
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return

    const pngUrl = canvas
      .toDataURL('image/png')
      .replace('image/png', 'image/octet-stream')

    const downloadLink = document.createElement('a')
    downloadLink.href = pngUrl
    downloadLink.download = `P1NTO-Table-${tableNumber}-QR.png`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  const printQR = () => {
    // A simple print mechanism - opens a new window, renders the QR card, and calls print()
    if (!qrRef.current) return
    const canvas = qrRef.current.querySelector('canvas')
    if (!canvas) return

    const pngUrl = canvas.toDataURL('image/png')
    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>Print QR - Table ${tableNumber}</title>
          <style>
            body { 
              font-family: sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              height: 100vh; 
              margin: 0; 
              background: #fff;
            }
            .card {
              border: 2px solid #8B5E3C;
              border-radius: 16px;
              padding: 40px;
              text-align: center;
              width: 300px;
            }
            .brand {
              font-size: 24px;
              font-weight: bold;
              color: #8B5E3C;
              margin-bottom: 8px;
              letter-spacing: 2px;
            }
            .title {
              font-size: 28px;
              font-weight: bold;
              margin: 24px 0 12px;
            }
            .subtitle {
              font-size: 14px;
              color: #666;
            }
            img {
              width: 200px;
              height: 200px;
              margin: 0 auto;
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="brand">P1NTO</div>
            <div>COFFEE</div>
            <img src="${pngUrl}" alt="QR Code" />
            <div class="title">TABLE ${tableNumber}</div>
            <div class="subtitle">Scan to view our menu<br/>Order directly from your table</div>
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div 
        ref={qrRef} 
        className="bg-white p-6 rounded-xl shadow-sm border border-border/50 flex flex-col items-center"
      >
        <div className="font-display font-bold text-xl text-primary tracking-widest mb-1">P1NTO</div>
        <div className="text-xs text-muted-foreground uppercase tracking-widest mb-4">Coffee</div>
        
        <QRCodeCanvas 
          value={targetUrl}
          size={180}
          bgColor={"#ffffff"}
          fgColor={"#171513"}
          level={"H"}
          marginSize={0}
        />
        
        <div className="mt-4 font-bold text-lg">TABLE {tableNumber}</div>
        <div className="text-xs text-center text-muted-foreground mt-1 max-w-[180px]">
          Scan to order directly from your table
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={downloadQR}>
          <Download className="w-4 h-4 mr-2" /> PNG
        </Button>
        <Button size="sm" onClick={printQR}>
          <Printer className="w-4 h-4 mr-2" /> Print
        </Button>
      </div>
    </div>
  )
}
