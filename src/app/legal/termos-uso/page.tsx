import { prisma } from '@/lib/prisma'
import { LegalDocument } from '../components/LegalDocument'

async function getTermsContent() {
  const doc = await prisma.legalDocuments.findFirst({
    where: {
      type: 'terms-of-use',
      isActive: true
    }
  })
  return doc
}

export default async function TermosUsoPage() {
  const doc = await getTermsContent()

  if (!doc) {
    return (
      <LegalDocument title="Termos de Uso">
        <p>Documento não encontrado ou indisponível no momento.</p>
      </LegalDocument>
    )
  }

  return (
    <LegalDocument title={doc.title}>
      <div className="prose max-w-none">
        {doc.content.split('\n').map((paragraph, index) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </LegalDocument>
  )
}
