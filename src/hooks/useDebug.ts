interface DebugLogger {
  log: (...args: any[]) => void
  error: (...args: any[]) => void
  warn: (...args: any[]) => void
  info: (...args: any[]) => void
  group: (label: string) => void
  groupEnd: () => void
}

export function useDebug(namespace: string): DebugLogger {
  const isDevelopment = process.env.NODE_ENV === 'development'

  const createLogger = (type: 'log' | 'error' | 'warn' | 'info') => {
    return (...args: any[]) => {
      if (isDevelopment) {
        console[type](`[${namespace}]`, ...args)
      }
    }
  }

  return {
    log: createLogger('log'),
    error: createLogger('error'),
    warn: createLogger('warn'),
    info: createLogger('info'),
    group: (label: string) => {
      if (isDevelopment) {
        console.group(`[${namespace}] ${label}`)
      }
    },
    groupEnd: () => {
      if (isDevelopment) {
        console.groupEnd()
      }
    }
  }
}
