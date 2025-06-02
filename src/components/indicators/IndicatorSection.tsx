'use client'

import { useState, useEffect, useRef } from 'react'
import { IndicatorCard } from './IndicatorCard'
import { Spinner } from '@/components/ui/Spinner'

interface Indicator {
  id: string
  title: string
  subtitle?: string
  value: string
  icon?: string
  iconColor?: string
  backgroundColor?: string
  textColor?: string
  order: number
  active: boolean
}

export function IndicatorSection() {
  const [indicators, setIndicators] = useState<Indicator[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  useEffect(() => {
    async function fetchIndicators() {
      try {
        setIsLoading(true)
        const response = await fetch('/api/indicators')
        
        if (!response.ok) {
          throw new Error('Falha ao carregar indicadores')
        }
        
        const data = await response.json()
        
        // Debug: Verificar dados retornados pela API
        console.log('Dados retornados pela API de indicadores:', data)
        
        // Filtra apenas indicadores ativos e ordena por ordem
        const activeIndicators = data
          .filter((indicator: Indicator) => indicator.active)
          .sort((a: Indicator, b: Indicator) => a.order - b.order)
        
        setIndicators(activeIndicators)
      } catch (error) {
        console.error('Erro ao carregar indicadores:', error)
        setError('Não foi possível carregar os indicadores')
      } finally {
        setIsLoading(false)
      }
    }

    fetchIndicators()
  }, [])

  // Funções para controle do arrasto
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; // Velocidade do arrasto
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const x = e.touches[0].pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-500">
        <p>{error}</p>
      </div>
    )
  }

  if (indicators.length === 0) {
    return null // Não exibe a seção se não houver indicadores
  }

  return (
    <div 
      ref={containerRef}
      className="w-full max-w-[1300px] mx-auto pl-4 pr-0 sm:px-6 relative overflow-hidden"
    >
      {/* Container com scroll horizontal */}
      <div 
        ref={sliderRef}
        className="overflow-x-auto scrollbar-hide"
        style={{ 
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
      >
        <div className="flex overflow-x-auto snap-x snap-start scrollbar-hide min-w-full">
          {indicators.map((indicator) => (
            <div 
              key={indicator.id} 
              className="flex-shrink-0 snap-start pr-3 pl-0 first:pl-0 w-[36%] md:w-[30%] lg:w-[23%]"
            >
              {/* Debug: Mostrar os valores de cada indicador */}
              {(() => {
                console.log('Renderizando indicador:', indicator.id, {
                  title: indicator.title,
                  subtitle: indicator.subtitle,
                  value: indicator.value,
                  icon: indicator.icon
                });
                return null;
              })()}
              <IndicatorCard
                title={indicator.title}
                subtitle={indicator.subtitle}
                value={indicator.value}
                icon={indicator.icon}
                iconColor={indicator.iconColor}
                backgroundColor={indicator.backgroundColor}
                textColor={indicator.textColor}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
