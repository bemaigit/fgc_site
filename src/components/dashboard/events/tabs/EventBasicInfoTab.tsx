'use client'

import React, { useEffect, useState, useRef } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FormErrorMessage } from '@/components/ui/form-error-message'

// Definindo o tipo para o DatePicker
interface DatePickerProps {
  id: string;
  selected: Date | null;
  onSelect: (date: Date | null) => void;
  placeholder: string;
}

// Componente DatePicker temporário até resolver a importação
const DatePicker: React.FC<DatePickerProps> = ({ id, selected, onSelect, placeholder }) => {
  return (
    <Input
      id={id}
      type="date"
      value={selected ? selected.toISOString().split('T')[0] : ''}
      onChange={(e) => {
        const date = e.target.value ? new Date(e.target.value) : null;
        onSelect(date);
      }}
      placeholder={placeholder}
    />
  );
};

export function EventBasicInfoTab() {
  const { formData, updateBasicInfo, errors } = useEventForm()
  const { basicInfo } = formData
  const [slugError, setSlugError] = useState<string | null>(null)
  const [isValidatingSlug, setIsValidatingSlug] = useState(false)
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false)
  const previousTitleRef = useRef<string>('')

  // Função para gerar slug a partir do título
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Substitui espaços por hífens
      .replace(/--+/g, '-') // Remove hífens duplicados
      .trim() // Remove espaços no início e fim
  }

  // Atualiza o slug quando o título muda, a menos que tenha sido editado manualmente
  useEffect(() => {
    // Só atualiza se o título mudou desde a última verificação
    if (basicInfo.title && !slugManuallyEdited && basicInfo.title !== previousTitleRef.current) {
      previousTitleRef.current = basicInfo.title
      const newSlug = generateSlug(basicInfo.title)
      
      // Só atualiza se o slug gerado for diferente do atual
      if (newSlug !== basicInfo.slug) {
        updateBasicInfo({ slug: newSlug })
      }
    }
  }, [basicInfo.title, basicInfo.slug, updateBasicInfo, slugManuallyEdited])

  // Função para validar o slug
  const validateSlug = async (slug: string) => {
    if (!slug) {
      setSlugError('URL personalizada é obrigatória')
      return false
    }

    try {
      setIsValidatingSlug(true)
      // Verifica se o slug já existe
      const response = await fetch(`/api/events/validate-slug?slug=${slug}`)
      const data = await response.json()

      if (!response.ok) {
        setSlugError('Erro ao validar URL personalizada')
        return false
      }

      if (!data.available) {
        setSlugError('Esta URL personalizada já está em uso')
        return false
      }

      setSlugError(null)
      return true
    } catch (error) {
      console.error('Erro ao validar slug:', error)
      setSlugError('Erro ao validar URL personalizada')
      return false
    } finally {
      setIsValidatingSlug(false)
    }
  }

  // Manipulador para mudança no slug
  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSlug = e.target.value
      .toLowerCase()
      .replace(/[^\w-]/g, '') // Permite apenas letras, números e hífens
    
    updateBasicInfo({ slug: newSlug })
    setSlugManuallyEdited(true) // Marca que o slug foi editado manualmente
  }

  // Validar slug quando perder o foco
  const handleSlugBlur = () => {
    if (basicInfo.slug) {
      validateSlug(basicInfo.slug)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título do Evento</Label>
              <Input
                id="title"
                value={basicInfo.title || ''}
                onChange={(e) => updateBasicInfo({ title: e.target.value })}
                placeholder="Digite o título do evento"
              />
              {errors.title && (
                <FormErrorMessage>{errors.title[0]}</FormErrorMessage>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Personalizada</Label>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">eventos/</span>
                <Input
                  id="slug"
                  value={basicInfo.slug || ''}
                  onChange={handleSlugChange}
                  onBlur={handleSlugBlur}
                  placeholder="url-do-seu-evento"
                  className={slugError ? 'border-red-500' : ''}
                  disabled={isValidatingSlug}
                />
              </div>
              {slugError && (
                <FormErrorMessage>{slugError}</FormErrorMessage>
              )}
              <p className="text-xs text-muted-foreground">
                Use apenas letras minúsculas, números e hífens. Sem espaços ou caracteres especiais.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={basicInfo.description || ''}
                onChange={(e) => updateBasicInfo({ description: e.target.value })}
                placeholder="Digite a descrição do evento"
                rows={5}
              />
              {errors.description && (
                <FormErrorMessage>{errors.description[0]}</FormErrorMessage>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data de Início</Label>
                <DatePicker
                  id="startDate"
                  selected={basicInfo.startDate ? new Date(basicInfo.startDate) : null}
                  onSelect={(date: Date | null) => updateBasicInfo({ startDate: date })}
                  placeholder="Selecione a data de início"
                />
                {errors.startDate && (
                  <FormErrorMessage>{errors.startDate[0]}</FormErrorMessage>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">Data de Término</Label>
                <DatePicker
                  id="endDate"
                  selected={basicInfo.endDate ? new Date(basicInfo.endDate) : null}
                  onSelect={(date: Date | null) => updateBasicInfo({ endDate: date })}
                  placeholder="Selecione a data de término"
                />
                {errors.endDate && (
                  <FormErrorMessage>{errors.endDate[0]}</FormErrorMessage>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationEnd">Data Limite de Inscrição</Label>
                <DatePicker
                  id="registrationEnd"
                  selected={basicInfo.registrationEnd ? new Date(basicInfo.registrationEnd) : null}
                  onSelect={(date: Date | null) => updateBasicInfo({ registrationEnd: date })}
                  placeholder="Selecione a data limite"
                />
                {errors.registrationEnd && (
                  <FormErrorMessage>{errors.registrationEnd[0]}</FormErrorMessage>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
