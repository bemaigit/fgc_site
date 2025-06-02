'use client'

import { useState, useEffect } from 'react'
import { HeaderConfig, HeaderMenu } from '@prisma/client'
import { HeaderConfigForm } from './components/HeaderConfigForm'
import { MenuList } from './components/MenuList'
import { Loader2 } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function HeaderPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null)
  const [menuItems, setMenuItems] = useState<HeaderMenu[]>([])

  // Verificar autenticação
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated' && 
              session.user.role !== 'ADMIN' && 
              session.user.role !== 'SUPER_ADMIN') {
      router.push('/')
    }
  }, [status, session, router])

  // Carregar dados do header
  useEffect(() => {
    if (status === 'authenticated' && 
       (session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN')) {
      loadHeaderData()
    }
  }, [status, session])

  const loadHeaderData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const res = await fetch('/api/header', {
        credentials: 'include'
      })
      
      if (!res.ok) {
        throw new Error(`Erro ao carregar dados: ${res.status}`)
      }

      const data = await res.json()
      setHeaderConfig(data.config)
      setMenuItems(data.menus || [])
    } catch (error) {
      console.error('Erro ao carregar dados do header:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdateConfig = async (data: Partial<HeaderConfig>) => {
    try {
      setError(null)
      setSuccess(null)
      
      const res = await fetch('/api/header', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(data),
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.message || responseData.error || `Erro no servidor: ${res.status}`)
      }

      setSuccess('Configurações atualizadas com sucesso!')
      await loadHeaderData()
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      throw error
    }
  }

  const handleAddMenuItem = async (data: Partial<HeaderMenu>) => {
    try {
      const res = await fetch('/api/header/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erro ao adicionar item do menu')
      }

      await loadHeaderData()
    } catch (error) {
      console.error('Erro ao adicionar item do menu:', error)
      throw error
    }
  }

  const handleUpdateMenuItem = async (id: string, data: Partial<HeaderMenu>) => {
    try {
      // Atualiza o estado local imediatamente
      setMenuItems(prevItems => 
        prevItems.map(item => 
          item.id === id ? { ...item, ...data } : item
        )
      )

      const res = await fetch(`/api/header/menu/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        // Se houver erro, reverte a alteração local
        await loadHeaderData()
        throw new Error(error.message || 'Erro ao atualizar item do menu')
      }
    } catch (error) {
      console.error('Erro ao atualizar item do menu:', error)
      throw error
    }
  }

  const handleDeleteMenuItem = async (id: string) => {
    try {
      const res = await fetch(`/api/header/menu/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erro ao excluir item do menu')
      }

      await loadHeaderData()
    } catch (error) {
      console.error('Erro ao excluir item do menu:', error)
      throw error
    }
  }

  const handleReorderMenuItems = async (items: HeaderMenu[]) => {
    try {
      const res = await fetch('/api/header/menu/reorder', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Erro ao reordenar itens do menu')
      }

      setMenuItems(items)
    } catch (error) {
      console.error('Erro ao reordenar itens do menu:', error)
      throw error
    }
  }

  // Se ainda está carregando a sessão
  if (status === 'loading' || (status === 'authenticated' && isLoading)) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    )
  }

  // Se não estiver autenticado ou não for admin, não renderiza nada
  // (o useEffect vai redirecionar)
  if (status !== 'authenticated' || session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
    return null
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações do Header</h1>
        <p className="text-gray-600">Gerencie a aparência e os itens do menu do header do site.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-lg">
          {success}
        </div>
      )}

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-4">Aparência</h2>
          {headerConfig && (
            <HeaderConfigForm
              initialData={headerConfig}
              onSubmit={handleUpdateConfig}
            />
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Itens do Menu</h2>
          <MenuList
            items={menuItems}
            onAddItem={handleAddMenuItem}
            onUpdateItem={handleUpdateMenuItem}
            onDeleteItem={handleDeleteMenuItem}
            onReorderItems={handleReorderMenuItems}
          />
        </div>
      </div>
    </div>
  )
}
