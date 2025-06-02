import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'sonner';

// Definição de tipos para o formulário
type BasicInfoType = {
  title: string;
  description: string;
  slug: string;
  startDate: Date | null;
  endDate: Date | null;
  registrationEnd: Date | null;
  status: 'DRAFT' | 'PUBLISHED';
  published: boolean;
};

type LocationType = {
  location: string;
  locationUrl?: string;
  addressDetails: string;
  zipCode: string;
  latitude: number | null;
  longitude: number | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
};

type ModalityType = {
  modalityIds: string[];
  categoryIds: string[];
  genderIds: string[];
};

type PricingTierType = {
  id?: string;
  name: string;
  price: number;
  startDate: Date | null;
  endDate: Date | null;
  endTime?: string;
  maxEntries?: number | null;
};

type CategoryPriceType = {
  id?: string;
  modalityId: string;
  categoryId: string;
  genderId: string;
  price: number;
  tierId: string;
  // Campos opcionais para exibição, podem não vir do backend diretamente
  modalityName?: string;
  categoryName?: string;
  genderName?: string;
  tierName?: string;
};

// Tipo para Cupons de Desconto
// Similar ao definido em EventAdvancedPricingTab
type DiscountCouponType = {
  id?: string;
  code: string;
  discount: number;
  modalityId: string | null;
  categoryId: string | null;
  genderId: string | null;
  maxUses: number;
  startDate: Date | null; // Ajustado para aceitar null
  endDate: Date | null;   // Ajustado para aceitar null
  // Campos opcionais para exibição
  modalityName?: string | null;
  categoryName?: string | null;
  genderName?: string | null;
  usedCount?: number; // Adicionado para consistência, pode vir do backend
};

type PricingType = {
  isFree: boolean;
  pricingTiers: PricingTierType[];
  categoryPrices: CategoryPriceType[];
  discountCoupons: DiscountCouponType[];
};

type ImagesType = {
  coverImage: string;
  posterImage: string;
};

type RegulationType = {
  regulationUrl: string;
  regulationFilename: string;
  regulationText: string;
  useTextRegulation: boolean;
};

type ResultsType = {
  resultsFile: string;
};

type FormDataType = {
  basicInfo: BasicInfoType;
  location: LocationType;
  modality: ModalityType;
  pricing: PricingType;
  images: ImagesType;
  regulation: RegulationType;
  results: ResultsType;
};

// Estrutura inicial do formulário
const initialFormState: FormDataType = {
  basicInfo: {
    title: '',
    description: '',
    slug: '',
    startDate: null,
    endDate: null,
    registrationEnd: null,
    status: 'DRAFT',
    published: false
  },
  location: {
    location: '',
    locationUrl: '',
    addressDetails: '',
    zipCode: '',
    latitude: null,
    longitude: null,
    countryId: null,
    stateId: null,
    cityId: null
  },
  modality: {
    modalityIds: [],
    categoryIds: [],
    genderIds: []
  },
  pricing: {
    isFree: false,
    pricingTiers: [],
    categoryPrices: [],
    discountCoupons: []
  },
  images: {
    coverImage: '',
    posterImage: ''
  },
  regulation: {
    regulationUrl: '',
    regulationFilename: '',
    regulationText: '',
    useTextRegulation: false
  },
  results: {
    resultsFile: ''
  }
};

// Tipo do contexto
type EventFormContextType = {
  formData: FormDataType;
  updateBasicInfo: (data: Partial<BasicInfoType>) => void;
  updateLocation: (data: Partial<LocationType>) => void;
  updateModality: (data: Partial<ModalityType>) => void;
  updatePricing: (data: Partial<PricingType>) => void;
  updateImages: (data: Partial<ImagesType>) => void;
  updateRegulation: (data: Partial<RegulationType>) => void;
  updateResults: (data: Partial<ResultsType>) => void;
  updateFormData: (data: Partial<FormDataType>) => void;
  resetForm: () => void;
  submitForm: (status?: 'DRAFT' | 'PUBLISHED') => Promise<{success: boolean, eventId?: string, error?: string}>;
  success: boolean;
  eventId?: string;
  error?: string;
  isValid: () => boolean;
  errors: Record<string, string>;
  isLoading: boolean;
};

const EventFormContext = createContext<EventFormContextType | null>(null);

interface EventFormProviderProps {
  children: React.ReactNode;
  eventId?: string;
}

