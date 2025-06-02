import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'papaparse';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { notificationQueue } from '@/lib/notifications/queue/notification-queue';
import { INotificationPayload } from '@/lib/notifications/types';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Schema para validação dos parâmetros
const CSVUploadSchema = z.object({
  templateId: z.string().optional(),
  channel: z.enum(["whatsapp", "email", "sms"]).default("whatsapp"),
  message: z.string().optional(),
  subject: z.string().optional(),
  delayBetweenMessages: z.number().min(300).max(5000).default(500),
  priority: z.enum(["low", "normal", "high"]).default("normal"),
});

/**
 * Endpoint para processar upload de CSV com destinatários
 */
export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    // Processar o formulário multipart
    const formData = await req.formData();
    const csvFile = formData.get('file') as File;
    
    if (!csvFile) {
      return NextResponse.json({ error: 'Arquivo CSV é obrigatório' }, { status: 400 });
    }
    
    // Validar parâmetros enviados
    const params = {
      templateId: formData.get('templateId') as string,
      channel: formData.get('channel') as string,
      message: formData.get('message') as string,
      subject: formData.get('subject') as string,
      delayBetweenMessages: parseInt(formData.get('delayBetweenMessages') as string || '500'),
      priority: formData.get('priority') as string,
    };
    
    const paramsResult = CSVUploadSchema.safeParse(params);
    if (!paramsResult.success) {
      return NextResponse.json({ 
        error: 'Parâmetros inválidos', 
        details: paramsResult.error.format() 
      }, { status: 400 });
    }
    
    const validParams = paramsResult.data;
    
    // Verificar se templateId é válido quando fornecido
    let template = null;
    if (validParams.templateId) {
      template = await prisma.notificationTemplate.findUnique({
        where: { id: validParams.templateId },
      });
      
      if (!template) {
        return NextResponse.json({ error: 'Template não encontrado' }, { status: 400 });
      }
    } else if (!validParams.message) {
      // Se não tem template, precisa ter mensagem
      return NextResponse.json({ 
        error: 'Você deve fornecer um template ou uma mensagem personalizada' 
      }, { status: 400 });
    }
    
    // Ler e processar o arquivo CSV
    const csvText = await csvFile.text();
    const { data, errors } = parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim().toLowerCase(),
    });
    
    if (errors.length > 0) {
      return NextResponse.json({ 
        error: 'Erro ao processar arquivo CSV', 
        details: errors 
      }, { status: 400 });
    }
    
    if (data.length === 0) {
      return NextResponse.json({ error: 'Arquivo CSV não contém dados' }, { status: 400 });
    }
    
    // Verificar se há coluna de telefone ou email
    const hasPhoneColumn = data[0].hasOwnProperty('telefone') || 
                          data[0].hasOwnProperty('phone') || 
                          data[0].hasOwnProperty('celular') ||
                          data[0].hasOwnProperty('whatsapp');
    
    const hasEmailColumn = data[0].hasOwnProperty('email') || 
                          data[0].hasOwnProperty('e-mail');
    
    if (validParams.channel === 'whatsapp' && !hasPhoneColumn) {
      return NextResponse.json({ 
        error: 'Arquivo CSV não contém coluna de telefone/celular necessária para WhatsApp' 
      }, { status: 400 });
    }
    
    if (validParams.channel === 'email' && !hasEmailColumn) {
      return NextResponse.json({ 
        error: 'Arquivo CSV não contém coluna de email necessária' 
      }, { status: 400 });
    }
    
    // Processar cada linha do CSV
    const notifications: INotificationPayload[] = [];
    const invalidRows: { row: number; reason: string }[] = [];
    
    data.forEach((row, index) => {
      try {
        // Determinar o destinatário com base no canal
        let recipient = '';
        if (validParams.channel === 'whatsapp') {
          recipient = row.telefone || row.phone || row.celular || row.whatsapp;
          // Normalizar número de telefone
          recipient = normalizePhoneNumber(recipient);
        } else if (validParams.channel === 'email') {
          recipient = row.email || row['e-mail'];
        }
        
        if (!recipient) {
          invalidRows.push({ 
            row: index + 2, // +2 porque índice 0 + cabeçalho
            reason: `Destinatário não encontrado para o canal ${validParams.channel}` 
          });
          return;
        }
        
        // Criar payload de notificação
        let content = '';
        
        if (template) {
          // Usa template com variáveis substituídas
          content = template.content;
          
          // Substituir variáveis do template com dados do CSV
          Object.keys(row).forEach(key => {
            const variablePattern = new RegExp(`{{\\s*${key}\\s*}}`, 'gi');
            content = content.replace(variablePattern, row[key] || '');
          });
        } else {
          // Usa mensagem personalizada
          content = validParams.message || '';
        }
        
        // Adicionar à lista de notificações
        notifications.push({
          recipient,
          channel: validParams.channel,
          type: template ? template.type : 'BULK_MESSAGE',
          subject: validParams.subject,
          content,
          priority: validParams.priority,
          variables: row, // Inclui todos os dados da linha como variáveis
          metadata: {
            source: 'csv_upload',
            filename: csvFile.name,
            rowIndex: index + 2,
            uploadedBy: session.user.email,
          },
        });
      } catch (error) {
        invalidRows.push({ 
          row: index + 2,
          reason: error.message || 'Erro ao processar linha' 
        });
      }
    });
    
    if (notifications.length === 0) {
      return NextResponse.json({ 
        error: 'Nenhuma notificação válida foi gerada a partir do CSV', 
        invalidRows 
      }, { status: 400 });
    }
    
    // Adicionar notificações em lote à fila
    const batchResult = await notificationQueue.addBatchToQueue(
      notifications,
      { delayBetweenJobs: validParams.delayBetweenMessages }
    );
    
    // Registrar log do envio em lote
    await prisma.notificationLog.create({
      data: {
        level: 'info',
        message: `Lote de ${notifications.length} notificações adicionado à fila via CSV pelo usuário ${session.user.name || session.user.email}`,
        metadata: JSON.stringify({
          count: notifications.length,
          channel: validParams.channel,
          csvFilename: csvFile.name,
          invalidRows: invalidRows.length,
        }),
        createdAt: new Date(),
      },
    });
    
    return NextResponse.json({
      success: true,
      totalProcessed: data.length,
      validNotifications: notifications.length,
      invalidRows,
      queuedNotifications: batchResult.length,
      notificationIds: batchResult.map(r => r.notificationId),
      estimatedCompletionTime: new Date(
        Date.now() + (notifications.length * validParams.delayBetweenMessages)
      ).toISOString(),
    });
  } catch (error: any) {
    console.error('Erro ao processar upload de CSV:', error);
    return NextResponse.json({ 
      error: 'Erro ao processar upload de CSV', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Endpoint para obter exemplo de CSV
 */
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }
    
    // Obter canal da consulta
    const url = new URL(req.url);
    const channel = url.searchParams.get('channel') || 'whatsapp';
    
    // Gerar exemplo de CSV
    let csvContent = '';
    
    if (channel === 'whatsapp') {
      csvContent = 'nome,telefone,clube,categoria\n';
      csvContent += 'João Silva,5562991234567,Clube Ciclismo Goiânia,Elite\n';
      csvContent += 'Maria Oliveira,5562987654321,Speed Bike Team,Master\n';
      csvContent += 'Carlos Santos,5562977778888,MTB Anápolis Club,Sub-23\n';
    } else if (channel === 'email') {
      csvContent = 'nome,email,clube,categoria\n';
      csvContent += 'João Silva,joao.silva@example.com,Clube Ciclismo Goiânia,Elite\n';
      csvContent += 'Maria Oliveira,maria.oliveira@example.com,Speed Bike Team,Master\n';
      csvContent += 'Carlos Santos,carlos.santos@example.com,MTB Anápolis Club,Sub-23\n';
    }
    
    // Retornar CSV como texto
    return new NextResponse(csvContent, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="exemplo_${channel}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar exemplo de CSV:', error);
    return NextResponse.json({ 
      error: 'Erro ao gerar exemplo de CSV', 
      message: error.message 
    }, { status: 500 });
  }
}

/**
 * Normaliza número de telefone para formato consistente
 */
function normalizePhoneNumber(phone: string): string {
  // Verificar se é string
  if (typeof phone !== 'string') {
    return String(phone);
  }
  
  // Remover todos os caracteres não numéricos
  let normalized = phone.replace(/\D/g, '');
  
  // Remover prefixos como "+" ou "whatsapp:"
  normalized = normalized.replace(/^whatsapp:/, '');
  
  // Garantir formato com código do país
  if (normalized.length === 11) {
    // Assume um número brasileiro sem código do país
    normalized = `55${normalized}`;
  } else if (normalized.length === 10) {
    // Assume um número brasileiro sem código do país e sem o 9
    normalized = `559${normalized.substring(2)}`;
  }
  
  return normalized;
}
