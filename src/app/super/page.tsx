'use client'

import { useEffect, useState } from 'react'
import { logger } from '@/lib/logger'

export default function SuperAdminPage() {
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const checkSession = async () => {
      try {
        // TODO: Implementar verificação de sessão
        logger.info('Verificando sessão de super admin...')
      } catch (err) {
        logger.error('Erro ao verificar sessão:', err)
        setError(err)
      }
    }

    checkSession()
  }, [])

  if (error) {
    return <div>Error: {JSON.stringify(error)}</div>
  }

  return (
    <div>
      <h1>Super Admin</h1>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  )
}
