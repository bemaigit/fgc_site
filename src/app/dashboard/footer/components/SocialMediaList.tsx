'use client'

import { useState } from 'react'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { SocialMedia } from '../types'

const socialMediaSchema = z.object({
  icon: z.string().min(1, 'Selecione uma rede social'),
  url: z.string().url('Digite uma URL válida'),
})

type SocialMediaFormData = z.infer<typeof socialMediaSchema>

interface SocialMediaListProps {
  socialMedia: SocialMedia[];
  onChange: (socialMedia: SocialMedia[]) => void;
}

const AVAILABLE_ICONS = [
  { label: 'Instagram', value: 'instagram' },
  { label: 'Facebook', value: 'facebook' },
  { label: 'Twitter', value: 'twitter' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'LinkedIn', value: 'linkedin' },
  { label: 'TikTok', value: 'tiktok' },
]

export function SocialMediaList({ socialMedia = [], onChange }: SocialMediaListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SocialMediaFormData>({
    resolver: zodResolver(socialMediaSchema),
  })

  const handleAdd = async (data: SocialMediaFormData) => {
    try {
      setIsLoading(true)
      const newItem = { icon: data.icon, url: data.url }
      onChange([...socialMedia, newItem])
      setShowAddForm(false)
      reset()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (index: number, data: SocialMediaFormData) => {
    try {
      setIsLoading(true)
      const updated = [...socialMedia]
      updated[index] = { icon: data.icon, url: data.url }
      onChange(updated)
      setEditingIndex(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (index: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta rede social?')) {
      const updated = socialMedia.filter((_, i) => i !== index)
      onChange(updated)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Redes Sociais</h3>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
          disabled={isLoading}
        >
          <Plus className="w-4 h-4" />
          Adicionar Rede Social
        </button>
      </div>

      <div className="space-y-2">
        {socialMedia.map((item, index) => (
          <div
            key={index}
            className="flex items-center justify-between p-2 bg-white border rounded-md hover:bg-gray-50"
          >
            {editingIndex === index ? (
              <div 
                className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
              >
                <div>
                  <select
                    {...register('icon')}
                    defaultValue={item.icon}
                    className="w-full px-3 py-2 border rounded-md"
                  >
                    <option value="">Selecione...</option>
                    {AVAILABLE_ICONS.map((icon) => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                  {errors.icon && (
                    <span className="text-sm text-red-500">{errors.icon.message}</span>
                  )}
                </div>
                <div>
                  <input
                    type="url"
                    {...register('url')}
                    defaultValue={item.url}
                    placeholder="https://..."
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  {errors.url && (
                    <span className="text-sm text-red-500">{errors.url.message}</span>
                  )}
                </div>
                <div className="md:col-span-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
                    disabled={isLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit((data) => handleUpdate(index, data))}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    Salvar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {AVAILABLE_ICONS.find(i => i.value === item.icon)?.label || item.icon}
                  </span>
                  <span className="text-sm text-gray-500">{item.url}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingIndex(index)}
                    className="p-1 text-gray-500 hover:text-blue-600"
                    disabled={isLoading}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="p-1 text-red-500 hover:text-red-700"
                    disabled={isLoading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {showAddForm && (
        <div 
          className="p-4 border rounded-md space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <select
                {...register('icon')}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">Selecione...</option>
                {AVAILABLE_ICONS.map((icon) => (
                  <option key={icon.value} value={icon.value}>
                    {icon.label}
                  </option>
                ))}
              </select>
              {errors.icon && (
                <span className="text-sm text-red-500">{errors.icon.message}</span>
              )}
            </div>
            <div>
              <input
                type="url"
                {...register('url')}
                placeholder="https://..."
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.url && (
                <span className="text-sm text-red-500">{errors.url.message}</span>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                reset()
              }}
              className="px-3 py-1 text-sm border rounded-md hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit(handleAdd)}
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={isLoading}
            >
              Adicionar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
