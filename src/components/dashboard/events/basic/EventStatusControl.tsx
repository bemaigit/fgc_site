'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormDescription } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BasicInfoFormValues } from './EventBasicInfoEditor'

interface EventStatusControlProps {
  isDisabled?: boolean
}

export function EventStatusControl({ isDisabled = false }: EventStatusControlProps) {
  const { control, watch } = useFormContext<BasicInfoFormValues>()
  
  // Observar status para controlar publicação
  const status = watch('status')
  const isPublished = watch('published')

  return (
    <div className="grid gap-4 p-4 border rounded-lg">
      {/* Status do evento */}
      <FormField
        control={control}
        name="status"
        render={({ field }) => (
          <FormItem>
            <FormControl>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Status do evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DRAFT">Rascunho</SelectItem>
                  <SelectItem value="PUBLISHED">Publicado</SelectItem>
                  <SelectItem value="CANCELLED">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </FormControl>
            <FormDescription>
              {status === 'DRAFT' && 'O evento está em rascunho e não está visível para o público'}
              {status === 'PUBLISHED' && 'O evento está publicado e visível para o público'}
              {status === 'CANCELLED' && 'O evento foi cancelado e não aceita mais inscrições'}
            </FormDescription>
          </FormItem>
        )}
      />

      {/* Controle de publicação */}
      <FormField
        control={control}
        name="published"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between space-y-0">
            <div>
              <h4 className="text-sm font-medium">Publicar evento</h4>
              <p className="text-xs text-muted-foreground">
                {isPublished ? 'O evento está visível para o público' : 'O evento está oculto do público'}
              </p>
            </div>
            <FormControl>
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isDisabled || status === 'CANCELLED'}
              />
            </FormControl>
          </FormItem>
        )}
      />
    </div>
  )
}
