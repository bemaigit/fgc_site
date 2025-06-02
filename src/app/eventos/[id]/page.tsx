'use client'

import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState, useMemo } from "react"
import React from "react"
import { EventDetails } from "@/types/event-details"
import { EventHeader } from "@/components/events/details/EventHeader"
import { EventOptionsSelector } from "@/components/events/details/EventOptionsSelector"
import { MiniCheckout } from "@/components/events/details/MiniCheckout"
import { EventTopResults } from "@/components/events/details/EventTopResults"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { useSession, signIn } from "next-auth/react"

interface PageProps {
  params: Promise<{ id: string }>
}

export default function EventPage({ params }: PageProps) {
  const router = useRouter()
  const { id } = React.use(params)
  const [event, setEvent] = useState<EventDetails | null>(null)
  const [selectedModality, setSelectedModality] = useState<string>('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedGender, setSelectedGender] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [categoryPrices, setCategoryPrices] = useState<any[]>([])
  const [currentPrice, setCurrentPrice] = useState<number | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, discount: number } | null>(null);
  const [currentParticipants, setCurrentParticipants] = useState<number>(0);

  useEffect(() => {
    async function fetchEvent() {
      try {
        setIsLoading(true)
        console.log('Buscando evento com ID:', id)
        
        // Adicionando cabeçalhos para evitar cache
        const response = await fetch(`/api/events/${id}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
        
        if (!response.ok) {
          console.error('Erro na resposta da API:', response.status, response.statusText)
          throw new Error(`Evento não encontrado (${response.status})`)
        }
        
        const data = await response.json()
        console.log('Dados do evento recebidos:', data)

        // Verificar se os dados do evento estão presentes
        if (!data || !data.id) {
          throw new Error('Dados do evento inválidos')
        }

        // Verificar se as relações estão presentes
        console.log('Verificando relações do evento:')
        console.log('- EventToModality:', data.EventToModality?.length || 0)
        console.log('- EventToCategory:', data.EventToCategory?.length || 0)
        console.log('- EventToGender:', data.EventToGender?.length || 0)

        // Extrair modalidades, categorias e gêneros com verificação mais robusta
        const eventModalities = data.EventToModality?.filter((rel: any) => rel.EventModality).map((rel: any) => rel.EventModality) || [];
        const eventCategories = data.EventToCategory?.filter((rel: any) => rel.EventCategory).map((rel: any) => rel.EventCategory) || [];
        const eventGenders = data.EventToGender?.filter((rel: any) => rel.Gender).map((rel: any) => rel.Gender) || [];

        console.log('Modalidades extraídas:', eventModalities.length);
        console.log('Categorias extraídas:', eventCategories.length);
        console.log('Gêneros extraídos:', eventGenders.length);

        // Converte as strings de data para objetos Date e transforma as relações
        const eventWithDates: EventDetails = {
          ...data,
          startDate: new Date(data.startDate),
          endDate: data.endDate ? new Date(data.endDate) : null,
          registrationEnd: data.registrationEnd ? new Date(data.registrationEnd) : null,
          
          // Transformar os lotes de preço
          pricingTiers: data.EventPricingTier?.map((tier: any) => ({
            ...tier,
            startDate: new Date(tier.startDate),
            endDate: new Date(tier.endDate)
          })) || [],
          
          // Usar as listas filtradas para garantir que não há objetos nulos
          modalities: eventModalities,
          categories: eventCategories,
          genders: eventGenders,
        }

        console.log('Evento processado:', eventWithDates)
        console.log('Modalidades:', eventWithDates.modalities)
        console.log('Categorias:', eventWithDates.categories)
        console.log('Gêneros:', eventWithDates.genders)
        console.log('Lotes de preço:', eventWithDates.pricingTiers)
        
        setEvent(eventWithDates)

        // Busca os preços por categoria
        fetchCategoryPrices(id);
      } catch (err) {
        console.error('Erro ao carregar evento:', err)
        setError(err instanceof Error ? err.message : 'Erro ao carregar evento')
      } finally {
        setIsLoading(false)
      }
    }

    fetchEvent()
  }, [id])

  useEffect(() => {
    async function fetchTotalParticipants() {
      const res = await fetch(`/api/events/${id}/participants`);
      if (res.ok) {
        const data = await res.json();
        setCurrentParticipants(data.totalCount || 0);
      }
    }
    fetchTotalParticipants();
  }, [id]);

  // Função para buscar preços específicos por categoria
  const fetchCategoryPrices = async (eventId: string) => {
    try {
      console.log('Buscando preços específicos por categoria para o evento:', eventId);
      const response = await fetch(`/api/events/${eventId}/pricing/categories`);
      console.log('Status da resposta:', response.status, response.statusText);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Resposta completa da API de preços por categoria:', result);
        
        if (result.success && result.data) {
          console.log('Preços específicos encontrados:', result.data.length);
          console.log('Detalhes dos preços:', result.data);
          setCategoryPrices(result.data);
        } else {
          console.warn('Resposta da API não contém dados de preços ou não foi bem-sucedida:', result);
        }
      } else {
        console.error('Erro ao buscar preços por categoria. Status:', response.status);
      }
    } catch (error) {
      console.error('Erro ao buscar preços por categoria:', error);
    }
  };

  // Função para verificar e aplicar cupom de desconto
  const handleApplyCoupon = async (couponCode: string): Promise<number | null> => {
    try {
      console.log('Verificando cupom de desconto:', couponCode);
      
      if (!event) {
        console.error('Evento não encontrado ao verificar cupom');
        return null;
      }
      
      // Preparar os dados para verificação do cupom
      const couponData = {
        code: couponCode,
        modalityId: selectedModality,
        categoryId: selectedCategory,
        genderId: selectedGender,
        tierId: currentTier?.id
      };
      
      console.log('Dados para verificação de cupom:', couponData);
      
      // Chamar a API para verificar o cupom
      const response = await fetch(`/api/events/${id}/coupons/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(couponData)
      });
      
      console.log('Status da resposta:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log('Informação sobre o cupom inválido:', errorData);
        
        // Obter a mensagem de erro específica da API ou usar uma mensagem padrão amigável
        let errorMessage = 'Não foi possível aplicar o cupom. Por favor, verifique o código.';
        
        if (errorData.error) {
          // Mapeamento de mensagens técnicas para mensagens amigáveis
          switch (errorData.error) {
            case 'Cupom não encontrado ou expirado':
              errorMessage = 'Este cupom não existe ou está expirado. Verifique o código ou use outro cupom.';
              break;
            case 'Cupom atingiu o limite de usos':
              errorMessage = 'Este cupom já atingiu o limite máximo de uso. Por favor, use outro cupom.';
              break;
            case 'Cupom não é válido para a modalidade selecionada':
              errorMessage = 'Este cupom não é válido para a modalidade selecionada. Verifique as restrições ou selecione outra modalidade.';
              break;
            case 'Cupom não é válido para a categoria selecionada':
              errorMessage = 'Este cupom não é válido para a categoria selecionada. Verifique as restrições ou selecione outra categoria.';
              break;
            case 'Cupom não é válido para o gênero selecionado':
              errorMessage = 'Este cupom não é válido para o gênero selecionado. Verifique as restrições ou selecione outro gênero.';
              break;
            default:
              // Manter a mensagem padrão
          }
        }
        
        // Mostrar a mensagem de erro para o usuário
        toast({
          title: "Cupom inválido",
          description: errorMessage,
          variant: "destructive",
        });
        
        return null;
      }
      
      const result = await response.json();
      console.log('Resposta da API de verificação de cupom:', result);
      
      if (result.success && result.data && result.data.valid) {
        // Guardar o cupom aplicado no estado
        setAppliedCoupon({
          code: couponCode,
          discount: result.data.discount
        });
        
        // Retornar o valor do desconto
        return result.data.discount;
      }
      
      return null;
    } catch (error) {
      console.log('Informação sobre verificação de cupom:', error);
      
      // Mostrar mensagem amigável via toast
      toast({
        title: "Erro ao verificar cupom",
        description: "Ocorreu um problema ao verificar o cupom. Por favor, tente novamente.",
        variant: "destructive",
      });
      
      return null;
    }
  };

  // Determina o tier atual com base na data
  const currentTier = useMemo(() => {
    if (!event || !event.pricingTiers || event.pricingTiers.length === 0) return null

    const now = new Date()
    console.log('=== DEBUG LOTES ===')
    console.log('Data atual:', now.toISOString())
    console.log('Todos os lotes:', event.pricingTiers)

    // Encontra o lote ativo para a data atual
    const activeTier = event.pricingTiers.find(tier => {
      const tierStartDate = new Date(tier.startDate)
      const tierEndDate = new Date(tier.endDate)
      // Ajusta o final do dia para incluir o dia todo
      tierEndDate.setHours(23, 59, 59, 999);
      
      const isActive = tier.active
      const isWithinDateRange = now >= tierStartDate && now <= tierEndDate
      
      console.log(`Verificando lote ${tier.id} (${tier.name}): Ativo=${isActive}, Data Início=${tierStartDate.toISOString()}, Data Fim=${tierEndDate.toISOString()}, Dentro do Range=${isWithinDateRange}`);
      
      return isActive && isWithinDateRange
    });

    if (activeTier) {
      console.log('Lote ativo encontrado:', {
        id: activeTier.id,
        name: activeTier.name,
        price: activeTier.price,
        active: activeTier.active,
        startDate: activeTier.startDate,
        endDate: activeTier.endDate
      })
      return activeTier
    }

    console.log('Nenhum lote ativo encontrado para a data atual.');
    // Fallback: talvez retornar o primeiro lote ativo futuro ou null? Por enquanto, null.
    return null // Ou talvez o primeiro lote ativo, mesmo que futuro?
  }, [event])

  // Efeito para calcular o preço específico quando modalidade, categoria ou gênero mudam
  useEffect(() => {
    console.log('--- Recalculando preço específico ---');
    console.log('Modalidade selecionada:', selectedModality);
    console.log('Categoria selecionada:', selectedCategory);
    console.log('Gênero selecionado:', selectedGender);
    console.log('Lote atual:', currentTier?.id);
    console.log('Preços específicos disponíveis:', categoryPrices.length);
    
    if (!currentTier || !selectedModality || !selectedCategory || !selectedGender || !categoryPrices.length) {
      console.log('Condições não atendidas para preço específico, usando preço padrão:', currentTier?.price);
      setCurrentPrice(currentTier?.price || null);
      return;
    }

    // Procura um preço específico para a combinação selecionada
    console.log('DADOS COMPLETOS DOS PREÇOS ESPECÍFICOS:', JSON.stringify(categoryPrices, null, 2));
    
    // Verificar cada item um por um
    categoryPrices.forEach((price, index) => {
      console.log(`Verificando preço #${index}:`, {
        id: price.id,
        modalidade: {
          id: price.modalityId, 
          match: String(price.modalityId).trim() === String(selectedModality).trim()
        },
        categoria: {
          id: price.categoryId, 
          match: String(price.categoryId).trim() === String(selectedCategory).trim()
        },
        genero: {
          id: price.genderId, 
          match: String(price.genderId).trim() === String(selectedGender).trim()
        },
        lote: {
          id: price.tierId, 
          match: String(price.tierId).trim() === String(currentTier.id).trim()
        },
        preco: price.price
      });
    });
    
    // Usar uma comparação mais flexível para garantir correspondência mesmo com diferenças de tipo/formato
    const specificPrice = categoryPrices.find(
      priceItem => 
        String(priceItem.modalityId).trim() === String(selectedModality).trim() &&
        String(priceItem.categoryId).trim() === String(selectedCategory).trim() &&
        String(priceItem.genderId).trim() === String(selectedGender).trim() &&
        String(priceItem.tierId).trim() === String(currentTier.id).trim()
    );

    console.log('Critérios de busca:', {
      modalityId: selectedModality,
      categoryId: selectedCategory,
      genderId: selectedGender,
      tierId: currentTier.id
    });
    console.log('Preço específico encontrado:', specificPrice);
    
    if (specificPrice) {
      console.log('Aplicando preço específico:', specificPrice.price);
      setCurrentPrice(specificPrice.price);
    } else {
      console.log('Preço específico não encontrado, usando preço padrão:', currentTier.price);
      setCurrentPrice(currentTier.price);
    }
  }, [selectedModality, selectedCategory, selectedGender, currentTier, categoryPrices]);

  // Buscar número de inscrições para a combinação selecionada
  useEffect(() => {
    async function fetchParticipants() {
      if (!selectedModality || !selectedCategory || !selectedGender) return;
      const qs = new URLSearchParams({ modalityId: selectedModality, categoryId: selectedCategory, genderId: selectedGender });
      const res = await fetch(`/api/events/${id}/participants?${qs.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentParticipants(data.totalCount || 0);
      }
    }
    fetchParticipants();
  }, [selectedModality, selectedCategory, selectedGender]);

  // Usar o preço específico ou o preço padrão do tier
  const displayPrice = currentPrice !== null ? currentPrice : currentTier?.price;
  console.log('Preço final exibido sem desconto:', displayPrice);
  
  // Calcular o preço final com desconto
  const finalPrice = useMemo(() => {
    if (!displayPrice) return 0;
    
    // Se houver um cupom aplicado, calcular o desconto
    if (appliedCoupon) {
      const discountAmount = (Number(displayPrice) * appliedCoupon.discount) / 100;
      const priceWithDiscount = Number(displayPrice) - discountAmount;
      console.log(`Calculando preço com desconto: ${displayPrice} - ${discountAmount} = ${priceWithDiscount}`);
      return priceWithDiscount;
    }
    
    // Se não houver cupom, retornar o preço normal
    return Number(displayPrice);
  }, [displayPrice, appliedCoupon]);
  
  console.log('Preço final com desconto:', finalPrice);

  // Verifica se o evento está aberto para inscrições
  const registrationStatus = useMemo(() => {
    if (!event) return { isOpen: false, message: 'Evento não encontrado' }
    
    const now = new Date()
    
    // Verifica se o evento já passou
    if (event.endDate && now > event.endDate) {
      return { isOpen: false, message: 'Este evento já foi encerrado' }
    }
    
    // Verifica se a data de inscrição já passou
    if (event.registrationEnd && now > event.registrationEnd) {
      return { isOpen: false, message: 'As inscrições para este evento já foram encerradas' }
    }
    
    // Verifica se há vagas disponíveis
    if (event.maxParticipants && event.registrations && event.registrations.length >= event.maxParticipants) {
      return { isOpen: false, message: 'Este evento já atingiu o limite de participantes' }
    }
    
    return { isOpen: true, message: '' }
  }, [event])

  // Verifica se pode prosseguir para o checkout
  const canProceedToCheckout = useMemo(() => {
    if (!registrationStatus.isOpen) {
      console.log('Registro não está aberto:', registrationStatus.message)
      return false
    }
    
    console.log('Estado das seleções:', {
      selectedModality,
      selectedCategory,
      selectedGender,
      isFree: event?.isFree,
      hasTier: Boolean(currentTier)
    })
    
    return Boolean(
      selectedModality && 
      selectedCategory && 
      selectedGender && 
      (event?.isFree || currentTier)
    )
  }, [selectedModality, selectedCategory, selectedGender, currentTier, registrationStatus.isOpen, event?.isFree])

  useEffect(() => {
    console.log('canProceedToCheckout:', canProceedToCheckout)
  }, [canProceedToCheckout])

  // Encontra os nomes das opções selecionadas
  const selectedOptions = useMemo(() => {
    if (!event) return { modality: '', category: '', gender: '' }

    const selectedModalityObj = event.modalities.find(m => m.id === selectedModality)
    const selectedCategoryObj = event.categories.find(c => c.id === selectedCategory)
    const selectedGenderObj = event.genders.find(g => g.id === selectedGender)

    return {
      modality: selectedModalityObj?.name || '',
      category: selectedCategoryObj?.name || '',
      gender: selectedGenderObj?.name || ''
    }
  }, [event, selectedModality, selectedCategory, selectedGender])

  // Obter informações da sessão para verificar autenticação
  const { data: session } = useSession()

  const handleProceedToCheckout = () => {
    if (!event || !canProceedToCheckout) return
    
    // Verificar se o usuário está autenticado
    if (!session) {
      // Se não estiver, redirecionar para login com returnUrl para voltar após autenticação
      const returnUrl = `/eventos/${id}`;
      signIn(undefined, { callbackUrl: returnUrl });
      return;
    }
    
    // Se estiver autenticado, mostrar o diálogo de confirmação
    setShowConfirmDialog(true)
  }

  const handleConfirmRegistration = () => {
    // Redirecionar para o formulário de inscrição com os dados selecionados
    const searchParams = new URLSearchParams({
      modality: selectedModality,
      category: selectedCategory,
      gender: selectedGender,
      tierId: currentTier?.id || (event?.isFree ? 'free' : '') // Garante que tierId seja passado ou 'free'
    })
    
    // Adiciona o código do cupom se um cupom foi aplicado
    if (appliedCoupon) {
      searchParams.set('couponCode', appliedCoupon.code);
    }
    
    router.push(`/eventos/${id}/inscricao?${searchParams.toString()}`)
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
      <div className="flex flex-col justify-center items-center min-h-screen gap-4">
        <h1 className="text-2xl font-bold text-red-500">
          {error || 'Evento não encontrado'}
        </h1>
        <p>O evento solicitado não foi encontrado ou não está disponível.</p>
        <Button asChild>
          <Link href="/eventos">Ver todos os eventos</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {!isLoading && event && (
        <EventHeader
          title={event.title}
          startDate={event.startDate}
          endDate={event.endDate}
          location={event.location || ''}
          locationUrl={event.locationUrl}
          posterImage={event.posterImage || ''}
          coverImage={event.coverImage || ''}
          regulationPdf={event.regulationPdf}
          regulationText={event.regulationText || undefined}
          resultsFile={event.resultsFile}
          latitude={event.latitude || undefined}
          longitude={event.longitude || undefined}
          eventId={event.id}
        />
      )}

      <main className="container mx-auto py-8 px-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          </div>
        ) : event ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Coluna da esquerda - Informações */}
            <div className="md:col-span-2 space-y-8">
              <section>
                <h2 className="text-2xl font-bold mb-4">Sobre o Evento</h2>
                <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: event.description }} />
              </section>

              {(event.resultsFile || (event.endDate && new Date(event.endDate) < new Date())) && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Resultados</h2>
                  <EventTopResults eventId={event.id} resultsFile={event.resultsFile || undefined} />
                </section>
              )}

              {event.modalities && event.modalities.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold mb-4">Opções de Inscrição</h2>
                  
                  {!registrationStatus.isOpen && (
                    <Alert variant="destructive" className="mb-6">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {registrationStatus.message}
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <EventOptionsSelector
                    event={event}
                    currentModality={selectedModality}
                    currentCategory={selectedCategory}
                    currentGender={selectedGender}
                    onSelectModality={setSelectedModality}
                    onSelectCategory={setSelectedCategory}
                    onSelectGender={setSelectedGender}
                    readOnly={!registrationStatus.isOpen}
                  />
                </section>
              )}
            </div>

            {/* Coluna da direita - Inscrição */}
            <div className="sticky top-4">
              {event.isFree ? (
                <Card>
                  <CardContent className="p-6">
                    <h2 className="text-xl font-bold mb-4">Inscrição</h2>
                    <p className="text-lg font-medium text-green-600 mb-4">
                      Evento Gratuito
                    </p>
                    <Button 
                      className="w-full"
                      disabled={!canProceedToCheckout}
                      onClick={handleProceedToCheckout}
                    >
                      Inscrever-se
                    </Button>
                    {!canProceedToCheckout && registrationStatus.isOpen && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        Selecione uma modalidade, categoria e gênero para continuar
                      </p>
                    )}
                    {!registrationStatus.isOpen && (
                      <p className="text-sm text-gray-500 mt-2 text-center">
                        {registrationStatus.message || 'Inscrições encerradas'}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ) : currentTier && (
                <MiniCheckout
                  tier={{
                    ...currentTier,
                    price: finalPrice // Usar o preço com desconto
                  }}
                  onProceed={handleProceedToCheckout}
                  disabled={!canProceedToCheckout}
                  disabledReason={
                    !registrationStatus.isOpen 
                      ? registrationStatus.message || 'Inscrições encerradas'
                      : !canProceedToCheckout 
                        ? 'Selecione uma modalidade, categoria e gênero para continuar'
                        : undefined
                  }
                  onApplyCoupon={handleApplyCoupon}
                  appliedCoupon={appliedCoupon}
                  originalPrice={appliedCoupon ? Number(displayPrice) : undefined}
                  currentParticipants={currentParticipants}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Evento não encontrado</h2>
            <p className="text-gray-600 mb-8">Não foi possível carregar as informações deste evento.</p>
            <Button asChild>
              <Link href="/eventos">Ver todos os eventos</Link>
            </Button>
          </div>
        )}
      </main>

      {/* Diálogo de confirmação */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Inscrição</DialogTitle>
            <DialogDescription>
              Você selecionou as seguintes opções:
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-2">
              <p><strong>Modalidade:</strong> {selectedOptions.modality}</p>
              <p><strong>Categoria:</strong> {selectedOptions.category}</p>
              <p><strong>Gênero:</strong> {selectedOptions.gender}</p>
              {currentTier && (
                <>
                  {appliedCoupon ? (
                    <>
                      <p>
                        <strong>Valor original:</strong> {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(Number(currentTier.price))}
                      </p>
                      <p>
                        <strong>Cupom aplicado:</strong> {appliedCoupon.code} ({appliedCoupon.discount}% de desconto)
                      </p>
                      <p className="text-green-600 font-semibold">
                        <strong>Valor com desconto:</strong> {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(finalPrice)}
                      </p>
                    </>
                  ) : (
                    <p>
                      <strong>Valor:</strong> {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL'
                      }).format(finalPrice)}
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Voltar
            </Button>
            <Button onClick={handleConfirmRegistration}>
              Continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
