const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function initFooter() {
  try {
    // Criar configuração padrão do footer
    const footer = await prisma.footerConfig.upsert({
      where: { id: 'default-footer' },
      update: {},
      create: {
        id: 'default-footer',
        logo: '/images/logo-fgc.png',
        background: '#08285d',
        hoverColor: '#177cc3',
        textColor: '#ffffff',
        isActive: true
      }
    })

    // Criar menus padrão
    const menus = [
      { label: 'Filia-se', url: '/filiacao' },
      { label: 'Eventos', url: '/eventos' },
      { label: 'Notícias', url: '/noticias' },
      { label: 'Rankings', url: '/rankings' },
      { label: 'Campeões Goianos', url: '/campeoes' },
      { label: 'Documentos', url: '/documentos' },
      { label: 'Nossos Parceiros', url: '/parceiros' }
    ]

    // Criar os menus um por um para manter a ordem
    for (let i = 0; i < menus.length; i++) {
      await prisma.footerMenu.create({
        data: {
          label: menus[i].label,
          url: menus[i].url,
          order: i,
          isActive: true,
          requireAuth: false,
          footerId: footer.id
        }
      })
      console.log(`Menu "${menus[i].label}" criado com sucesso!`)
    }

    console.log('Configuração do footer criada com sucesso!')
  } catch (error) {
    console.error('Erro ao criar configuração do footer:', error)
  } finally {
    await prisma.$disconnect()
  }
}

initFooter()
