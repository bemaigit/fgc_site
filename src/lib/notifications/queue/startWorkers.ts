// Arquivo para iniciar os workers de notificação em ambientes de produção/desenvolvimento
import { startWorkers, stopWorkers } from './notificationWorkers';

/**
 * Esta função é chamada para iniciar os workers de notificação
 * Pode ser chamada em diferentes locais dependendo da arquitetura da aplicação:
 * - Em um processo separado em produção
 * - No processo principal durante desenvolvimento
 */
async function main() {
  console.log('🚀 Iniciando sistema de filas de notificação');
  
  // Iniciar os workers
  const workers = startWorkers();
  
  // Manipular desligamento gracioso
  const handleShutdown = async () => {
    console.log('📴 Parando sistema de filas de notificação...');
    await stopWorkers();
    process.exit(0);
  };
  
  // Registrar manipuladores de eventos para desligamento gracioso
  process.on('SIGTERM', handleShutdown);
  process.on('SIGINT', handleShutdown);
  
  console.log('✅ Sistema de filas de notificação iniciado com sucesso');
  
  // Manter processo vivo se for executado diretamente
  if (require.main === module) {
    console.log('🔄 Processo de worker rodando em modo autônomo');
  }
}

// Executar a função principal se o arquivo for chamado diretamente
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Erro ao iniciar workers:', error);
    process.exit(1);
  });
}

export default main;
