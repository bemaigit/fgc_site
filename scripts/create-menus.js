const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function createMenus() {
  try {
    // Primeiro, criar a configuração do header se não existir
    const header = await prisma.headerConfig.upsert({
      where: { id: 'default-header' },
      update: {},
      create: {
        id: 'default-header',
        logo: '/images/logo-fgc.png',
        background: '#08285d',
        hoverColor: '#177cc3',
        textColor: '#ffffff',
        isActive: true
      }
    })

    // Agora criar os menus na ordem correta
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
      await prisma.headerMenu.create({
        data: {
          label: menus[i].label,
          url: menus[i].url,
          order: i,
          isActive: true,
          requireAuth: false,
          headerId: header.id
        }
      })
      console.log(`Menu "${menus[i].label}" criado com sucesso!`)
    }

    console.log('Todos os menus foram criados com sucesso!')
  } catch (error) {
    console.error('Erro ao criar menus:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createMenus()
