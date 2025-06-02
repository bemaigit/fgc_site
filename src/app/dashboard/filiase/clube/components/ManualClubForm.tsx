"use client"

import { useState, useEffect } from "react"
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
import { MaskedInput } from "@/components/ui/input-mask"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Switch,
} from "@/components/ui/switch"
import { 
  RadioGroup, 
  RadioGroupItem 
} from "@/components/ui/radio-group"
import { 
  Card, 
  CardContent, 
  CardFooter 
} from "@/components/ui/card"
import { DialogFooter } from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"
import { useSession } from "next-auth/react"

// Schema de validação
const clubFormSchema = z.object({
  responsibleName: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  clubName: z.string().min(3, "Nome do clube deve ter pelo menos 3 caracteres"),
  cnpj: z.string()
    .min(14, "CNPJ deve ter 14 dígitos")
    .refine(cnpj => {
      // Remove caracteres não numéricos
      const cleaned = cnpj.replace(/\D/g, '')
      return cleaned.length === 14
    }, "CNPJ inválido"),
  zipCode: z.string()
    .min(8, "CEP deve ter 8 dígitos")
    .refine(cep => {
      // Remove caracteres não numéricos
      const cleaned = cep.replace(/\D/g, '')
      return cleaned.length === 8
    }, "CEP inválido"),
  address: z.string().min(5, "Endereço deve ter pelo menos 5 caracteres"),
  city: z.string().min(2, "Cidade deve ter pelo menos 2 caracteres"),
  state: z.string().min(2, "Estado deve ter pelo menos 2 caracteres"),
  phone: z.string()
    .min(10, "Telefone deve ter pelo menos 10 dígitos")
    .refine(phone => {
      // Remove caracteres não numéricos
      const cleaned = phone.replace(/\D/g, '')
      return cleaned.length >= 10 && cleaned.length <= 11
    }, "Telefone inválido"),
  email: z.string().email("Email inválido"),
  paymentStatus: z.enum(["PENDING", "CONFIRMED", "CANCELLED"]),
  active: z.boolean(),
})

type ClubFormValues = z.infer<typeof clubFormSchema>

interface ManualClubFormProps {
  onClose: () => void
  onSuccess: () => void
}

export default function ManualClubForm({ onClose, onSuccess }: ManualClubFormProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [cnpjExists, setCnpjExists] = useState(false)
  const [cnpjChecking, setCnpjChecking] = useState(false)

  // Inicializar formulário
  const form = useForm<ClubFormValues>({
    resolver: zodResolver(clubFormSchema),
    defaultValues: {
      responsibleName: "",
      clubName: "",
      cnpj: "",
      zipCode: "",
      address: "",
      city: "",
      state: "",
      phone: "",
      email: "",
      paymentStatus: "CONFIRMED", // Default para cadastro manual
      active: true, // Default para cadastro manual
    },
  })

  // Verificar CNPJ
  const handleCnpjBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cnpj = e.target.value.replace(/\D/g, '')
    
    if (cnpj.length !== 14) {
      return
    }

    try {
      setCnpjChecking(true)
      const response = await fetch(`/api/filiacao/clube/verificar?cnpj=${cnpj}`)
      const data = await response.json()
      
      if (response.ok && data.exists) {
        setCnpjExists(true)
        toast({
          title: "CNPJ já cadastrado",
          description: `Este CNPJ pertence ao clube "${data.clubName}"`,
          variant: "destructive",
        })
      } else {
        setCnpjExists(false)
      }
    } catch (error) {
      console.error("Erro ao verificar CNPJ:", error)
    } finally {
      setCnpjChecking(false)
    }
  }

  // Buscar endereço pelo CEP
  const handleZipCodeBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, '')
    
    if (cep.length !== 8) {
      return
    }

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        form.setValue('address', data.logradouro)
        form.setValue('city', data.localidade)
        form.setValue('state', data.uf)
      }
    } catch (error) {
      console.error("Erro ao buscar CEP:", error)
    }
  }

  // Formatar CNPJ
  const formatCnpj = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  // Formatar CEP
  const formatCep = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  // Formatar telefone
  const formatPhone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4,5})(\d{4})/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1')
  }

  // Enviar formulário
  const onSubmit = async (values: ClubFormValues) => {
    if (cnpjExists) {
      toast({
        title: "CNPJ já cadastrado",
        description: "Este CNPJ já está vinculado a um clube existente",
        variant: "destructive",
      })
      return
    }

    try {
      setLoading(true)

      // Formatar dados para envio
      const formData = {
        ...values,
        cnpj: values.cnpj.replace(/\D/g, ''),
        zipCode: values.zipCode.replace(/\D/g, ''),
        phone: values.phone.replace(/\D/g, ''),
        isManualRegistration: true,
        isNewRegistration: true // Adicionar flag para indicar que é um novo cadastro
      }

      const response = await fetch('/api/filiacao/clube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Clube cadastrado com sucesso",
        })
        onSuccess()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Erro ao cadastrar clube")
      }
    } catch (error: any) {
      console.error("Erro ao submeter formulário:", error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao cadastrar o clube",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Informações Básicas */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Informações Básicas</h3>
              
              <FormField
                control={form.control}
                name="responsibleName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Responsável</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome completo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clubName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Clube</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome oficial do clube" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cnpj"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-base">CNPJ</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="00.000.000/0000-00"
                          {...field}
                          value={formatCnpj(field.value)}
                          onChange={(e) => {
                            // Atualiza com o valor formatado
                            field.onChange(e.target.value);
                          }}
                          onBlur={handleCnpjBlur}
                          disabled={cnpjChecking}
                          className="w-full border-2"
                        />
                        {cnpjChecking && (
                          <Loader2 className="absolute right-3 top-2.5 h-5 w-5 animate-spin text-muted-foreground" />
                        )}
                      </div>
                    </FormControl>
                    {cnpjExists && (
                      <p className="text-sm font-medium text-destructive">
                        Este CNPJ já está cadastrado
                      </p>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="email@exemplo.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-base">Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(00) 00000-0000"
                        {...field}
                        value={formatPhone(field.value)}
                        onChange={(e) => {
                          // Atualiza com o valor formatado
                          field.onChange(e.target.value);
                        }}
                        className="w-full border-2"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Endereço e Status */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="text-lg font-medium">Endereço e Status</h3>
              
              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel className="text-base">CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        {...field}
                        value={formatCep(field.value)}
                        onChange={(e) => {
                          // Atualiza com o valor formatado
                          field.onChange(e.target.value);
                        }}                        
                        onBlur={handleZipCodeBlur}
                        className="w-full border-2"
                      />
                    </FormControl>
                    <FormDescription>
                      Digite o CEP para autocompletar o endereço
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input placeholder="Rua, número, complemento" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade</FormLabel>
                      <FormControl>
                        <Input placeholder="Cidade" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <FormControl>
                        <Input placeholder="UF" maxLength={2} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status de Pagamento</FormLabel>
                    <FormControl>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CONFIRMED">Confirmado</SelectItem>
                          <SelectItem value="PENDING">Pendente</SelectItem>
                          <SelectItem value="CANCELLED">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Ativo</FormLabel>
                      <FormDescription>
                        Determina se o clube estará ativo no sistema
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
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            type="submit"
            disabled={loading || cnpjExists}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Clube
              </>
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
