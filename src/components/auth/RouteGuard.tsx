import { Role } from '@prisma/client'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

interface RouteGuardProps {
  children: React.ReactNode
  requiredRole?: Role
}

export function RouteGuard({ children, requiredRole }: RouteGuardProps) {
  const { isLoading, hasRequiredRole } = useAuth(requiredRole)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!hasRequiredRole) {
    return null // O hook useAuth já faz o redirecionamento
  }

  return <>{children}</>
}
