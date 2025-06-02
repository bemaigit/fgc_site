'use client'

import { useState } from 'react'
import { LegalDocuments } from '@prisma/client'
import { Loader2 } from 'lucide-react'

interface LegalDocumentFormProps {
  document: LegalDocuments
  onSave: (data: Partial<LegalDocuments>) => Promise<void>
  isLoading?: boolean
}

export function LegalDocumentForm({ 
  document, 
  onSave, 
  isLoading = false 
}: LegalDocumentFormProps) {
  const [formData, setFormData] = useState({
    title: document.title,
    content: document.content,
    isActive: document.isActive
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label 
          htmlFor="title" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Título
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div>
        <label 
          htmlFor="content" 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Conteúdo
        </label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          rows={15}
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
          required
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onChange={handleChange}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded"
        />
        <label 
          htmlFor="isActive" 
          className="ml-2 block text-sm text-gray-700"
        >
          Ativo
        </label>
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
              Salvando...
            </>
          ) : (
            'Salvar'
          )}
        </button>
      </div>

      {/* Preview do documento */}
      <div className="mt-8">
        <h3 className="text-lg font-medium mb-4">Preview</h3>
        <div className="p-4 border rounded-md">
          <h1 className="text-2xl font-bold mb-4">{formData.title}</h1>
          <div className="prose max-w-none">
            {formData.content.split('\n').map((paragraph, index) => (
              <p key={index} className="mb-4">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>
    </form>
  )
}
