import { cn } from "@/lib/utils"
import React, { HTMLAttributes } from "react"

interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  className?: string
  as?: React.ElementType
}

export function Container({
  children,
  className,
  as: Component = "div",
  ...props
}: ContainerProps) {
  return (
    <Component
      className={cn(
        "container mx-auto px-4 md:px-6 w-full max-w-7xl",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
}

export default Container
