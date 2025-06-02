import prisma from '../src/lib/prisma'

async function fixFooterLogo() {
  try {
    // Busca a configuração do footer
    const footerConfig = await prisma.footerConfig.findUnique({
      where: { id: 'default-footer' }
    })

    if (!footerConfig) {
      console.log('Configuração do footer não encontrada')
      return
    }

    // Se o logo atual estiver no formato antigo
    if (footerConfig.logo.startsWith('/images/') || footerConfig.logo.startsWith('http')) {
      // Extrai o nome do arquivo
      const urlParts = footerConfig.logo.split('/')
      const filename = urlParts[urlParts.length - 1]
      const newPath = `logomarca/${filename}`

      // Atualiza o caminho no banco
      await prisma.footerConfig.update({
        where: { id: footerConfig.id },
        data: { logo: newPath }
      })

      console.log('Logo do footer atualizado:', {
        oldPath: footerConfig.logo,
        newPath
      })
    } else {
      console.log('Logo do footer já está no formato correto:', footerConfig.logo)
    }

    console.log('Atualização concluída!')
  } catch (error) {
    console.error('Erro ao corrigir logo do footer:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixFooterLogo()
