import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  await prisma.user.upsert({
    where: { email: 'admin@fgc.com.br' },
    update: {
      password: hashedPassword,
      role: 'SUPER_ADMIN'
    },
    create: {
      email: 'admin@fgc.com.br',
      name: 'Administrador',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
    },
  })

  console.log('Usuário SUPER_ADMIN criado com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
