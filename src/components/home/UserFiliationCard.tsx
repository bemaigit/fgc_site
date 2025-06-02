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
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, Medal, Award } from 'lucide-react';

export function UserFiliationCard() {
  const router = useRouter();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const { data: session } = useSession();

  const handleFiliacao = () => {
    if (session) {
      router.push('/filiacao/formulario');
    } else {
      setShowLoginDialog(true);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="grid grid-cols-[auto,1fr,auto] gap-4 items-start mb-4">
        {/* Ícone de usuário */}
        <div className="bg-blue-500 p-3 rounded-lg">
          <svg 
            className="w-6 h-6 text-white"
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" 
            />
          </svg>
        </div>

        {/* Título e descrição */}
        <div>
          <h2 className="text-xl font-bold text-gray-900">Filie-se à FGC</h2>
          <p className="text-sm text-gray-600 mt-1">
            Faça parte da maior comunidade de ciclismo de Goiás
          </p>
        </div>

        {/* Ícones de troféu, medalha e prêmio */}
        <div className="flex gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <Medal className="w-5 h-5 text-gray-400" />
          <Award className="w-5 h-5 text-orange-500" />
        </div>
      </div>

      {/* Grid de benefícios */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4 text-sm">
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
        className="w-full bg-blue-500 hover:bg-blue-600 text-white py-4 rounded-lg text-base font-medium transition-colors duration-200 group flex items-center justify-between px-4"
      >
        <span>{session ? 'Continuar filiação' : 'Filiar-se agora'}</span>
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