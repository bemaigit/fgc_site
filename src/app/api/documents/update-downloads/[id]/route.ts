import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Verifica autenticação
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se o documento existe
    const document = await prisma.document.findUnique({
      where: { 
        id,
        active: true
      }
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Documento não encontrado' },
        { status: 404 }
      );
    }

    // Atualiza o contador de downloads
    await prisma.document.update({
      where: { id },
      data: { downloads: { increment: 1 } }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao atualizar contador de downloads:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar contador de downloads' },
      { status: 500 }
    );
  }
}
