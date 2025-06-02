'use client'
 
// Desativar temporariamente o componente de erro para evitar loops infinitos
// Importar apenas React para renderização mínima
import React from 'react'
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  // Não usar hooks como useEffect ou useState que podem causar loops
  // Apenas registrar o erro uma vez no console, sem usar hooks
  React.useLayoutEffect(() => {
    console.error("Erro capturado:", error)
    // Não atualizar nenhum estado aqui
  }, [error]);
 
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Algo deu errado!
        </h2>
        <p className="text-gray-600 mb-6">
          Ocorreu um erro ao carregar esta página. Por favor, tente novamente.
        </p>
        <button
          type="button"
          onClick={() => {
            // Redefinir sem causar loops de renderização
            try {
              reset();
            } catch (e) {
              console.error("Erro ao tentar resetar:", e);
              // Forçar o recarregamento da página como fallback
              window.location.reload();
            }
          }}
          className="w-full bg-[#08285d] text-white py-2 px-4 rounded-md hover:bg-[#7db0de] transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  )
}
