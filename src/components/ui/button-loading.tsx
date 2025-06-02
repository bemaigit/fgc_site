import { Icons } from "@/components/ui/icons"
import { Button } from "@/components/ui/button"
import { ButtonProps } from "@/components/ui/button"

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
}

export function LoadingButton({
  loading,
  loadingText = "Carregando...",
  children,
  disabled,
  ...props
}: LoadingButtonProps) {
  return (
    <Button {...props} disabled={loading || disabled}>
      {loading ? (
        <>
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  )
}
