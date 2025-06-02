import prisma from '../src/lib/prisma'

async function updateHeader() {
  try {
    // Criar ou atualizar configuração do header
    await prisma.headerConfig.upsert({
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

    // Criar alguns menus padrão
    await prisma.headerMenu.createMany({
      skipDuplicates: true,
      data: [
        {
          label: 'Início',
          url: '/',
          order: 0,
          isActive: true,
          requireAuth: false,
          headerId: 'default-header'
        },
        {
          label: 'Notícias',
          url: '/noticias',
          order: 1,
          isActive: true,
          requireAuth: false,
          headerId: 'default-header'
        },
        {
          label: 'Eventos',
          url: '/eventos',
          order: 2,
          isActive: true,
          requireAuth: false,
          headerId: 'default-header'
        }
      ]
    })

    console.log('Header configurado com sucesso!')
  } catch (error) {
    console.error('Erro ao configurar header:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateHeader()
