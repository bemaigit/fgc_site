'use client'

import React from 'react'
import { useFormContext } from 'react-hook-form'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { DateField } from './DateField'
import { EventStatusControl } from './EventStatusControl'
import { useEventSlugValidation } from '@/hooks/events/useEventSlugValidation'
import type { BasicInfoFormValues } from './EventBasicInfoEditor'

interface EventBasicInfoFieldsProps {
  eventId?: string
  isDisabled?: boolean
}

export function EventBasicInfoFields({ eventId, isDisabled }: EventBasicInfoFieldsProps) {
  const { control } = useFormContext<BasicInfoFormValues>()

  // Não estamos usando a validação de slug no momento para evitar problemas
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { validateSlug: _validateSlug } = useEventSlugValidation({
    eventId,
    onValidationChange: () => {
      // Removida validação estrita
    }
  })

  return (
    <div className="grid gap-6">
      <EventStatusControl isDisabled={isDisabled} />

      {/* Título */}
      <FormField
        control={control}
        name="title"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Título</FormLabel>
            <FormControl>
              <Input 
                placeholder="Digite o título do evento" 
                {...field} 
                disabled={isDisabled}
              />
            </FormControl>
            <FormDescription>
              O título deve ser claro e representar bem o evento
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* URL Personalizada (Slug) */}
      <FormField
        control={control}
        name="slug"
        render={({ field }) => (
          <FormItem>
            <FormLabel>URL Personalizada</FormLabel>
            <div className="flex">
              <div className="flex h-9 items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-sm text-muted-foreground">
                /eventos/
              </div>
              <FormControl>
                <Input
                  placeholder="url-do-evento"
                  {...field}
                  disabled={isDisabled}
                  className="rounded-l-none"
                />
              </FormControl>
            </div>
            <FormDescription>
              URL amigável para o evento. Se não preenchida, será gerada automaticamente a partir do título
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Descrição */}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Descrição</FormLabel>
            <FormControl>
              <Textarea 
                placeholder="Descreva o evento em detalhes" 
                {...field}
                disabled={isDisabled}
              />
            </FormControl>
            <FormDescription>
              Descreva o evento em detalhes, incluindo informações importantes para os participantes
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Datas */}
      <div className="grid gap-4 sm:grid-cols-3">
        <DateField
          control={control}
          name="startDate"
          label="Data de Início"
          placeholder="Selecione a data"
          disabled={isDisabled}
        />
        <DateField
          control={control}
          name="endDate"
          label="Data de Término"
          placeholder="Selecione a data"
          disabled={isDisabled}
        />
        <DateField
          control={control}
          name="registrationEnd"
          label="Fim das Inscrições"
          placeholder="Selecione a data"
          disabled={isDisabled}
        />
      </div>

      {/* Evento Gratuito */}
      <FormField
        control={control}
        name="isFree"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="space-y-0.5">
              <FormLabel>Evento Gratuito</FormLabel>
              <FormDescription>
                Marque esta opção se o evento não terá custo de inscrição
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
    </div>
  )
}
