import prisma from '../src/lib/prisma'

async function updateHeaderConfig() {
  try {
    await prisma.headerConfig.upsert({
      where: { id: 'default-header' },
      update: {
        logo: '/images/logo-fgc.png',
        background: '#08285d',
        hoverColor: '#177cc3',
        textColor: '#ffffff'
      },
      create: {
        id: 'default-header',
        logo: '/images/logo-fgc.png',
        background: '#08285d',
        hoverColor: '#177cc3',
        textColor: '#ffffff'
      }
    })
    console.log('Header configurado com sucesso!')
  } catch (error) {
    console.error('Erro ao configurar header:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateHeaderConfig()
