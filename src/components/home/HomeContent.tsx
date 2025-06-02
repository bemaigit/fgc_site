'use client'

import { CarouselBanner } from "../CarouselBanner";
import { SmallBanners } from "../../components/SmallBanners";
import { FiliationSection } from "./FiliationSection";
import Link from "next/link";
import { ClubFiliationCard } from "./ClubFiliationCard";
import { EventSlider } from "@/components/events/EventSlider";
import { NewsSlider } from "@/components/news/NewsSlider";
import DocumentsSection from "./DocumentsSection";
import { Partners } from "@/components/Partners";
import { Sponsors } from "@/components/Sponsors";
import { HomeRankingSection } from "./HomeRankingSection";
import { HomeChampionsSection } from "./HomeChampionsSection";
import { GallerySlider } from "@/components/gallery/GallerySlider";
import { IndicatorSection } from "@/components/indicators/IndicatorSection";
import CalendarioDestaque from "@/components/home/CalendarioDestaque";
import { ChevronRight } from 'lucide-react';
import { useState, useRef } from 'react';
import { AthletesSectionBanner } from './AthletesSectionBanner';

export function HomeContent() {
  // Refs e estados para controle do slider de filiação
  const filiationSliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Funções para controle do arrasto
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!filiationSliderRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - filiationSliderRef.current.offsetLeft);
    setScrollLeft(filiationSliderRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !filiationSliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - filiationSliderRef.current.offsetLeft;
    const walk = (x - startX) * 2; 
    filiationSliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!filiationSliderRef.current) return;
    setIsDragging(true);
    setStartX(e.touches[0].pageX - filiationSliderRef.current.offsetLeft);
    setScrollLeft(filiationSliderRef.current.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !filiationSliderRef.current) return;
    const x = e.touches[0].pageX - filiationSliderRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    filiationSliderRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <main className="flex-1 flex flex-col">
      {/* Banner principal - sem container extra */}
      <CarouselBanner />
      
      {/* Patrocinadores - Imediatamente após o banner, sem espaçamento */}
      <div id="patrocinadores" className="w-full bg-white">
        <Sponsors />
      </div>
      
      {/* Indicadores - Sem sobreposição, após os patrocinadores */}
      <div id="indicadores" className="w-full bg-gray-50 pt-4">
        <div className="container mx-auto px-4">
          <IndicatorSection />
        </div>
      </div>

      {/* Filiação - sem título, com espaçamento adequado dos indicadores */}
      <div id="filiacao" className="w-full pt-4 sm:pt-6 md:pt-10 lg:pt-12 pb-4 bg-gray-50">
        <div className="container mx-auto px-3">
          
          {/* Container do slider de filiação - SIMULANDO EXATAMENTE OS INDICADORES */}
          <div className="w-full overflow-hidden">
            <div 
              ref={filiationSliderRef}
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
              <div className="flex snap-x snap-mandatory min-w-full">
                {/* Cartões de filiação com altura igual e largura reduzida em celular */}
                <div className="flex-shrink-0 snap-start px-2 w-[80%] sm:w-1/2 sm:px-2 md:px-3">
                  <div className="h-full">
                    <FiliationSection />
                  </div>
                </div>
                
                <div className="flex-shrink-0 snap-start px-2 w-[80%] sm:w-1/2 sm:px-2 md:px-3">
                  <div className="h-full">
                    <ClubFiliationCard />
                  </div>
                </div>
              </div>
              
              {/* Indicadores de navegação para o slider - espaçamento reduzido */}
              <div className="flex justify-center mt-2 space-x-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <div className="w-2 h-2 rounded-full bg-gray-300"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Eventos - espaçamento otimizado */}
      <div id="eventos" className="w-full pt-8 pb-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#08285d]">Eventos</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Confira os próximos eventos Oficiais</p>
          </div>
          <div>
            <EventSlider />
          </div>
        </div>
      </div>
      
      {/* Calendário de Provas - destaque */}
      <div className="w-full pb-8 -mt-2">
        <div className="container mx-auto px-3 sm:px-4">
          <CalendarioDestaque />
        </div>
      </div>
      
      {/* Rankings */}
      <div id="rankings">
        <HomeRankingSection />
      </div>

      {/* Campeões Goianos */}
      <div id="campeoes">
        <HomeChampionsSection />
      </div>

      {/* Banner Conheça nossos Atletas */}
      <div id="conheca-atletas" className="w-full">
        <AthletesSectionBanner />
      </div>
      
      {/* Banner Menor */}
      <div className="w-full bg-white py-8">
        <div> 
          <SmallBanners />
        </div>
      </div>

      {/* Notícias - Reposicionado após o Banner Menor */}
      <div id="noticias" className="w-full pt-6 pb-6 sm:py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#08285d]">Notícias</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Acompanhe as últimas notícias do ciclismo</p>
          </div>
          <div>
            <NewsSlider />
          </div>
        </div>
      </div>

      {/* Galerias - espaçamento otimizado */}
      <div id="galerias" className="w-full pt-6 pb-6 sm:py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#08285d]">Galerias</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-2">Veja as melhores fotos dos eventos da FGC</p>
          </div>
          <div>
            <GallerySlider />
          </div>
        </div>
      </div>

      {/* Documentos */}
      <div id="documentos">
        <DocumentsSection />
      </div>

      {/* Parceiros */}
      <div id="parceiros">
        <Partners />
      </div>
    </main>
  );
}