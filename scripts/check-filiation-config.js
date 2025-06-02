// Script para verificar os campos da tabela FiliationConfig
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFiliationConfig() {
  try {
    console.log('Verificando a tabela FiliationConfig...');

    // Consultar o registro padrão
    const config = await prisma.filiationConfig.findUnique({
      where: { id: 'default-filiation' }
    });

    if (!config) {
      console.error('Registro padrão não encontrado!');
      return;
    }

    console.log('Configuração de Filiação:');
    console.log(JSON.stringify(config, null, 2));

    // Verificar quais campos foram adicionados
    const fields = Object.keys(config);
    console.log('\nCampos disponíveis:');
    fields.forEach(field => console.log(`- ${field}`));

  } catch (error) {
    console.error('Erro ao verificar a tabela FiliationConfig:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFiliationConfig()
  .then(() => console.log('\nVerificação concluída.'))
  .catch(error => console.error('Erro na execução do script:', error));
