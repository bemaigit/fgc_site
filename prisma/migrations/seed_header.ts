import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Criar configuração padrão do header
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

  // Criar menus padrão
  const menus = [
    {
      label: 'Home',
      url: '/',
      order: 1,
      isActive: true,
      requireAuth: false,
      roles: [],
      headerId: 'default-header'
    },
    {
      label: 'Notícias',
      url: '/noticias',
      order: 2,
      isActive: true,
      requireAuth: false,
      roles: [],
      headerId: 'default-header'
    },
    {
      label: 'Eventos',
      url: '/eventos',
      order: 3,
      isActive: true,
      requireAuth: false,
      roles: [],
      headerId: 'default-header'
    },
    {
      label: 'Filiação',
      url: '/filiacao',
      order: 4,
      isActive: true,
      requireAuth: false,
      roles: [],
      headerId: 'default-header'
    }
  ]

  for (const menu of menus) {
    await prisma.headerMenu.create({
      data: menu
    })
  }

  console.log('Dados do header inseridos com sucesso!')
}

main()
  .catch((e) => {
    console.error('Erro ao inserir dados:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
