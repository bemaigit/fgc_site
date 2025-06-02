import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface DashboardHeaderProps {
  title: string
  description?: string
  backLink?: string
  backLabel?: string
  actions?: React.ReactNode
}

export function DashboardHeader({
  title,
  description,
  backLink,
  backLabel = 'Voltar',
  actions
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col gap-4 pb-4 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1.5">
        {backLink && (
          <Button asChild variant="ghost" size="sm" className="mb-2">
            <Link href={backLink}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Link>
          </Button>
        )}
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">{actions}</div>
      )}
    </div>
  )
}

export default DashboardHeader
