'use client'

import * as React from "react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { RegistrationFormData, registrationFormSchema } from "@/lib/validations/registration"
import { Form } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { MaskedInput } from "@/components/ui/input-mask"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useSearchParams, useParams } from "next/navigation"
import { EventDetails } from "@/types/event-details"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PageProps {
  params: { id: string }
}

export default function RegistrationPage({ params }: PageProps) {
  // Usar useParams do Next.js para acessar os parâmetros da rota
  const routeParams = useParams();
  const eventId = routeParams.id as string;
  
  const searchParams = useSearchParams()
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Pegar parâmetros da URL
  const selectedModality = searchParams.get('modality')
  const selectedCategory = searchParams.get('category')
  const selectedGender = searchParams.get('gender')
  const selectedTierId = searchParams.get('tierId')
  // Ler o código do cupom da URL
  const couponCode = searchParams.get('couponCode')

  const { toast } = useToast()
  const form = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationFormSchema),
    defaultValues: {
      eventId: eventId,
      modalityId: selectedModality || '',
      categoryId: selectedCategory || '',
      genderId: selectedGender || '',
      tierId: selectedTierId || ''
    }
  })

  useEffect(() => {
    async function fetchEvent() {
      try {
        const response = await fetch(`/api/events/${eventId}`)
        if (!response.ok) {
          throw new Error('Evento não encontrado')
        }
        const data = await response.json()
        setEvent(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar evento')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [eventId])

  const handleCepChange = async (cep: string) => {
    try {
      // Remove caracteres não numéricos e verifica se o CEP tem 8 dígitos
      const cleanCep = cep.replace(/\D/g, '');
      
      if (cleanCep.length !== 8) {
        return; // Não faz nada se o CEP não tiver 8 dígitos
      }

      // Busca os dados do endereço pelo CEP
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "Verifique o CEP informado e tente novamente.",
          variant: "destructive"
        });
        return;
      }

      // Preenche os campos do formulário com os dados retornados
      form.setValue('address.street', data.logradouro);
      form.setValue('address.neighborhood', data.bairro);
      form.setValue('address.city', data.localidade);
      form.setValue('address.state', data.uf);

      // Foca no campo número após preencher os dados
      document.getElementById('number')?.focus();

    } catch (error) {
      console.error('Erro ao buscar endereço:', error);
      toast({
        title: "Erro ao buscar endereço",
        description: "Ocorreu um erro ao buscar o endereço. Tente novamente mais tarde.",
        variant: "destructive"
      });
    }
  };

  async function onSubmit(data: RegistrationFormData) {
    try {
      // Limpar qualquer erro anterior
      setError(null);
      
      // Mostrar indicador de carregamento
      setIsLoading(true);
      
      // Verificar se o evento é gratuito
      const isFree = event?.isFree || false;
      const selectedTier = event?.pricingTiers?.find(tier => tier.id === data.tierId);
      const isPriceFree = selectedTier ? parseFloat(selectedTier.price.toString()) === 0 : false;
      const isEventFree = isFree || isPriceFree || data.tierId === 'free';
      
      // Escolher a API correta com base no tipo do evento
      const apiEndpoint = isEventFree 
        ? `/api/events/${eventId}/register/free` 
        : `/api/events/${eventId}/register/temp`;
      
      // Adiciona o couponCode aos dados se ele existir e o evento for pago
      const payload = { 
        ...data, 
        ...(couponCode && !isEventFree && { couponCode }) 
      };
      
      console.log('Enviando dados para API:', JSON.stringify(payload));
      
      // Enviar os dados para a API adequada
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload) // Envia o payload com o cupom, se aplicável
      });

      // Obter resposta da API
      const responseData = await response.json();
      console.log('Resposta da API:', JSON.stringify(responseData));
      
      if (!response.ok) {
        // Verificar se é o caso de inscrição pendente (código 409 Conflict)
        if (response.status === 409 && responseData.continuationUrl) {
          // Mostrar alerta com opção de continuar
          setError(null); // Limpar erro anterior se houver
          
          // Criar um modal ou alerta informativo
          const continueRegistration = window.confirm(
            `${responseData.message}\n\nDeseja continuar com sua inscrição anterior?\n\n` +
            `Se você escolher "Cancelar", volte à página do evento e selecione outra categoria ou modalidade.`
          );
          
          if (continueRegistration) {
            // Redirecionar para continuar a inscrição
            console.log('Redirecionando para continuação:', responseData.continuationUrl);
            window.location.href = responseData.continuationUrl;
            return;
          } else {
            // Voltar à página do evento
            console.log('Voltando para a página do evento');
            window.location.href = `/eventos/${eventId}`;
            return;
          }
        }
        
        throw new Error(responseData.message || 'Erro ao processar inscrição');
      }
      
      // Redirecionar baseado no tipo de evento (gratuito ou pago)
      if (responseData.isFree) {
        // Para eventos gratuitos, redirecionar para página de sucesso com o protocolo
        console.log('Evento gratuito, redirecionando para sucesso');
        window.location.href = `/eventos/${eventId}/inscricao/sucesso?protocol=${responseData.protocol}`;
      } else {
        // Para eventos pagos, redirecionar para o checkout
        console.log('Evento pago, redirecionando para checkout:', `/eventos/${eventId}/checkout?registration=${responseData.registrationId}`);
        // Usar setTimeout para garantir que o redirecionamento ocorra
        setTimeout(() => {
          window.location.href = `/eventos/${eventId}/checkout?registration=${responseData.registrationId}`;
        }, 100);
      }
    } catch (err) {
      console.error('Erro ao processar inscrição:', err);
      setError(err instanceof Error ? err.message : 'Erro ao processar inscrição');
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert variant="destructive">
          <AlertDescription>
            {error || 'Evento não encontrado'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Inscrição para {event.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Dados pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name">Nome Completo</label>
                      <Input
                        id="name"
                        {...form.register('name')}
                        error={form.formState.errors.name?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="cpf">CPF</label>
                      <MaskedInput
                        id="cpf"
                        mask="cpf"
                        {...form.register('cpf')}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="birthDate">Data de Nascimento</label>
                      <Input
                        id="birthDate"
                        type="date"
                        {...form.register('birthDate')}
                        error={form.formState.errors.birthDate?.message}
                      />
                    </div>
                  </div>
                </div>

                {/* Contato */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Contato</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="email">Email</label>
                      <Input
                        id="email"
                        type="email"
                        {...form.register('email')}
                        error={form.formState.errors.email?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="phone">Telefone</label>
                      <MaskedInput
                        id="phone"
                        mask="phone"
                        {...form.register('phone')}
                      />
                    </div>
                  </div>
                </div>

                {/* Endereço */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Endereço</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="cep">CEP</label>
                      <MaskedInput
                        id="cep"
                        mask="cep"
                        {...form.register('address.cep', {
                          onChange: (e) => handleCepChange(e.target.value)
                        })}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="street">Rua</label>
                      <Input
                        id="street"
                        {...form.register('address.street')}
                        error={form.formState.errors.address?.street?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="number">Número</label>
                      <Input
                        id="number"
                        {...form.register('address.number')}
                        error={form.formState.errors.address?.number?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="complement">Complemento</label>
                      <Input
                        id="complement"
                        {...form.register('address.complement')}
                        error={form.formState.errors.address?.complement?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="neighborhood">Bairro</label>
                      <Input
                        id="neighborhood"
                        {...form.register('address.neighborhood')}
                        error={form.formState.errors.address?.neighborhood?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="city">Cidade</label>
                      <Input
                        id="city"
                        {...form.register('address.city')}
                        error={form.formState.errors.address?.city?.message}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="state">Estado</label>
                      <Input
                        id="state"
                        {...form.register('address.state')}
                        error={form.formState.errors.address?.state?.message}
                      />
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Continuar para Pagamento
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
