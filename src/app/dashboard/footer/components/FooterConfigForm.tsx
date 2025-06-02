'use client'

import { useState } from 'react'
import { FooterConfig, FooterMenu, LegalDocuments } from '@prisma/client'
import { Loader2 } from 'lucide-react'
import { LogoUploader } from './LogoUploader'
import { LegalDocumentsList } from './LegalDocumentsList'
import { FooterMenuList } from './FooterMenuList'
import { SocialMediaList } from './SocialMediaList'
import type { SocialMedia } from '../types'
import Image from 'next/image'

interface FooterConfigFormProps {
  initialData: FooterConfig & { 
    menus: FooterMenu[] 
  } & {
    socialMedia?: SocialMedia[]
  }
  legalDocuments: LegalDocuments[]
  onSave: (data: Partial<FooterConfig>) => Promise<void>
  onSaveLegalDocument: (id: string, data: Partial<LegalDocuments>) => Promise<void>
  onAddMenuItem: (data: Partial<FooterMenu>) => Promise<void>
  onUpdateMenuItem: (id: string, data: Partial<FooterMenu>) => Promise<void>
  onDeleteMenuItem: (id: string) => Promise<void>
  onReorderMenuItems: (items: FooterMenu[]) => Promise<void>
  isLoading?: boolean
}

const getFullImageUrl = (path: string | null) => {
  if (!path) return ''
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return path
  return `/images/${path}`
}

export function FooterConfigForm({ 
  initialData, 
  legalDocuments, 
  onSave, 
  onSaveLegalDocument,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onReorderMenuItems,
  isLoading = false 
}: FooterConfigFormProps) {
  const [formData, setFormData] = useState({
    background: initialData.background,
    textColor: initialData.textColor,
    hoverColor: initialData.hoverColor,
    logo: initialData.logo,
    isActive: initialData.isActive,
    cnpj: initialData.cnpj || '',
    endereco: initialData.endereco || '',
    cidade: initialData.cidade || '',
    estado: initialData.estado || '',
    telefone: initialData.telefone || '',
    email: initialData.email || '',
    whatsapp: initialData.whatsapp || '',
    socialMedia: (initialData.socialMedia || []) as SocialMedia[]
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave({
      ...formData,
      socialMedia: Array.isArray(formData.socialMedia) ? formData.socialMedia : []
    })
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Seção de Cores */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cores</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Cor de Fundo</label>
              <input
                type="color"
                name="background"
                value={formData.background}
                onChange={handleChange}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cor do Texto</label>
              <input
                type="color"
                name="textColor"
                value={formData.textColor}
                onChange={handleChange}
                className="w-full h-10"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cor do Hover</label>
              <input
                type="color"
                name="hoverColor"
                value={formData.hoverColor}
                onChange={handleChange}
                className="w-full h-10"
              />
            </div>
          </div>

          {/* Seção de Logo */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Logo</h3>
            <div className="flex items-center space-x-4">
              <div className="relative h-8 w-24">
                <Image 
                  src={getFullImageUrl(formData.logo)}
                  alt="Logo Preview" 
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
              <LogoUploader 
                currentLogo={formData.logo} 
                onLogoChange={(logo) => setFormData(prev => ({ ...prev, logo }))}
              />
            </div>
          </div>
        </div>

        {/* Seção de Informações de Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Informações de Contato</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">CNPJ</label>
              <input
                type="text"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Endereço</label>
              <input
                type="text"
                name="endereco"
                value={formData.endereco}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cidade</label>
              <input
                type="text"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Estado</label>
              <input
                type="text"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Telefone</label>
              <input
                type="text"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">WhatsApp</label>
              <input
                type="text"
                name="whatsapp"
                value={formData.whatsapp}
                onChange={handleChange}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
          </div>
        </div>

        {/* Seção de Status */}
        <div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              name="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-4 h-4"
            />
            <span>Ativo</span>
          </label>
        </div>

        {/* Seção de Redes Sociais */}
        <div className="pt-6">
          <SocialMediaList 
            socialMedia={formData.socialMedia || []}
            onChange={(socialMedia) => setFormData(prev => ({ ...prev, socialMedia }))}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            Salvar Configurações
          </button>
        </div>
      </form>

      {/* Seção de Menus */}
      <div className="pt-6 border-t">
        <FooterMenuList
          items={initialData?.menus || []}
          onAddItem={onAddMenuItem}
          onUpdateItem={onUpdateMenuItem}
          onDeleteItem={onDeleteMenuItem}
          onReorderItems={onReorderMenuItems}
        />
      </div>

      {/* Seção de Documentos Legais */}
      <div className="pt-6 border-t">
        <LegalDocumentsList
          documents={legalDocuments}
          onSave={onSaveLegalDocument}
        />
      </div>
    </div>
  )
}
