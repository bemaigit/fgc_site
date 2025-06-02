'use client'

import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface ActionButtonsProps {
  onNewClick?: () => void
  className?: string
}

export default function ActionButtons({
  onNewClick,
  className = '',
}: ActionButtonsProps) {
  const router = useRouter()

  const handleNewClick = () => {
    if (onNewClick) {
      onNewClick()
    } else {
      router.push('/dashboard/noticias/criar')
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleNewClick}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
      >
        <Plus className="-ml-1 mr-2 h-5 w-5" />
        Nova Notícia
      </button>
    </div>
  )
}
