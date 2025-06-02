"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerWithRangeProps {
  className?: string
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
}

export function DatePickerWithRange({
  className,
  value,
  onChange
}: DatePickerWithRangeProps) {
  // Garantir que value seja um objeto DateRange válido mesmo quando undefined
  const safeValue = React.useMemo(() => {
    if (!value) return undefined
    return {
      from: value.from || undefined,
      to: value.to || undefined
    }
  }, [value])

  // Handler para garantir que onChange receba um valor válido
  const handleSelect = React.useCallback((newValue: DateRange | undefined) => {
    if (!newValue) {
      onChange(undefined)
      return
    }
    
    onChange({
      from: newValue.from || undefined,
      to: newValue.to || undefined
    })
  }, [onChange])

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-full justify-start text-left font-normal",
              !safeValue && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {safeValue?.from ? (
              safeValue.to ? (
                <>
                  {format(safeValue.from, "dd/MM/yyyy", { locale: ptBR })} -{" "}
                  {format(safeValue.to, "dd/MM/yyyy", { locale: ptBR })}
                </>
              ) : (
                format(safeValue.from, "dd/MM/yyyy", { locale: ptBR })
              )
            ) : (
              <span>Selecione um período</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={new Date()}
            selected={safeValue}
            onSelect={handleSelect}
            numberOfMonths={2}
            locale={ptBR}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
