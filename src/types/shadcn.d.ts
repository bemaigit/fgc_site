import { ReactNode } from "react"

declare module "@/components/ui/use-toast" {
  interface ToastProps {
    title?: ReactNode
    description?: ReactNode
    action?: ReactNode
    variant?: "default" | "destructive"
    duration?: number
  }
}