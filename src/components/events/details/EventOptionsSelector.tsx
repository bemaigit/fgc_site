'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { useEffect, useState, useMemo } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { EventDetails } from "@/types/event-details"

interface EventOptionsSelectorProps {
  event: EventDetails
  currentModality?: string
  currentCategory?: string
  currentGender?: string
  onSelectModality: (modality: string) => void
  onSelectCategory: (category: string) => void
  onSelectGender: (gender: string) => void
  readOnly?: boolean
}

export function EventOptionsSelector({
  event,
  currentModality,
  currentCategory,
  currentGender,
  onSelectModality,
  onSelectCategory,
  onSelectGender,
  readOnly = false
}: EventOptionsSelectorProps) {
  // Limpar seleções anteriores quando o gênero muda
  useEffect(() => {
    if (currentGender) {
      // Se mudar o gênero, resetar modalidade e categoria
      onSelectModality('');
      onSelectCategory('');
    }
  }, [currentGender, onSelectModality, onSelectCategory]);

  // Limpar categoria quando modalidade muda
  useEffect(() => {
    if (currentModality !== undefined) {
      onSelectCategory('');
    }
  }, [currentModality, onSelectCategory]);

  // Filtrar modalidades e categorias baseadas no gênero selecionado
  const filteredModalities = useMemo(() => {
    if (!currentGender) return [];
    
    // Implementar lógica de filtragem com base nas relações do evento
    // Aqui estamos assumindo que o evento já tenha essas relações definidas
    // Se não houver uma estrutura de relacionamento explícita, retornar todas as modalidades
    return event.modalities;
  }, [event, currentGender]);

  const filteredCategories = useMemo(() => {
    if (!currentGender || !currentModality) return [];
    
    // Implementar lógica de filtragem com base nas relações do evento
    // Filtrando categorias que são compatíveis com a modalidade e gênero selecionados
    return event.categories;
  }, [event, currentGender, currentModality]);

  // Renderiza o valor fixo para o modo somente leitura
  const renderFixedValue = (label: string, value?: string) => {
    if (!value) return null;
    
    return (
      <div className="p-4 bg-gray-50 rounded-md border border-gray-200">
        <p className="text-sm text-gray-500">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Seleção de Gênero - PRIMEIRO */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-4">Gênero</h3>
          
          {readOnly && currentGender ? (
            renderFixedValue("Gênero selecionado", event.genders.find(g => g.id === currentGender)?.name)
          ) : (
            <RadioGroup
              value={currentGender}
              onValueChange={onSelectGender}
              className="grid grid-cols-2 gap-4"
            >
              {event.genders.map((gender) => (
                <div key={gender.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={gender.id} id={`gender-${gender.id}`} />
                  <Label htmlFor={`gender-${gender.id}`}>{gender.name}</Label>
                </div>
              ))}
            </RadioGroup>
          )}
        </CardContent>
      </Card>

      {/* Seleção de Modalidade - SEGUNDO (após selecionar gênero) */}
      {currentGender && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Modalidade</h3>
            
            {readOnly && currentModality ? (
              renderFixedValue("Modalidade selecionada", event.modalities.find(m => m.id === currentModality)?.name)
            ) : (
              <RadioGroup
                value={currentModality}
                onValueChange={onSelectModality}
                className="grid grid-cols-2 gap-4"
              >
                {filteredModalities.map((modality) => (
                  <div key={modality.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={modality.id} id={`modality-${modality.id}`} />
                    <Label htmlFor={`modality-${modality.id}`}>{modality.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}

      {/* Seleção de Categoria - TERCEIRO (após selecionar modalidade) */}
      {currentGender && currentModality && (
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Categoria</h3>
            
            {readOnly && currentCategory ? (
              renderFixedValue("Categoria selecionada", event.categories.find(c => c.id === currentCategory)?.name)
            ) : (
              <RadioGroup
                value={currentCategory}
                onValueChange={onSelectCategory}
                className="grid grid-cols-2 gap-4"
              >
                {filteredCategories.map((category) => (
                  <div key={category.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={category.id} id={`category-${category.id}`} />
                    <Label htmlFor={`category-${category.id}`}>{category.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
