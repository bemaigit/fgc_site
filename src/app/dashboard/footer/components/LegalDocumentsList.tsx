'use client'

import { useState } from 'react'
import { LegalDocuments } from '@prisma/client'
import { LegalDocumentForm } from './LegalDocumentForm'

interface LegalDocumentsListProps {
  documents: LegalDocuments[]
  onSave: (id: string, data: Partial<LegalDocuments>) => Promise<void>
}

export function LegalDocumentsList({ 
  documents, 
  onSave 
}: LegalDocumentsListProps) {
  const [activeDocument, setActiveDocument] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSave = async (id: string, data: Partial<LegalDocuments>) => {
    try {
      setIsLoading(true)
      await onSave(id, data)
    } finally {
      setIsLoading(false)
    }
  }

  const documentTypes: Record<string, string> = {
    'legal': 'Informações Legais',
    'privacy-policy': 'Política de Privacidade',
    'terms-of-use': 'Termos de Uso',
    'lgpd': 'LGPD'
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Documentos Legais</h2>
      
      <div className="flex space-x-4">
        <div className="w-1/4 space-y-2">
          {documents.map(doc => (
            <button
              key={doc.id}
              onClick={() => setActiveDocument(doc.id)}
              className={`w-full text-left px-4 py-2 rounded-md ${
                activeDocument === doc.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              {documentTypes[doc.type] || doc.title}
            </button>
          ))}
        </div>

        <div className="flex-1">
          {activeDocument ? (
            <LegalDocumentForm
              document={documents.find(d => d.id === activeDocument)!}
              onSave={(data) => handleSave(activeDocument, data)}
              isLoading={isLoading}
            />
          ) : (
            <div className="text-center text-gray-500 py-8">
              Selecione um documento para editar
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
