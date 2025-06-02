import prisma from '@/lib/prisma'
import { LegalDocument } from '../components/LegalDocument'

async function getLGPDContent() {
  const doc = await prisma.legalDocuments.findFirst({
    where: {
      type: 'lgpd',
      isActive: true
    }
  })
  return doc
}

export default async function LGPDPage() {
  const doc = await getLGPDContent()

  if (!doc) {
    return (
      <LegalDocument title="Lei Geral de Proteção de Dados (LGPD)">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-6">LGPD</h1>
          <div className="prose max-w-none">
            <p>Documento não encontrado ou indisponível no momento.</p>
          </div>
        </div>
      </LegalDocument>
    )
  }

  return (
    <LegalDocument title={doc.title}>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl md:text-3xl font-bold mb-6">{doc.title}</h1>
        <div className="prose max-w-none">
          {doc.content.split('\n').map((paragraph, index) => (
            <p key={index} className="mb-4">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </LegalDocument>
  )
}
