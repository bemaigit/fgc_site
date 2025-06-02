import type { ReactNode } from 'react'
import '@/components/ui/use-toast'

declare module '@/components/ui/use-toast' {
  interface Toast {
    className?: string
    icon?: ReactNode
  }
}
