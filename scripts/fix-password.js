// Este script corrige a senha do usuário usando bcrypt com as configurações exatas do sistema
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function updatePassword() {
  try {
    // Dados do usuário
    const userId = '0ae569d4-e20f-4a44-bde3-ef29b05e112f';
    const email = 'w.betofoto@hotmail.com';
    const newPassword = 'C@ntafgc1104';
    
    // Gerar o hash exatamente como o sistema faz durante a autenticação
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    console.log('Novo hash gerado:', hashedPassword);
    
    // Atualizar o usuário no banco de dados
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
      select: { id: true, email: true }
    });
    
    console.log('Senha atualizada com sucesso para o usuário:', updatedUser);

    // Verificar se podemos recuperar o usuário e validar a senha
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, password: true }
    });

    if (user && user.password) {
      // Testar se a senha será válida quando o sistema fizer a comparação
      const isValid = await bcrypt.compare(newPassword, user.password);
      console.log('Validação da nova senha:', isValid ? 'SUCESSO' : 'FALHA');
    } else {
      console.log('Usuário não encontrado após atualização!');
    }
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updatePassword();
