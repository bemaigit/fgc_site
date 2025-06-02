'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { FiInfo } from 'react-icons/fi'
import { IconSelector } from './IconSelector'
import { Indicator, IndicatorFormData } from '@/types/indicator'

// Schema de validação usando Zod
const indicatorSchema = z.object({
  title: z.string().min(3, 'Título deve ter pelo menos 3 caracteres'),
  subtitle: z.string().optional(),
  value: z.string().min(1, 'Valor é obrigatório'),
  order: z.coerce.number().int().positive('Ordem deve ser um número positivo'),
  active: z.boolean().default(true),
  iconColor: z.string().optional(),
  backgroundColor: z.string().optional(),
  textColor: z.string().optional()
})

interface IndicatorFormProps {
  initialData?: Partial<Indicator>
  onSubmit: (data: IndicatorFormData & { icon: string }) => void
  onCancel: () => void
}

export function IndicatorForm({ initialData, onSubmit, onCancel }: IndicatorFormProps) {
  const [selectedIcon, setSelectedIcon] = useState(initialData?.icon || '')
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<IndicatorFormData>({
    resolver: zodResolver(indicatorSchema),
    defaultValues: initialData ? {
      ...initialData,
      // Converte para number caso seja string
      order: typeof initialData.order === 'string' ? parseInt(initialData.order) : initialData.order || 1
    } : {
      title: '',
      subtitle: '',
      value: '',
      order: 1,
      active: true,
      iconColor: '#08285d',
      backgroundColor: '#ffffff',
      textColor: '#000000'
    }
  })

  // Observar valores do formulário para a prévia
  const watchedValues = watch();

  // Handlers para sincronizar os inputs de cor
  const handleColorChange = (field: 'iconColor' | 'backgroundColor' | 'textColor', value: string) => {
    setValue(field, value);
  };

  // Reset form quando initialData mudar
  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        order: typeof initialData.order === 'string' ? parseInt(initialData.order) : initialData.order || 1
      })
      setSelectedIcon(initialData.icon || '')
    }
  }, [initialData, reset])

  const handleFormSubmit = (data: IndicatorFormData) => {
    onSubmit({
      ...data,
      icon: selectedIcon
    })
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Informações Básicas - Coluna 1 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('title')}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: Atletas Filiados"
            />
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtítulo
            </label>
            <input
              type="text"
              {...register('subtitle')}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: Ciclistas federados ativos"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register('value')}
              className="w-full p-2 border rounded-md"
              placeholder="Ex: 500+"
            />
            {errors.value && (
              <p className="text-red-500 text-sm mt-1">{errors.value.message}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ordem <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              {...register('order')}
              className="w-full p-2 border rounded-md"
              min="1"
            />
            {errors.order && (
              <p className="text-red-500 text-sm mt-1">{errors.order.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="active"
              {...register('active')}
              className="h-4 w-4 text-[#08285d] border-gray-300 rounded"
            />
            <label htmlFor="active" className="text-sm text-gray-700">
              Ativo
            </label>
          </div>
        </div>
        
        {/* Personalização Visual - Coluna 2 */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ícone
            </label>
            <IconSelector 
              selectedIcon={selectedIcon} 
              onSelectIcon={setSelectedIcon}
            />
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor do Ícone
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={watchedValues.iconColor || '#08285d'}
                  onChange={(e) => handleColorChange('iconColor', e.target.value)}
                  className="w-12 h-10 border rounded-l-md"
                />
                <input
                  type="text"
                  {...register('iconColor')}
                  onChange={(e) => handleColorChange('iconColor', e.target.value)}
                  className="flex-1 p-2 border border-l-0 rounded-r-md"
                  placeholder="#08285d"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor de Fundo
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={watchedValues.backgroundColor || '#ffffff'}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="w-12 h-10 border rounded-l-md"
                />
                <input
                  type="text"
                  {...register('backgroundColor')}
                  onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                  className="flex-1 p-2 border border-l-0 rounded-r-md"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cor do Texto
              </label>
              <div className="flex">
                <input
                  type="color"
                  value={watchedValues.textColor || '#000000'}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="w-12 h-10 border rounded-l-md"
                />
                <input
                  type="text"
                  {...register('textColor')}
                  onChange={(e) => handleColorChange('textColor', e.target.value)}
                  className="flex-1 p-2 border border-l-0 rounded-r-md"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-3 rounded-md flex items-start">
            <FiInfo className="text-blue-500 mt-1 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              As cores podem ser definidas usando valores hexadecimais (ex: #08285d) 
              ou nomes de cores (ex: blue).
            </p>
          </div>
        </div>
      </div>
      
      {/* Prévia - Corrigida para usar valores observados */}
      <div className="bg-gray-50 p-4 rounded-md">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Prévia</h3>
        <div 
          className="w-48 h-32 mx-auto rounded-lg shadow-md p-4 flex flex-col items-center justify-center"
          style={{
            backgroundColor: watchedValues.backgroundColor || '#ffffff',
            color: watchedValues.textColor || '#000000'
          }}
        >
          {selectedIcon && (
            <div className="text-3xl mb-2" style={{ color: watchedValues.iconColor || '#08285d' }}>
              <i className={selectedIcon}></i>
            </div>
          )}
          <div className="text-xl font-bold">{watchedValues.value || 'Valor'}</div>
          <div className="text-sm">{watchedValues.title || 'Título'}</div>
          {watchedValues.subtitle && (
            <div className="text-xs mt-1 opacity-70">{watchedValues.subtitle}</div>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
          disabled={isSubmitting}
        >
          Cancelar
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-[#08285d] text-white rounded-md"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Salvando...' : initialData ? 'Atualizar' : 'Criar'}
        </button>
      </div>
    </form>
  )
}
