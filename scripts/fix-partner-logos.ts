import prisma from '../src/lib/prisma'

async function fixPartnerLogos() {
  try {
    // Busca todos os parceiros
    const partners = await prisma.partner.findMany()

    // Para cada parceiro, corrige o caminho do logo
    for (const partner of partners) {
      // Extrai o nome do arquivo da URL completa
      const urlParts = partner.logo.split('/')
      const filename = urlParts[urlParts.length - 1]
      const newPath = `parceiros/${filename}`

      // Atualiza o registro
      await prisma.partner.update({
        where: { id: partner.id },
        data: { logo: newPath }
      })

      console.log(`Corrigido: ${partner.logo} -> ${newPath}`)
    }

    console.log('Todos os registros foram corrigidos!')
  } catch (error) {
    console.error('Erro ao corrigir logos:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixPartnerLogos()
