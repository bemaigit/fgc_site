import React, { useEffect, useState } from 'react';
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import "@/styles/select-fix.css";

interface Category {
  id: string;
  name: string;
}

interface CategorySelectorProps {
  form: any;
  selectedModalityIds: string[];
}

export function CategorySelector({ form, selectedModalityIds }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // Buscar categorias filtradas diretamente da API
  useEffect(() => {
    const fetchFilteredCategories = async () => {
      try {
        // Se não houver modalidades selecionadas, limpar as categorias
        if (selectedModalityIds.length === 0) {
          setCategories([]);
          return;
        }
        
        setLoading(true);
        console.log('Buscando categorias para modalidades:', selectedModalityIds);

        // Usar a API correta de filtragem
        const response = await fetch('/api/filiacao/categorias/filtrar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modalityIds: selectedModalityIds })
        });

        if (!response.ok) {
          throw new Error(`Erro ${response.status}`);
        }

        // Obter categorias filtradas
        const filteredCategories = await response.json();
        console.log(`Recebidas ${filteredCategories.length} categorias filtradas`);
        
        // Atualizar estado
        setCategories(filteredCategories);
        
        // Auto-selecionar se houver apenas uma categoria
        if (filteredCategories.length === 1) {
          console.log('Auto-selecionando categoria:', filteredCategories[0].name);
          form.setValue('category', filteredCategories[0].id, { shouldValidate: true });
        } else if (form.getValues('category')) {
          // Verificar se a categoria atual ainda existe nas filtradas
          const currentCategoryId = form.getValues('category');
          const categoryExists = filteredCategories.some((cat: Category) => cat.id === currentCategoryId);
          
          if (!categoryExists) {
            // Limpar seleção se categoria não existir mais
            form.setValue('category', '', { shouldValidate: true });
          }
        }
      } catch (error) {
        console.error('Erro ao buscar categorias filtradas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilteredCategories();
  }, [selectedModalityIds, form]);

  return (
    <FormField
      control={form.control}
      name="category"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Categoria</FormLabel>
          <Select 
            onValueChange={field.onChange} 
            value={field.value}
            disabled={selectedModalityIds.length === 0 || loading}
          >
            <FormControl>
              <SelectTrigger>
                <SelectValue 
                  placeholder={
                    selectedModalityIds.length === 0 
                      ? "Selecione modalidades primeiro" 
                      : loading 
                        ? "Carregando..." 
                        : categories.length === 0 
                          ? "Nenhuma categoria disponível" 
                          : "Selecione uma categoria"
                  } 
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent className="bg-white text-black border shadow-md backdrop-blur-none select-dropdown-fix" style={{ backgroundColor: 'white' }}>
              {loading ? (
                <div className="p-2 text-center bg-white text-black">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto text-gray-500" />
                  <span className="text-xs mt-1">Carregando categorias...</span>
                </div>
              ) : categories.length === 0 ? (
                <div className="p-2 text-center text-gray-500 text-sm bg-white">
                  {selectedModalityIds.length === 0 
                    ? "Selecione modalidades primeiro" 
                    : "Nenhuma categoria disponível para as modalidades selecionadas"}
                </div>
              ) : (
                categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id} 
                    className="bg-white hover:bg-gray-100 text-black" 
                    style={{ backgroundColor: 'white' }}
                  >
                    {category.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
