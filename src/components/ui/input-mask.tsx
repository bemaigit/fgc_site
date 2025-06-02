"use client"

import { forwardRef } from "react"
import { NumericFormat, PatternFormat } from "react-number-format"
import { cn } from "@/lib/utils"

const inputStyles = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"

export interface InputMaskProps extends React.InputHTMLAttributes<HTMLInputElement> {
  mask: string
}

const MaskedInput = forwardRef<HTMLInputElement, InputMaskProps>(
  ({ className, mask, ...props }, ref) => {
    if (mask === "cpf") {
      return (
        <PatternFormat
          format="###.###.###-##"
          mask="_"
          {...props}
          getInputRef={ref}
          className={cn(inputStyles, className)}
        />
      )
    }

    if (mask === "phone") {
      return (
        <PatternFormat
          format="(##) #####-####"
          mask="_"
          {...props}
          getInputRef={ref}
          className={cn(inputStyles, className)}
        />
      )
    }

    if (mask === "cep") {
      return (
        <PatternFormat
          format="#####-###"
          mask="_"
          {...props}
          getInputRef={ref}
          className={cn(inputStyles, className)}
        />
      )
    }

    return null
  }
)
MaskedInput.displayName = "MaskedInput"

export { MaskedInput }
