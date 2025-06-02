"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useEffect, useState } from "react"
import { MaskedInput } from "@/components/ui/input-mask"
import { fetchAddressByCep } from "@/lib/cep"

// Schema de validação atualizado com os novos campos
const formSchema = z.object({
  filiationType: z.enum(["NEW", "RENEWAL"], {
    required_error: "Selecione se é uma nova filiação ou renovação",
  }),
  fullName: z.string().min(1, "Nome completo é obrigatório"),
  cpf: z.string().min(1, "CPF é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  cbcRegistration: z.string().optional(),
  birthDate: z.string().min(1, "Data de nascimento é obrigatória"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  zipCode: z.string().min(1, "CEP é obrigatório"),
  address: z.string().min(1, "Endereço é obrigatório"),
  city: z.string().min(1, "Cidade é obrigatória"),
  state: z.string().min(1, "Estado é obrigatório"),
  modalities: z.array(z.string()).min(1, "Selecione pelo menos uma modalidade"),
  category: z.string().optional(), // Alterado para opcional, a validação será feita manualmente
  affiliationType: z.enum(["INDIVIDUAL", "CLUB"], {
    required_error: "Tipo de filiação é obrigatório",
  }),
  clubId: z.string().optional()
})

interface Category {
  id: string
  name: string
}

interface Modality {
  id: string
  name: string
  price: number
}

interface Club {
  id: string
  clubName: string
  responsibleName: string
}

export default function FiliationForm() {
  const { data: session } = useSession()
  const router = useRouter()
  
  // Estados
  const [categories, setCategories] = useState<Category[]>([])
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([])
  const [modalities, setModalities] = useState<Modality[]>([])
  const [clubs, setClubs] = useState<Club[]>([])
  const [selectedModalities, setSelectedModalities] = useState<string[]>([])
  const [selectedModalityId, setSelectedModalityId] = useState<string>('')
  const [isIndividual, setIsIndividual] = useState(true)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | undefined>()
  const [isRenewal, setIsRenewal] = useState(false)
  const [searchingByCpf, setSearchingByCpf] = useState(false)
  const [renewalFee, setRenewalFee] = useState(0)
  const [athleteDataFound, setAthleteDataFound] = useState(false)

  // Form
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filiationType: "NEW",
      fullName: "",
      cpf: "",
      email: "",
      cbcRegistration: "",
      birthDate: "",
      phone: "",
      zipCode: "",
      address: "",
      city: "",
      state: "",
      modalities: [],
      category: "",
      affiliationType: "INDIVIDUAL",
      clubId: ""
    },
  })

  // Efeitos
  useEffect(() => {
    if (!session) {
      router.push('/auth/login')
    }
  }, [session, router])

  // Efeito para atualizar estado de renovação quando tipo de filiação mudar
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'filiationType') {
        setIsRenewal(value.filiationType === 'RENEWAL');
        // Limpa o CPF quando alternar entre tipos de filiação para evitar verificações indesejadas
        if (value.filiationType !== 'RENEWAL') {
          form.setValue('cpf', '');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch])
  
  // Efeito para calcular preço com base nas modalidades selecionadas
  useEffect(() => {
    if (modalities.length > 0 && selectedModalities.length > 0) {
      const selectedMods = modalities.filter(mod => selectedModalities.includes(mod.id));
      if (selectedMods.length > 0) {
        // Aplicar a regra de usar o valor mais alto entre as modalidades selecionadas
        const highestPrice = Math.max(...selectedMods.map(m => Number(m.price)));
        setTotal(highestPrice);
      }
    } else {
      setTotal(0);
    }
  }, [modalities, selectedModalities])

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user) return
      
      try {
        setLoading(true)
        console.log('Buscando dados...')
        
        // Dados temporários para modalidades, categorias e clubes
        let modalidadesData: Modality[] = [];
        let categoriasData: Category[] = [];
        let clubesData: Club[] = [];
        
        // Tentar buscar modalidades
        try {
          const modalidadesRes = await fetch('/api/modalities');
          if (modalidadesRes.ok) {
            modalidadesData = await modalidadesRes.json();
            setModalities(modalidadesData);
          } else {
            console.warn('Não foi possível carregar modalidades');
            // Dados fictícios temporários para evitar quebra da interface
            modalidadesData = [
              { id: '1', name: 'Modalidade Exemplo', price: 100 }
            ];
            setModalities(modalidadesData);
          }
        } catch (err) {
          console.error('Erro ao buscar modalidades:', err);
          // Dados fictícios temporários para evitar quebra da interface
          modalidadesData = [
            { id: '1', name: 'Modalidade Exemplo', price: 100 }
          ];
          setModalities(modalidadesData);
        }
        
        // Tentar buscar categorias de filiação
        try {
          const categoriasRes = await fetch('/api/filiation-categories');
          if (categoriasRes.ok) {
            categoriasData = await categoriasRes.json();
            console.log('Categorias de filiação carregadas:', categoriasData);
            setCategories(categoriasData);
          } else {
            console.warn('Não foi possível carregar categorias de filiação');
            // Dados fictícios temporários para evitar quebra da interface
            categoriasData = [
              { id: '1', name: 'Categoria Exemplo' }
            ];
            setCategories(categoriasData);
          }
        } catch (err) {
          console.error('Erro ao buscar categorias de filiação:', err);
          // Dados fictícios temporários para evitar quebra da interface
          categoriasData = [
            { id: '1', name: 'Categoria Exemplo' }
          ];
          setCategories(categoriasData);
        }
        
        // Tentar buscar clubes
        try {
          const clubesRes = await fetch('/api/clubs');
          if (clubesRes.ok) {
            clubesData = await clubesRes.json();
            setClubs(clubesData);
          } else {
            console.warn('Não foi possível carregar clubes');
            // Dados fictícios temporários para evitar quebra da interface
            clubesData = [
              { id: '1', clubName: 'Clube Exemplo', responsibleName: 'Responsável' }
            ];
            setClubs(clubesData);
          }
        } catch (err) {
          console.error('Erro ao buscar clubes:', err);
          // Dados fictícios temporários para evitar quebra da interface
          clubesData = [
            { id: '1', clubName: 'Clube Exemplo', responsibleName: 'Responsável' }
          ];
          setClubs(clubesData);
        }

        // Calcular o preço total (maior valor entre as modalidades)
        if (selectedModalities.length > 0) {
          const selectedMods = modalidadesData.filter(
            (m: Modality) => selectedModalities.includes(m.id)
          );
          if (selectedMods.length > 0) {
            const highestPrice = Math.max(
              ...selectedMods.map((m: Modality) => Number(m.price))
            );
            setTotal(highestPrice);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [session, selectedModalities]);

  // Handlers
  const handleCepChange = async (cep: string) => {
    if (cep.replace(/\D/g, '').length !== 8) return;
    
    try {
      const endereco = await fetchAddressByCep(cep);
      if (endereco) {
        form.setValue('address', endereco.logradouro);
        form.setValue('city', endereco.cidade);
        form.setValue('state', endereco.estado);
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  // Handler para quando o tipo de filiação muda
  const handleAffiliationTypeChange = (value: string) => {
    const isClubMember = value === "CLUB";
    setIsIndividual(!isClubMember);
  };
  
  // Handler para quando a modalidade muda
  const handleModalityChange = async (modalityId: string) => {
    setSelectedModalityId(modalityId);
    setLoading(true);
    
    try {
      // Buscar categorias para a modalidade selecionada
      const response = await fetch(`/api/filiation-categories/by-modality?modalityId=${modalityId}`);
      
      if (response.ok) {
        const categoriesData = await response.json();
        setFilteredCategories(categoriesData);
        
        // Se já existia uma categoria selecionada, mas não está nas categorias filtradas, resetar
        const currentCategory = form.getValues('category');
        if (currentCategory) {
          const exists = categoriesData.some((cat: Category) => cat.id === currentCategory);
          if (!exists) {
            form.setValue('category', '');
          }
        }
      } else {
        // Se houver erro, mostrar todas as categorias
        setFilteredCategories(categories);
      }
    } catch (error) {
      console.error('Erro ao buscar categorias por modalidade:', error);
      setFilteredCategories(categories);
    } finally {
      setLoading(false);
    }
  };

  // Função para buscar dados do atleta por CPF para renovação
  const findAthleteByCpf = async (cpf: string) => {
    if (!cpf || cpf.length < 11) return;
    // Limpar CPF (remover caracteres não numéricos)
    const cleanedCpf = cpf.replace(/\D/g, "");
    
    // Verificar se já temos dados deste CPF (para evitar consultas repetidas)
    if (form.getValues('fullName') && form.getValues('cpf').replace(/\D/g, "") === cleanedCpf) return;
    
    if (cleanedCpf.length === 11 && !searchingByCpf) {
      try {
        setSearchingByCpf(true);
        setError(undefined);
        setAthleteDataFound(false); // Resetar o estado de dados encontrados
        
        const response = await fetch(`/api/filiacao/verificar-atleta?cpf=${cleanedCpf}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || "Erro ao buscar dados do atleta");
        }
        
        if (data && data.found && data.athlete) {
          // Preencher formulário com dados do atleta
          form.setValue('fullName', data.athlete.fullName || '');
          form.setValue('email', data.athlete.email || '');
          form.setValue('cbcRegistration', data.athlete.cbcRegistration || '');
          form.setValue('birthDate', data.athlete.birthDate || '');
          form.setValue('phone', data.athlete.phone || '');
          form.setValue('zipCode', data.athlete.zipCode || '');
          form.setValue('address', data.athlete.address || '');
          form.setValue('city', data.athlete.city || '');
          form.setValue('state', data.athlete.state || '');
          form.setValue('affiliationType', data.athlete.isIndividual ? 'INDIVIDUAL' : 'CLUB');
          form.setValue('clubId', data.athlete.clubId || '');
          form.setValue('category', data.athlete.category || '');
          
          if (!data.athlete.isIndividual) {
            setIsIndividual(false);
          } else {
            setIsIndividual(true);
          }
          
          // Verificar se tem modalidades
          if (data.athlete.modalities && data.athlete.modalities.length > 0) {
            form.setValue('modalities', data.athlete.modalities);
            setSelectedModalities(data.athlete.modalities);
          }
          
          // Não precisamos definir um valor total neste momento
          // O total será calculado quando o usuário selecionar as modalidades
          setAthleteDataFound(true); // Marcar que os dados foram encontrados
        } else if (data && !data.found) {
          setError("Nenhum atleta encontrado com este CPF.");
        }
      } catch (err: any) {
        console.error("Erro ao buscar atleta:", err);
        setError(err.message || "Erro ao buscar dados do atleta. Tente novamente.");
      } finally {
        setSearchingByCpf(false);
      }
    }
  };

  // Efeito para garantir que as modalidades selecionadas sejam corretamente definidas no formulário
  useEffect(() => {
    if (selectedModalities.length > 0) {
      console.log('Definindo modalidades no formulário:', selectedModalities);
      form.setValue('modalities', selectedModalities);
      
      // Se houver modalidades selecionadas, definir a primeira como a modalidade atual
      // para filtrar as categorias corretamente
      if (selectedModalities[0]) {
        handleModalityChange(selectedModalities[0]);
      }
    }
  }, [selectedModalities]);
  
  // Efeito para verificar CPF automaticamente quando o tipo de filiação for renovação
  useEffect(() => {
    // Apenas monitora mudanças no CPF quando o tipo de filiação for renovação
    if (!isRenewal) return;
    
    // Obtém o CPF atual do formulário
    const currentCpf = form.getValues('cpf');
    
    // Verifica se o CPF tem comprimento válido
    if (currentCpf && currentCpf.replace(/\D/g, '').length === 11 && !searchingByCpf) {
      // Usa um timeout para evitar múltiplas chamadas durante a digitação
      const timer = setTimeout(() => {
        findAthleteByCpf(currentCpf);
      }, 800); // Aguarda 800ms após o último caractere digitado
      
      return () => clearTimeout(timer); // Limpa o timeout se o efeito for executado novamente
    }
  }, [form.watch('cpf'), isRenewal]); // Observa mudanças no campo CPF e no estado isRenewal

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const values = form.getValues();
      
      // Limpar o CPF (remover caracteres não numéricos)
      if (values.cpf) {
        values.cpf = values.cpf.replace(/\D/g, "");
      }
      
      // Verificar se as modalidades foram selecionadas
      // Para renovações, usamos selectedModalities em vez de values.modalities
      // porque o React Hook Form pode não estar capturando corretamente as modalidades selecionadas
      const modalitiesForValidation = isRenewal ? selectedModalities : values.modalities;
      
      console.log('Modalidades para validação:', {
        fromValues: values.modalities,
        fromState: selectedModalities,
        using: modalitiesForValidation
      });
      
      if (!modalitiesForValidation || modalitiesForValidation.length === 0) {
        setError("Por favor, selecione pelo menos uma modalidade");
        console.log('Form validation failed: No modalities selected');
        return;
      }
      // Para renovações, vamos pular a validação com Zod completamente
      // e fazer nossa própria validação manual dos campos essenciais
      
      // Definir o tipo correto para o resultado da validação
      type ValidationResult = 
        | { success: true }
        | { success: false; error: { format: () => Record<string, any> } };
      
      let result: ValidationResult = { success: true };
      
      if (isRenewal) {
        console.log('Usando validação manual para renovação');
        
        // Verificar manualmente apenas os campos essenciais
        const essentialFields = {
          fullName: values.fullName,
          cpf: values.cpf,
          email: values.email,
          category: values.category,
          affiliationType: values.affiliationType
        };
        
        const missingFields = Object.entries(essentialFields)
          .filter(([_, value]) => !value || value.length === 0)
          .map(([key]) => key);
        
        if (missingFields.length > 0) {
          console.log('Campos essenciais faltando:', missingFields);
          result = { 
            success: false, 
            error: { 
              format: () => ({ 
                _errors: [], 
                ...Object.fromEntries(missingFields.map(field => [field, { _errors: ['Campo obrigatório'] }]))
              }) 
            } 
          };
        }
      } else {
        // Para novas filiações, validamos o formulário completo com Zod
        result = formSchema.safeParse(values);
        console.log('Validando nova filiação com esquema completo');
      }
      
      if (!result.success) {
        const fieldErrors = result.error.format();
        console.log('Form validation failed:', JSON.stringify(fieldErrors, null, 2));
        
        // Mostrar mensagem mais específica sobre quais campos estão faltando
        const errorFields = Object.keys(fieldErrors)
          .filter(key => key !== '_errors')
          .map(key => key);
          
        if (errorFields.length > 0) {
          setError(`Por favor, verifique os seguintes campos: ${errorFields.join(', ')}`);
        } else {
          setError("Por favor, preencha todos os campos obrigatórios.");
        }
        return;
      }
      
      // Verificar se o usuário já tem um atleta associado
      let existingAthleteId = null;
      try {
        const checkResponse = await fetch(`/api/athletes/by-user?userId=${session?.user?.id}`);
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.found && checkData.athlete) {
            existingAthleteId = checkData.athlete.id;
            console.log('Atleta existente encontrado:', existingAthleteId);
          }
        }
      } catch (checkError) {
        console.error('Erro ao verificar atleta existente:', checkError);
      }
      
      // Para renovações, vamos usar diretamente as modalidades do estado
      // e ignorar completamente o que está no formulário
      let modalitiesForPayload = isRenewal ? selectedModalities : values.modalities;
      
      // IMPORTANTE: Filtrar valores nulos ou indefinidos do array de modalidades
      if (modalitiesForPayload) {
        modalitiesForPayload = modalitiesForPayload.filter(m => m !== null && m !== undefined);
      } else {
        modalitiesForPayload = [];
      }
      
      console.log('Modalidades para o payload (após filtrar nulos):', {
        original: isRenewal ? selectedModalities : values.modalities,
        filtered: modalitiesForPayload
      });
      
      // Verificar novamente se há modalidades após filtrar nulos
      if (modalitiesForPayload.length === 0) {
        setError("Por favor, selecione pelo menos uma modalidade válida");
        console.log('Form validation failed: No valid modalities after filtering nulls');
        return;
      }
      
      // Construir payload para a API
      const payload = {
        ...values,
        isRenewal: isRenewal,
        userId: session?.user?.id,
        isIndividual: values.affiliationType === "INDIVIDUAL",
        // Se existir um atleta, enviar o ID para a API saber que é uma atualização
        athleteId: existingAthleteId,
        // Usar modalidades filtradas (sem nulos)
        modalities: modalitiesForPayload
      };
      
      console.log('Payload final:', payload);
      
      console.log('Submitting form with payload:', payload);
      
      // Enviar formulário
      const response = await fetch('/api/filiacao/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Erro ao processar filiação';
        
        // Personalizar mensagens de erro para torná-las mais amigáveis
        if (errorMessage.includes("Já existe um atleta cadastrado com este CPF")) {
          setError("Você já possui uma filiação. Para adicionar uma nova modalidade, selecione uma diferente da que você já está filiado.");
        } else if (errorMessage.includes("Você já está filiado na(s) modalidade(s)")) {
          // Manter a mensagem detalhada que vem da API
          setError(errorMessage);
        } else {
          setError(errorMessage);
        }
        return; // Interromper a execução para não prosseguir com o redirecionamento
      }
      
      // Redirecionar para página de pagamento ou confirmação
      if (data.isFreeModality) {
        router.push('/filiacao/confirmacao');
      } else {
        router.push(`/filiacao/pagamento/${data.paymentId}`);
      }
    } catch (error: any) {
      setError(error.message || 'Erro ao processar sua filiação');
      console.error('Erro:', error);
    }
  }

  if (!session) {
    return null
  }

  return (
    <div className="container mx-auto py-4 px-4 md:px-10 md:py-10">
      <Card className="w-full overflow-hidden shadow-md mx-auto max-w-4xl">
        <CardHeader className="border-b">
          <CardTitle className="text-center text-xl md:text-2xl">Formulário de Filiação</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form id="filiation-form" onSubmit={handleSubmit} className="space-y-8">
              {/* Tipo de Filiação - Primeiro elemento do formulário */}
              <div className="mb-6">
                <FormField
                  control={form.control}
                  name="filiationType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-lg font-medium">Tipo de Processo</FormLabel>
                      <FormControl>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${field.value === 'NEW' 
                              ? 'bg-blue-50 border-blue-500 shadow-sm' 
                              : 'bg-white border-gray-200 hover:border-blue-200'}`}
                            onClick={() => {
                              field.onChange("NEW");
                              // Resetar formulário se mudar de renovação para nova filiação
                              if (isRenewal) {
                                form.reset({
                                  ...form.getValues(),
                                  filiationType: "NEW",
                                  fullName: "",
                                  email: "",
                                  cbcRegistration: "",
                                  birthDate: "",
                                  phone: "",
                                  zipCode: "",
                                  address: "",
                                  city: "",
                                  state: "",
                                  modalities: [],
                                  category: "",
                                });
                                setSelectedModalities([]);
                                setTotal(0);
                              }
                            }}
                          >
                            <div className="text-center py-2">
                              <h3 className="font-medium">Primeira Filiação</h3>
                              <p className="text-xs text-gray-600 mt-1">Para atletas que nunca se filiaram anteriormente</p>
                            </div>
                          </div>
                          
                          <div 
                            className={`border rounded-lg p-3 cursor-pointer transition-all ${field.value === 'RENEWAL' 
                              ? 'bg-blue-50 border-blue-500 shadow-sm' 
                              : 'bg-white border-gray-200 hover:border-blue-200'}`}
                            onClick={() => field.onChange("RENEWAL")}
                          >
                            <div className="text-center py-2">
                              <h3 className="font-medium">Renovação de Filiação</h3>
                              <p className="text-xs text-gray-600 mt-1">Para atletas que já possuem filiação anterior</p>
                            </div>
                          </div>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {isRenewal && form.getValues('fullName') && selectedModalities.length > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-md">
                    <p className="text-sm text-blue-700">
                      O valor da renovação para {new Date().getFullYear()} é de 
                      <strong> R$ {total.toFixed(2)}</strong>
                      {selectedModalities.length > 1 && ' (baseado na modalidade de maior valor)'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Mensagem de erro */}
              {error && (
                <div className="bg-red-50 p-3 rounded-md mb-4">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              
              {/* Dados do formulário - visíveis conforme o fluxo */}
              {/* Caso seja renovação e ainda não tenha buscado os dados do atleta, mostra apenas o campo de CPF */}
              {isRenewal && form.getValues('filiationType') === 'RENEWAL' && !athleteDataFound ? (
                <div className="flex flex-col items-center p-4 sm:p-6 bg-blue-50 rounded-lg">
                  <div className="w-full max-w-md">
                    <h3 className="text-base sm:text-lg font-medium mb-2 sm:mb-3 text-center">Digite seu CPF para continuar</h3>
                    <p className="text-xs sm:text-sm text-center text-gray-600 mb-4">
                      Para renovar sua filiação, precisamos recuperar seus dados cadastrais.
                    </p>
                    <div className="mb-4">
                      <label htmlFor="cpf-input" className="block mb-1 text-sm font-medium">CPF</label>
                      <div className="flex items-center">
                        <input
                          id="cpf-input"
                          type="text"
                          value={form.getValues('cpf') || ''}
                          onChange={(e) => {
                            // Aplicar máscara manualmente
                            const value = e.target.value.replace(/\D/g, '');
                            let mask = value;
                            
                            if (value.length <= 3) {
                              mask = value;
                            } else if (value.length <= 6) {
                              mask = value.replace(/^(\d{3})(\d{0,3})/, "$1.$2");
                            } else if (value.length <= 9) {
                              mask = value.replace(/^(\d{3})(\d{3})(\d{0,3})/, "$1.$2.$3");
                            } else {
                              mask = value.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, "$1.$2.$3-$4");
                            }
                            
                            form.setValue('cpf', mask.substring(0, 14));
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="000.000.000-00"
                        />
                        {searchingByCpf && (
                          <div className="ml-2 flex items-center text-blue-600">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-sm">Buscando...</span>
                          </div>
                        )}
                      </div>
                      {form.formState.errors.cpf && (
                        <p className="mt-1 text-sm text-red-600">{form.formState.errors.cpf.message?.toString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                  {/* Campos pessoais */}
                  <div className="space-y-3 md:space-y-4 mb-6 md:mb-0">
                    <h3 className="text-lg font-medium border-b pb-2">Dados Pessoais</h3>
                  
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Nome Completo</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-full" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">CPF</FormLabel>
                        <FormControl>
                          <MaskedInput 
                            mask="cpf"
                            placeholder="000.000.000-00"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Email</FormLabel>
                        <FormControl>
                          <Input 
                            type="email"
                            placeholder="seu@email.com"
                            {...field} 
                            className="w-full" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cbcRegistration"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Número de Registro CBC (opcional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Número de registro na CBC"
                            {...field} 
                            className="w-full" 
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Data de Nascimento</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} className="w-full" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Telefone</FormLabel>
                        <FormControl>
                          <MaskedInput 
                            mask="phone"
                            placeholder="(00) 00000-0000"
                            {...field}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Endereço */}
                <div className="space-y-3 md:space-y-4">
                  <h3 className="text-lg font-medium border-b pb-2">Endereço</h3>
                  
                  <FormField
                    control={form.control}
                    name="zipCode"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">CEP</FormLabel>
                        <FormControl>
                          <MaskedInput 
                            mask="cep"
                            placeholder="00000-000"
                            {...field}
                            className="w-full"
                            onChange={(e) => {
                              field.onChange(e);
                              handleCepChange(e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Endereço</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-full" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Cidade</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-full" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem className="mb-3">
                        <FormLabel className="block mb-1 text-sm font-medium">Estado</FormLabel>
                        <FormControl>
                          <Input {...field} className="w-full" />
                        </FormControl>
                        <FormMessage className="text-xs" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Filiação e Total */}
                <div className="md:col-span-2 space-y-6 mt-6 md:mt-0">
                  <div className="space-y-3 md:space-y-4">
                    <h3 className="text-lg font-medium border-b pb-2">Filiação</h3>
                    
                    {/* Modalidades */}
                    <div className="relative z-[60]">
                      <FormField
                        control={form.control}
                        name="modalities"
                        render={() => (
                          <FormItem>
                            <div className="mb-2">
                              <FormLabel className="block mb-1 text-sm font-medium">Modalidades</FormLabel>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 border rounded-lg p-2 md:p-4">
                              {!loading && modalities.map((modality) => (
                                <FormField
                                  key={modality.id}
                                  control={form.control}
                                  name="modalities"
                                  render={({ field }) => {
                                    // Esta função é chamada para cada modalidade
                                    const isModalitySelected = field.value?.includes(modality.id);
                                    return (
                                      <FormItem
                                        key={modality.id}
                                        className="flex flex-row items-start space-x-2 space-y-0 p-1 rounded hover:bg-gray-50"
                                      >
                                        <FormControl>
                                           <Checkbox
                                            checked={isModalitySelected || selectedModalities.includes(modality.id)}
                                            onCheckedChange={(checked) => {
                                              // Atualizar tanto o campo do formulário quanto o estado
                                              let updatedModalities;
                                              
                                              if (checked) {
                                                // Criar um Set para garantir que não haja duplicatas
                                                const modalitiesSet = new Set([
                                                  ...(field.value || []), 
                                                  modality.id
                                                ]);
                                                updatedModalities = Array.from(modalitiesSet);
                                              } else {
                                                // Remover modalidade
                                                updatedModalities = [
                                                  ...(field.value || [])
                                                ]
                                                .filter(value => value !== modality.id);
                                              }
                                              
                                              // Atualizar tanto o formulário quanto o estado
                                              field.onChange(updatedModalities);
                                              setSelectedModalities(updatedModalities);
                                              console.log('Modalidades atualizadas:', updatedModalities);
                                              
                                              // Se modalidade for selecionada, também atualizamos a modalidade atual
                                              // para filtrar as categorias
                                              if (checked) {
                                                handleModalityChange(modality.id);
                                              } else if (updatedModalities.length > 0) {
                                                // Se desmarcar, mas ainda houver modalidades selecionadas,
                                                // usar a primeira modalidade selecionada
                                                handleModalityChange(updatedModalities[0]);
                                              } else {
                                                // Se não houver nenhuma modalidade selecionada, limpar as categorias
                                                setFilteredCategories([]);
                                                setSelectedModalityId('');
                                                form.setValue('category', '');
                                              }
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="text-xs md:text-sm font-normal cursor-pointer leading-tight">
                                          {modality.name} - R$ {Number(modality.price).toFixed(2)}
                                        </FormLabel>
                                      </FormItem>
                                    )
                                  }}
                                />
                              ))}
                            </div>
                            {/* Usando renderização condicional para prevenir undefined */}
                            {form.formState.errors.modalities ? (
                              <p className="text-sm font-medium text-destructive mt-2">
                                {form.formState.errors.modalities.message}
                              </p>
                            ) : null}
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Categoria */}
                    <div className="relative z-[65]">
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem className="mb-4">
                            <FormLabel className="block mb-1 text-sm font-medium">Categoria</FormLabel>
                            <FormControl>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={filteredCategories.length === 0}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={filteredCategories.length > 0 ? "Selecione uma categoria" : "Selecione uma modalidade primeiro"} />
                                </SelectTrigger>
                                {/* Re-adicionando position='popper' e className='z-[100]' do backup */}
                                <SelectContent id="category-select-content" position="popper" className="z-[100] bg-white">
                                  {filteredCategories.map((category) => (
                                    <SelectItem key={category.id} value={category.id}>
                                      {category.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Tipo de Atleta */}
                    <div className="relative z-[69]">
                      <FormField
                        control={form.control}
                        name="affiliationType"
                        render={({ field }) => (
                          <FormItem className="mb-3">
                            <FormLabel className="block mb-1 text-sm font-medium">Tipo de Atleta</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={(value) => {
                                  field.onChange(value);
                                  handleAffiliationTypeChange(value);
                                }}
                                className="flex flex-col sm:flex-row sm:space-x-6 space-y-2 sm:space-y-0"
                              >
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="INDIVIDUAL" />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    Atleta Avulso
                                  </FormLabel>
                                </FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <RadioGroupItem value="CLUB" />
                                  </FormControl>
                                  <FormLabel className="text-sm font-normal cursor-pointer">
                                    Vinculado a Clube
                                  </FormLabel>
                                </FormItem>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    {/* Clube (mostrado somente quando "Vinculado a Clube" está selecionado) */}
                    {!isIndividual && (
                      <div className="relative z-[65]">
                        <FormField
                          control={form.control}
                          name="clubId"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel className="block mb-1 text-sm font-medium">Clube</FormLabel>
                              <FormControl>
                                <Select
                                  value={field.value}
                                  onValueChange={field.onChange}
                                >
                                  <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Selecione um clube" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white">
                                    {clubs.map((club) => (
                                      <SelectItem key={club.id} value={club.id}>
                                        {club.clubName}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </FormControl>
                              <FormMessage className="text-xs" />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-medium mb-2">Total</h3>
                      <div className="text-xl md:text-2xl font-bold mb-2">
                        R$ {total.toFixed(2)}
                      </div>
                      <p className="text-xs md:text-sm text-gray-600">
                        * O valor da filiação é baseado na modalidade de maior valor entre as selecionadas.
                        Você poderá participar de todas as modalidades selecionadas pagando apenas o maior valor.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-between">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => router.push('/')}>Voltar ao Início</Button>
          <Button type="submit" form="filiation-form" className="w-full sm:w-auto">Prosseguir para Pagamento</Button>
        </CardFooter>
      </Card>
    </div>
  )
}
