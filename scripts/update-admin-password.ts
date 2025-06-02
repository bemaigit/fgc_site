import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hashedPassword = await bcrypt.hash('123456', 10)
  
  await prisma.user.update({
    where: { email: 'admin@fgc.org.br' },
    data: {
      password: hashedPassword
    }
  })

  console.log('Senha do admin atualizada com sucesso!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
