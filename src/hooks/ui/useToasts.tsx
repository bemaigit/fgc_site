import { useCallback } from 'react'
import { toast } from '@/components/ui/use-toast'
import { CheckCircle, AlertCircle } from 'lucide-react'

interface ToastOptions {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
}

export function useToasts() {
  const showLoading = useCallback((options?: ToastOptions) => {
    return toast({
      title: options?.title || 'Processando...',
      description: options?.description,
      variant: options?.variant || 'default'
    })
  }, [])

  const showSuccess = useCallback((options?: ToastOptions) => {
    toast({
      title: options?.title || 'Sucesso!',
      description: options?.description,
      variant: 'default',
      className: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="h-5 w-5 text-green-600" />
    })
  }, [])

  const showError = useCallback((options?: ToastOptions) => {
    toast({
      title: options?.title || 'Erro!',
      description: options?.description || 'Ocorreu um erro. Tente novamente.',
      variant: 'destructive',
      icon: <AlertCircle className="h-5 w-5" />
    })
  }, [])

  return {
    showLoading,
    showSuccess,
    showError
  }
}
