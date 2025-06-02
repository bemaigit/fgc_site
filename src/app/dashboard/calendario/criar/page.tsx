'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, MapPin, Info, Tag, Award, Link, Flag } from 'lucide-react'
import { useCreateCalendarEvent } from '@/hooks/calendar/useCreateCalendarEvent'
import { ImageUpload } from '@/components/ui/image-upload'

interface CalendarFormState {
  title: string
  description: string
  startdate: string
  enddate: string
  modality: string
  category: string
  city: string
  uf: string
  status: string
  website: string
  highlight: boolean
  imageFiles: File[]
  regulationFile: File | null
}

export default function CreateCalendarEventPage() {
  const router = useRouter()
  
  const [form, setForm] = useState<CalendarFormState>({
    title: '',
    description: '',
    startdate: '',
    enddate: '',
    modality: '',
    category: '',
    city: '',
    uf: '',
    status: '',
    website: '',
    highlight: false,
    imageFiles: [],
    regulationFile: null,
  })
  
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  
  const { createEvent } = useCreateCalendarEvent()
  
  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }
  
  // Upload de imagem
  const handleImageFilesSelected = (files: File[]) => {
    setForm((prev) => ({ ...prev, imageFiles: files }))
  }
  
  const handleImageFileRemove = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }))
  }
  
  // Upload de regulamento
  const handleRegulationFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setForm((prev) => ({ ...prev, regulationFile: file }))
  }
  
  // Função auxiliar para upload dos arquivos
  async function uploadFiles(): Promise<{ imageUrl?: string; regulationUrl?: string }> {
    setIsUploading(true)
    try {
      const formData = new FormData()
      if (form.imageFiles.length > 0) {
        formData.append('image', form.imageFiles[0])
      }
      if (form.regulationFile) {
        formData.append('regulation', form.regulationFile)
      }
      
      if (formData.has('image') || formData.has('regulation')) {
        const res = await fetch('/api/upload/calendar', {
          method: 'POST',
          body: formData,
        })
        
        if (!res.ok) throw new Error('Erro ao fazer upload dos arquivos')
        return res.json()
      }
      return {}
    } finally {
      setIsUploading(false)
    }
  }
  
  // Submit (enviar dados para API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    
    try {
      // Validação básica
      if (!form.title) throw new Error('O título é obrigatório')
      if (!form.startdate) throw new Error('A data de início é obrigatória')
      if (!form.enddate) throw new Error('A data de fim é obrigatória')
      if (!form.modality) throw new Error('A modalidade é obrigatória')
      if (!form.category) throw new Error('A categoria é obrigatória')
      if (!form.city) throw new Error('A cidade é obrigatória')
      if (!form.uf) throw new Error('O estado (UF) é obrigatório')
      if (!form.status) throw new Error('O status é obrigatório')
      
      // 1. Upload dos arquivos para o MinIO
      const uploaded = await uploadFiles()
      
      // 2. Montar dados do evento
      const eventData = {
        title: form.title,
        description: form.description,
        startdate: form.startdate ? new Date(form.startdate).toISOString() : null,
        enddate: form.enddate ? new Date(form.enddate).toISOString() : null,
        modality: form.modality,
        category: form.category,
        city: form.city,
        uf: form.uf,
        status: form.status,
        website: form.website,
        highlight: form.highlight,
        imageurl: uploaded.imageUrl || undefined,
        regulationpdf: uploaded.regulationUrl || undefined,
      }
      
      // 3. Criar evento via API
      await createEvent(eventData)
      
      setSuccess(true)
      
      // Redirecionar após sucesso
      setTimeout(() => {
        router.push('/dashboard/calendario')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar evento')
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-[#08285d] hover:text-[#7db0de] p-1"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Novo Evento no Calendário</h1>
      </div>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 my-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">Evento criado com sucesso! Redirecionando...</p>
            </div>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Seção de informações básicas */}
        <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
          <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
            <h2 className="text-lg font-medium text-gray-800">Informações Básicas</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Título *
              </label>
              <input
                type="text"
                name="title"
                id="title"
                value={form.title}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
              />
            </div>
            
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Descrição
              </label>
              <textarea
                name="description"
                id="description"
                rows={3}
                value={form.description}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 bg-white"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startdate" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    Data Início *
                  </div>
                </label>
                <input
                  type="datetime-local"
                  name="startdate"
                  id="startdate"
                  value={form.startdate}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                />
              </div>
              
              <div>
                <label htmlFor="enddate" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center">
                    <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                    Data Fim *
                  </div>
                </label>
                <input
                  type="datetime-local"
                  name="enddate"
                  id="enddate"
                  value={form.enddate}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de categorização */}
        <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
          <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
            <h2 className="text-lg font-medium text-gray-800">Categorização</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="modality" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center">
                    <Tag className="mr-2 h-4 w-4 text-gray-500" />
                    Modalidade *
                  </div>
                </label>
                <input
                  type="text"
                  name="modality"
                  id="modality"
                  value={form.modality}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                />
              </div>
              
              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center">
                    <Award className="mr-2 h-4 w-4 text-gray-500" />
                    Categoria *
                  </div>
                </label>
                <input
                  type="text"
                  name="category"
                  id="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Info className="mr-2 h-4 w-4 text-gray-500" />
                  Status *
                </div>
              </label>
              <select
                name="status"
                id="status"
                value={form.status}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
              >
                <option value="">Selecione um status</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Provisório">Provisório</option>
                <option value="Cancelado">Cancelado</option>
                <option value="Adiado">Adiado</option>
                <option value="Concluído">Concluído</option>
              </select>
            </div>
            
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  type="checkbox"
                  name="highlight"
                  id="highlight"
                  checked={form.highlight}
                  onChange={handleChange}
                  className="focus:ring-[#7db0de] h-4 w-4 text-[#08285d] border-gray-400 rounded bg-white"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="highlight" className="font-medium text-gray-700">
                  <div className="flex items-center">
                    <Flag className="mr-2 h-4 w-4 text-gray-500" />
                    Destaque
                  </div>
                </label>
                <p className="text-gray-500">Marque esta opção para destacar o evento na listagem principal</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de localização */}
        <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
          <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
            <h2 className="text-lg font-medium text-gray-800">Localização</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  <div className="flex items-center">
                    <MapPin className="mr-2 h-4 w-4 text-gray-500" />
                    Cidade *
                  </div>
                </label>
                <input
                  type="text"
                  name="city"
                  id="city"
                  value={form.city}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                />
              </div>
              
              <div>
                <label htmlFor="uf" className="block text-sm font-medium text-gray-700">
                  UF *
                </label>
                <input
                  type="text"
                  name="uf"
                  id="uf"
                  value={form.uf}
                  onChange={handleChange}
                  required
                  maxLength={2}
                  className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                <div className="flex items-center">
                  <Link className="mr-2 h-4 w-4 text-gray-500" />
                  Website / Redes Sociais
                </div>
              </label>
              <input
                type="url"
                name="website"
                id="website"
                value={form.website}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-400 shadow-sm focus:border-[#7db0de] focus:ring-[#7db0de] text-base py-2.5 px-3 h-11 bg-white"
                placeholder="https://exemplo.com.br"
              />
            </div>
          </div>
        </div>
        
        {/* Seção de arquivos */}
        <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
          <div className="bg-gray-200 px-6 py-4 border-b border-gray-300">
            <h2 className="text-lg font-medium text-gray-800">Arquivos</h2>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Cartaz/Imagem do Evento (opcional)
              </label>
              <div className="mt-1">
                <ImageUpload
                  files={form.imageFiles}
                  onFilesSelected={handleImageFilesSelected}
                  onFileRemove={handleImageFileRemove}
                  isUploading={isUploading}
                  maxFiles={1}
                  maxSize={2 * 1024 * 1024}
                />
                <p className="mt-2 text-sm text-gray-500">
                  A imagem será enviada para o MinIO na pasta <strong>calendario/</strong>.
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Regulamento (PDF ou arquivo, opcional)
              </label>
              <div className="mt-1">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.odt"
                  onChange={handleRegulationFile}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#08285d] file:text-white hover:file:bg-[#7db0de]"
                />
                {form.regulationFile && (
                  <p className="mt-2 text-sm text-gray-500">
                    Arquivo selecionado: <strong>{form.regulationFile.name}</strong>
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  O regulamento será enviado para o MinIO na pasta <strong>calendario/regulamento/</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Seção de botões */}
        <div className="bg-gray-100 shadow-md rounded-lg overflow-hidden border border-gray-300">
          <div className="px-6 py-4 bg-gray-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/calendario')}
              className="py-2 px-4 border border-gray-400 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
