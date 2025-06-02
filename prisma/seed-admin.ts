import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    // Configurações do Super Admin
    const adminEmail = 'admin@fgc.org.br'
    const adminPassword = 'FGC@admin2024' // Você deve alterar esta senha após o primeiro login
    
    try {
        // Verifica se já existe um Super Admin
        const existingAdmin = await prisma.user.findFirst({
            where: {
                email: adminEmail,
                role: 'SUPER_ADMIN'
            }
        })

        if (existingAdmin) {
            console.log('Super Admin já existe!')
            return
        }

        // Cria o usuário Super Admin
        const hashedPassword = await hash(adminPassword, 10)
        
        const admin = await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'Super Administrador',
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                emailVerified: new Date(),
            }
        })

        console.log('Super Admin criado com sucesso:', admin.email)
        console.log('Por favor, altere a senha após o primeiro login!')
        
    } catch (error) {
        console.error('Erro ao criar Super Admin:', error)
        throw error
    }
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
