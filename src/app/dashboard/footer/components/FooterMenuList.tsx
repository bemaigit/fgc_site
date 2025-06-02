'use client'

import { useState } from 'react'
import { FooterMenu } from '@prisma/client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

const menuItemSchema = z.object({
  label: z.string().min(1, 'O texto do menu é obrigatório'),
  url: z.string().min(1, 'A URL é obrigatória'),
  requireAuth: z.boolean().default(false),
  roles: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

type MenuItemFormData = z.infer<typeof menuItemSchema>

interface FooterMenuListProps {
  items?: FooterMenu[]
  onAddItem: (data: MenuItemFormData) => Promise<void>
  onUpdateItem: (id: string, data: MenuItemFormData) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  onReorderItems: (items: FooterMenu[]) => Promise<void>
}

export function FooterMenuList({ 
  items = [], 
  onAddItem, 
  onUpdateItem, 
  onDeleteItem, 
  onReorderItems 
}: FooterMenuListProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MenuItemFormData>({
    resolver: zodResolver(menuItemSchema),
  })

  const handleAddSubmit = async (data: MenuItemFormData) => {
    try {
      setIsLoading(true)
      await onAddItem(data)
      setShowAddForm(false)
      reset()
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateSubmit = async (id: string, data: MenuItemFormData) => {
    try {
      setIsLoading(true)
      await onUpdateItem(id, data)
      setEditingId(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este item do menu?')) {
      try {
        setIsLoading(true)
        await onDeleteItem(id)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return

    const reorderedItems = Array.from(items)
    const [reorderedItem] = reorderedItems.splice(result.source.index, 1)
    reorderedItems.splice(result.destination.index, 0, reorderedItem)

    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index,
    }))

    await onReorderItems(updatedItems)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Menus do Footer</h3>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          disabled={isLoading || showAddForm}
          className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar Menu
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit(handleAddSubmit)} className="p-4 bg-gray-50 rounded-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Texto do Menu</label>
              <input
                type="text"
                {...register('label')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.label && (
                <p className="text-red-500 text-sm mt-1">{errors.label.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">URL</label>
              <input
                type="text"
                {...register('url')}
                className="w-full px-3 py-2 border rounded-md"
              />
              {errors.url && (
                <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="w-4 h-4"
              />
              <span className="text-sm">Ativo</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('requireAuth')}
                className="w-4 h-4"
              />
              <span className="text-sm">Requer Autenticação</span>
            </label>
          </div>

          <div className="mt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowAddForm(false)
                reset()
              }}
              disabled={isLoading}
              className="px-3 py-1 border rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="footer-menu-list">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="bg-white p-4 rounded-md shadow-sm border"
                    >
                      {editingId === item.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            handleUpdateSubmit(item.id, {
                              label: (e.currentTarget.label as any).value,
                              url: (e.currentTarget.url as any).value,
                              isActive: (e.currentTarget.isActive as any).checked,
                              requireAuth: (e.currentTarget.requireAuth as any).checked,
                              roles: [],
                            })
                          }}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-1">
                                Texto do Menu
                              </label>
                              <input
                                type="text"
                                name="label"
                                defaultValue={item.label}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium mb-1">
                                URL
                              </label>
                              <input
                                type="text"
                                name="url"
                                defaultValue={item.url}
                                className="w-full px-3 py-2 border rounded-md"
                              />
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                name="isActive"
                                defaultChecked={item.isActive}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Ativo</span>
                            </label>

                            <label className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                name="requireAuth"
                                defaultChecked={item.requireAuth}
                                className="w-4 h-4"
                              />
                              <span className="text-sm">Requer Autenticação</span>
                            </label>
                          </div>

                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              disabled={isLoading}
                              className="px-3 py-1 border rounded-md hover:bg-gray-50"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{item.label}</h4>
                            <p className="text-sm text-gray-500">{item.url}</p>
                            <div className="flex gap-2 mt-1">
                              {!item.isActive && (
                                <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-800 rounded">
                                  Inativo
                                </span>
                              )}
                              {item.requireAuth && (
                                <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded">
                                  Requer Auth
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(item.id)}
                              disabled={isLoading}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              disabled={isLoading}
                              className="p-1 hover:bg-gray-100 rounded text-red-600"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  )
}
