'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function RedirectToSponsors() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/dashboard/institucional/patrocinadores')
  }, [router])
  
  return (
    <div className="flex h-screen items-center justify-center">
      <p className="text-lg">Redirecionando para a página de patrocinadores...</p>
    </div>
  )
}
