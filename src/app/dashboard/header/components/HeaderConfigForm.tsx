'use client'

import { useState } from 'react'
import { HeaderConfig } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save } from 'lucide-react'
import { LogoUploader } from './LogoUploader'
import { HexColorPicker } from 'react-colorful'
import Image from 'next/image'
import { processHeaderLogoUrl } from '@/lib/processHeaderLogoUrl'

const headerConfigSchema = z.object({
  logo: z.string().min(1, 'A logo é obrigatória'),
  background: z.string().min(1, 'A cor de fundo é obrigatória'),
  hoverColor: z.string().min(1, 'A cor do hover é obrigatória'),
  textColor: z.string().min(1, 'A cor do texto é obrigatória'),
})

type HeaderConfigFormData = z.infer<typeof headerConfigSchema>

interface HeaderConfigFormProps {
  initialData: HeaderConfig
  onSubmit: (data: HeaderConfigFormData) => Promise<void>
}

// Usar nossa função de processamento de URLs
const getFullImageUrl = (path: string) => {
  return processHeaderLogoUrl(path)
}

export function HeaderConfigForm({ initialData, onSubmit }: HeaderConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [previewLogo, setPreviewLogo] = useState(getFullImageUrl(initialData.logo))
  const [showColorPicker, setShowColorPicker] = useState<'background' | 'hover' | 'text' | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<HeaderConfigFormData>({
    resolver: zodResolver(headerConfigSchema),
    defaultValues: {
      logo: initialData.logo,
      background: initialData.background,
      hoverColor: initialData.hoverColor,
      textColor: initialData.textColor,
    },
  })

  const watchBackground = watch('background')
  const watchHoverColor = watch('hoverColor')
  const watchTextColor = watch('textColor')

  const handleFormSubmit = async (data: HeaderConfigFormData) => {
    try {
      setIsLoading(true)
      await onSubmit(data)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Preview do Header */}
      <div 
        className="w-full h-16 flex items-center justify-between px-4 mb-6"
        style={{ backgroundColor: watchBackground }}
      >
        <div className="flex items-center space-x-4">
          <div className="relative h-8 w-24">
            <Image 
              src={processHeaderLogoUrl(previewLogo)}
              alt="Logo Preview" 
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <div className="hidden md:flex space-x-4">
            <span style={{ color: watchTextColor }}>Menu 1</span>
            <span style={{ color: watchTextColor }}>Menu 2</span>
            <span style={{ color: watchTextColor }}>Menu 3</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: watchHoverColor,
              color: watchTextColor
            }}
          >
            Entrar
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg transition-colors duration-200"
            style={{ 
              backgroundColor: 'transparent',
              border: `1px solid ${watchTextColor}`,
              color: watchTextColor
            }}
          >
            Cadastrar
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Logo
          </label>
          <LogoUploader
            currentLogo={previewLogo}
            onLogoChange={(logo) => {
              setValue('logo', logo)
              setPreviewLogo(logo)
            }}
          />
          {errors.logo && (
            <p className="text-red-500 text-sm mt-1">{errors.logo.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cor de Fundo
          </label>
          <div className="relative">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
                className="h-10 w-10 rounded border"
                style={{ backgroundColor: watch('background') }}
              />
              <input
                type="text"
                {...register('background')}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showColorPicker === 'background' && (
              <div className="absolute z-10 mt-2">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowColorPicker(null)}
                />
                <div className="relative">
                  <HexColorPicker
                    color={watch('background')}
                    onChange={(color) => setValue('background', color)}
                  />
                </div>
              </div>
            )}
          </div>
          {errors.background && (
            <p className="text-red-500 text-sm mt-1">{errors.background.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cor do Hover
          </label>
          <div className="relative">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowColorPicker(showColorPicker === 'hover' ? null : 'hover')}
                className="h-10 w-10 rounded border"
                style={{ backgroundColor: watch('hoverColor') }}
              />
              <input
                type="text"
                {...register('hoverColor')}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showColorPicker === 'hover' && (
              <div className="absolute z-10 mt-2">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowColorPicker(null)}
                />
                <div className="relative">
                  <HexColorPicker
                    color={watch('hoverColor')}
                    onChange={(color) => setValue('hoverColor', color)}
                  />
                </div>
              </div>
            )}
          </div>
          {errors.hoverColor && (
            <p className="text-red-500 text-sm mt-1">{errors.hoverColor.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cor do Texto
          </label>
          <div className="relative">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
                className="h-10 w-10 rounded border"
                style={{ backgroundColor: watch('textColor') }}
              />
              <input
                type="text"
                {...register('textColor')}
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {showColorPicker === 'text' && (
              <div className="absolute z-10 mt-2">
                <div 
                  className="fixed inset-0" 
                  onClick={() => setShowColorPicker(null)}
                />
                <div className="relative">
                  <HexColorPicker
                    color={watch('textColor')}
                    onChange={(color) => setValue('textColor', color)}
                  />
                </div>
              </div>
            )}
          </div>
          {errors.textColor && (
            <p className="text-red-500 text-sm mt-1">{errors.textColor.message}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center space-x-2 px-4 py-2 bg-[#08285d] text-white rounded-lg hover:bg-[#177cc3] transition-colors duration-200 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>Salvar Alterações</span>
        </button>
      </div>
    </form>
  )
}
