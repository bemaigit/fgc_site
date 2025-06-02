// Logger para debug de autenticação
class Logger {
  private isDev = process.env.NODE_ENV !== 'production'
  private MAX_LOGS = 100

  private saveLog(log: any) {
    try {
      // Só salva logs no cliente
      if (typeof window !== 'undefined') {
        // Pega logs existentes
        const logs = JSON.parse(localStorage.getItem('auth_logs') || '[]')
        
        // Adiciona novo log
        logs.push({
          timestamp: new Date().toISOString(),
          ...log
        })
        
        // Mantém só os últimos MAX_LOGS
        if (logs.length > this.MAX_LOGS) {
          logs.splice(0, logs.length - this.MAX_LOGS)
        }
        
        // Salva logs atualizados
        localStorage.setItem('auth_logs', JSON.stringify(logs))
      }
    } catch (err) {
      console.error('Erro ao salvar log:', err)
    }
  }

  error(message: string, error?: unknown) {
    const log = {
      level: 'ERROR',
      message,
      error: error instanceof Error ? error.message : error
    }
    
    if (this.isDev) {
      console.error(`[ERROR] ${message}:`, error)
    }
    
    this.saveLog(log)
  }

  warn(message: string, ...args: unknown[]) {
    const log = {
      level: 'WARN',
      message,
      data: args
    }
    
    if (this.isDev) {
      console.warn(`[WARN] ${message}`, ...args)
    }
    
    this.saveLog(log)
  }

  info(message: string, ...args: unknown[]) {
    const log = {
      level: 'INFO',
      message,
      data: args
    }
    
    if (this.isDev) {
      console.info(`[INFO] ${message}`, ...args)
    }
    
    this.saveLog(log)
  }

  debug(message: string, ...args: unknown[]) {
    const log = {
      level: 'DEBUG',
      message,
      data: args
    }
    
    if (this.isDev) {
      console.debug(`[DEBUG] ${message}`, ...args)
    }
    
    this.saveLog(log)
  }

  // Método para ler os logs
  getLogs() {
    try {
      if (typeof window !== 'undefined') {
        return JSON.parse(localStorage.getItem('auth_logs') || '[]')
      }
      return []
    } catch (err) {
      console.error('Erro ao ler logs:', err)
      return []
    }
  }

  // Método para limpar os logs
  clearLogs() {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_logs')
      }
    } catch (err) {
      console.error('Erro ao limpar logs:', err)
    }
  }
}

export const logger = new Logger()
