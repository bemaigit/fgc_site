"use client"

import { useCallback, useMemo, useState } from "react"
import type { ReactElement } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  PaymentProvider,
  PaymentMethod,
  EntityType,
  validateCredentials,
} from "@/lib/payment/types"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import type { GatewayFormData, GatewayFormProps } from "./types"
import { CredentialsFields } from "./CredentialsFields"

const formSchema = z.object({
  name: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  provider: z.nativeEnum(PaymentProvider),
  active: z.boolean(),
  priority: z.number().min(0),
  allowedMethods: z.array(z.nativeEnum(PaymentMethod)).min(1, "Selecione pelo menos um método"),
  entityTypes: z.array(z.nativeEnum(EntityType)).min(1, "Selecione pelo menos um tipo"),
  checkoutType: z.enum(['REDIRECT', 'TRANSPARENT']).default('REDIRECT'),
  sandbox: z.boolean().default(false),
  webhook: z.object({
    secretKey: z.string().optional(),
    retryAttempts: z.number().min(1).max(10).default(3),
    retryInterval: z.number().min(1000).max(60000).default(5000)
  }).optional(),
  urls: z.object({
    success: z.string().url("URL de sucesso inválida").optional(),
    failure: z.string().url("URL de falha inválida").optional(),
    notification: z.string().url("URL de notificação inválida").optional()
  }).optional(),
  credentials: z.object({
    access_token: z.string().optional(),
    accessToken: z.string().optional(),
    public_key: z.string().optional(),
    publicKey: z.string().optional(),
    sandbox_access_token: z.string().optional(),
    sandbox_public_key: z.string().optional()
  }).refine(
    (creds) => {
      return Object.values(creds).some(value => value && value.trim() !== '')
    }, 
    { message: "Pelo menos uma credencial é necessária" }
  )
})

const initialValues: GatewayFormData = {
  name: "",
  provider: PaymentProvider.MERCADO_PAGO,
  active: true,
  priority: 0,
  allowedMethods: [PaymentMethod.PIX],
  entityTypes: [EntityType.ATHLETE],
  checkoutType: 'REDIRECT',
  sandbox: true,
  webhook: {
    retryAttempts: 3,
    retryInterval: 5000
  },
  urls: {
    success: "",
    failure: "",
    notification: ""
  },
  credentials: {}
}

