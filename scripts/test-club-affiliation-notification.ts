import WhatsAppAdapter from '../src/lib/notifications/adapters/whatsapp-adapter';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

// Inicializa o Prisma e o adaptador WhatsApp
const prisma = new PrismaClient();
const whatsappAdapter = new WhatsAppAdapter();

// Configurações para o teste
const TEST_PHONE = '5562994242329'; // Número de WhatsApp para teste
const TEST_USER_EMAIL = 'teste.whatsapp@example.com';

async function testClubAffiliationNotification() {
  try {
    console.log('===== INICIANDO TESTE DE NOTIFICAÇÃO DE FILIAÇÃO DE CLUBE =====');
    console.log(`Número de WhatsApp para teste: ${TEST_PHONE}`);

    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER_EMAIL }
    });

    if (!user) {
      console.error(`❌ Usuário com email ${TEST_USER_EMAIL} não encontrado.`);
      console.log('Por favor, crie o usuário primeiro usando o script test-user-registration.ts');
      return;
    }

    console.log(`\nUsuário encontrado: ${user.name} (${user.email})`);

    // Verificar conexão com WhatsApp antes de enviar
    console.log('\nVerificando conexão com WhatsApp...');
    const connectionStatus = await whatsappAdapter.checkConnectionStatus();

    if (connectionStatus.status !== 'connected') {
      console.error(`❌ WhatsApp não está conectado. Status: ${connectionStatus.status}`);
      console.error('Por favor, verifique a conexão do WhatsApp e tente novamente.');
      return;
    }

    console.log(`✅ WhatsApp conectado: ${connectionStatus.message}`);

    // Criar dados fictícios da filiação
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const formattedDate = now.toLocaleDateString('pt-BR');
    const formattedExpiryDate = expiryDate.toLocaleDateString('pt-BR');
    const protocol = `CLUBE-${Math.floor(Math.random() * 10000)}-${now.getFullYear()}`;

    // Construir a mensagem de confirmação
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://fgciclismo.com.br';
    const nome = user.name || 'Representante';
    const nomeClube = 'Clube Ciclístico Goiânia';
    const modalidades = 'MTB, ROAD, PISTA';

    // Construir a mensagem de confirmação
    const mensagem = `*Parabéns, ${nome}!* 🏁

A filiação do clube *${nomeClube}* foi *CONFIRMADA* com sucesso!

Protocolo: *${protocol}*
Clube: *${nomeClube}*
Modalidades: *${modalidades}*
Validade: *${formattedDate} até ${formattedExpiryDate}*

Você agora pode registrar atletas e equipes para competições oficiais da FGC!

Acesse o painel do clube em:
${baseUrl}/dashboard/clube

A Federação Goiana de Ciclismo agradece sua confiança!
Dúvidas? Entre em contato: contato@fgciclismo.com.br`;

    // Enviar mensagem pelo WhatsApp
    console.log('\nEnviando mensagem de confirmação de filiação de clube...');
    const result = await whatsappAdapter.sendTextMessage(TEST_PHONE, mensagem);

    if (result.success) {
      console.log(`\n✅ Mensagem enviada com sucesso!`);
      console.log(`ID da mensagem: ${result.messageId}`);
      console.log('\nVerifique se a mensagem de confirmação foi recebida no WhatsApp!');

      // Registrar a notificação no banco de dados para fins de auditoria (opcional)
      await prisma.notification.create({
        data: {
          id: uuidv4(),
          type: 'AFFILIATION_CONFIRMED',
          recipient: TEST_PHONE,
          status: 'DELIVERED',
          priority: 'HIGH',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      });
    } else {
      console.error(`\n❌ Falha ao enviar mensagem: ${result.error}`);
    }

  } catch (error: any) {
    console.error('Erro durante o teste:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testClubAffiliationNotification();
