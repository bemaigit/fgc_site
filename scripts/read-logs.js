const fs = require('fs')

// Lê o arquivo de logs
const logs = fs.readFileSync('../auth-debug.log', 'utf8')
  .split('\n')
  .filter(line => line) // Remove linhas vazias
  .map(line => {
    try {
      return JSON.parse(line)
    } catch (err) {
      return { error: 'Erro ao parsear linha', line }
    }
  })

// Imprime os logs formatados
logs.forEach(log => {
  console.log('\n-----------------------------------')
  console.log(`[${log.timestamp}] ${log.level}: ${log.message}`)
  if (log.data) console.log('Data:', log.data)
  if (log.error) console.log('Error:', log.error)
})
