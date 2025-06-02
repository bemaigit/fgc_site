// Script para criar templates iniciais de notificação
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const templates = [
  // Template de WhatsApp para Boas-vindas
  {
    name: 'Boas-vindas',
    type: 'WELCOME',
    channel: 'whatsapp',
    content: 'Olá {{nome}}, bem-vindo(a) à Federação Goiana de Ciclismo! 🚴‍♂️ Estamos felizes em ter você conosco. Acesse nosso site para mais informações sobre eventos e filiação.',
    variables: ['nome'],
    active: true
  },
  // Template de WhatsApp para Lembrete de Evento
  {
    name: 'Lembrete de Evento',
    type: 'EVENT_REMINDER',
    channel: 'whatsapp',
    content: 'Lembrete: O evento "{{evento}}" acontecerá em {{data}} às {{hora}} no local {{local}}. Não esqueça de levar seu equipamento e documentos. Esperamos você lá!',
    variables: ['evento', 'data', 'hora', 'local'],
    active: true
  },
  // Template de WhatsApp para Confirmação de Inscrição
  {
    name: 'Confirmação de Inscrição',
    type: 'REGISTRATION_CONFIRMATION',
    channel: 'whatsapp',
    content: 'Sua inscrição para o evento "{{evento}}" foi confirmada! Número do atleta: {{numero}}. Data: {{data}}. Para mais detalhes, acesse nossa plataforma.',
    variables: ['evento', 'numero', 'data'],
    active: true
  },
  // Template de Email para Boas-vindas
  {
    name: 'Email de Boas-vindas',
    type: 'WELCOME',
    channel: 'email',
    content: '<h1>Bem-vindo à Federação Goiana de Ciclismo!</h1><p>Olá {{nome}},</p><p>É com grande prazer que damos as boas-vindas a você em nossa comunidade de ciclismo.</p><p>Seu cadastro foi realizado com sucesso e você já pode acessar todos os nossos serviços.</p><p>Atenciosamente,<br>Equipe FGC</p>',
    variables: ['nome'],
    active: true
  },
  // Template de Email para Resultados de Competição
  {
    name: 'Resultados de Competição',
    type: 'COMPETITION_RESULTS',
    channel: 'email',
    content: '<h1>Resultados - {{evento}}</h1><p>Olá {{nome}},</p><p>Os resultados da competição "{{evento}}" já estão disponíveis!</p><p>Sua classificação: {{posicao}}º lugar</p><p>Tempo: {{tempo}}</p><p>Parabéns pela participação!</p><p>Veja a classificação completa em nosso site.</p>',
    variables: ['nome', 'evento', 'posicao', 'tempo'],
    active: true
  }
];

async function main() {
  console.log('Iniciando criação de templates...');
  
  for (const template of templates) {
    try {
      // Gerar ID consistente baseado no tipo e canal (usando template.name como seed)
      const templateId = `${template.type}_${template.channel}_${template.name.replace(/\s+/g, '_').toLowerCase()}`;
      
      const result = await prisma.notificationTemplate.upsert({
        where: {
          id: templateId
        },
        update: {
          ...template,
          updatedAt: new Date()
        },
        create: {
          ...template,
          id: templateId,
          updatedAt: new Date()
        }
      });
      
      console.log(`Template criado/atualizado: ${result.name}`);
    } catch (error) {
      console.error(`Erro ao criar template ${template.name}:`, error);
    }
  }
  
  console.log('Templates criados com sucesso!');
}

main()
  .catch(e => {
    console.error('Erro durante execução do script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
