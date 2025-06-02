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

interface MenuListProps {
  items: FooterMenu[]
  onAddItem: (data: MenuItemFormData) => Promise<void>
  onUpdateItem: (id: string, data: MenuItemFormData) => Promise<void>
  onDeleteItem: (id: string) => Promise<void>
  onReorderItems: (items: FooterMenu[]) => Promise<void>
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
        <form onSubmit={handleSubmit(handleAddSubmit)} className="space-y-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Texto do Menu
            </label>
            <input
              type="text"
              {...register('label')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#08285d] focus:ring-[#08285d]"
            />
            {errors.label && (
              <p className="mt-1 text-sm text-red-600">{errors.label.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              type="text"
              {...register('url')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#08285d] focus:ring-[#08285d]"
            />
            {errors.url && (
              <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-4 py-2 bg-[#08285d] text-white rounded-lg hover:bg-[#177cc3] transition-colors duration-200 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Salvando...' : 'Salvar'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200"
            >
              <X className="w-4 h-4" />
              <span>Cancelar</span>
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
                      className="bg-white p-4 rounded-lg shadow flex items-center justify-between"
                    >
                      {editingId === item.id ? (
                        <form
                          onSubmit={(e) => {
                            e.preventDefault()
                            const formData = new FormData(e.currentTarget)
                            const data = {
                              label: formData.get('label') as string,
                              url: formData.get('url') as string,
                              requireAuth: false,
                              roles: [],
                              isActive: true,
                            }
                            handleUpdateSubmit(item.id, data)
                          }}
                          className="flex-1 flex items-center gap-4"
                        >
                          <input
                            type="text"
                            name="label"
                            defaultValue={item.label}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#08285d] focus:ring-[#08285d]"
                          />
                          <input
                            type="text"
                            name="url"
                            defaultValue={item.url}
                            className="flex-1 rounded-md border-gray-300 shadow-sm focus:border-[#08285d] focus:ring-[#08285d]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="submit"
                              disabled={isLoading}
                              className="p-2 text-green-600 hover:text-green-700"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditingId(null)}
                              className="p-2 text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <div className="flex-1">
                            <p className="font-medium">{item.label}</p>
                            <p className="text-sm text-gray-500">{item.url}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setEditingId(item.id)}
                              className="p-2 text-blue-600 hover:text-blue-700"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </>
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
