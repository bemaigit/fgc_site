"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function FixManagerPage() {
  const router = useRouter()
  const [email, setEmail] = useState('w.betofoto@hotmail.com')
  const [clubId, setClubId] = useState('100a0e4f-5c02-463f-a3f9-9fac21882f35') // ID mostrado na imagem
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{success: boolean; message: string} | null>(null)
  
  const handleSubmit = async () => {
    try {
      setLoading(true)
      setResult(null)
      
      // Log para verificar dados enviados
      console.log('Enviando requisição:', { email, clubId })
      
      // Atualizar diretamente o usuário no banco usando o Prisma
      const response = await fetch('/api/admin/update-user-manager', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          clubId,
          setAsManager: true
        }),
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
            Esta ferramenta irá configurar seu usuário como dirigente de um clube
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email do Usuário</Label>
              <Input
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="clubId">ID do Clube</Label>
              <Input
                id="clubId"
                value={clubId}
                onChange={(e) => setClubId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco para remover associação com clube
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <div className="w-full space-y-4">
            <Button 
              className="w-full" 
              onClick={handleSubmit} 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                'Corrigir Perfil'
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
