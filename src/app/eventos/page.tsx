'use client'

import { Button } from '@/components/ui/button'
import { EventGrid } from '@/components/events/EventGrid'
import { ChevronLeft, History } from "lucide-react"
import Link from "next/link"

export default function EventsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-500/30 py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-4 sm:mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mb-2 sm:mb-3">
                <ChevronLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">Eventos</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  Confira todos os eventos disponíveis e faça sua inscrição
                </p>
              </div>
              <Link href="/eventos/realizados">
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline">Eventos realizados</span>
                  <span className="sm:hidden">Realizados</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Eventos */}
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <EventGrid />
      </div>
    </div>
  )
}
