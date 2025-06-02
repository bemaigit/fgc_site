import type { ReactElement } from "react"
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { PaymentProvider } from "@/lib/payment/types"
import { Control } from "react-hook-form"
import type { FormData } from "./types"

interface CredentialsFieldsProps {
  provider: PaymentProvider
  control: Control<FormData>
  isSandbox: boolean
}

export function CredentialsFields({ provider, control, isSandbox }: CredentialsFieldsProps): ReactElement | null {
  switch (provider) {
    case PaymentProvider.MERCADO_PAGO:
      return (
        <>
          {isSandbox ? (
            <>
              <FormField
                control={control}
                name={`credentials.sandbox_access_token`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token (Sandbox)</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Token de acesso para ambiente de testes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`credentials.sandbox_public_key`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key (Sandbox)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Chave pública para ambiente de testes
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          ) : (
            <>
              <FormField
                control={control}
                name={`credentials.access_token`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Access Token (Produção)</FormLabel>
                    <FormControl>
                      <Input {...field} type="password" value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Token de acesso para ambiente de produção
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name={`credentials.public_key`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Key (Produção)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} />
                    </FormControl>
                    <FormDescription>
                      Chave pública para ambiente de produção
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}
        </>
      )
    
    case PaymentProvider.PAGSEGURO:
      return (
        <>
          <FormField
            control={control}
            name={`credentials.email`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input {...field} type="email" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`credentials.token`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token</FormLabel>
                <FormControl>
                  <Input {...field} type="password" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`credentials.appId`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>App ID</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`credentials.appKey`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>App Key</FormLabel>
                <FormControl>
                  <Input {...field} type="password" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )

    case PaymentProvider.ASAAS:
      return (
        <FormField
          control={control}
          name={`credentials.accessToken`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Access Token</FormLabel>
              <FormControl>
                <Input {...field} type="password" value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case PaymentProvider.PAGHIPER:
      return (
        <>
          <FormField
            control={control}
            name={`credentials.apiKey`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>API Key</FormLabel>
                <FormControl>
                  <Input {...field} type="password" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`credentials.token`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Token</FormLabel>
                <FormControl>
                  <Input {...field} type="password" value={field.value || ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </>
      )

    default:
      return null
  }
}