export function GatewayForm({ onSubmit, onCancel, initialData }: GatewayFormProps): ReactElement {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo((): GatewayFormData => {
    if (!initialData) return initialValues

    return {
      name: initialData.name,
      provider: initialData.provider,
      active: initialData.active,
      priority: initialData.priority,
      allowedMethods: initialData.allowedMethods,
      entityTypes: initialData.entityTypes,
      checkoutType: initialData.checkoutType,
      sandbox: initialData.sandbox,
      webhook: initialData.webhook,
      urls: initialData.urls,
      credentials: initialData.credentials
    }
  }, [initialData])

  const form = useForm<GatewayFormData>({
    resolver: zodResolver(formSchema),
    defaultValues,
    mode: "all"
  })

  const selectedProvider = form.watch("provider")

  const handleSubmit = useCallback(async (data: GatewayFormData) => {
    try {
      console.log("[GatewayForm] Iniciando submissão de formulário:", data);
      
      setIsSubmitting(true);
      
      // Validar dados antes de enviar
      console.log("[GatewayForm] Validando dados do formulário");
      try {
        const validationResult = formSchema.safeParse(data)
        if (!validationResult.success) {
          console.error("[GatewayForm] Erro de validação:", validationResult.error);
          throw validationResult.error;
        }
        console.log("[GatewayForm] Validação do formulário bem-sucedida");
      } catch (validationError) {
        console.error("[GatewayForm] Erro de validação:", validationError);
        throw validationError;
      }

      console.log("[GatewayForm] Enviando formulário para o backend");
      // Validação completa antes do envio
      const validationResult = formSchema.safeParse(data)
      if (!validationResult.success) {
        console.error("Erros de validação COMPLETOS:", JSON.stringify(validationResult.error, null, 2))
        
        // Log detalhado de cada erro
        validationResult.error.errors.forEach((err, index) => {
          console.error(`Erro ${index + 1}:`, {
            path: err.path,
            message: err.message,
            code: err.code,
            type: err.type,
            input: err.input
          })
        })
        
        // Mapear erros para toast
        const errorMessages = validationResult.error.errors.map(
          err => `${err.path.join('.')}: ${err.message}`
        ).join('; ')

        toast({
          title: "Erro de Validação",
          description: errorMessages,
          variant: "destructive",
          duration: 10000
        })
        
        // Adicionar log de estado completo do formulário
        console.log("Estado completo do formulário:", {
          values: form.getValues(),
          errors: form.formState.errors,
          isDirty: form.formState.isDirty,
          isValid: form.formState.isValid
        })
        
        return
      }

      // Mapear credenciais para formato consistente
      const credentials = {
        access_token: data.credentials.access_token || data.credentials.accessToken,
        public_key: data.credentials.public_key || data.credentials.publicKey
      }

      // Formatar dados conforme estrutura do banco
      const formattedData = {
        ...data,
        credentials,
        webhook: data.webhook ? {
          retryAttempts: Number(data.webhook.retryAttempts) || 3,
          retryInterval: Number(data.webhook.retryInterval) || 5000
        } : null,
        urls: data.urls ? {
          success: data.urls.success || "https://ad4e-189-123-162-163.ngrok-free.app/pagamento/sucesso",
          failure: data.urls.failure || "https://ad4e-189-123-162-163.ngrok-free.app/pagamento/erro",
          notification: data.urls.notification || "https://ad4e-189-123-162-163.ngrok-free.app/api/webhooks/payment"
        } : null
      }

      console.log("Dados formatados:", formattedData)

      console.log("[GatewayForm] Enviando dados para API...");
      const result = await onSubmit(formattedData)
      
      console.log("[GatewayForm] Formulário enviado com sucesso");
      console.log("Gateway salvo com sucesso:", result)
      toast({
        title: "Sucesso",
        description: "Gateway salvo com sucesso",
      })
    } catch (error) {
      console.error("[GatewayForm] Erro na submissão do formulário:", error);
      
      setIsSubmitting(false);
      
      if (error instanceof z.ZodError) {
        toast({
          title: "Erro de Validação",
          description: "Dados inválidos. Verifique todos os campos obrigatórios.",
          variant: "destructive",
          duration: 10000
        })
      } else if (error instanceof Error) {
        toast({
          title: "Erro",
          description: error.message,
          variant: "destructive",
          duration: 10000
        })
      } else {
        toast({
          title: "Erro",
          description: "Erro desconhecido ao adicionar gateway",
          variant: "destructive",
          duration: 10000
        })
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, onSubmit, toast, form])

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="gateway-name">Nome do Gateway</FormLabel>
                <FormControl>
                  <Input 
                    id="gateway-name"
                    {...field} 
                    value={field.value || ""} 
                    aria-describedby="gateway-name-help"
                  />
                </FormControl>
                <FormMessage id="gateway-name-help" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="gateway-provider">Provider</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="gateway-provider" aria-describedby="gateway-provider-help">
                      <SelectValue placeholder="Selecione um provider" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PaymentProvider).map((provider) => (
                      <SelectItem key={provider} value={provider}>
                        {provider}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage id="gateway-provider-help" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel htmlFor="gateway-active">Ativo</FormLabel>
                  <FormDescription>
                    Define se o gateway de pagamento está ativo
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    id="gateway-active"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-describedby="gateway-active-help"
                  />
                </FormControl>
                <FormMessage id="gateway-active-help" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="gateway-priority">Prioridade</FormLabel>
                <FormControl>
                  <Input 
                    id="gateway-priority"
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    aria-describedby="gateway-priority-help"
                  />
                </FormControl>
                <FormMessage id="gateway-priority-help" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="allowedMethods"
            render={() => (
              <FormItem>
                <FormLabel>Métodos de Pagamento</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {Object.values(PaymentMethod).map((method) => (
                    <FormField
                      key={method}
                      control={form.control}
                      name="allowedMethods"
                      render={({ field }) => (
                        <FormItem 
                          key={method}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              id={`gateway-method-${method}`}
                              checked={field.value?.includes(method)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, method])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== method
                                      )
                                    )
                              }}
                              aria-describedby={`gateway-method-${method}-help`}
                            />
                          </FormControl>
                          <FormLabel 
                            htmlFor={`gateway-method-${method}`}
                            className="text-sm font-normal"
                          >
                            {method}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="entityTypes"
            render={() => (
              <FormItem>
                <FormLabel>Tipos de Entidade</FormLabel>
                <div className="flex flex-wrap gap-2">
                  {Object.values(EntityType).map((type) => (
                    <FormField
                      key={type}
                      control={form.control}
                      name="entityTypes"
                      render={({ field }) => (
                        <FormItem 
                          key={type}
                          className="flex flex-row items-center space-x-2 space-y-0"
                        >
                          <FormControl>
                            <Checkbox
                              id={`gateway-entity-${type}`}
                              checked={field.value?.includes(type)}
                              onCheckedChange={(checked) => {
                                return checked
                                  ? field.onChange([...field.value, type])
                                  : field.onChange(
                                      field.value?.filter(
                                        (value) => value !== type
                                      )
                                    )
                              }}
                              aria-describedby={`gateway-entity-${type}-help`}
                            />
                          </FormControl>
                          <FormLabel 
                            htmlFor={`gateway-entity-${type}`}
                            className="text-sm font-normal"
                          >
                            {type}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="checkoutType"
            render={({ field }) => (
              <FormItem>
                <FormLabel htmlFor="gateway-checkout-type">Tipo de Checkout</FormLabel>
                <Select 
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger id="gateway-checkout-type" aria-describedby="gateway-checkout-type-help">
                      <SelectValue placeholder="Selecione um tipo de checkout" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {['REDIRECT', 'TRANSPARENT'].map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage id="gateway-checkout-type-help" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="sandbox"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel htmlFor="gateway-sandbox">Modo Sandbox</FormLabel>
                  <FormDescription>
                    Define se o gateway de pagamento está em modo sandbox
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    id="gateway-sandbox"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    aria-describedby="gateway-sandbox-help"
                  />
                </FormControl>
                <FormMessage id="gateway-sandbox-help" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="webhook"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Webhook</FormLabel>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="webhook.secretKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="gateway-webhook-secret-key">Chave Secreta</FormLabel>
                        <FormControl>
                          <Input 
                            id="gateway-webhook-secret-key"
                            {...field} 
                            value={field.value || ""} 
                            aria-describedby="gateway-webhook-secret-key-help"
                          />
                        </FormControl>
                        <FormMessage id="gateway-webhook-secret-key-help" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="webhook.retryAttempts"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="gateway-webhook-retry-attempts">Tentativas de Retentativa</FormLabel>
                        <FormControl>
                          <Input 
                            id="gateway-webhook-retry-attempts"
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            aria-describedby="gateway-webhook-retry-attempts-help"
                          />
                        </FormControl>
                        <FormMessage id="gateway-webhook-retry-attempts-help" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="webhook.retryInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="gateway-webhook-retry-interval">Intervalo de Retentativa</FormLabel>
                        <FormControl>
                          <Input 
                            id="gateway-webhook-retry-interval"
                            type="number" 
                            {...field} 
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            aria-describedby="gateway-webhook-retry-interval-help"
                          />
                        </FormControl>
                        <FormMessage id="gateway-webhook-retry-interval-help" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="urls"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URLs</FormLabel>
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="urls.success"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="gateway-urls-success">URL de Sucesso</FormLabel>
                        <FormControl>
                          <Input 
                            id="gateway-urls-success"
                            {...field} 
                            value={field.value || ""} 
                            aria-describedby="gateway-urls-success-help"
                          />
                        </FormControl>
                        <FormMessage id="gateway-urls-success-help" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="urls.failure"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="gateway-urls-failure">URL de Falha</FormLabel>
                        <FormControl>
                          <Input 
                            id="gateway-urls-failure"
                            {...field} 
                            value={field.value || ""} 
                            aria-describedby="gateway-urls-failure-help"
                          />
                        </FormControl>
                        <FormMessage id="gateway-urls-failure-help" />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="urls.notification"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel htmlFor="gateway-urls-notification">URL de Notificação</FormLabel>
                        <FormControl>
                          <Input 
                            id="gateway-urls-notification"
                            {...field} 
                            value={field.value || ""} 
                            aria-describedby="gateway-urls-notification-help"
                          />
                        </FormControl>
                        <FormMessage id="gateway-urls-notification-help" />
                      </FormItem>
                    )}
                  />
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedProvider && (
            <div className="space-y-4">
              <h3 className="font-medium">Credenciais</h3>
              <CredentialsFields 
                provider={selectedProvider} 
                control={form.control}
              />
            </div>
          )}

          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={onCancel}
              >
                Cancelar
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Salvando..." : "Salvar Gateway"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}