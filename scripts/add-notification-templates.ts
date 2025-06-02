#!/usr/bin/env ts-node
/**
 * Script para adicionar templates de notificação para os novos tipos
 * implementados no sistema.
 * 
 * Executar com: npx ts-node scripts/add-notification-templates.ts
 */

import { PrismaClient } from '@prisma/client';
import * as Handlebars from 'handlebars';

const prisma = new PrismaClient();

// Função auxiliar para extrair variáveis do template
function extractVariables(content: string): string[] {
  const regex = /{{([^}]+)}}/g;
  const variables = new Set<string>();
  let match;

  while ((match = regex.exec(content)) !== null) {
    const variable = match[1].trim();
    if (!variable.startsWith("#") && !variable.startsWith("/")) {
      variables.add(variable);
    }
  }

  return Array.from(variables);
}

async function createOrUpdateTemplate(template: {
  id: string;
  type: string;
  channel: string;
  name: string;
  content: string;
}) {
  try {
    // Validar template com Handlebars
    Handlebars.compile(template.content);
    
    // Extrair variáveis
    const variables = extractVariables(template.content);
    
    // Atualizar ou criar o template
    const result = await prisma.notificationTemplate.upsert({
      where: {
        id: template.id
      },
      update: {
        ...template,
        variables,
        active: true,
        updatedAt: new Date()
      },
      create: {
        ...template,
        variables,
        active: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });
    
    console.log(`✅ Template "${template.name}" (${template.id}) salvo com sucesso.`);
    return result;
  } catch (error) {
    console.error(`❌ Erro ao salvar template "${template.name}":`, error);
    throw error;
  }
}

async function main() {
  console.log('🔔 Iniciando criação/atualização de templates de notificação...');
  
  try {
    // Template de boas-vindas por WhatsApp
    await createOrUpdateTemplate({
      id: 'user-welcome-whatsapp',
      type: 'USER_WELCOME',
      channel: 'whatsapp',
      name: 'Boas-vindas ao novo usuário',
      content: `Olá {{name}}! 👋

Bem-vindo(a) ao sistema da Federação Goiana de Ciclismo!

Seu cadastro foi realizado com sucesso. Agora você pode se inscrever em eventos e acompanhar as novidades da federação.

Acesse sua conta em: {{loginUrl}}

Se precisar de ajuda, entre em contato conosco.`
    });
    
    // Template de confirmação de filiação por WhatsApp
    await createOrUpdateTemplate({
      id: 'affiliation-confirmed-whatsapp',
      type: 'AFFILIATION_CONFIRMED',
      channel: 'whatsapp',
      name: 'Confirmação de filiação de atleta',
      content: `Olá {{name}}! 🚴‍♂️

Sua filiação como atleta na Federação Goiana de Ciclismo foi confirmada!

*Detalhes da filiação:*
• Categoria: {{category}}
• Modalidade: {{modality}}
• Validade: {{expirationDate}}
• Clube: {{clubName}}

Sua carteirinha digital já está disponível em nosso sistema.
Acesse: {{cardUrl}}

Boas pedaladas! 🚵‍♀️`
    });
    
    // Template de resultados de eventos por WhatsApp
    await createOrUpdateTemplate({
      id: 'event-results-whatsapp',
      type: 'EVENT_RESULTS_PUBLISHED',
      channel: 'whatsapp',
      name: 'Resultados de evento publicados',
      content: `Olá {{name}}! 🏆

Os resultados do evento *{{eventName}}* acabam de ser publicados!

*Sua classificação:*
• Posição: {{position}}
• Categoria: {{category}}
• Tempo: {{time}}

Veja os resultados completos e classicação geral em:
{{resultsUrl}}

Parabéns pela participação! 👏`
    });

    // Versões em email dos mesmos templates (HTML)
    await createOrUpdateTemplate({
      id: 'user-welcome-email',
      type: 'USER_WELCOME',
      channel: 'email',
      name: 'Boas-vindas ao novo usuário (Email)',
      content: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #3498db; color: white; padding: 10px; text-align: center; }
    .content { padding: 20px; border: 1px solid #ddd; }
    .button { background-color: #3498db; color: white; padding: 10px 15px; text-decoration: none; display: inline-block; border-radius: 4px; }
    .footer { margin-top: 20px; font-size: 12px; color: #777; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Bem-vindo à Federação Goiana de Ciclismo!</h2>
    </div>
    <div class="content">
      <p>Olá {{name}},</p>
      
      <p>Seja bem-vindo(a) ao sistema da Federação Goiana de Ciclismo!</p>
      
      <p>Seu cadastro foi realizado com sucesso. Agora você pode se inscrever em eventos e acompanhar as novidades da federação.</p>
      
      <p style="text-align: center; margin: 25px 0;">
        <a href="{{loginUrl}}" class="button">Acessar Minha Conta</a>
      </p>
      
      <p>Se tiver alguma dúvida, sinta-se à vontade para entrar em contato conosco.</p>
      
      <p>Atenciosamente,<br>
      Equipe da Federação Goiana de Ciclismo</p>
    </div>
    <div class="footer">
      <p>Este é um email automático, por favor não responda.</p>
    </div>
  </div>
</body>
</html>`
    });
    
    console.log('✅ Todos os templates foram criados/atualizados com sucesso.');
  } catch (error) {
    console.error('❌ Erro durante a execução do script:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
