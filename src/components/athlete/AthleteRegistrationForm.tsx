"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MaskedInput } from "@/components/ui/input-mask";
import { Loader2 } from "lucide-react";
import { fetchAddressByCep } from "@/lib/cep";
import { useToast } from "@/components/ui/use-toast";
import { CategorySelector } from "./CategorySelector";

// Schema de validação para o formulário de atleta
const athleteFormSchema = z.object({
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
  category: z.string().min(1, "Selecione uma categoria"),
});

interface Category {
  id: string;
  name: string;
}

interface Modality {
  id: string;
  name: string;
  price: number;
}

interface AthleteRegistrationFormProps {
  clubId: string;
  onSuccess: () => void;
}

export function AthleteRegistrationForm({ clubId, onSuccess }: AthleteRegistrationFormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [modalities, setModalities] = useState<Modality[]>([]);
  const [selectedModalities, setSelectedModalities] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Inicializar o formulário
  const form = useForm<z.infer<typeof athleteFormSchema>>({
    resolver: zodResolver(athleteFormSchema),
    defaultValues: {
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
    },
  });

  // Carregar categorias e modalidades ao montar o componente
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Carregamos apenas as modalidades inicialmente
        const modalidadesRes = await fetch('/api/filiacao/modalidades');

        if (!modalidadesRes.ok) {
          toast({
            title: "Erro",
            description: "Falha ao carregar modalidades",
            variant: "destructive",
          });
          return;
        }

        const modalidadesData = await modalidadesRes.json();
        setModalities(modalidadesData);
        
        // Se não há modalidades selecionadas, carregar todas as categorias
        if (selectedModalities.length === 0) {
          const categoriasRes = await fetch('/api/filiacao/categorias');
          if (categoriasRes.ok) {
            const categoriasData = await categoriasRes.json();
            setCategories(categoriasData);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast({
          title: "Erro",
          description: "Falha ao carregar dados necessários",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast, selectedModalities.length === 0]);

  // Atualizar modalidades selecionadas quando o formulário muda
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'modalities') {
        setSelectedModalities(value.modalities as string[] || []);
        
        // Limpar a categoria selecionada quando as modalidades mudam
        form.setValue('category', '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form, form.watch]);
  
  // Não precisamos mais deste useEffect para buscar categorias, pois isso será feito no CategorySelector

  // Handler para busca de CEP
  const handleCepChange = async (cep: string) => {
    if (cep.length === 9) { // Formato: 00000-000
      try {
        const address = await fetchAddressByCep(cep);
        if (address) {
          form.setValue('address', address.logradouro);
          form.setValue('city', address.cidade);
          form.setValue('state', address.estado);
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        toast({
          title: "Erro",
          description: error instanceof Error ? error.message : 'Erro ao buscar CEP',
          variant: "destructive",
        });
      }
    }
  };

  // Enviar formulário
  const onSubmit = async (data: z.infer<typeof athleteFormSchema>) => {
    try {
      setSubmitting(true);
      
      // Limpar formatação dos campos
      const cleanedData = {
        ...data,
        cpf: data.cpf.replace(/\D/g, ''),
        phone: data.phone.replace(/\D/g, ''),
        zipCode: data.zipCode.replace(/\D/g, ''),
        // Adicionar flag de clube - somente se clubId for válido
        isIndividual: !clubId || clubId === '',
        clubId: clubId && clubId !== '' ? clubId : null,
        // Adicionar flag para indicar o tipo de filiação
        affiliationType: clubId && clubId !== '' ? 'CLUB' : 'INDIVIDUAL'
      };
      
      const response = await fetch('/api/filiacao/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedData)
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao registrar atleta');
      }

      toast({
        title: "Sucesso",
        description: "Atleta registrado com sucesso",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao submeter formulário:', error);
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao registrar o atleta',
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-2">Carregando formulário...</p>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Dados Pessoais</h3>
            
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome completo do atleta" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cpf"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CPF</FormLabel>
                  <FormControl>
                    <MaskedInput 
                      mask="cpf"
                      placeholder="000.000.000-00"
                      {...field}
                    />
                  </FormControl>
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
                    <Input type="email" placeholder="email@exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
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
              control={form.control}
              name="cbcRegistration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registro CBC (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Número de registro CBC" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Endereço e Modalidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Endereço e Modalidades</h3>
            
            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>CEP</FormLabel>
                  <FormControl>
                    <MaskedInput 
                      mask="cep"
                      placeholder="00000-000"
                      {...field}
                      onBlur={(e) => handleCepChange(e.target.value)}
                    />
                  </FormControl>
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

            {/* Substituir pelo novo componente dedicado à seleção de categorias */}
            <CategorySelector form={form} selectedModalityIds={selectedModalities} />

            <FormField
              control={form.control}
              name="modalities"
              render={() => (
                <FormItem>
                  <FormLabel>Modalidades</FormLabel>
                  <div className="space-y-2">
                    {modalities.map((modality) => (
                      <div key={modality.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`modality-${modality.id}`}
                          checked={selectedModalities.includes(modality.id)}
                          onChange={(e) => {
                            const updatedModalities = e.target.checked
                              ? [...selectedModalities, modality.id]
                              : selectedModalities.filter(id => id !== modality.id);
                            
                            form.setValue('modalities', updatedModalities, { 
                              shouldValidate: true 
                            });
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary"
                        />
                        <label htmlFor={`modality-${modality.id}`} className="text-sm">
                          {modality.name} - R$ {modality.price.toFixed(2)}
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={onSuccess}>
            Cancelar
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Registrar Atleta"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
