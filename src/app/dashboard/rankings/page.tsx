'use client'

import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import { RankingManager } from './components/RankingManager'

export default function RankingsPage() {
  const { data: session } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/auth/signin')
    },
  })

  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    redirect('/auth/login')
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciamento de Rankings</h1>
      <RankingManager />
    </div>
  )
}
