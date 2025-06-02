"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { Button } from "../ui/button"

interface QRCodeDisplayProps {
  qrCode?: string | null
  qrCodeBase64?: string | null
  paymentUrl?: string | null
  amount: number
}

export function QRCodeDisplay({ qrCode, qrCodeBase64, paymentUrl, amount }: QRCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  if (!qrCode && !qrCodeBase64) return null

  const handleCopy = () => {
    if (qrCode) {
      navigator.clipboard.writeText(qrCode)
      setCopied(true)
    }
  }

  return (
    <div className="flex flex-col items-center gap-4 p-4 border rounded-lg bg-background">
      <h3 className="text-lg font-semibold">PIX QR Code</h3>
      <div className="text-sm text-muted-foreground">
        Valor: R$ {amount.toFixed(2)}
      </div>

      {qrCodeBase64 ? (
        <Image 
          src={`data:image/png;base64,${qrCodeBase64}`}
          alt="QR Code PIX"
          width={200}
          height={200}
          className="border rounded-lg p-2"
        />
      ) : qrCode ? (
        <div className="relative w-[200px] h-[200px] border rounded-lg p-2">
          <Image 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrCode)}`}
            alt="QR Code PIX"
            fill
            className="object-contain"
          />
        </div>
      ) : null}

      {qrCode && (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <Button 
            variant={copied ? "outline" : "secondary"}
            onClick={handleCopy}
          >
            {copied ? "Copiado!" : "Copiar código PIX"}
          </Button>
        </div>
      )}

      {paymentUrl && (
        <a 
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-500 hover:text-blue-700 flex items-center"
        >
          Ver página de pagamento
          <svg 
            className="w-4 h-4 ml-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
            />
          </svg>
        </a>
      )}
    </div>
  )
}