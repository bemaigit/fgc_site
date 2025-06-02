'use client'

import { useEffect } from 'react'

type NotificationProps = {
  message: string
  type?: 'success' | 'error'
  duration?: number
  onClose: () => void
}

export function Notification({ message, type = 'success', duration = 3000, onClose }: NotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = type === 'success' ? 'bg-green-50' : 'bg-red-50'
  const textColor = type === 'success' ? 'text-green-800' : 'text-red-800'
  const borderColor = type === 'success' ? 'border-green-100' : 'border-red-100'

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`rounded-lg border ${borderColor} ${bgColor} p-4 shadow-lg`}>
        <p className={`text-sm ${textColor}`}>{message}</p>
      </div>
    </div>
  )
}
