'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export interface DatePickerProps {
  id?: string;
  selected?: Date | null;
  onSelect?: (date: Date | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePicker({
  id,
  selected,
  onSelect,
  placeholder = 'Selecione uma data',
  disabled = false,
}: DatePickerProps) {
  // Função wrapper para converter entre os tipos Date | undefined e Date | null
  const handleSelect = React.useCallback(
    (date: Date | undefined) => {
      onSelect?.(date || null);
    },
    [onSelect]
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant={'outline'}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {selected ? (
            format(selected, 'PPP', { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selected || undefined}
          onSelect={handleSelect}
          initialFocus
          locale={ptBR}
          required={false}
        />
      </PopoverContent>
    </Popover>
  )
}
