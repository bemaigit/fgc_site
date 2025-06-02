'use client'

import { useCallback } from 'react'
import { format } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { FormControl, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { Control, useController } from 'react-hook-form'
import type { BasicInfoFormValues } from './EventBasicInfoEditor'

interface DateFieldProps {
  control: Control<BasicInfoFormValues>
  name: keyof BasicInfoFormValues
  label: string
  placeholder?: string
  disabled?: boolean
}

export function DateField({ 
  control,
  name,
  label,
  placeholder = "Selecione uma data",
  disabled = false,
}: DateFieldProps) {
  const {
    field,
    fieldState: { error }
  } = useController({
    name,
    control
  })

  // Converte Date | null | undefined para Date | undefined (formato esperado pelo Calendar)
  const dateValue = field.value instanceof Date ? field.value : undefined

  // Handler para seleção de data
  const handleSelect = (date: Date | undefined) => {
    field.onChange(date || null)
  }

  // Desabilita datas passadas
  const disablePastDates = useCallback((date: Date) => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return date < now
  }, [])

  return (
    <FormItem className="flex flex-col">
      <FormLabel>{label}</FormLabel>
      <Popover>
        <PopoverTrigger asChild>
          <FormControl>
            <Button
              type="button"
              variant="outline"
              className={cn(
                "w-full pl-3 text-left font-normal",
                !field.value && "text-muted-foreground",
                error && "border-red-500 focus-visible:ring-red-500"
              )}
              disabled={disabled}
            >
              {field.value instanceof Date ? (
                format(field.value, "dd/MM/yyyy")
              ) : (
                <span>{placeholder}</span>
              )}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </FormControl>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar 
            mode="single"
            disabled={disablePastDates}
            initialFocus
            selected={dateValue}
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
      <FormMessage />
    </FormItem>
  )
}