export function EventFormProvider({ children, eventId }: EventFormProviderProps) {
  // Estado principal do formulário
  const [formData, setFormData] = useState<FormDataType>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [eventIdState, setEventId] = useState<string | undefined>(eventId);
  const [error, setError] = useState<string | undefined>();
  
  // Estado para controle de carregamento de dados
  const [isLoading, setIsLoading] = useState(false);
  
  // Função para resetar completamente o formulário para o estado inicial
  const resetForm = () => {
    console.log('Resetando formulário para o estado inicial');
    setFormData(JSON.parse(JSON.stringify(initialFormState)));
    setErrors({});
    setSuccess(false);
    setError(undefined);
  };
  
  // Efeito para carregar dados do evento existente se eventId for fornecido
  useEffect(() => {
    // Se eventId for undefined ou null, resetar o formulário para inicial
    if (!eventId) {
      console.log('Criando novo evento, resetando formulário');
      resetForm();
      return;
    }
    
    // Se chegar aqui, é edição de evento existente
    setIsLoading(true);
    
    const fetchEventData = async () => {
      try {
        // Chamada real à API para buscar os dados do evento
        const response = await fetch(`/api/events/${eventId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar dados do evento');
        }
        
        const eventData = await response.json();
        console.log('Dados do evento carregados:', eventData);
        
        // Verificar se os dados estão dentro de um objeto 'data'
        const eventDetails = eventData.data || eventData;
        
        // Formatar os dados do evento para o formato do formulário
        setFormData({
          basicInfo: {
            title: eventDetails.title || '',
            description: eventDetails.description || '',
            slug: eventDetails.slug || '',
            startDate: eventDetails.startDate ? new Date(eventDetails.startDate) : null,
            endDate: eventDetails.endDate ? new Date(eventDetails.endDate) : null,
            registrationEnd: eventDetails.registrationEnd ? new Date(eventDetails.registrationEnd) : null,
            status: eventDetails.status || 'DRAFT',
            published: eventDetails.published || false
          },
          location: {
            location: eventDetails.location || '',
            locationUrl: eventDetails.locationUrl || '',
            addressDetails: eventDetails.addressDetails || '',
            zipCode: eventDetails.zipCode || '',
            latitude: eventDetails.latitude || null,
            longitude: eventDetails.longitude || null,
            countryId: eventDetails.countryId || null,
            stateId: eventDetails.stateId || null,
            cityId: eventDetails.cityId || null
          },
          modality: {
            modalityIds: eventDetails.EventToModality?.map((m: { modalityId: string }) => m.modalityId) || [],
            categoryIds: eventDetails.EventToCategory?.map((c: { categoryId: string }) => c.categoryId) || [],
            genderIds: eventDetails.EventToGender?.map((g: { genderId: string }) => g.genderId) || []
          },
          pricing: {
            isFree: eventDetails.isFree || false,
            pricingTiers: eventDetails.EventPricingTier?.map((tier: {
              id: string;
              name: string;
              price: number;
              startDate: string | Date;
              endDate: string | Date;
            }) => ({
              id: tier.id,
              name: tier.name,
              price: tier.price,
              startDate: tier.startDate ? new Date(tier.startDate) : null,
              endDate: tier.endDate ? new Date(tier.endDate) : null
            })) || [],
            // CORREÇÃO: Mapear corretamente os preços por categorias da API
            categoryPrices: Array.isArray(eventDetails.EventPricingByCategory) ? eventDetails.EventPricingByCategory.map((price) => ({
              id: price.id,
              modalityId: price.modalityId,
              categoryId: price.categoryId,
              genderId: price.genderId,
              tierId: price.tierId,
              price: price.price,
              // Tente obter os nomes se disponíveis
              tierName: price.tierName || eventDetails.EventPricingTier?.find((t) => t.id === price.tierId)?.name || '',
              modalityName: price.modalityName || '',
              categoryName: price.categoryName || '',
              genderName: price.genderName || ''
            })) : [],
            discountCoupons: Array.isArray(eventDetails.EventDiscountCoupon) ? eventDetails.EventDiscountCoupon.map((coupon) => ({
              id: coupon.id,
              code: coupon.code,
              discount: coupon.discount || coupon.discountPercentage || 0, // Aceita ambos os formatos para compatibilidade
              maxUses: coupon.maxUses || 0,
              startDate: coupon.startDate ? new Date(coupon.startDate) : null,
              endDate: coupon.endDate ? new Date(coupon.endDate) : null,
              modalityId: coupon.modalityId,
              categoryId: coupon.categoryId,
              genderId: coupon.genderId,
              modalityName: coupon.modalityName || '',
              categoryName: coupon.categoryName || '',
              genderName: coupon.genderName || ''
            })) : []
          },
          images: {
            coverImage: eventDetails.coverImage || '',
            posterImage: eventDetails.posterImage || ''
          },
          regulation: {
            regulationUrl: eventDetails.regulationPdf || '',
            regulationFilename: eventDetails.regulationPdf ? eventDetails.regulationPdf.split('/').pop() || '' : '',
            regulationText: eventDetails.regulationText || '',
            useTextRegulation: !eventDetails.regulationPdf
          },
          results: {
            resultsFile: eventDetails.resultsFile || ''
          }
        });
        
        toast.success('Dados do evento carregados com sucesso');
      } catch (error) {
        console.error('Erro ao buscar dados do evento:', error);
        toast.error('Erro ao carregar dados do evento');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchEventData();
  }, [eventId]);
  
  // Carregar do localStorage na montagem
  useEffect(() => {
    try {
      // Se temos um eventId, estamos editando um evento existente
      if (eventId) {
        // Usar uma chave específica para o evento em edição
        const savedEditForm = localStorage.getItem(`eventForm_edit_${eventId}`);
        if (savedEditForm) {
          setFormData(JSON.parse(savedEditForm));
          console.log(`Carregados dados do evento em edição (ID: ${eventId}) do localStorage`);
        }
      } else {
        // Estamos criando um novo evento - NÃO carregar dados do localStorage
        // Isso evita que dados de eventos anteriores sejam usados para novos eventos
        console.log('Criando novo evento - formulário limpo');
      }
    } catch (error) {
      console.error('Erro ao carregar formulário:', error);
    }
  }, [eventId]);
  
  // Salvar no localStorage quando o estado mudar
  useEffect(() => {
    // Usar um timeout para evitar salvamentos excessivos
    const timeoutId = setTimeout(() => {
      try {
        // Apenas salvar no localStorage se estivermos editando um evento existente
        if (eventId) {
          // Armazenar os dados com uma chave específica para o evento em edição
          localStorage.setItem(`eventForm_edit_${eventId}`, JSON.stringify(formData));
          console.log(`Salvos dados do evento em edição (ID: ${eventId}) no localStorage`);
        }
      } catch (error) {
        console.error('Erro ao salvar formulário no localStorage:', error);
      }
    }, 500); // 500ms de debounce
    
    // Limpar o timeout quando o componente for desmontado ou o estado mudar novamente
    return () => clearTimeout(timeoutId);
  }, [formData, eventId]);
  
  // Funções para atualizar cada seção
  const updateBasicInfo = (data: Partial<BasicInfoType>) => {
    setFormData(prev => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        ...data
      }
    }));
  };
  
  const updateLocation = (data: Partial<LocationType>) => {
    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        ...data
      }
    }));
  };
  
  const updateModality = (data: Partial<ModalityType>) => {
    setFormData(prev => ({
      ...prev,
      modality: {
        ...prev.modality,
        ...data
      }
    }));
  };
  
  const updatePricing = (data: Partial<PricingType>) => {
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        ...data
      }
    }));
  };
  
  const updateImages = (data: Partial<ImagesType>) => {
    setFormData(prev => ({
      ...prev,
      images: {
        ...prev.images,
        ...data
      }
    }));
  };
  
  const updateRegulation = (data: Partial<RegulationType>) => {
    setFormData(prev => ({
      ...prev,
      regulation: {
        ...prev.regulation,
        ...data
      }
    }));
  };
  
  const updateResults = (data: Partial<ResultsType>) => {
    setFormData(prev => ({
      ...prev,
      results: {
        ...prev.results,
        ...data
      }
    }));
  };
  
  const updateFormData = (data: Partial<FormDataType>) => {
    setFormData(prev => ({
      ...prev,
      ...data
    }));
  };
  
  // Validação básica do formulário
  const isValid = () => {
    const newErrors: Record<string, string> = {};
    
    // Validação básica
    if (!formData.basicInfo.title) {
      newErrors.title = 'O título é obrigatório';
    }
    
    if (!formData.basicInfo.description) {
      newErrors.description = 'A descrição é obrigatória';
    }
    
    // Mais validações conforme necessário...
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Enviar o formulário
  const submitForm = async (status: 'DRAFT' | 'PUBLISHED' = 'DRAFT') => {
    setIsLoading(true);
    
    try {
      // Validar o formulário antes de enviar
      if (!isValid()) {
        setIsLoading(false);
        return { success: false, error: 'Formulário inválido' };
      }
      
      // Preparar o objeto de dados completo para o evento
      const eventData = {
        title: formData.basicInfo.title,
        description: formData.basicInfo.description,
        slug: formData.basicInfo.slug,
        location: formData.location.location,
        locationUrl: formData.location.locationUrl,
        startDate: formData.basicInfo.startDate,
        endDate: formData.basicInfo.endDate,
        registrationEnd: formData.basicInfo.registrationEnd,
        status: status || formData.basicInfo.status,
        published: formData.basicInfo.published,
        isFree: formData.pricing.isFree,
        addressDetails: formData.location.addressDetails,
        zipCode: formData.location.zipCode,
        latitude: formData.location.latitude,
        longitude: formData.location.longitude,
        countryId: formData.location.countryId,
        stateId: formData.location.stateId,
        cityId: formData.location.cityId,
        modalityIds: formData.modality.modalityIds,
        categoryIds: formData.modality.categoryIds,
        genderIds: formData.modality.genderIds,
        // Adicionar lotes de preço
        pricingTiers: formData.pricing.isFree ? [] : formData.pricing.pricingTiers.map(tier => {
          console.log(`Formatando lote ${tier.name} com preço original: ${tier.price}`);
          const price = parseFloat(tier.price.toString());
          console.log(`Formatando lote ${tier.name} com preço convertido: ${price}`);
          const priceStr = price.toFixed(2);
          console.log(`Formatando lote ${tier.name} com preço para Prisma: ${priceStr}`);
          return {
            id: tier.id || undefined,
            name: tier.name,
            price: priceStr,
            startDate: tier.startDate,
            endDate: tier.endDate,
            endTime: tier.endTime,
            maxEntries: tier.maxEntries || 100, // Usar o valor definido pelo usuário ou o padrão
            active: true
          };
        }),
        // Estrutura corrigida: colocar preços avançados e cupons dentro do objeto pricing
        pricing: {
          // Adicionar os cupons de desconto
          discountCoupons: formData.pricing.discountCoupons.map(coupon => ({
            ...coupon,
            // Remover IDs temporários para que o backend gere novos
            id: coupon.id && !coupon.id.startsWith('temp-') ? coupon.id : undefined,
            // Certificar que datas sejam nulas ou objetos Date válidos (ou strings ISO se a API esperar)
            startDate: coupon.startDate ? new Date(coupon.startDate) : null,
            endDate: coupon.endDate ? new Date(coupon.endDate) : null
          })),
          // Adicionar os preços avançados por categoria
          categoryPrices: formData.pricing.categoryPrices.map(price => ({
            ...price,
            // Remover IDs temporários para que o backend gere novos
            id: price.id && !price.id.startsWith('temp-') ? price.id : undefined,
            // Converter o preço para número para garantir que seja salvo corretamente
            price: parseFloat(price.price.toString())
          }))
        },
        // Adicionar campos de imagens e regulamento
        coverImage: formData.images.coverImage,
        posterImage: formData.images.posterImage,
        regulationPdf: formData.regulation.useTextRegulation ? null : formData.regulation.regulationUrl,
        resultsFile: formData.results.resultsFile
      };
      
      console.log('Enviando dados para API:', eventData);
      console.log('Lotes de preço enviados:', eventData.pricingTiers);
      
      // LOGS DETALHADOS PARA PREÇOS AVANÇADOS
      console.log('Preços avançados no formData:', formData.pricing.categoryPrices);
      console.log('Preços avançados formatados para envio:', eventData.pricing?.categoryPrices);
      console.log('Estrutura completa do eventData:', JSON.stringify(eventData, null, 2));
      console.log('Chaves do objeto eventData:', Object.keys(eventData));
      
      // Determinar se é uma criação ou atualização
      let url = '/api/events';
      let method = 'POST';
      
      // Se temos um eventId, é uma atualização
      if (eventId) {
        url = `/api/events/${eventId}`;
        method = 'PUT';
        console.log(`Atualizando evento com ID: ${eventId}`);
      } else {
        console.log('Criando novo evento');
      }
      
      // Enviar para a API
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar evento');
      }
      
      const result = await response.json();
      
      // Limpar o formulário após sucesso
      resetForm();
      
      setSuccess(true);
      setEventId(result.id);
      setError(undefined);
      
      return { success: true, eventId: result.id };
    } catch (error: unknown) {
      console.error('Erro ao enviar formulário:', error);
      setSuccess(false);
      setError(error instanceof Error ? error.message : 'Ocorreu um erro ao criar o evento');
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Ocorreu um erro ao criar o evento' 
      };
    } finally {
      setIsLoading(false);
    }
  };
  
  const value = {
    formData,
    updateBasicInfo,
    updateLocation,
    updateModality,
    updatePricing,
    updateImages,
    updateRegulation,
    updateResults,
    updateFormData,
    resetForm,
    submitForm,
    success,
    eventId: eventIdState,
    error,
    isValid,
    errors,
    isLoading
  };
  
  return (
    <EventFormContext.Provider value={value}>
      {children}
    </EventFormContext.Provider>
  );
}

// Hook para usar o contexto
export function useEventForm() {
  const context = useContext(EventFormContext);
  if (!context) {
    throw new Error('useEventForm deve ser usado dentro de um EventFormProvider');
  }
  return context;
}
