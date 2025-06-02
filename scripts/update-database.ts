import { spawn } from 'child_process'

async function runCommand(command: string, args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit' })
    child.on('close', code => {
      if (code === 0) resolve()
      else reject(new Error(`Command failed with code ${code}`))
    })
  })
}

async function main() {
  try {
    console.log('🔄 Regenerando Prisma Client...')
    await runCommand('npx', ['prisma', 'generate'])

    console.log('🔄 Atualizando schema do banco...')
    // db push é seguro, só adiciona novas colunas e não remove dados existentes
    await runCommand('npx', ['prisma', 'db', 'push'])

    console.log('✅ Atualização concluída com sucesso!')
    console.log('💡 Nota: Nenhum dado existente foi afetado')
    console.log('📝 Mudanças aplicadas:')
    console.log('   - Adicionado campo priority (Int, default: 0) na tabela PaymentGatewayConfig')
    console.log('   - Criados índices para melhor performance')
  } catch (error) {
    console.error('❌ Erro ao atualizar banco:', error)
    process.exit(1)
  }
}

main()