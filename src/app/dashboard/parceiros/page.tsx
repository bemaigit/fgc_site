'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ParceiroRedirect() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/dashboard/institucional/parceiros')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Redirecionando para a página de parceiros...</p>
    </div>
  )
}
