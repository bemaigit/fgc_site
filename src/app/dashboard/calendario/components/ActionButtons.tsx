'use client'

import { Plus, Image } from 'lucide-react'
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
      router.push('/dashboard/calendario/criar')
    }
  }
  
  const handleBannerClick = () => {
    router.push('/dashboard/calendario/banner')
  }

  return (
    <div className={`flex space-x-3 ${className}`}>
      <button
        type="button"
        onClick={handleNewClick}
        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
      >
        <Plus className="-ml-1 mr-2 h-5 w-5" />
        Novo Calendário
      </button>
      
      <button
        type="button"
        onClick={handleBannerClick}
        className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
      >
        <Image className="-ml-1 mr-2 h-5 w-5" />
        Gerenciar Banner
      </button>
    </div>
  )
}
