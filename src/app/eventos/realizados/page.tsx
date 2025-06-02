'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft } from "lucide-react"
import Link from "next/link"
import { PastEventGrid } from '@/components/events/PastEventGrid'

export default function PastEventsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-500/30 py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-4 sm:mb-6">
            <Link href="/eventos">
              <Button variant="ghost" size="sm" className="mb-2 sm:mb-3">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar para Eventos
              </Button>
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold">Eventos Realizados</h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
              Confira o histórico de eventos já realizados pela FGC
            </p>
          </div>
        </div>
      </div>

      {/* Lista de Eventos Realizados */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <PastEventGrid />
      </div>
    </div>
  )
}
