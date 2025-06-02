import prisma from '../src/lib/prisma'

async function fixHeaderLogo() {
  try {
    // Busca a configuração do header
    const headerConfig = await prisma.headerConfig.findUnique({
      where: { id: 'default-header' }
    })

    if (!headerConfig) {
      console.log('Configuração do header não encontrada')
      return
    }

    // Se o logo atual estiver no formato antigo
    if (headerConfig.logo.startsWith('/images/') || headerConfig.logo.startsWith('http')) {
      // Extrai o nome do arquivo
      const urlParts = headerConfig.logo.split('/')
      const filename = urlParts[urlParts.length - 1]
      const newPath = `logomarca/${filename}`

      // Atualiza o caminho no banco
      await prisma.headerConfig.update({
        where: { id: headerConfig.id },
        data: { logo: newPath }
      })

      console.log('Logo do header atualizado:', {
        oldPath: headerConfig.logo,
        newPath
      })
    } else {
      console.log('Logo do header já está no formato correto:', headerConfig.logo)
    }

    console.log('Atualização concluída!')
  } catch (error) {
    console.error('Erro ao corrigir logo do header:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixHeaderLogo()
