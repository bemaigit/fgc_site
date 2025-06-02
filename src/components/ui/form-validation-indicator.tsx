import React from 'react'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export type ValidationStatus = 'valid' | 'invalid' | 'pending'

interface FormValidationIndicatorProps {
  status: ValidationStatus
  message?: string
}

export function FormValidationIndicator({ status, message }: FormValidationIndicatorProps) {
  const icon = {
    pending: <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />,
    valid: <Check className="h-4 w-4 text-green-500" />,
    invalid: <AlertCircle className="h-4 w-4 text-red-500" />,
  }[status]

  if (!icon) return null

  // Se não tiver mensagem, apenas mostra o ícone
  if (!message) {
    return <span aria-hidden>{icon}</span>
  }

  // Se tiver mensagem, mostra o ícone com tooltip
  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger type="button" className="cursor-help">
          {icon}
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
