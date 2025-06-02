'use client'

import React, { useState, useEffect } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Plus, Trash2, Copy, Tag, Percent, X, RefreshCw, Loader2 } from 'lucide-react'
import { useToasts } from '@/hooks/ui/useToasts'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useParams } from 'next/navigation';

// Tipos
interface CategoryPrice {
  id?: string;
  modalityId: string;
  categoryId: string;
  genderId: string;
  price: number;
  tierId: string;
  modalityName?: string;
  categoryName?: string;
  genderName?: string;
  tierName?: string;
}

interface DiscountCoupon {
  id?: string;
  code: string;
  discount: number;
  modalityId: string | null;
  categoryId: string | null;
  genderId: string | null;
  maxUses: number;
  startDate: Date | null;
  endDate: Date | null;
  modalityName?: string | null;
  categoryName?: string | null;
  genderName?: string | null;
}

interface Modality {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
}

interface Gender {
  id: string;
  name: string;
  code: string;
}

interface PricingTier {
  id: string;
  name: string;
}

export function EventAdvancedPricingTab() {
  const { formData, updatePricing, errors } = useEventForm()
  const { showError, showSuccess } = useToasts()
  
  // Estados para preços por categoria
  const [modalities, setModalities] = useState<Modality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [genders, setGenders] = useState<Gender[]>([])
  const [pricingTiers, setPricingTiers] = useState<PricingTier[]>([])
  const [categoryPrices, setCategoryPrices] = useState<CategoryPrice[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [forceRefresh, setForceRefresh] = useState(false)
  
  // Estado para novo preço por categoria
  const [newCategoryPrice, setNewCategoryPrice] = useState<{
    modalityId: string,
    categoryIds: string[],  
    genderIds: string[],    
    price: number,
    tierId: string
  }>({
    modalityId: '',
    categoryIds: [],  
    genderIds: [],    
    price: 0,
    tierId: ''
  })
  
  // Estados para cupons de desconto
  const [discountCoupons, setDiscountCoupons] = useState<DiscountCoupon[]>([])
  const [couponCategories, setCouponCategories] = useState<Category[]>([])
  
  // Estado para novo cupom de desconto
  const [newCoupon, setNewCoupon] = useState<DiscountCoupon>({
    code: '',
    discount: 0,
    modalityId: null,
    categoryId: null,
    genderId: null,
    maxUses: 10,
    startDate: new Date(),
    endDate: new Date(new Date().setDate(new Date().getDate() + 30))
  })

  // Obter o ID do evento dos parâmetros da URL
  const params = useParams<{ id: string }>();
  const eventIdFromParams = params?.id || '';

  // Efeito para carregar dados iniciais
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setIsLoadingData(true)
        
        console.log('Dados do formulário:', formData)
        console.log('Slug do evento:', formData.basicInfo?.slug)
        console.log('ID do evento nos parâmetros:', eventIdFromParams)
        
        // Carregar modalidades - apenas as selecionadas na aba Modalidades
        if (formData.modality && formData.modality.modalityIds && formData.modality.modalityIds.length > 0) {
          console.log('Modalidades selecionadas:', formData.modality.modalityIds)
          const modalityIds = formData.modality.modalityIds;
          const modalitiesResponse = await fetch('/api/events/modalities')
          const modalitiesData = await modalitiesResponse.json()
          
          if (modalitiesData.success) {
            // Filtrar apenas as modalidades selecionadas
            const selectedModalities = modalitiesData.data.filter((modality: any) => 
              modalityIds.includes(modality.id)
            )
            console.log('Modalidades filtradas:', selectedModalities)
            setModalities(selectedModalities)
            
            if (selectedModalities.length > 0 && !newCategoryPrice.modalityId) {
              setNewCategoryPrice(prev => ({
                ...prev,
                modalityId: selectedModalities[0].id
              }));
            }
          }
        } else {
          // Fallback para carregar todas as modalidades se nenhuma estiver selecionada
          const modalitiesResponse = await fetch('/api/events/modalities')
          const modalitiesData = await modalitiesResponse.json()
          const modalitiesList = modalitiesData.data || modalitiesData;
          setModalities(modalitiesList)
        }
        
        // Carregar gêneros - apenas os selecionados na aba Modalidades
        if (formData.modality && formData.modality.genderIds && formData.modality.genderIds.length > 0) {
          console.log('Gêneros selecionados:', formData.modality.genderIds)
          const genderIds = formData.modality.genderIds;
          const gendersResponse = await fetch('/api/events/genders')
          const gendersData = await gendersResponse.json()
          
          // Verificar se a resposta contém a propriedade data
          const gendersList = gendersData.data || gendersData;
          
          // Filtrar apenas os gêneros selecionados
          const selectedGenders = gendersList.filter(
            (gender: Gender) => genderIds.includes(gender.id)
          );
          
          console.log('Gêneros filtrados:', selectedGenders)
          setGenders(selectedGenders)
          
          // Se tiver pelo menos um gênero, pré-selecionar o primeiro
          if (selectedGenders.length > 0) {
            setNewCategoryPrice(prev => ({
              ...prev,
              genderIds: [selectedGenders[0].id]
            }));
          }
        } else {
          // Fallback para carregar todos os gêneros se nenhum estiver selecionado
          const gendersResponse = await fetch('/api/events/genders')
          const gendersData = await gendersResponse.json()
          const gendersList = gendersData.data || gendersData;
          setGenders(gendersList)
        }
        
        // Carregar o resto dos dados se o evento já tem um slug
        await fetchEventSpecificData();
      } catch (error) {
        console.error('Erro ao carregar dados iniciais:', error)
        showError({
          title: 'Erro ao carregar dados',
          description: 'Não foi possível carregar os dados necessários. Tente novamente mais tarde.'
        })
      } finally {
        setIsLoadingData(false)
      }
    }
    
    fetchInitialData()
  }, [formData.modality])

  // Função para carregar dados específicos do evento (lotes, preços e cupons)
  // Esta função pode ser chamada sempre que necessário atualizar esses dados
  const fetchEventSpecificData = async () => {
    console.log('Carregando dados específicos do evento:', formData.basicInfo?.slug);
    
    // Usar o ID dos parâmetros da URL para garantir consistência
    const eventId = eventIdFromParams;
    
    console.log('Usando ID para busca de preços avançados:', eventId);
    
    // -------------------------------------------------------------
    // Lógica para carregar Lotes de Preço (Pricing Tiers)
    // REMOVIDO: Busca via API (/api/events/${eventId}/pricing-tiers)
    // AGORA: Utiliza diretamente os dados do contexto formData
    // -------------------------------------------------------------
    if (formData.pricing && formData.pricing.pricingTiers && formData.pricing.pricingTiers.length > 0) {
      console.log('Usando lotes do formData:', formData.pricing.pricingTiers);
      const tiers = formData.pricing.pricingTiers.map((tier: any) => ({
        // Garante que o ID seja string, mesmo que seja temporário
        id: String(tier.id || ''), 
        name: tier.name
      }));
      console.log('Lotes de preço mapeados do formData:', tiers);
      setPricingTiers(tiers);

      // Selecionar o primeiro lote por padrão se não houver seleção e houver lotes
      if (tiers.length > 0 && !newCategoryPrice.tierId) {
        setNewCategoryPrice(prev => ({
          ...prev,
          tierId: tiers[0].id
        }));
      }
    } else {
      console.warn('Nenhum lote de preço encontrado no formData.pricing.pricingTiers');
      // Limpar lotes se não encontrar nada no contexto
      setPricingTiers([]); 
    }

    // -------------------------------------------------------------
    // Restante da lógica (carregar preços por categoria e cupons)
    // Mantém a busca via API para estes, pois são específicos do evento salvo
    // -------------------------------------------------------------
    
    // Primeiro verifica se o contexto já tem os preços carregados
    console.log('Verificando se já existem preços avançados no contexto do formulário...');
    console.log('Preços por categoria no contexto:', formData.pricing.categoryPrices?.length || 0);
    console.log('Cupons de desconto no contexto:', formData.pricing.discountCoupons?.length || 0);

    if (formData.pricing.categoryPrices?.length > 0) {
      console.log('Usando os preços por categoria do contexto do formulário');
      
      // Enriquecer os preços com os nomes das entidades relacionadas
      const enrichedPrices = formData.pricing.categoryPrices.map((price: any) => {
        console.log('Enriquecendo preço:', price);
        
        // Buscar nomes correspondentes aos IDs
        const modalityName = price.modalityName || getModalityName(price.modalityId);
        const categoryName = price.categoryName || getCategoryName(price.categoryId);
        const genderName = price.genderName || getGenderName(price.genderId);
        const tierName = price.tierName || getTierName(price.tierId);
        
        console.log(`Nomes encontrados: modalidade=${modalityName}, categoria=${categoryName}, gênero=${genderName}, lote=${tierName}`);
        
        // Retornar objeto enriquecido
        return {
          ...price,
          modalityName,
          categoryName,
          genderName,
          tierName
        };
      });
      
      console.log('Preços enriquecidos:', enrichedPrices);
      setCategoryPrices(enrichedPrices);
    }

    if (formData.pricing.discountCoupons?.length > 0) {
      console.log('Usando os cupons de desconto do contexto do formulário');
      // Converter os cupons do contexto para o formato esperado pelo componente
      const mappedCoupons = formData.pricing.discountCoupons.map(coupon => ({
        id: coupon.id,
        code: coupon.code,
        discount: coupon.discount,
        modalityId: coupon.modalityId,
        categoryId: coupon.categoryId,
        genderId: coupon.genderId,
        maxUses: coupon.maxUses || 0,
        startDate: coupon.startDate || new Date(), // Garantir que nunca seja null
        endDate: coupon.endDate || new Date(),     // Garantir que nunca seja null
        modalityName: coupon.modalityName || null,
        categoryName: coupon.categoryName || null,
        genderName: coupon.genderName || null
      }));
      setDiscountCoupons(mappedCoupons);
    }
    
    // Verificação se o evento já existe no banco para buscar o restante
    let eventExists = false;
    if (eventId && !eventId.includes('temp-')) {
      try {
        // Sempre usar o ID dos parâmetros para verificar a existência
        const eventCheckResponse = await fetch(`/api/events/${eventId}`);
        if (eventCheckResponse.ok) {
          eventExists = true;
          console.log('Evento confirmado no banco, buscando preços e cupons adicionais se necessário...');
        } else {
          console.log('Evento não encontrado no banco via ID normal, tentando via ID dos parâmetros...');
          // Forçando como true pois já estamos na edição de um evento existente
          console.log('Forçando eventExists=true para permitir carregamento dos preços avançados');
          eventExists = true;
        }
      } catch (error) {
        console.error('Erro ao verificar existência do evento:', error);
        // Se ocorrer um erro, vamos assumir que o evento existe se temos um ID válido
        console.log('Erro na verificação, mas forçando eventExists=true para permitir carregamento');
        eventExists = true;
      }
    }

    // Busca da API somente se não encontrou dados no contexto OU forçando atualização
    const shouldFetchPricing = eventExists && (formData.pricing.categoryPrices?.length === 0 || forceRefresh);
    const shouldFetchCoupons = eventExists && (formData.pricing.discountCoupons?.length === 0 || forceRefresh);

    // Verificar diretamente no banco se há preços e cupons (debug)
    console.log('Realizando verificação direta de preços e cupons no banco...');
    try {
      const debugResponse = await fetch(`/api/debug/event-pricing?eventId=${eventId}`);
      if (debugResponse.ok) {
        const debugData = await debugResponse.json();
        console.log('Resultado da verificação direta:', debugData);
      }
    } catch (debugError) {
      console.error('Erro na verificação direta:', debugError);
    }

    if (shouldFetchPricing) {
      try {
        console.log(`Buscando preços específicos por categoria para o evento: ${eventId}`);
        const categoryPricesResponse = await fetch(`/api/events/${eventId}/pricing/categories`);
        console.log('Status da resposta de preços por categoria:', categoryPricesResponse.status);
        
        if (categoryPricesResponse.ok) {
          const categoryPricesData = await categoryPricesResponse.json();
          console.log('Preços por categoria carregados da API:', categoryPricesData);
          
          // Tratamento robusto para todos os possíveis formatos da resposta
          let loadedPrices: CategoryPrice[] = [];
          
          if (Array.isArray(categoryPricesData)) {
            // Formato 1: array direto
            loadedPrices = categoryPricesData;
            console.log('Formato detectado: Array direto de preços');
          } else if (categoryPricesData.data && Array.isArray(categoryPricesData.data)) {
            // Formato 2: { data: [...] }
            loadedPrices = categoryPricesData.data;
            console.log('Formato detectado: Objeto com array em data');
          } else {
            // Formato desconhecido
            console.error('Formato de resposta não reconhecido:', categoryPricesData);
            loadedPrices = [];
          }
          
          console.log(`Foram carregados ${loadedPrices.length} preços avançados do servidor`);
          
          // Verificar e enriquecer os dados com nomes de modalidades, categorias e gêneros se necessário
          const enrichedPrices = loadedPrices.map(price => {
            // Se já tiver os nomes, usa os que vieram da API
            if (price.modalityName && price.categoryName && price.genderName && price.tierName) {
              console.log('Preço já tem todos os nomes:', price);
              return price;
            }
            
            // Caso contrário, busca os nomes nas listas carregadas
            const modalityName = price.modalityName || 
                                 modalities.find(m => m.id === price.modalityId)?.name || 
                                 'Desconhecida';
            const categoryName = price.categoryName || 
                                categories.find(c => c.id === price.categoryId)?.name || 
                                'Desconhecida';
            const genderName = price.genderName || 
                               genders.find(g => g.id === price.genderId)?.name || 
                               'Desconhecido';
            const tierName = price.tierName || 
                            pricingTiers.find(t => t.id === price.tierId)?.name || 
                            'Desconhecido';
            
            console.log(`Enriquecendo preço: modalidade=${modalityName}, categoria=${categoryName}, gênero=${genderName}, lote=${tierName}`);
            
            return {
              ...price,
              modalityName,
              categoryName,
              genderName,
              tierName
            };
          });
          
          // CRUCIAL: Atualizar o estado local E o estado do formulário
          console.log('Preços enriquecidos com nomes:', enrichedPrices);
          setCategoryPrices(enrichedPrices);
          
          // Garantir que o contexto do formulário tenha os preços carregados
          // Isso é essencial para que eles sejam enviados de volta ao servidor quando o evento for salvo
          updatePricing({
            categoryPrices: enrichedPrices
          });
          
          console.log('Preços avançados atualizados no contexto:', enrichedPrices)
          
          // Log para confirmação
          if (enrichedPrices.length > 0) {
            console.log('Exemplo de preço carregado:', JSON.stringify(enrichedPrices[0], null, 2));
          }
        } else {
          const errorData = await categoryPricesResponse.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.error('Erro ao buscar preços por categoria:', errorData);
        }
      } catch (error) {
        console.error('Exceção ao carregar preços por categoria:', error);
      }
    } else {
      console.log('Não foi necessário buscar preços da API, usando dados do contexto');
    }

    // Carregar cupons de desconto somente se não estiverem no contexto
    if (shouldFetchCoupons) {
      try {
        const couponsResponse = await fetch(`/api/events/${eventId}/coupons`)
        if (couponsResponse.ok) {
          const couponsData = await couponsResponse.json()
          if (couponsData.data && Array.isArray(couponsData.data)) {
            setDiscountCoupons(couponsData.data)
          } else {
            console.log('Nenhum cupom encontrado ou formato inválido')
            setDiscountCoupons([])
          }
        } else {
          console.warn('Erro ao carregar cupons:', couponsResponse.status);
        }
      } catch (error) {
        console.error('Erro ao carregar cupons:', error)
      }
    } else {
      console.log('Não foi necessário buscar cupons da API, usando dados do contexto');
    }
  };

  // Forçar a recarga dos dados quando a aba for selecionada
  useEffect(() => {
    // Esta função será chamada sempre que o componente for montado ou quando mudar de aba para esta
    console.log('Aba de Preços Avançados selecionada ou componente montado');
    fetchEventSpecificData();
  }, []); // Executar apenas na montagem do componente
  
  // Efeito para pré-selecionar a primeira modalidade disponível para o preço por categoria
  useEffect(() => {
    if (modalities.length > 0 && !newCategoryPrice.modalityId) {
      setNewCategoryPrice(prev => ({
        ...prev,
        modalityId: modalities[0].id
      }));
      
      // Carregar categorias para a modalidade selecionada
      fetchCategories(modalities[0].id);
    }
  }, [modalities]);
  
  // Efeito para pré-selecionar a primeira modalidade disponível para o cupom de desconto
  useEffect(() => {
    if (modalities.length > 0 && !newCoupon.modalityId) {
      console.log('Pré-selecionando primeira modalidade para o cupom:', modalities[0].id)
      setNewCoupon(prev => ({
        ...prev,
        modalityId: modalities[0].id
      }));
    }
  }, [modalities, newCoupon.modalityId]);
  
  // Função para carregar categorias baseadas na modalidade
  const fetchCategories = async (modalityId: string, genderId?: string) => {
    if (!modalityId) return;
    
    try {
      console.log('Buscando categorias para modalidade:', modalityId)
      
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('modalityId', modalityId);
      
      // Incluir os gêneros selecionados na aba Modalidades
      if (genderId) {
        params.append('genderIds', genderId);
      } else if (formData.modality && formData.modality.genderIds && formData.modality.genderIds.length > 0) {
        params.append('genderIds', formData.modality.genderIds.join(','));
      }
      
      // Incluir as categorias selecionadas na aba Modalidades
      if (formData.modality && formData.modality.categoryIds && formData.modality.categoryIds.length > 0) {
        params.append('categoryIds', formData.modality.categoryIds.join(','));
      }
      
      console.log('Parâmetros para busca de categorias:', params.toString())
      
      const response = await fetch(`/api/events/categories-by-modality-gender?${params}`)
      const responseData = await response.json()
      const data = responseData.data || responseData;
      
      console.log('Categorias retornadas pela API:', data)
      
      // Definir as categorias
      setCategories(data);
      
      // Se tiver pelo menos uma categoria, pré-selecionar a primeira
      if (data.length > 0) {
        setNewCategoryPrice(prev => ({
          ...prev,
          categoryIds: [data[0].id]
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    }
  }
  
  // Efeito para carregar categorias quando a modalidade do preço por categoria for selecionada
  useEffect(() => {
    if (newCategoryPrice.modalityId) {
      fetchCategories(newCategoryPrice.modalityId, newCategoryPrice.genderIds[0]);
    } else {
      setCategories([]);
    }
  }, [newCategoryPrice.modalityId, newCategoryPrice.genderIds]);
  
  // Efeito para carregar categorias quando a modalidade do cupom for selecionada
  useEffect(() => {
    const modalityId = newCoupon.modalityId;
    const genderId = newCoupon.genderId || undefined;
    if (modalityId) {
      fetchCouponCategories(modalityId, genderId);
    } else {
      setCouponCategories([]);
    }
  }, [newCoupon.modalityId, newCoupon.genderId]);
  
  // Manipuladores para preços por categoria
  const handleCategoryPriceChange = (field: keyof typeof newCategoryPrice, value: string | number | string[]) => {
    setNewCategoryPrice(prev => ({
      ...prev,
      [field]: value
    }))
  }
  
  const handleAddCategoryPrice = async () => {
    if (!newCategoryPrice.modalityId || 
        newCategoryPrice.categoryIds.length === 0 || 
        newCategoryPrice.genderIds.length === 0 || 
        !newCategoryPrice.tierId || 
        newCategoryPrice.price <= 0) {
      showError({
        title: 'Erro',
        description: 'Todos os campos são obrigatórios'
      });
      return;
    }

    // Mostrar mensagem de carregamento
    showSuccess({
      title: 'Adicionando preços específicos para categorias...',
      description: 'Aguarde um momento...'
    });

    // Criar um array para armazenar todos os preços a serem adicionados
    const newPrices: CategoryPrice[] = [];

    // Para cada combinação de categoria e gênero
    for (const categoryId of newCategoryPrice.categoryIds) {
      for (const genderId of newCategoryPrice.genderIds) {
        // Buscar nomes das entidades selecionadas para exibição imediata na tabela
        const modalityName = modalities.find(m => m.id === newCategoryPrice.modalityId)?.name || 'Desconhecida';
        const categoryName = categories.find(c => c.id === categoryId)?.name || 'Desconhecida';
        const genderName = genders.find(g => g.id === genderId)?.name || 'Desconhecido';
        const tierName = pricingTiers.find(t => t.id === newCategoryPrice.tierId)?.name || 'Desconhecido';
        
        // Criar um ID temporário para este preço (será substituído pelo ID do servidor)
        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        
        // Adicionar o novo preço ao array
        newPrices.push({
          id: tempId,
          modalityId: newCategoryPrice.modalityId,
          categoryId,
          genderId,
          tierId: newCategoryPrice.tierId,
          price: newCategoryPrice.price,
          // Adicionar nomes para exibição na tabela
          modalityName,
          categoryName,
          genderName,
          tierName
        });
      }
    }

    console.log('Novos preços a serem adicionados:', newPrices);

    // Se estiver criando um novo evento (sem eventId), apenas atualizar o estado do formulário
    if (!formData.basicInfo.slug || formData.basicInfo.slug.includes('temp-') || !params.id) {
      console.log('Evento novo, adicionando preços apenas no estado local');
      
      // Adicionar os novos preços ao estado local e ao contexto do formulário
      const updatedPrices = [...categoryPrices, ...newPrices];
      setCategoryPrices(updatedPrices);
      
      // Atualizar o contexto do formulário
      updatePricing({
        categoryPrices: updatedPrices
      });
      
      // Limpar o formulário de novo preço
      setNewCategoryPrice(prev => ({
        ...prev, // Manter modalidade e lote se desejado
        categoryIds: [],
        genderIds: [],
        price: 0,
      }));

      showSuccess({
        title: 'Preços adicionados',
        description: `${newPrices.length} novo(s) preço(s) adicionado(s) com sucesso!`
      });
      return;
    }

    // Para eventos existentes, salvar na API
    try {
      // Preparar os preços para envio (sem IDs temporários)
      const pricesToSend = newPrices.map(({ id, modalityName, categoryName, genderName, tierName, ...rest }) => rest);

      console.log('Enviando preços para a API:', pricesToSend);
      
      // Enviar requisição para a API
      const response = await fetch(`/api/events/${params.id}/pricing/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricesToSend),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
        console.error('Erro ao adicionar preços:', errorData);
        showError({
          title: 'Erro ao adicionar preços',
          description: errorData.error || 'Erro desconhecido'
        });
        return;
      }

      const result = await response.json();
      console.log('Resposta da API de adição de preços:', result);

      // Atualizar o estado local com os preços retornados pela API (com IDs reais)
      if (result.data && Array.isArray(result.data)) {
        const addedPrices = result.data.map((price: any) => ({
          ...price,
          // Certificar-se de que os nomes estão presentes
          modalityName: price.modalityName || modalities.find(m => m.id === price.modalityId)?.name || 'Desconhecida',
          categoryName: price.categoryName || categories.find(c => c.id === price.categoryId)?.name || 'Desconhecida',
          genderName: price.genderName || genders.find(g => g.id === price.genderId)?.name || 'Desconhecido',
          tierName: price.tierName || pricingTiers.find(t => t.id === price.tierId)?.name || 'Desconhecido'
        }));
        
        // Atualizar estado local e contexto do formulário
        const updatedPrices = [...categoryPrices, ...addedPrices];
        setCategoryPrices(updatedPrices);
        updatePricing({
          categoryPrices: updatedPrices
        });
      } else if (result.success) {
        // Se a API não retornou os dados mas a operação foi bem-sucedida
        // Atualizar com os dados que enviamos (mantendo os IDs temporários)
        const updatedPrices = [...categoryPrices, ...newPrices];
        setCategoryPrices(updatedPrices);
        updatePricing({
          categoryPrices: updatedPrices
        });
      }

      // Limpar o formulário de novo preço
      setNewCategoryPrice(prev => ({
        ...prev, // Manter modalidade e lote se desejado
        categoryIds: [],
        genderIds: [],
        price: 0,
      }));

      showSuccess({
        title: 'Preços adicionados',
        description: `${newPrices.length} novo(s) preço(s) adicionado(s) com sucesso!`
      });
    } catch (error) {
      console.error('Erro ao adicionar preços:', error);
      showError({
        title: 'Erro ao adicionar preços',
        description: (error as Error).message || 'Erro desconhecido'
      });
    }
  }

  const handleRemoveCategoryPrice = async (idToRemove: string) => {
    try {
      console.log(`Tentando remover preço específico - ID: ${idToRemove}`);
      
      // Mostrar mensagem de carregamento
      showSuccess({
        title: 'Removendo preço...',
        description: 'Aguarde um momento...'
      });
      
      // Se o ID começar com 'temp-', é um preço que foi adicionado localmente mas não salvo no banco
      const isTemporaryPrice = idToRemove.startsWith('temp-');
      let deletedFromDatabase = false;
      
      // Se não for um preço temporário, remover do banco de dados
      if (!isTemporaryPrice && params.id) {
        try {
          console.log(`Removendo preço ${idToRemove} do banco de dados para o evento ${params.id}`);
          const response = await fetch(`/api/events/${params.id}/pricing/categories?priceId=${idToRemove}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('Preço removido com sucesso do banco de dados');
            deletedFromDatabase = true;
            
            const result = await response.json();
            console.log('Resposta da API de deleção:', result);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('Erro ao remover preço do banco de dados:', errorData);
            
            // Se o erro for 404 (não encontrado), continuamos com a remoção local
            if (response.status !== 404) {
              showError({
                title: 'Erro ao remover preço',
                description: errorData.error || 'Erro desconhecido'
              });
              return; // Não continuar com a remoção local em caso de erro da API
            }
          }
        } catch (error) {
          console.error('Erro ao fazer requisição de remoção:', error);
          showError({
            title: 'Erro na comunicação',
            description: 'Não foi possível conectar ao servidor para remover o preço.'
          });
          return; // Não continuar com a remoção local em caso de erro de conexão
        }
      } else if (isTemporaryPrice) {
        console.log('Preço temporário, removendo apenas localmente:', idToRemove);
      } else {
        console.log('ID do evento não disponível, removendo apenas localmente');
      }
      
      // Filtrar o preço a ser removido do estado local
      const updatedPrices = categoryPrices.filter(price => price.id !== idToRemove);
      setCategoryPrices(updatedPrices);

      // Atualizar no contexto
      updatePricing({
        categoryPrices: updatedPrices
      });
      console.log('Preços avançados atualizados no contexto após remoção:', updatedPrices);

      if (deletedFromDatabase) {
        showSuccess({
          title: 'Preço removido',
          description: 'Preço removido com sucesso do sistema!'
        });
      } else {
        showSuccess({
          title: 'Preço removido',
          description: 'Preço removido localmente.'
        });
      }
    } catch (error) {
      console.error('Erro ao remover preço por categoria:', error);
      showError({
        title: 'Erro',
        description: 'Não foi possível remover o preço.'
      });
    }
  }
  
  // Manipuladores para cupons de desconto
  const handleCouponChange = (field: keyof DiscountCoupon, value: string | number | Date | null) => {
    setNewCoupon(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddCoupon = async () => {
    console.log('Tentando adicionar cupom:', newCoupon);

    if (!newCoupon.code || !newCoupon.discount || !newCoupon.maxUses || !newCoupon.startDate || !newCoupon.endDate) {
      showError({
        title: 'Erro',
        description: 'Código, Desconto (%), Usos Máximos, Data Início e Data Fim são obrigatórios.'
      });
      return;
    }
    
    // Validar datas
    if (newCoupon.endDate < newCoupon.startDate) {
       showError({
        title: 'Erro',
        description: 'A data final não pode ser anterior à data inicial.'
      });
      return;
    }

    // Mostrar mensagem de carregamento
    showSuccess({
      title: 'Adicionando cupom...',
      description: 'Aguarde um momento...'
    });

    // Verificar se estamos editando um evento existente
    const isExistingEvent = params.id && !formData.basicInfo.slug.includes('temp-');

    // Se estiver editando um evento existente, enviar para a API
    if (isExistingEvent) {
      try {
        console.log(`Enviando cupom para a API do evento ${params.id}`);
        
        // Preparar os dados para o formato que a API espera
        const couponToSend = {
          code: newCoupon.code,
          discount: newCoupon.discount,
          modalityId: newCoupon.modalityId,
          categoryId: newCoupon.categoryId,
          genderId: newCoupon.genderId,
          maxUses: newCoupon.maxUses,
          startDate: newCoupon.startDate,
          endDate: newCoupon.endDate
        };
        
        console.log('Cupom a ser enviado para a API:', couponToSend);
        
        // Enviar requisição para a API
        const response = await fetch(`/api/events/${params.id}/coupons`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(couponToSend)
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
          console.error('Erro ao adicionar cupom via API:', errorData);
          showError({
            title: 'Erro ao adicionar cupom',
            description: errorData.error || 'Erro desconhecido ao salvar o cupom no servidor'
          });
          return;
        }
        
        // Processar resposta
        const result = await response.json();
        console.log('Resposta da API de adição de cupom:', result);
        
        if (result.success && result.data) {
          // Adicionar o cupom retornado pela API ao estado local
          const updatedCoupons = [...discountCoupons, result.data];
          setDiscountCoupons(updatedCoupons);
          
          // Atualizar no contexto
          updatePricing({
            discountCoupons: updatedCoupons
          });
          
          showSuccess({
            title: 'Cupom adicionado',
            description: 'Cupom adicionado e salvo no banco de dados com sucesso!'
          });
        } else {
          showError({
            title: 'Erro ao adicionar cupom',
            description: 'O servidor não retornou os dados esperados'
          });
          return;
        }
      } catch (error) {
        console.error('Erro ao adicionar cupom via API:', error);
        showError({
          title: 'Erro ao adicionar cupom',
          description: 'Ocorreu um erro ao tentar salvar o cupom no servidor'
        });
        return;
      }
    } else {
      // Gerar um ID temporário
      const tempId = `temp-coupon-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
      // Adicionar nomes para exibição local
      const modalityName = newCoupon.modalityId ? modalities.find(m => m.id === newCoupon.modalityId)?.name : null;
      const categoryName = newCoupon.categoryId ? couponCategories.find(c => c.id === newCoupon.categoryId)?.name : null;
      const genderName = newCoupon.genderId ? genders.find(g => g.id === newCoupon.genderId)?.name : null;
  
      const couponToAdd: DiscountCoupon = {
        ...newCoupon,
        id: tempId,
        modalityName,
        categoryName,
        genderName
      };
  
      // Atualizar estado local
      const updatedCoupons = [...discountCoupons, couponToAdd];
      setDiscountCoupons(updatedCoupons);
  
      // Atualizar no contexto
      updatePricing({
        discountCoupons: updatedCoupons
      });
      console.log('Cupom adicionado localmente no contexto:', updatedCoupons);
      
      showSuccess({
        title: 'Cupom adicionado',
        description: 'Cupom adicionado localmente. Será salvo quando o evento for criado.'
      });
    }

    // Resetar campos do formulário de cupom
    setNewCoupon({
      code: '',
      discount: 0,
      modalityId: null,
      categoryId: null,
      genderId: null,
      maxUses: 0,
      startDate: new Date(),
      endDate: new Date(new Date().setDate(new Date().getDate() + 7)) // Padrão: 7 dias
    });
    setCouponCategories([]); // Limpar categorias do cupom
  };

  const handleRemoveCoupon = async (id: string) => {
    try {
      console.log(`Tentando remover cupom - ID: ${id}`);
      
      // Mostrar mensagem de carregamento
      showSuccess({
        title: 'Removendo cupom...',
        description: 'Aguarde um momento...'
      });

      // Se o ID começar com 'temp-', é um cupom que foi adicionado localmente mas não salvo no banco
      const isTemporaryCoupon = id.startsWith('temp-');
      let deletedFromDatabase = false;
      
      // Se não for um cupom temporário, remover do banco de dados
      if (!isTemporaryCoupon && params.id) {
        try {
          console.log(`Removendo cupom ${id} do banco de dados para o evento ${params.id}`);
          const response = await fetch(`/api/events/${params.id}/coupons?couponId=${id}`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            console.log('Cupom removido com sucesso do banco de dados');
            deletedFromDatabase = true;
            
            const result = await response.json();
            console.log('Resposta da API de deleção de cupom:', result);
          } else {
            const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
            console.error('Erro ao remover cupom do banco de dados:', errorData);
            
            // Se o erro for 404 (não encontrado), continuamos com a remoção local
            if (response.status !== 404) {
              showError({
                title: 'Erro ao remover cupom',
                description: errorData.error || 'Erro desconhecido'
              });
              return; // Não continuar com a remoção local em caso de erro da API
            }
          }
        } catch (error) {
          console.error('Erro ao fazer requisição de remoção de cupom:', error);
          showError({
            title: 'Erro na comunicação',
            description: 'Não foi possível conectar ao servidor para remover o cupom.'
          });
          return; // Não continuar com a remoção local em caso de erro de conexão
        }
      } else if (isTemporaryCoupon) {
        console.log('Cupom temporário, removendo apenas localmente:', id);
      } else {
        console.log('ID do evento não disponível, removendo cupom apenas localmente');
      }
      
      // Filtrar o cupom a ser removido do estado local
      const updatedCoupons = discountCoupons.filter(coupon => coupon.id !== id);
      setDiscountCoupons(updatedCoupons);

      // Atualizar no contexto
      updatePricing({
        discountCoupons: updatedCoupons
      });
      console.log('Cupons atualizados localmente no contexto após remoção:', updatedCoupons);

      if (deletedFromDatabase) {
        showSuccess({
          title: 'Cupom removido',
          description: 'Cupom removido com sucesso do sistema!'
        });
      } else {
        showSuccess({
          title: 'Cupom removido',
          description: 'Cupom removido localmente.'
        });
      }
    } catch (error) {
      console.error('Erro ao remover cupom:', error);
      showError({
        title: 'Erro',
        description: 'Não foi possível remover o cupom.'
      });
    }
  };

  const generateRandomCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    handleCouponChange('code', result)
  }
  
  // Formatadores
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }
  
  const formatDate = (date: Date | null | string) => {
    if (!date) return '-'
    
    try {
      // Converter para objeto Date se for string
      const dateObj = date instanceof Date ? date : new Date(date)
      
      // Verificar se a data é válida após a conversão
      if (isNaN(dateObj.getTime())) {
        console.warn('Data inválida após conversão:', date)
        return '-'
      }
      
      return new Intl.DateTimeFormat('pt-BR').format(dateObj)
    } catch (error) {
      console.warn('Erro ao formatar data:', error, date)
      return '-'
    }
  }
  
  // Funções auxiliares
  const getModalityName = (modalityId: string) => {
    const modality = modalities.find(m => m.id === modalityId);
    return modality?.name || 'Modalidade não encontrada';
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Categoria não encontrada';
  };

  const getGenderName = (genderId: string) => {
    const gender = genders.find(g => g.id === genderId);
    return gender?.name || 'Gênero não encontrado';
  };

  const getTierName = (tierId: string) => {
    const tier = pricingTiers.find(t => t.id === tierId);
    return tier?.name || 'Lote não encontrado';
  };
  
  // Função para carregar categorias para o cupom
  const fetchCouponCategories = async (modalityId: string, genderId?: string) => {
    if (!modalityId) return;
    
    try {
      console.log('Buscando categorias para cupom - modalidade:', modalityId)
      
      // Construir parâmetros de consulta
      const params = new URLSearchParams();
      params.append('modalityId', modalityId);
      
      // Incluir os gêneros selecionados na aba Modalidades
      if (genderId) {
        params.append('genderIds', genderId);
      } else if (formData.modality && formData.modality.genderIds && formData.modality.genderIds.length > 0) {
        params.append('genderIds', formData.modality.genderIds.join(','));
      }
      
      // Incluir as categorias selecionadas na aba Modalidades
      if (formData.modality && formData.modality.categoryIds && formData.modality.categoryIds.length > 0) {
        params.append('categoryIds', formData.modality.categoryIds.join(','));
      }
      
      console.log('Parâmetros para busca de categorias para cupom:', params.toString())
      
      const response = await fetch(`/api/events/categories-by-modality-gender?${params}`)
      const responseData = await response.json()
      const data = responseData.data || responseData;
      
      console.log('Categorias para cupom retornadas pela API:', data)
      
      // Definir as categorias para cupons
      setCouponCategories(data);
      
      // Se tiver pelo menos uma categoria, pré-selecionar a primeira
      if (data.length > 0) {
        setNewCoupon(prev => ({
          ...prev,
          categoryId: data[0].id
        }));
      }
    } catch (error) {
      console.error('Erro ao carregar categorias para cupom:', error)
    }
  }

  // Função auxiliar para verificar se um valor está selecionado
  const isSelectedValue = (field: 'modalityId' | 'categoryId' | 'genderId' | 'tierId', value: string) => {
    if (field === 'modalityId') return newCategoryPrice.modalityId === value;
    if (field === 'categoryId') return newCategoryPrice.categoryIds.includes(value);
    if (field === 'genderId') return newCategoryPrice.genderIds.includes(value);
    if (field === 'tierId') return newCategoryPrice.tierId === value;
    return false;
  };

  // Função para alternar um valor
  const toggleItem = (field: 'modalityId' | 'categoryId' | 'genderId' | 'tierId', value: string) => {
    if (field === 'modalityId') {
      handleCategoryPriceChange('modalityId', newCategoryPrice.modalityId === value ? '' : value);
    } else if (field === 'categoryId') {
      if (newCategoryPrice.categoryIds.includes(value)) {
        handleCategoryPriceChange('categoryIds', newCategoryPrice.categoryIds.filter(id => id !== value));
      } else {
        handleCategoryPriceChange('categoryIds', [...newCategoryPrice.categoryIds, value]);
      }
    } else if (field === 'genderId') {
      if (newCategoryPrice.genderIds.includes(value)) {
        handleCategoryPriceChange('genderIds', newCategoryPrice.genderIds.filter(id => id !== value));
      } else {
        handleCategoryPriceChange('genderIds', [...newCategoryPrice.genderIds, value]);
      }
    } else if (field === 'tierId') {
      handleCategoryPriceChange('tierId', newCategoryPrice.tierId === value ? '' : value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Preços Específicos por Categoria</h3>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              setForceRefresh(true);
              fetchEventSpecificData().then(() => {
                setForceRefresh(false);
                showSuccess({
                  title: "Dados atualizados",
                  description: "Os preços avançados foram recarregados do servidor.",
                  variant: "default"
                });
              });
            }}
            disabled={isLoadingData}
          >
            {isLoadingData ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Carregando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Recarregar Preços Avançados
              </>
            )}
          </Button>
        </div>
      </div>
      <Tabs defaultValue="category-prices" className="w-full">
        <TabsList className="grid grid-cols-2 mb-6">
          <TabsTrigger value="category-prices">Preços por Categoria</TabsTrigger>
          <TabsTrigger value="discount-coupons">Cupons de Desconto</TabsTrigger>
        </TabsList>
        
        {/* Aba de Preços por Categoria */}
        <TabsContent value="category-prices">
          <Card>
            <CardHeader>
              <CardTitle>Preços Específicos por Categoria</CardTitle>
              <CardDescription>
                Defina preços diferentes para cada combinação de modalidade, categoria e gênero.
                Os preços definidos aqui substituirão o preço base do lote para as combinações específicas.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulário para adicionar novo preço */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="modalityId">Modalidade</Label>
                  <Select
                    value={newCategoryPrice.modalityId}
                    onValueChange={(value) => handleCategoryPriceChange('modalityId', value)}
                  >
                    <SelectTrigger id="modalityId">
                      <SelectValue placeholder="Selecione uma modalidade" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      {modalities.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoryId">Categorias</Label>
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">Categorias selecionadas:</div>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter(cat => newCategoryPrice.categoryIds.includes(cat.id))
                        .map(cat => (
                          <Badge key={cat.id} variant="secondary" className="flex items-center gap-1">
                            {cat.name}
                            <X 
                              size={14} 
                              className="cursor-pointer" 
                              onClick={() => {
                                const updatedCats = newCategoryPrice.categoryIds.filter(id => id !== cat.id);
                                handleCategoryPriceChange('categoryIds', updatedCats);
                              }}
                            />
                          </Badge>
                        ))}
                      {newCategoryPrice.categoryIds.length === 0 && (
                        <div className="text-muted-foreground text-sm">Nenhuma categoria selecionada</div>
                      )}
                    </div>
                    <ScrollArea className="h-40 border rounded-md p-2">
                      {categories.map((category) => (
                        <div key={category.id} className="flex items-center space-x-2 py-1">
                          <Checkbox 
                            id={`cat-${category.id}`}
                            checked={newCategoryPrice.categoryIds.includes(category.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleCategoryPriceChange('categoryIds', [...newCategoryPrice.categoryIds, category.id]);
                              } else {
                                handleCategoryPriceChange('categoryIds', newCategoryPrice.categoryIds.filter(id => id !== category.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`cat-${category.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {category.name}
                          </label>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="genderId">Gêneros</Label>
                  <div className="flex flex-col gap-2">
                    <div className="font-medium">Gêneros selecionados:</div>
                    <div className="flex flex-wrap gap-2">
                      {genders
                        .filter(gen => newCategoryPrice.genderIds.includes(gen.id))
                        .map(gen => (
                          <Badge key={gen.id} variant="secondary" className="flex items-center gap-1">
                            {gen.name}
                            <X 
                              size={14} 
                              className="cursor-pointer" 
                              onClick={() => {
                                const updatedGens = newCategoryPrice.genderIds.filter(id => id !== gen.id);
                                handleCategoryPriceChange('genderIds', updatedGens);
                              }}
                            />
                          </Badge>
                        ))}
                      {newCategoryPrice.genderIds.length === 0 && (
                        <div className="text-muted-foreground text-sm">Nenhum gênero selecionado</div>
                      )}
                    </div>
                    <div className="border rounded-md p-2">
                      {genders.map((gender) => (
                        <div key={gender.id} className="flex items-center space-x-2 py-1">
                          <Checkbox 
                            id={`gen-${gender.id}`}
                            checked={newCategoryPrice.genderIds.includes(gender.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                handleCategoryPriceChange('genderIds', [...newCategoryPrice.genderIds, gender.id]);
                              } else {
                                handleCategoryPriceChange('genderIds', newCategoryPrice.genderIds.filter(id => id !== gender.id));
                              }
                            }}
                          />
                          <label 
                            htmlFor={`gen-${gender.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {gender.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="tierId">Lote</Label>
                  <Select
                    value={newCategoryPrice.tierId}
                    onValueChange={(value) => handleCategoryPriceChange('tierId', value)}
                  >
                    <SelectTrigger id="tierId">
                      <SelectValue placeholder="Selecione um lote" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      {pricingTiers.map((tier) => (
                        <SelectItem key={tier.id} value={tier.id}>
                          {tier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="price">Preço (R$)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={newCategoryPrice.price || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      console.log('Valor do preço digitado:', e.target.value, 'Convertido para:', value)
                      handleCategoryPriceChange('price', isNaN(value) ? 0 : value)
                    }}
                    placeholder="0,00"
                  />
                </div>
                
                <div className="md:col-span-5 flex justify-end">
                  <Button
                    type="button"
                    onClick={() => {
                      // Log para depuração do estado do botão
                      console.log('Estado do botão Adicionar Preço:', {
                        modalityId: newCategoryPrice.modalityId,
                        categoryIds: newCategoryPrice.categoryIds,
                        genderIds: newCategoryPrice.genderIds,
                        tierId: newCategoryPrice.tierId,
                        price: newCategoryPrice.price,
                        disabled: !newCategoryPrice.modalityId || 
                                 newCategoryPrice.categoryIds.length === 0 || 
                                 newCategoryPrice.genderIds.length === 0 || 
                                 !newCategoryPrice.tierId || 
                                 newCategoryPrice.price <= 0
                      });
                      // Chamar a função original
                      handleAddCategoryPrice();
                    }}
                    disabled={
                      !newCategoryPrice.modalityId || 
                      newCategoryPrice.categoryIds.length === 0 || 
                      newCategoryPrice.genderIds.length === 0 || 
                      !newCategoryPrice.tierId || 
                      newCategoryPrice.price <= 0
                    }
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Adicionar Preço
                  </Button>
                </div>
              </div>
              
              {/* Tabela de preços por categoria */}
              {categoryPrices.length > 0 && (
                <div className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Gênero</TableHead>
                        <TableHead>Lote</TableHead>
                        <TableHead>Preço</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categoryPrices.map((price) => {
                        // Log mais simplificado
                        console.log(`Processando preço: ${price.id}`);
                        
                        // Buscar diretamente por ID, sem usar find
                        let modalityName = "Modalidade não encontrada";
                        let categoryName = "Categoria não encontrada";
                        let genderName = "Gênero não encontrado";
                        let tierName = "Lote não encontrado";
                        
                        // Correspondência forçada para a modalidade
                        for (const m of modalities) {
                          if (m.id === price.modalityId) {
                            modalityName = m.name;
                            break;
                          }
                        }
                        
                        // Correspondência forçada para a categoria
                        for (const c of categories) {
                          if (c.id === price.categoryId) {
                            categoryName = c.name;
                            break;
                          }
                        }
                        
                        // Correspondência forçada para o gênero
                        for (const g of genders) {
                          if (g.id === price.genderId) {
                            genderName = g.name;
                            break;
                          }
                        }
                        
                        // Correspondência forçada para o lote
                        for (const t of pricingTiers) {
                          if (t.id === price.tierId) {
                            tierName = t.name;
                            break;
                          }
                        }
                        
                        // Log dos nomes encontrados
                        console.log(`Nomes encontrados: modalidade=${modalityName}, categoria=${categoryName}, gênero=${genderName}, lote=${tierName}`);
                        
                        return (
                          <TableRow key={price.id}>
                            <TableCell>{modalityName}</TableCell>
                            <TableCell>{categoryName}</TableCell>
                            <TableCell>{genderName}</TableCell>
                            <TableCell>{tierName}</TableCell>
                            <TableCell>{formatCurrency(price.price)}</TableCell>
                            <TableCell>
                              <Button variant="outline" size="icon" onClick={() => handleRemoveCategoryPrice(price.id || '')} title="Remover">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba de Cupons de Desconto */}
        <TabsContent value="discount-coupons">
          <Card>
            <CardHeader>
              <CardTitle>Cupons de Desconto</CardTitle>
              <CardDescription>
                Crie cupons de desconto para oferecer promoções especiais. Você pode limitar os cupons por modalidade, 
                categoria e gênero, além de definir a quantidade máxima de usos e o período de validade.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Formulário para adicionar novo cupom */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-md">
                <div className="space-y-2">
                  <Label htmlFor="couponCode">Código do Cupom</Label>
                  <div className="flex space-x-2">
                    <Input
                      id="couponCode"
                      value={newCoupon.code}
                      onChange={(e) => handleCouponChange('code', e.target.value.toUpperCase())}
                      placeholder="Ex: PROMO10"
                      className="uppercase"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={generateRandomCode}
                      title="Gerar código aleatório"
                    >
                      <Copy size={16} />
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (%)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newCoupon.discount || ''}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value)
                      handleCouponChange('discount', isNaN(value) ? 0 : Math.min(value, 100))
                    }}
                    placeholder="0"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxUses">Máximo de Usos</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    min="1"
                    value={newCoupon.maxUses || ''}
                    onChange={(e) => {
                      const value = parseInt(e.target.value)
                      handleCouponChange('maxUses', isNaN(value) ? 1 : Math.max(1, value))
                    }}
                    placeholder="10"
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2 lg:col-span-1">
                  <Label htmlFor="couponModalityId">Modalidade (opcional)</Label>
                  <Select
                    value={newCoupon.modalityId || 'all'}
                    onValueChange={(value) => handleCouponChange('modalityId', value === 'all' ? null : value)}
                  >
                    <SelectTrigger id="couponModalityId">
                      <SelectValue placeholder="Todas as modalidades" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      <SelectItem value="all">Todas as modalidades</SelectItem>
                      {modalities.map((modality) => (
                        <SelectItem key={modality.id} value={modality.id}>
                          {modality.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="couponCategoryId">Categoria (opcional)</Label>
                  <Select
                    value={newCoupon.categoryId || 'all'}
                    onValueChange={(value) => handleCouponChange('categoryId', value === 'all' ? null : value)}
                    disabled={!newCoupon.modalityId}
                  >
                    <SelectTrigger id="couponCategoryId">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {couponCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="couponGenderId">Gênero (opcional)</Label>
                  <Select
                    value={newCoupon.genderId || 'all'}
                    onValueChange={(value) => handleCouponChange('genderId', value === 'all' ? null : value)}
                  >
                    <SelectTrigger id="couponGenderId">
                      <SelectValue placeholder="Todos os gêneros" />
                    </SelectTrigger>
                    <SelectContent position="popper" className="z-[100]">
                      <SelectItem value="all">Todos os gêneros</SelectItem>
                      {genders.map((gender) => (
                        <SelectItem key={gender.id} value={gender.id}>
                          {gender.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data de Início</Label>
                  <DatePicker
                    id="startDate"
                    selected={newCoupon.startDate}
                    onSelect={(date: Date | null) => handleCouponChange('startDate', date)}
                    placeholder="Selecione a data"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data de Término</Label>
                  <DatePicker
                    id="endDate"
                    selected={newCoupon.endDate}
                    onSelect={(date: Date | null) => handleCouponChange('endDate', date)}
                    placeholder="Selecione a data"
                  />
                </div>
                
                <div className="md:col-span-2 lg:col-span-4 flex justify-end">
                  <Button
                    type="button"
                    onClick={handleAddCoupon}
                    disabled={
                      !newCoupon.code || 
                      newCoupon.discount <= 0 || 
                      newCoupon.discount > 100
                    }
                    className="flex items-center gap-2"
                  >
                    <Tag size={16} />
                    Adicionar Cupom
                  </Button>
                </div>
              </div>
              
              {/* Tabela de cupons de desconto */}
              {discountCoupons.length > 0 ? (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Desconto</TableHead>
                        <TableHead>Usos Máximos</TableHead>
                        <TableHead>Modalidade</TableHead>
                        <TableHead>Categoria</TableHead>
                        <TableHead>Gênero</TableHead>
                        <TableHead>Data Início</TableHead>
                        <TableHead>Data Fim</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {discountCoupons.map((coupon) => (
                        <TableRow key={coupon.id}>
                          <TableCell>{coupon.code}</TableCell>
                          <TableCell>{coupon.discount}%</TableCell>
                          <TableCell>{coupon.maxUses || 'Ilimitado'}</TableCell>
                          <TableCell>{coupon.modalityName || (coupon.modalityId ? getModalityName(coupon.modalityId) : 'Todas')}</TableCell>
                          <TableCell>{coupon.categoryName || (coupon.categoryId ? getCategoryName(coupon.categoryId) : 'Todas')}</TableCell>
                          <TableCell>{coupon.genderName || (coupon.genderId ? getGenderName(coupon.genderId) : 'Todos')}</TableCell>
                          <TableCell>
                            {coupon.startDate && new Date(coupon.startDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            {coupon.endDate && new Date(coupon.endDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCoupon(coupon.id!)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 size={16} />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex items-center justify-center p-8 border rounded-md">
                  <p className="text-muted-foreground">
                    Nenhum cupom de desconto criado para este evento.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
