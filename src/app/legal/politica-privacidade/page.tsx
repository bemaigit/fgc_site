import { prisma } from '@/lib/prisma'
import { LegalDocument } from '../components/LegalDocument'

async function getPrivacyPolicyContent() {
  const doc = await prisma.legalDocuments.findFirst({
    where: {
      type: 'privacy-policy',
      isActive: true
    }
  })
  return doc
}

export default async function PoliticaPrivacidadePage() {
  const doc = await getPrivacyPolicyContent()

  if (!doc) {
    return (
      <LegalDocument title="Política de Privacidade">
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
