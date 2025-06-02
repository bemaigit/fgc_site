"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Toast } from "@/components/ui/toast"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Save } from "lucide-react"
import { useSession } from "next-auth/react"

// Schema para validação
const clubFeesSchema = z.object({
  newRegistrationFee: z.string()
    .min(1, "Valor obrigatório")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Valor deve ser maior que zero"
    }),
  annualRenewalFee: z.string()
    .min(1, "Valor obrigatório")
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Valor deve ser maior que zero"
    }),
})

export default function ClubFeesPage() {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [formValues, setFormValues] = useState<any>(null)
  const { toast } = useToast()

  // Formulário
  const form = useForm<z.infer<typeof clubFeesSchema>>({
    resolver: zodResolver(clubFeesSchema),
    defaultValues: {
      newRegistrationFee: "",
      annualRenewalFee: "",
    },
  })

  // Efeito para carregar as taxas atuais
  useEffect(() => {
    const fetchFees = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/filiacao/clube/taxas')
        
        if (response.ok) {
          const data = await response.json()
          
          // Preencher formulário com valores atuais formatados para duas casas decimais
          form.setValue('newRegistrationFee', parseFloat(String(data.newRegistrationFee)).toFixed(2))
          form.setValue('annualRenewalFee', parseFloat(String(data.annualRenewalFee)).toFixed(2))
        } else {
          toast({
            title: "Erro",
            description: "Não foi possível carregar as taxas atuais",
            variant: "destructive",
          })
        }
      } catch (error) {
        console.error('Erro ao carregar taxas:', error)
        toast({
          title: "Erro",
          description: "Ocorreu um erro ao carregar as taxas",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchFees()
  }, [form, toast])

  // Função para salvar as taxas
  const onSubmit = (values: z.infer<typeof clubFeesSchema>) => {
    setFormValues(values)
    setConfirmOpen(true)
  }

  // Função para confirmar e salvar
  const handleConfirm = async () => {
    if (!formValues) return
    
    try {
      setSaving(true)
      
      const response = await fetch('/api/filiacao/clube/taxas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          newRegistrationFee: parseFloat(formValues.newRegistrationFee),
          annualRenewalFee: parseFloat(formValues.annualRenewalFee),
        }),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Taxas de filiação de clubes atualizadas com sucesso",
        })
      } else {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar taxas')
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error)
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao salvar as taxas",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Taxas de Filiação de Clubes</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configuração de Valores</CardTitle>
          <CardDescription>
            Defina os valores das taxas para nova filiação e renovação de anuidade de clubes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="newRegistrationFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor para Nova Filiação (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">R$</span>
                          <Input 
                            type="text" 
                            placeholder="0.00" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="annualRenewalFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor para Renovação de Anuidade (R$)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">R$</span>
                          <Input 
                            type="text" 
                            placeholder="0.00" 
                            className="pl-10" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end">
                  <Button 
                    type="submit" 
                    disabled={saving || loading}
                    className="w-full sm:w-auto"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      {/* Diálogo de confirmação */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Alterações</AlertDialogTitle>
            <AlertDialogDescription>
              Você está prestes a atualizar as taxas de filiação de clubes.
              <br /><br />
              <strong>Nova Filiação:</strong> R$ {formValues?.newRegistrationFee || '0.00'}
              <br />
              <strong>Renovação de Anuidade:</strong> R$ {formValues?.annualRenewalFee || '0.00'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Confirmando...
                </>
              ) : (
                'Confirmar'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
