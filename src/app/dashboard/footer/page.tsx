'use client'

import { useState, useEffect } from 'react'
import { FooterConfig, LegalDocuments } from '@prisma/client'
import { FooterConfigForm } from './components/FooterConfigForm'
import { useSession } from 'next-auth/react'
import { Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FooterPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [footerConfig, setFooterConfig] = useState<FooterConfig | null>(null)
  const [legalDocuments, setLegalDocuments] = useState<LegalDocuments[]>([])
  const [menus, setMenus] = useState<any[]>([])

  // Verificar autenticação e permissões
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    } else if (status === 'authenticated') {
      if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
        router.push('/')
      } else {
        loadData()
      }
    }
  }, [status, session, router])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Carregar configurações do footer
      const footerRes = await fetch('/api/footer', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      // Carregar documentos legais
      const docsRes = await fetch('/api/footer/legal-documents', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      // Carregar menus do footer
      const menusRes = await fetch('/api/footer/menus', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
      })

      const [footerData, docsData, menusData] = await Promise.all([
        footerRes.json(),
        docsRes.json(),
        menusRes.json()
      ])

      if (!footerRes.ok) {
        throw new Error(footerData.error || `Erro ao carregar dados: ${footerRes.status}`)
      }

      if (!docsRes.ok) {
        throw new Error(docsData.error || `Erro ao carregar documentos: ${docsRes.status}`)
      }

      if (!menusRes.ok) {
        throw new Error(menusData.error || `Erro ao carregar menus: ${menusRes.status}`)
      }

      setFooterConfig(footerData.config)
      setLegalDocuments(docsData)
      setMenus(menusData)
      setSuccess('Dados carregados com sucesso')
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError(error instanceof Error ? error.message : 'Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async (data: Partial<FooterConfig>) => {
    try {
      setIsLoading(true)
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/footer', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const responseData = await res.json()

      if (!res.ok) {
        throw new Error(responseData.error || `Erro ao salvar dados: ${res.status}`)
      }

      setFooterConfig(responseData.config)
      setSuccess('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar:', error)
      setError(error instanceof Error ? error.message : 'Erro ao salvar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveLegalDocument = async (id: string, data: Partial<LegalDocuments>) => {
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/footer/legal-documents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      })

      const updatedDoc = await res.json()

      if (!res.ok) {
        throw new Error(updatedDoc.error || `Erro ao salvar documento: ${res.status}`)
      }

      // Atualizar o documento na lista
      setLegalDocuments(prev => 
        prev.map(doc => doc.id === id ? updatedDoc : doc)
      )
      setSuccess('Documento salvo com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar documento:', error)
      setError(error instanceof Error ? error.message : 'Erro ao salvar documento')
      throw error // Re-throw para o componente filho lidar com o estado de loading
    }
  }

  const addMenuItem = async (data: any) => {
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/footer/menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      const newMenuItem = await res.json()

      if (!res.ok) {
        throw new Error(newMenuItem.error || `Erro ao adicionar menu item: ${res.status}`)
      }

      // Adicionar o novo menu item à lista
      setMenus(prev => [...prev, newMenuItem])
      setSuccess('Menu item adicionado com sucesso!')
    } catch (error) {
      console.error('Erro ao adicionar menu item:', error)
      setError(error instanceof Error ? error.message : 'Erro ao adicionar menu item')
    }
  }

  const updateMenuItem = async (id: string, data: any) => {
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/footer/menus', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...data })
      })

      const updatedMenuItem = await res.json()

      if (!res.ok) {
        throw new Error(updatedMenuItem.error || `Erro ao atualizar menu item: ${res.status}`)
      }

      // Atualizar o menu item na lista
      setMenus(prev => 
        prev.map(menu => menu.id === id ? updatedMenuItem : menu)
      )
      setSuccess('Menu item atualizado com sucesso!')
    } catch (error) {
      console.error('Erro ao atualizar menu item:', error)
      setError(error instanceof Error ? error.message : 'Erro ao atualizar menu item')
    }
  }

  const deleteMenuItem = async (id: string) => {
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/footer/menus', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (!res.ok) {
        throw new Error(`Erro ao excluir menu item: ${res.status}`)
      }

      // Remover o menu item da lista
      setMenus(prev => prev.filter(menu => menu.id !== id))
      setSuccess('Menu item excluído com sucesso!')
    } catch (error) {
      console.error('Erro ao excluir menu item:', error)
      setError(error instanceof Error ? error.message : 'Erro ao excluir menu item')
    }
  }

  const reorderMenuItems = async (items: any[]) => {
    try {
      setError(null)
      setSuccess(null)

      const res = await fetch('/api/footer/menus/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(items)
      })

      if (!res.ok) {
        throw new Error(`Erro ao reordenar menu items: ${res.status}`)
      }

      // Atualizar a ordem dos menu items na lista
      setMenus(prev => 
        prev.map(menu => {
          const item = items.find(i => i.id === menu.id)
          return item ? { ...menu, order: item.order } : menu
        })
      )
      setSuccess('Menu items reordenados com sucesso!')
    } catch (error) {
      console.error('Erro ao reordenar menu items:', error)
      setError(error instanceof Error ? error.message : 'Erro ao reordenar menu items')
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 text-red-500 p-4 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  if (!footerConfig) {
    return (
      <div className="p-4">
        <div className="bg-yellow-50 text-yellow-600 p-4 rounded-md">
          Nenhuma configuração encontrada
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Configurações do Footer</h1>
      
      {success && (
        <div className="mb-4 p-4 bg-green-50 text-green-600 rounded-md">
          {success}
        </div>
      )}

      <FooterConfigForm
        initialData={footerConfig}
        legalDocuments={legalDocuments}
        menus={menus}
        onSave={handleSave}
        onSaveLegalDocument={handleSaveLegalDocument}
        onAddMenuItem={addMenuItem}
        onUpdateMenuItem={updateMenuItem}
        onDeleteMenuItem={deleteMenuItem}
        onReorderMenuItems={reorderMenuItems}
        isLoading={isLoading}
      />
    </div>
  )
}
