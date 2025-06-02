import { PrismaClient, PaymentMethod } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { membershipService } from '../src/lib/membership/service';

// Inicializa o Prisma
const prisma = new PrismaClient();

// Configurações para o teste
const TEST_USER = {
  email: 'teste.whatsapp@example.com', // Usar o mesmo email do usuário de teste
};

async function testAthleteAffiliation() {
  try {
    console.log('===== INICIANDO TESTE DE FILIAÇÃO DE ATLETA =====');
    
    // Buscar o usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });
    
    if (!user) {
      console.error(`❌ Usuário com email ${TEST_USER.email} não encontrado.`);
      console.log('Por favor, crie o usuário primeiro usando o script test-user-registration.ts');
      return;
    }
    
    console.log(`\nUsuário encontrado: ${user.name} (${user.email})`);
    
    // Verificar se o atleta já existe para este usuário
    let athlete = await prisma.athlete.findFirst({
      where: { userId: user.id }
    });
    
    // Se o atleta não existir, criar um novo
    if (!athlete) {
      console.log('\nCriando novo atleta para o usuário...');
      
      athlete = await prisma.athlete.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          fullName: user.name || 'Atleta de Teste',
          birthDate: new Date('1990-01-01'),
          cpf: '12345678900',
          phone: '5562994242329', // Número para teste
          address: 'Rua de Teste, 123',
          city: 'Goiânia',
          state: 'GO',
          zipCode: '74000-000',
          category: 'ELITE',
          paymentStatus: 'PENDING',
          active: false,
          modalities: ['MTB', 'ROAD'],
          updatedAt: new Date()
        }
      });
      
      console.log(`✅ Atleta criado com sucesso: ${athlete.fullName}`);
    } else {
      console.log(`\nAtleta já existe: ${athlete.fullName}`);
      
      // Atualizar o número de telefone do atleta para garantir que esteja correto
      athlete = await prisma.athlete.update({
        where: { id: athlete.id },
        data: { 
          phone: '5562994242329',
          active: false // Garantir que está inativo para testar a ativação
        }
      });
      
      console.log('✅ Dados do atleta atualizados');
    }
    
    // Simular a criação de uma filiação
    console.log('\nCriando filiação para o atleta...');
    
    const affiliationData = {
      userId: user.id,
      type: 'ATHLETE' as const,
      amount: 15000, // R$ 150,00 em centavos
      description: 'Filiação de Atleta - Teste',
      paymentMethod: 'CREDIT_CARD' as PaymentMethod,
      customer: {
        name: user.name || athlete.fullName,
        email: user.email || 'teste.whatsapp@example.com', // Garantir que o email nunca será null
        document: athlete.cpf,
        address: {
          street: athlete.address,
          city: athlete.city,
          state: athlete.state,
          zipCode: athlete.zipCode
        }
      }
    };
    
    // Primeiro tentamos criar a filiação (isso normalmente só cria o registro e gera o pagamento)
    await membershipService.createMembership(affiliationData);
    
    console.log('\nFiliação criada, simulando aprovação de pagamento...');
    
    // Agora simulamos a ativação da filiação (como se o pagamento tivesse sido aprovado)
    console.log('\nAtivando filiação do atleta...');
    const activatedAthlete = await membershipService.activateMembership(user.id);
    
    if (activatedAthlete) {
      console.log(`\n✅ Filiação ativada com sucesso para: ${activatedAthlete.fullName}`);
      console.log('\nVerifique se a mensagem de confirmação foi recebida no WhatsApp!');
    } else {
      console.error('\n❌ Falha ao ativar a filiação do atleta.');
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
testAthleteAffiliation();
