import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';

// Este endpoint é apenas para depuração
export async function GET(request: NextRequest) {
  try {
    // Verifica se estamos em desenvolvimento
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Endpoint disponível apenas em ambiente de desenvolvimento' }, { status: 403 });
    }

    // Senha de teste
    const testPassword = 'C@ntafgc1104';
    
    // Gera um novo hash
    const newHash = await bcrypt.hash(testPassword, 10);
    console.log('Novo hash gerado:', newHash);
    
    // Busca o usuário para testar
    const user = await prisma.user.findUnique({
      where: { email: 'betofoto1@gmail.com' },
      select: {
        id: true,
        email: true,
        password: true,
      },
    });
    
    if (!user || !user.password) {
      return NextResponse.json({ error: 'Usuário não encontrado ou sem senha' }, { status: 404 });
    }
    
    // Compara a senha armazenada e a senha de teste
    const compareResult1 = await bcrypt.compare(testPassword, user.password);
    
    // Compara com o novo hash gerado
    const compareResult2 = await bcrypt.compare(testPassword, newHash);
    
    return NextResponse.json({
      userId: user.id,
      userEmail: user.email,
      storedPasswordHash: user.password,
      newHashGenerated: newHash,
      compareWithStored: compareResult1,
      compareWithNewHash: compareResult2,
      bcryptVersion: bcrypt.version || 'não disponível'
    });
  } catch (error) {
    console.error('Erro no teste bcrypt:', error);
    return NextResponse.json({ error: 'Erro ao processar teste' }, { status: 500 });
  }
}
