import { RankingSection } from './components/RankingSection'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Rankings - Federação Goiana de Ciclismo',
  description: 'Rankings dos atletas da Federação Goiana de Ciclismo'
}

export default function RankingsPage() {
  return (
    <main className="min-h-screen bg-[#0077c8] flex flex-col items-center">
      <div className="w-full max-w-4xl pt-4 pb-8 px-4">
        <div className="mb-2 pt-4">
          <Link 
            href="/" 
            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-sm transition-colors w-fit mb-4"
          >
            <ArrowLeft size={18} />
            <span>Voltar para Home</span>
          </Link>
        </div>
        <div className="mb-8 px-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white">RANKINGS GOIANO</h1>
          <p className="text-white/80 mt-2">
            Acompanhe o desempenho dos atletas nas diferentes modalidades e categorias
          </p>
        </div>

        {/* Filtros principais no topo */}
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-white/10 text-white px-4 py-2 rounded-sm font-medium">
            SPEED
          </div>
          <div className="text-white/60">+</div>
          <div className="bg-white/10 text-white px-4 py-2 rounded-sm font-medium">
            MTB
          </div>
          <div className="text-white/60">+</div>
          <div className="bg-white/10 text-white px-4 py-2 rounded-sm font-medium">
            BMX
          </div>
        </div>

        <RankingSection />

        <div className="text-white/60 text-sm mt-8 text-center">
          Última atualização: {new Date().toLocaleDateString()}
        </div>
      </div>
    </main>
  )
}
