'use client'

import { ChampionsSection } from '@/components/champions/ChampionsSection'
import Link from 'next/link'

export function HomeChampionsSection() {
  return (
    <section className="w-full bg-gradient-to-br from-[#0a8024] to-[#054012] py-12">
      <div className="container mx-auto px-4">
        <div className="mb-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            CAMPEÕES GOIANOS
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-2">
            Conheça os campeões Goianos oficiais da Federação Goiana de Ciclismo
          </p>
        </div>
        
        {/* Filtros principais no topo */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-8">
          <div className="bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-sm font-medium text-sm sm:text-base">
            SPEED
          </div>
          <div className="text-white/60">+</div>
          <div className="bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-sm font-medium text-sm sm:text-base">
            MTB
          </div>
          <div className="text-white/60">+</div>
          <div className="bg-white/10 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-sm font-medium text-sm sm:text-base">
            BMX
          </div>
        </div>
        
        <ChampionsSection />
      </div>
    </section>
  )
}
