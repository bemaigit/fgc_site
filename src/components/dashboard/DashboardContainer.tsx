'use client'

import { ReactNode } from 'react'
import { twMerge } from 'tailwind-merge'

interface DashboardContainerProps {
  title: string
  description?: string
  children: ReactNode
  className?: string
}

export function DashboardContainer({
  title,
  description,
  children,
  className
}: DashboardContainerProps) {
  return (
    <div className={twMerge('p-6', className)}>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#08285d]">{title}</h1>
        {description && (
          <p className="text-gray-500 mt-1">{description}</p>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        {children}
      </div>
    </div>
  )
}
