import { PrismaClient } from '@prisma/client';
import axios from 'axios';

// Configurações de teste
const TEST_USER = {
  name: 'Teste WhatsApp',
  email: 'teste.whatsapp@example.com',
  phone: '5562994242329', // Número fornecido para teste
  password: 'senha123'
};

// Inicializa o Prisma
const prisma = new PrismaClient();

async function testUserRegistration() {
  try {
    console.log('===== INICIANDO TESTE DE REGISTRO COM WHATSAPP =====');
    console.log(`Nome: ${TEST_USER.name}`);
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`WhatsApp: ${TEST_USER.phone}`);
    
    // Verificar se o usuário já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: TEST_USER.email }
    });
    
    if (existingUser) {
      console.log(`\n⚠️ Usuário já existe com o email ${TEST_USER.email}`);
      console.log('Excluindo usuário existente para teste...');
      
      // Excluir o usuário existente
      await prisma.user.delete({
        where: { id: existingUser.id }
      });
      
      console.log('Usuário excluído com sucesso.');
    }
    
    // Registrar o usuário através da API
    console.log('\nRegistrando novo usuário...');
    const response = await axios.post('http://localhost:3000/api/auth/register', TEST_USER);
    
    if (response.status === 201) {
      console.log('✅ Usuário registrado com sucesso!');
      console.log('\nDetalhes da resposta:');
      console.log(JSON.stringify(response.data, null, 2));
      console.log('\nVerifique se a mensagem de boas-vindas foi recebida no WhatsApp!');
    } else {
      console.log(`❌ Falha ao registrar usuário. Status: ${response.status}`);
      console.log(response.data);
    }
    
  } catch (error: any) {
    console.error('Erro durante o teste:', error.message);
    if (error.response?.data) {
      console.error('Detalhes do erro:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Executar o teste
testUserRegistration();
