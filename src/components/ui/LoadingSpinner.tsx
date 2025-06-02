interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12'
}

export function LoadingSpinner({ size = 'md' }: LoadingSpinnerProps) {
  return (
    <div
      className={`${sizes[size]} animate-spin rounded-full border-4 border-primary border-t-transparent`}
      role="status"
      aria-label="Carregando..."
    />
  )
}
