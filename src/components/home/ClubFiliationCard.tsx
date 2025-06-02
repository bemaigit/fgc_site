'use client';

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Building2, Star, Users, Loader2 } from 'lucide-react';
import { processFiliationBannerUrl } from '@/lib/processFiliationBannerUrl';

// Tipo do banner de filiação
type FiliationBanner = {
  id: string;
  type: 'ATHLETE' | 'CLUB';
  image: string;
  title: string;
  buttonText?: string;
  buttonUrl?: string;
  buttonPosition: string;
  active: boolean;
};

export function ClubFiliationCard() {
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { data: session } = useSession();
  const [banner, setBanner] = useState<FiliationBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar banner ao carregar o componente
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/filiacao/banner?type=CLUB');
        
        if (!response.ok) {
          throw new Error('Falha ao buscar banner');
        }
        
        const data = await response.json();
        setBanner(data[0] || null);
      } catch (error) {
        console.error('Erro ao buscar banner de filiação de clube:', error);
        setError('Não foi possível carregar o banner');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchBanner();
  }, []);

  const handleFiliacao = () => {
    if (session) {
      // Se tiver URL personalizada no banner, usar ela
      if (banner?.buttonUrl) {
        console.log('Redirecionando para URL do banner:', banner.buttonUrl);
        router.push(banner.buttonUrl);
      } else {
        // Senão, usar URL padrão do novo formulário de filiação de clube
        console.log('Redirecionando para formulário de filiação de clube');
        router.push('/filiacao/clube/formulario');
      }
    } else {
      console.log('Usuário não logado, exibindo diálogo de login');
      setShowLoginDialog(true);
    }
  };

  // Log para debug quando o banner for carregado
  useEffect(() => {
    if (banner) {
      console.log('Banner do clube carregado:', banner);
    }
  }, [banner]);

  // Usar o processador de URLs padronizado
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    // Obter a URL que falhou
    const failedSrc = e.currentTarget.src;
    console.error(`Erro ao carregar imagem do banner. URL: ${failedSrc}`);
    
    // Evitar loop infinito verificando se já estamos usando a imagem de fallback
    if (!failedSrc.endsWith('filiation-banner-placeholder.jpg')) {
      // Substituir por uma imagem padrão
      e.currentTarget.src = '/images/filiation-banner-placeholder.jpg';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center h-full w-full p-6">
          <Loader2 className="h-8 w-8 text-green-500 animate-spin" />
        </div>
      ) : error ? (
        // Exibir layout padrão caso ocorra erro
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center mb-3">
            <div className="bg-green-500 p-3 rounded-lg mr-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Filiar Clube</h2>
            <div className="flex-grow"></div>
            <div className="flex space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          
          <div className="ml-3 w-64 -mt-3 mb-3 min-h-[40px]">
            <p className="text-sm text-gray-600 line-clamp-2">
              Faça seu clube parte da Federação Goiana de Ciclismo
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-4 flex-grow">
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Reconhecimento Oficial
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Suporte FGC
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Eventos Oficiais
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Benefícios Exclusivos
            </div>
          </div>

          <Button 
            onClick={handleFiliacao}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg text-base font-medium transition-colors duration-200 group flex items-center justify-between px-4 mt-auto"
          >
            <span>{session ? 'Continuar filiação' : 'Filiar clube agora'}</span>
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </Button>
        </div>
      ) : banner ? (
        // Exibir banner personalizado
        <>
          {/* Layout melhorado do card com banner */}
          <div className="aspect-[16/9] bg-white">
            {/* Imagem do banner em destaque */}
            <img 
              src={processFiliationBannerUrl(banner.image)}
              alt={banner.title || 'Banner de Filiação de Clube'}
              className="w-full h-full object-contain" 
              onError={handleImageError}
            />
          </div>
          <div className="p-2">
            <Button 
              onClick={handleFiliacao}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-2 rounded-lg text-sm font-medium transition-colors duration-200 group flex items-center justify-between"
            >
              <span>
                {banner.buttonText ? 
                  banner.buttonText : 
                  (session ? 'Continuar filiação' : 'Filiar clube agora')}
              </span>
              <svg 
                className="ml-2 w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5l7 7-7 7" 
                />
              </svg>
            </Button>
          </div>
        </>
      ) : (
        // Exibir layout padrão se não houver banner
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center mb-3">
            <div className="bg-green-500 p-3 rounded-lg mr-3">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Filiar Clube</h2>
            <div className="flex-grow"></div>
            <div className="flex space-x-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          
          <div className="ml-3 w-64 -mt-3 mb-3 min-h-[40px]">
            <p className="text-sm text-gray-600 line-clamp-2">
              Faça seu clube parte da Federação Goiana de Ciclismo
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-4 flex-grow">
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Reconhecimento Oficial
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Suporte FGC
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Eventos Oficiais
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2"></span>
              Benefícios Exclusivos
            </div>
          </div>

          <Button 
            onClick={handleFiliacao}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-4 rounded-lg text-base font-medium transition-colors duration-200 group flex items-center justify-between px-4 mt-auto"
          >
            <span>{session ? 'Continuar filiação' : 'Filiar clube agora'}</span>
            <svg 
              className="w-5 h-5 transform group-hover:translate-x-1 transition-transform duration-200" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 5l7 7-7 7" 
              />
            </svg>
          </Button>
        </div>
      )}

      {/* Dialog de Login */}
      <Dialog open={showLoginDialog} onOpenChange={setShowLoginDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Necessário</DialogTitle>
            <DialogDescription>
              Para realizar a filiação do clube, é necessário fazer login no sistema.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              onClick={() => {
                setShowLoginDialog(false);
                router.push('/auth/login');
              }}
            >
              Ir para Login
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}