"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FixDirigentePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null)
  
  const handleAtualizarUsuario = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      // Chamada simples para o endpoint
      const response = await fetch('/api/fix-dirigente', {
        method: 'POST',
      })
      
      const data = await response.json()
      console.log('Resposta:', data)
      
      if (response.ok) {
        setResult({
          success: true,
          message: 'Usuário atualizado com sucesso! Agora você é um dirigente.',
        })
      } else {
        setResult({
          success: false,
          message: `Erro: ${data.error || 'Falha ao atualizar usuário'}`,
        })
      }
    } catch (error: any) {
      console.error('Erro:', error)
      setResult({
        success: false,
        message: `Erro: ${error.message || 'Falha ao processar requisição'}`,
      })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Corrigir Perfil de Dirigente</CardTitle>
          <CardDescription>
            Esta ferramenta irá configurar seu usuário como dirigente do clube
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Seu usuário (w.betofoto@hotmail.com) será configurado como dirigente do clube "Clube Ciclismo Teste".
          </p>
          <p className="text-sm text-amber-600 mb-4">
            Esta é uma ferramenta administrativa utilizada apenas para corrigir o problema atual.
          </p>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-4">
            <Button 
              className="w-full" 
              onClick={handleAtualizarUsuario} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Corrigir Meu Perfil'
              )}
            </Button>
            
            {result && (
              <div className={`flex items-center p-3 rounded-md ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.success ? (
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                ) : (
                  <XCircle className="mr-2 h-4 w-4" />
                )}
                <p>{result.message}</p>
              </div>
            )}
            
            {result?.success && (
              <Button 
                className="w-full" 
                variant="outline" 
                onClick={() => {
                  router.push('/dashboard/meu-perfil')
                  router.refresh()
                }}
              >
                Ir para Meu Perfil
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
