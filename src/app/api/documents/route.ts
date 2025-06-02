import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { storageService } from '@/lib/storage';
import { v4 as uuidv4 } from 'uuid'; // Importa uuid v4 para gerar IDs únicos

interface MinioError {
  code: string;
  message: string;
  statusCode?: number;
}

interface DbError extends Error {
  code?: string;
  meta?: Record<string, unknown>;
}

// GET - Lista todos os documentos (público)
export async function GET() {
  console.log('Iniciando busca de documentos...');
  try {
    const documents = await prisma.document.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        description: true,
        fileName: true,
        fileSize: true,
        mimeType: true,
        downloads: true,
        createdAt: true
      }
    });
    console.log('Documentos encontrados:', documents.length);
    return new NextResponse(
      JSON.stringify(documents),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    console.error('Erro detalhado ao buscar documentos:', {
      error: err,
      message: err.message,
      stack: err.stack
    });
    return new NextResponse(
      JSON.stringify({ 
        error: 'Erro ao buscar documentos',
        details: err.message 
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// POST - Upload de novo documento (admin)
export async function POST(request: NextRequest) {
  try {
    console.log('Iniciando upload de documento...');

    // Verifica autenticação
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('Acesso negado:', session?.user.role);
      return new NextResponse(
        JSON.stringify({ error: 'Acesso negado' }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log('Autenticação OK, processando formData...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;

    console.log('Dados recebidos:', {
      title,
      description,
      fileName: file?.name,
      fileSize: file?.size,
      fileType: file?.type
    });

    if (!file || !title) {
      console.log('Erro: arquivo ou título faltando');
      return new NextResponse(
        JSON.stringify({ error: 'Arquivo e título são obrigatórios' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Validação do tamanho do arquivo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      console.log('Arquivo muito grande:', file.size);
      return new NextResponse(
        JSON.stringify({ error: 'O arquivo não pode ser maior que 10MB' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log('Iniciando upload para o MinIO...');
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Cria o nome do arquivo sanitizado com timestamp
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const fileName = `${Date.now()}-${sanitizedFileName}`;
    
    try {
      // Define o prefixo e faz o upload diretamente
      storageService.setPrefix('documentos');
      const url = await storageService.uploadFile(buffer, {
        filename: fileName,
        contentType: file.type,
        size: file.size
      });

      if (!url) {
        throw new Error('URL do arquivo não gerada');
      }

      // Extrai o caminho relativo da URL
      const fileUrl = `documentos/${fileName}`;

      console.log('Upload para MinIO concluído:', {
        url,
        fileUrl
      });

      // Cria o registro no banco
      console.log('Criando registro no banco...');
      console.log('Dados para criar documento:', {
        title,
        description,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        active: true,
        createdBy: session?.user?.id
      });

      if (!session?.user?.id) {
        throw new Error('ID do usuário não encontrado na sessão');
      }

      const document = await prisma.document.create({
        data: {
          id: uuidv4(), // Gera um ID único usando uuid v4
          title,
          description,
          fileUrl,
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type,
          active: true,
          createdBy: session.user.id,
          updatedAt: new Date() // Adiciona updatedAt para satisfazer o modelo Prisma
        }
      });

      if (!document) {
        throw new Error('Documento não foi criado no banco');
      }

      console.log('Documento criado com sucesso:', document);
      console.log('Dados do documento criado:', {
        id: document.id,
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        downloads: document.downloads,
        createdAt: document.createdAt
      });
      
      const response = {
        id: document.id,
        title: document.title,
        description: document.description,
        fileUrl: document.fileUrl,
        fileName: document.fileName,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        downloads: document.downloads,
        createdAt: document.createdAt
      };

      console.log('Resposta do documento criado:', response);
      return new NextResponse(
        JSON.stringify(response),
        { 
          status: 201,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    } catch (dbError) {
      const err = dbError as DbError;
      console.error('Erro detalhado ao criar no banco:', {
        error: err,
        message: err.message,
        code: err.code,
        meta: err.meta
      });
      throw new Error('Erro ao salvar documento no banco de dados: ' + err.message);
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    console.error('Erro detalhado ao criar documento:', {
      error: err,
      message: err.message,
      stack: err.stack
    });

    // Se for um erro do MinIO, vai ter propriedades específicas
    if (error && typeof error === 'object' && 'code' in error) {
      const minioError = error as MinioError;
      console.error('Erro do MinIO:', {
        code: minioError.code,
        message: minioError.message,
        statusCode: minioError.statusCode
      });
    }

    return new NextResponse(
      JSON.stringify({ 
        error: 'Erro ao criar documento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// DELETE - Remove documento (admin)
export async function DELETE(request: NextRequest) {
  console.log('Iniciando remoção de documento...');
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN')) {
      console.log('Acesso negado:', session?.user.role);
      return new NextResponse(
        JSON.stringify({ error: 'Acesso negado' }),
        { 
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      console.log('ID do documento não fornecido');
      return new NextResponse(
        JSON.stringify({ error: 'ID do documento não fornecido' }),
        { 
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
    }

    console.log('Atualizando documento:', id);
    await prisma.document.update({
      where: { id },
      data: { active: false }
    });

    console.log('Documento removido com sucesso');
    return new NextResponse(
      JSON.stringify({ success: true }),
      { 
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Erro desconhecido');
    console.error('Erro detalhado ao remover documento:', {
      error: err,
      message: err.message,
      stack: err.stack
    });

    return new NextResponse(
      JSON.stringify({ 
        error: 'Erro ao remover documento',
        details: err.message
      }),
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// Aumenta o limite do payload para 10MB
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
}
