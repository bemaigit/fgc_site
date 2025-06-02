"use client"

import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const configSchema = z.object({
  whatsappEnabled: z.boolean(),
  emailEnabled: z.boolean(),
  webhookEnabled: z.boolean(),
  whatsappToken: z.string().min(1, "Token obrigatório").optional(),
  whatsappPhoneId: z.string().min(1, "ID do telefone obrigatório").optional(),
  webhookUrl: z.string().url("URL inválida").optional(),
  maxRetries: z.number().min(1).max(10),
})

type ConfigFormValues = z.infer<typeof configSchema>

export default function ConfiguracaoGeral() {
  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      whatsappEnabled: false,
      emailEnabled: true,
      webhookEnabled: false,
      maxRetries: 3,
    },
  })

  async function onSubmit(data: ConfigFormValues) {
    try {
      // TODO: Implementar chamada à API para salvar configurações
      console.log(data)
    } catch (error) {
      console.error("Erro ao salvar configurações:", error)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6">
          {/* Canais de Notificação */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Canais de Notificação</h3>
            
            <FormField
              control={form.control}
              name="emailEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Email</FormLabel>
                    <FormDescription>
                      Ativar notificações por email
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="whatsappEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>WhatsApp</FormLabel>
                    <FormDescription>
                      Ativar notificações por WhatsApp
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("whatsappEnabled") && (
              <>
                <FormField
                  control={form.control}
                  name="whatsappToken"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token do WhatsApp</FormLabel>
                      <FormControl>
                        <Input type="password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="whatsappPhoneId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID do Telefone WhatsApp</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            <FormField
              control={form.control}
              name="webhookEnabled"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <FormLabel>Webhook</FormLabel>
                    <FormDescription>
                      Ativar notificações via webhook
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {form.watch("webhookEnabled") && (
              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Webhook</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>

          {/* Configurações Gerais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Configurações Gerais</h3>
            
            <FormField
              control={form.control}
              name="maxRetries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Máximo de Tentativas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={10}
                      {...field}
                      onChange={e => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Número máximo de tentativas de reenvio em caso de falha
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button type="submit">Salvar Configurações</Button>
      </form>
    </Form>
  )
}
