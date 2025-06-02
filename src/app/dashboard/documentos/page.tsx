'use client'

import DocumentEditor from './DocumentEditor'

export default function DocumentosPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Documentos</h1>
      <DocumentEditor />
    </div>
  )
}
