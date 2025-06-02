'use client'

import { useState } from 'react'
import { HeaderMenu } from '@prisma/client'
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

interface MenuListProps {
  items: HeaderMenu[]
  onAddItem: (data: MenuItemFormData) => Promise<void>
  onUpdateItem: (id: string, data: MenuItemFormData) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  onReorderItems: (items: HeaderMenu[]) => Promise<void>
}

export function MenuList({ items, onAddItem, onUpdateItem, onDeleteItem, onReorderItems }: MenuListProps) {
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
      // Atualiza o item localmente
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, ...data } : item
      )
      // Força a re-renderização do componente
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

    // Atualiza a ordem dos itens
    const updatedItems = reorderedItems.map((item, index) => ({
      ...item,
      order: index,
    }))

    await onReorderItems(updatedItems)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Itens do Menu</h3>
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#08285d] text-white rounded-lg hover:bg-[#177cc3] transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Item</span>
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit(handleAddSubmit)} className="bg-gray-50 p-4 rounded-lg space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Texto do Menu
              </label>
              <input
                type="text"
                {...register('label')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.label && (
                <p className="text-red-500 text-sm mt-1">{errors.label.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL
              </label>
              <input
                type="text"
                {...register('url')}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              {errors.url && (
                <p className="text-red-500 text-sm mt-1">{errors.url.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('requireAuth')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Requer Autenticação</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                {...register('isActive')}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Ativo</span>
            </label>
          </div>

          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-[#08285d] text-white rounded-lg hover:bg-[#177cc3] transition-colors duration-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      )}

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="menu-items">
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
                      className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                    >
                      {editingId === item.id ? (
                        <form 
                          onSubmit={handleSubmit((data) => handleUpdateSubmit(item.id, data))}
                          className="space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Texto do Menu
                              </label>
                              <input
                                type="text"
                                {...register('label')}
                                defaultValue={item.label}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                URL
                              </label>
                              <input
                                type="text"
                                {...register('url')}
                                defaultValue={item.url}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                {...register('requireAuth')}
                                defaultChecked={item.requireAuth}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Requer Autenticação</span>
                            </label>

                            <label className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                {...register('isActive')}
                                defaultChecked={item.isActive}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm text-gray-700">Ativo</span>
                            </label>
                          </div>

                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="px-4 py-2 text-gray-700 bg-white border rounded-lg hover:bg-gray-50"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="flex items-center space-x-2 px-4 py-2 bg-[#08285d] text-white rounded-lg hover:bg-[#177cc3] transition-colors duration-200 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                              <span>Salvar</span>
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium">{item.label}</span>
                            <span className="text-sm text-gray-500">{item.url}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="p-1 text-gray-500 hover:text-gray-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-gray-500 hover:text-red-600"
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
