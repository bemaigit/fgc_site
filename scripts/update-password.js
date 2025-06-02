// Este script atualiza a senha de um usuário específico no banco de dados
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    // Dados do usuário
    const userId = '0ae569d4-e20f-4a44-bde3-ef29b05e112f';
    const newPassword = 'C@ntafgc1104';
    
    // Gerar hash da nova senha
    // O 10 é o número de rounds de salt - deve ser o mesmo usado em seu sistema
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Atualizar o usuário no banco de dados - usando a tabela Account que armazena as senhas
    const updatedAccount = await prisma.account.updateMany({
      where: {
        userId: userId
      },
      data: {
        password: hashedPassword
      }
    });
    
    console.log('Senha atualizada com sucesso:', updatedAccount);
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
