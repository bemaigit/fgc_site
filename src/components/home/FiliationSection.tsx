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
import { Trophy, Medal, Award, User2, Loader2 } from 'lucide-react';
import Image from 'next/image';

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

export function FiliationSection() {
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { data: session } = useSession();
  const [banner, setBanner] = useState<FiliationBanner | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Processar URL da imagem do banner
  const processImageUrl = (url: string | undefined): string => {
    if (!url) return '';
    
    console.log('Processando URL do banner de atleta (original):', url);
    
    // Determinar a URL base de forma mais segura
    // Usar sempre window.location.origin no cliente para garantir compatibilidade com ambiente atual
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    
    // Logar a URL base em desenvolvimento para depuração
    if (process.env.NODE_ENV === 'development') {
      console.log(`[FiliationSection] Usando base URL: ${baseUrl}`);
    }
    
    // Se a URL já é do nosso endpoint proxy com a URL atual
    if (url.includes('/api/filiacao/banner/image') && url.startsWith(baseUrl)) {
      console.log('URL já processada corretamente, retornando original:', url);
      return url;
    }
    
    // Se for caminho relativo
    if (!url.includes('://') && !url.startsWith('/')) {
      // Usar a variável baseUrl já definida anteriormente
      const processedUrl = `${baseUrl}/api/filiacao/banner/image?path=${encodeURIComponent(url)}`;
      console.log('URL processada de caminho relativo:', processedUrl);
      return processedUrl;
    }
    
    // Se for uma URL do ngrok antigo
    if (url.includes('ngrok-free.app')) {
      try {
        const urlObj = new URL(url);
        
        // Se for uma URL do endpoint proxy antigo, extrair o parâmetro path
        if (url.includes('/api/filiacao/banner/image')) {
          const searchParams = new URLSearchParams(urlObj.search);
          const pathParam = searchParams.get('path');
          if (pathParam) {
            // Usar a variável baseUrl já definida anteriormente
            const processedUrl = `${baseUrl}/api/filiacao/banner/image?path=${encodeURIComponent(pathParam)}`;
            console.log('URL reprocessada de antiga URL proxy:', processedUrl);
            return processedUrl;
          }
        }
        
        // Se for uma URL direta
        const path = urlObj.pathname.replace(/^\/storage\//, '');
        const encodedPath = encodeURIComponent(path);
        const processedUrl = `${baseUrl}/api/filiacao/banner/image?path=${encodedPath}`;
        console.log('URL reprocessada de URL antiga:', processedUrl);
        return processedUrl;
      } catch (error) {
        console.error('Erro ao processar URL do banner:', error);
      }
    }
    
    // Se for uma URL do MinIO local
    if (url.includes('localhost:9000')) {
      try {
        const urlObj = new URL(url);
        // Extrair apenas o caminho relativo (após fgc/)
        const pathMatch = urlObj.pathname.match(/^\/fgc\/(.*)/);
        const path = pathMatch ? pathMatch[1] : urlObj.pathname;
        const encodedPath = encodeURIComponent(path);
        
        // Usar a API proxy para entregar a imagem - usar a variável baseUrl já definida
        return `${baseUrl}/api/filiacao/banner/image?path=${encodedPath}`;
      } catch (error) {
        console.error('Erro ao processar URL do MinIO:', error);
      }
    }
    
    return url;
  };

  // Buscar banner ao carregar o componente
  useEffect(() => {
    const fetchBanner = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/filiacao/banner?type=ATHLETE');
        
        if (!response.ok) {
          throw new Error('Falha ao buscar banner');
        }
        
        const data = await response.json();
        setBanner(data[0] || null);
      } catch (error) {
        console.error('Erro ao buscar banner de filiação:', error);
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
        router.push(banner.buttonUrl);
      } else {
        // Senão, usar URL padrão
        router.push('/filiacao/formulario');
      }
    } else {
      setShowLoginDialog(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
      {isLoading ? (
        <div className="flex items-center justify-center p-6">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin" />
        </div>
      ) : error ? (
        // Exibir layout padrão caso ocorra erro
        <div className="p-6 flex flex-col">
          <div className="flex items-center mb-3">
            <div className="bg-blue-500 p-3 rounded-lg mr-3">
              <User2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-grow"></div>
            <div className="flex space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <Medal className="w-5 h-5 text-gray-400" />
              <Award className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          
          <div className="ml-3 w-64 -mt-3 mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              Faça parte da maior comunidade de ciclismo de Goiás
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Eventos oficiais
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Ranking estadual
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Seguro atleta
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Descontos
            </div>
          </div>

          <Button 
            onClick={handleFiliacao}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors duration-200 group flex items-center justify-between"
          >
            <span>{session ? 'Continuar filiação' : 'Filiar atleta agora'}</span>
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
        // Versão simples e compacta do banner
        <>
          <div className="aspect-[16/9] bg-white">
            <img 
              src={processImageUrl(banner.image)} 
              alt={banner.title}
              className="w-full h-full object-contain" 
              onError={(e) => {
                console.error('Erro ao carregar imagem do banner:', e);
                // Substituir por uma imagem padrão
                e.currentTarget.src = '/images/logo.png';
              }}
            />
          </div>
          <div className="p-2">
            <Button 
              onClick={handleFiliacao}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors duration-200 group flex items-center justify-between"
            >
              <span>
                {banner.buttonText ? 
                  banner.buttonText : 
                  (session ? 'Continuar filiação' : 'Filiar atleta agora')}
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
        <div className="p-6 flex flex-col">
          <div className="flex items-center mb-3">
            <div className="bg-blue-500 p-3 rounded-lg mr-3">
              <User2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-grow"></div>
            <div className="flex space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <Medal className="w-5 h-5 text-gray-400" />
              <Award className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          
          <div className="ml-3 w-64 -mt-3 mb-3">
            <p className="text-sm text-gray-600 line-clamp-2">
              Faça parte da maior comunidade de ciclismo de Goiás
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-y-2 text-sm mb-4">
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Eventos oficiais
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Ranking estadual
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Seguro atleta
            </div>
            <div className="flex items-center text-gray-700">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></span>
              Descontos
            </div>
          </div>

          <Button 
            onClick={handleFiliacao}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg text-sm font-medium transition-colors duration-200 group flex items-center justify-between"
          >
            <span>{session ? 'Continuar filiação' : 'Filiar atleta agora'}</span>
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
              Para realizar a filiação, é necessário fazer login no sistema.
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
