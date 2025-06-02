import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Criar configuração padrão do header
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
    },
  })

  console.log('Configuração padrão do header criada com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
