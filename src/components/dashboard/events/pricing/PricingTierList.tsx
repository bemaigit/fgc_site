'use client'

import React, { useCallback } from 'react'
import { format } from 'date-fns'
import { CalendarIcon, Plus, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { useFieldArray, type UseFormReturn } from 'react-hook-form'
import type { PricingFormValues } from './EventPricingEditor'

interface PricingTierListProps {
  form: UseFormReturn<PricingFormValues>
  isDisabled?: boolean
}

export function PricingTierList({ 
  form,
  isDisabled = false 
}: PricingTierListProps) {
  const { control, watch } = form
  const isFree = watch('isFree')

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'pricingTiers'
  })

  const handleAddTier = useCallback(() => {
    append({
      name: '',
      description: '',
      price: 0,
      startDate: null,
      endDate: null,
      maxEntries: null,
      active: true
    })
  }, [append])

  if (isFree) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium">Lotes</h4>
          <p className="text-sm text-muted-foreground">
            Configure os lotes e preços do evento
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddTier}
          disabled={isDisabled}
        >
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Lote
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="rounded-lg border p-4">
            <div className="space-y-4">
              {/* Nome do Lote */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.name`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Lote</FormLabel>
                    <FormControl>
                      <Input {...field} disabled={isDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Descrição */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.description`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ''} disabled={isDisabled} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Preço */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.price`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preço</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min={0}
                        step={0.01}
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        disabled={isDisabled}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data Inicial */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.startDate`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Inicial</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isDisabled}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={isDisabled}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Data Final */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.endDate`}
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Data Final</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                            disabled={isDisabled}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Selecione uma data</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value || undefined}
                          onSelect={field.onChange}
                          disabled={isDisabled}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Número Máximo de Inscrições */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.maxEntries`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número Máximo de Inscrições (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        min={1}
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                        disabled={isDisabled}
                      />
                    </FormControl>
                    <FormDescription>
                      Deixe em branco para não ter limite
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ativo */}
              <FormField
                control={control}
                name={`pricingTiers.${index}.active`}
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <FormDescription>
                        Lotes inativos não aparecem para o público
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isDisabled}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => remove(index)}
                disabled={isDisabled}
              >
                <Trash className="mr-2 h-4 w-4" />
                Remover Lote
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
