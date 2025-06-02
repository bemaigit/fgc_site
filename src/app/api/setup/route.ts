import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    
    await prisma.user.upsert({
      where: { email: 'admin@fgc.com.br' },
      update: {
        password: hashedPassword
      },
      create: {
        email: 'admin@fgc.com.br',
        name: 'Administrador',
        password: hashedPassword,
        role: 'ADMIN',
      },
    })

    return NextResponse.json({ message: 'Admin user created successfully' })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json({ error: 'Failed to create admin user' }, { status: 500 })
  }
}
