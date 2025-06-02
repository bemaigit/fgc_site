import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Criar usuário ADMIN
  await prisma.user.upsert({
    where: { email: 'admin@fgc.com.br' },
    update: {
      password: await bcrypt.hash('admin123', 10)
    },
    create: {
      email: 'admin@fgc.com.br',
      name: 'Administrador',
      password: await bcrypt.hash('admin123', 10),
      role: 'ADMIN',
    },
  })

  console.log('Usuário admin criado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
