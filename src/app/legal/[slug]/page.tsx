import { notFound } from 'next/navigation'
import { readFileSync } from 'fs'
import { join } from 'path'
import matter from 'gray-matter'

// Função para obter o conteúdo do arquivo markdown
async function getDocumentContent(slug: string) {
  try {
    const filePath = join(process.cwd(), 'src/content/legal', `${slug}.md`)
    const fileContent = readFileSync(filePath, 'utf8')
    const { data, content } = matter(fileContent)
    return { metadata: data, content }
  } catch (error) {
    return null
  }
}

export default async function LegalPage({
  params,
}: {
  params: { slug: string }
}) {
  const doc = await getDocumentContent(params.slug)
  
  if (!doc) {
    notFound()
  }

  return (
    <article className="max-w-4xl mx-auto px-4 py-8">
      <div className="prose prose-blue max-w-none">
        {/* O conteúdo markdown será renderizado aqui */}
        <div dangerouslySetInnerHTML={{ __html: doc.content }} />
      </div>
    </article>
  )
}
