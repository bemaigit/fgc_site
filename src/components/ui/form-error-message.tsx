import React from 'react'
import { cn } from '@/lib/utils'

interface FormErrorMessageProps extends React.HTMLAttributes<HTMLParagraphElement> {
  children: React.ReactNode
}

const FormErrorMessage = React.forwardRef<HTMLParagraphElement, FormErrorMessageProps>(
  ({ className, children, ...props }, ref) => {
    if (!children) {
      return null
    }

    return (
      <p
        ref={ref}
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {children}
      </p>
    )
  }
)
FormErrorMessage.displayName = "FormErrorMessage"

export { FormErrorMessage }
