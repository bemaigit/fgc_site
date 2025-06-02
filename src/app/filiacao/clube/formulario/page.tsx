"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MaskedInput } from "@/components/ui/input-mask"
import { fetchAddressByCep } from "@/lib/cep"
import { AlertCircle, Loader2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Schema para novo cadastro
const newClubSchema = z.object({
  responsibleName: z.string().min(1, "Nome do responsável é obrigatório"),
  clubName: z.string().min(1, "Nome do clube é obrigatório"),
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("E-mail inválido").min(1, "E-mail é obrigatório"),
})

// Schema para renovação
const renewalSchema = z.object({
  cnpj: z.string().min(14, "CNPJ é obrigatório"),
  clubName: z.string().min(1, "Nome do clube é obrigatório")
})

export default function ClubFiliationForm() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Estados
  const [isNewRegistration, setIsNewRegistration] = useState(true)
  const [fees, setFees] = useState({ newRegistrationFee: 0, annualRenewalFee: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [clubExists, setClubExists] = useState(false)
  const [existingClub, setExistingClub] = useState<any>(null)
  const [cnpjChecking, setCnpjChecking] = useState(false)
  const [zipCodeChecking, setZipCodeChecking] = useState(false)

  // Formulários
  const newClubForm = useForm<z.infer<typeof newClubSchema>>({
    resolver: zodResolver(newClubSchema),
    defaultValues: {
      responsibleName: "",
      clubName: "",
      cnpj: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      phone: "",
      email: ""
    },
  })

  const renewalForm = useForm<z.infer<typeof renewalSchema>>({
    resolver: zodResolver(renewalSchema),
    defaultValues: {
      cnpj: "",
      clubName: ""
    },
  })

  // Efeitos
  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, router])

  useEffect(() => {
    const fetchFees = async () => {
      try {
        const response = await fetch('/api/filiacao/clube/taxas')
        if (response.ok) {
          const data = await response.json()
          setFees(data)
        }
      } catch (error) {
        console.error('Erro ao buscar taxas:', error)
      }
    }

    fetchFees()
  }, [])

  // Função para verificar CNPJ
  const checkCnpj = async (cnpj: string) => {
    if (cnpj.replace(/\D/g, '').length < 14) return

    try {
      setCnpjChecking(true)
      const response = await fetch(`/api/filiacao/clube/verificar?cnpj=${cnpj}`)
      const data = await response.json()

      if (data.exists) {
        setClubExists(true)
        setExistingClub(data.club)
        
        if (isNewRegistration) {
          setError(`Este CNPJ já está cadastrado para o clube "${data.club.name}". Por favor, use a opção "Renovação de Anuidade".`)
        } else {
          renewalForm.setValue('clubName', data.club.name)
          setError(undefined)
        }
      } else {
        setClubExists(false)
        setExistingClub(null)
        
        if (!isNewRegistration) {
          setError('Este CNPJ não está cadastrado. Por favor, use a opção "Nova Filiação".')
        } else {
          setError(undefined)
        }
      }
    } catch (error) {
      console.error('Erro ao verificar CNPJ:', error)
    } finally {
      setCnpjChecking(false)
    }
  }

  // Função para buscar endereço pelo CEP
  const handleZipCodeChange = async (zipCode: string) => {
    if (zipCode.replace(/\D/g, '').length < 8) return
    
    try {
      setZipCodeChecking(true)
      const address = await fetchAddressByCep(zipCode)
      
      if (address) {
        newClubForm.setValue('address', address.logradouro)
        newClubForm.setValue('city', address.localidade)
        newClubForm.setValue('state', address.uf)
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
    } finally {
      setZipCodeChecking(false)
    }
  }

  // Função para alternar entre nova filiação e renovação
  const handleTabChange = (value: string) => {
    setIsNewRegistration(value === 'new')
    setError(undefined)
  }

  // Função para processar nova filiação
  const onSubmitNewRegistration = async (values: z.infer<typeof newClubSchema>) => {
    if (clubExists) {
      setError('Este CNPJ já está cadastrado. Por favor, use a opção "Renovação de Anuidade".')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/filiacao/clube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          isNewRegistration: true
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      // Redirecionar para página de pagamento
      router.push(`/filiacao/pagamento/${data.paymentId}`)
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error)
      setError(error.message || 'Ocorreu um erro ao processar sua solicitação')
    } finally {
      setLoading(false)
    }
  }

  // Função para processar renovação
  const onSubmitRenewal = async (values: z.infer<typeof renewalSchema>) => {
    if (!clubExists) {
      setError('Este CNPJ não está cadastrado. Por favor, use a opção "Nova Filiação".')
      return
    }

    try {
      setLoading(true)
      
      const response = await fetch('/api/filiacao/clube', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...values,
          isNewRegistration: false
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao processar solicitação')
      }

      // Redirecionar para página de pagamento
      router.push(`/filiacao/pagamento/${data.paymentId}`)
    } catch (error: any) {
      console.error('Erro ao enviar formulário:', error)
      setError(error.message || 'Ocorreu um erro ao processar sua solicitação')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4 md:py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Filiação de Clube</h1>
      
      <div className="max-w-4xl mx-auto">
        <Tabs 
          defaultValue="new" 
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="new">Nova Filiação</TabsTrigger>
            <TabsTrigger value="renewal">Renovação de Anuidade</TabsTrigger>
          </TabsList>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Formulário para nova filiação */}
          <TabsContent value="new">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Nova Filiação de Clube</span>
                  <span className="text-lg font-normal text-green-600">
                    Valor: R$ {parseFloat(String(fees.newRegistrationFee)).toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...newClubForm}>
                  <form 
                    onSubmit={newClubForm.handleSubmit(onSubmitNewRegistration)} 
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Dados do Clube</h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={newClubForm.control}
                          name="responsibleName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Responsável</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={newClubForm.control}
                          name="clubName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome do Clube</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={newClubForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                  onChange={(e) => {
                                    // Formatação manual do CNPJ
                                    const value = e.target.value
                                      .replace(/\D/g, '')
                                      .replace(/(\d{2})(\d)/, '$1.$2')
                                      .replace(/(\d{3})(\d)/, '$1.$2')
                                      .replace(/(\d{3})(\d)/, '$1/$2')
                                      .replace(/(\d{4})(\d)/, '$1-$2')
                                      .replace(/(-\d{2})\d+?$/, '$1')
                                    
                                    // Atualizar campo com valor formatado
                                    field.onChange({ ...e, target: { ...e.target, value } })
                                    checkCnpj(value)
                                  }}
                                />
                                {cnpjChecking && (
                                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                                )}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Endereço</h3>
                        
                        <FormField
                          control={newClubForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>CEP</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <MaskedInput 
                                    mask="cep"
                                    placeholder="00000-000"
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e)
                                      handleZipCodeChange(e.target.value)
                                    }}
                                  />
                                  {zipCodeChecking && (
                                    <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={newClubForm.control}
                          name="address"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Endereço</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={newClubForm.control}
                            name="city"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Cidade</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={newClubForm.control}
                            name="state"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estado</FormLabel>
                                <FormControl>
                                  <Input {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Contato</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={newClubForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Telefone</FormLabel>
                                <FormControl>
                                  <MaskedInput 
                                    mask="phone"
                                    placeholder="(00) 00000-0000"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={newClubForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>E-mail</FormLabel>
                                <FormControl>
                                  <Input 
                                    type="email" 
                                    placeholder="email@exemplo.com"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>

                    <CardFooter className="px-0 flex flex-col sm:flex-row gap-3 justify-between">
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={() => router.push('/')}
                      >
                        Voltar ao Início
                      </Button>
                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full sm:w-auto"
                        disabled={loading || clubExists}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Prosseguir para pagamento'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Formulário para renovação */}
          <TabsContent value="renewal">
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Renovação de Anuidade</span>
                  <span className="text-lg font-normal text-green-600">
                    Valor: R$ {parseFloat(String(fees.annualRenewalFee)).toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...renewalForm}>
                  <form 
                    onSubmit={renewalForm.handleSubmit(onSubmitRenewal)} 
                    className="space-y-6"
                  >
                    <div className="space-y-4">
                      <FormField
                        control={renewalForm.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CNPJ do Clube</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  placeholder="00.000.000/0000-00"
                                  {...field}
                                  onChange={(e) => {
                                    // Formatação manual do CNPJ
                                    const value = e.target.value
                                      .replace(/\D/g, '')
                                      .replace(/(\d{2})(\d)/, '$1.$2')
                                      .replace(/(\d{3})(\d)/, '$1.$2')
                                      .replace(/(\d{3})(\d)/, '$1/$2')
                                      .replace(/(\d{4})(\d)/, '$1-$2')
                                      .replace(/(-\d{2})\d+?$/, '$1')
                                    
                                    // Atualizar campo com valor formatado
                                    field.onChange({ ...e, target: { ...e.target, value } })
                                    checkCnpj(value)
                                  }}
                                />
                                {cnpjChecking && (
                                  <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-3" />
                                )}
                              </div>
                            </FormControl>
                            <FormDescription>
                              Digite o CNPJ do clube para verificar o cadastro
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={renewalForm.control}
                        name="clubName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Clube</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                readOnly={clubExists}
                                className={clubExists ? "bg-gray-100" : ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {clubExists && existingClub && (
                        <div className="border p-4 rounded-md bg-blue-50">
                          <h4 className="font-medium mb-2">Dados do Clube</h4>
                          <p>
                            <span className="font-medium">Responsável:</span> {existingClub.responsibleName}
                          </p>
                          <p>
                            <span className="font-medium">Status:</span> {existingClub.active ? 'Ativo' : 'Inativo'}
                          </p>
                          <p>
                            <span className="font-medium">Cadastrado em:</span> {new Date(existingClub.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      )}
                    </div>

                    <CardFooter className="px-0 flex flex-col sm:flex-row gap-3 justify-between">
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto"
                        onClick={() => router.push('/')}
                      >
                        Voltar ao Início
                      </Button>
                      <Button 
                        type="submit" 
                        size="lg"
                        className="w-full sm:w-auto"
                        disabled={loading || !clubExists}
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Prosseguir para pagamento'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
