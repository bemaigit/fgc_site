"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useSession } from "next-auth/react"

interface Modality {
  id: string;
  name: string;
}

function FiliationConfirmationContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [athleteData, setAthleteData] = useState<any>(null)
  const [modalityNames, setModalityNames] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Redirecionar se o usuário não estiver autenticado
    if (!session?.user) {
      router.push('/auth/login')
      return
    }

    const fetchAthleteData = async () => {
      try {
        setLoading(true)
        // Buscar informações do atleta para exibir os detalhes da filiação
        const response = await fetch(`/api/athletes/by-user?userId=${session.user.id}`)
        
        if (!response.ok) {
          throw new Error("Não foi possível carregar os dados do atleta")
        }
        
        const data = await response.json()
        if (data.found && data.athlete) {
          setAthleteData(data.athlete)
          
          // Buscar nomes das modalidades se houver IDs
          if (data.athlete.modalities && Array.isArray(data.athlete.modalities) && data.athlete.modalities.length > 0) {
            await fetchModalityNames(data.athlete.modalities);
          }
        } else {
          throw new Error("Dados do atleta não encontrados")
        }
      } catch (error) {
        console.error("Erro ao carregar dados do atleta:", error)
        setError("Não foi possível carregar os detalhes da filiação")
      } finally {
        setLoading(false)
      }
    }

    fetchAthleteData()
  }, [session, router])

  // Função para buscar os nomes das modalidades a partir dos IDs
  const fetchModalityNames = async (modalityIds: string[]) => {
    try {
      // Primeiro tentamos buscar do endpoint específico para modalidades
      const response = await fetch('/api/filiacao/modalidades?active=true');
      
      if (response.ok) {
        const allModalities: Modality[] = await response.json();
        
        // Filtrar apenas as modalidades que o atleta está filiado
        const athleteModalities = allModalities.filter(
          modality => modalityIds.includes(modality.id)
        );
        
        // Extrair apenas os nomes
        const names = athleteModalities.map(modality => modality.name);
        setModalityNames(names);
      } else {
        // Fallback: se não conseguir pelo endpoint específico, tentar pelo endpoint geral
        const fallbackResponse = await fetch('/api/modalities');
        if (fallbackResponse.ok) {
          const allModalities: Modality[] = await fallbackResponse.json();
          const athleteModalities = allModalities.filter(
            modality => modalityIds.includes(modality.id)
          );
          const names = athleteModalities.map(modality => modality.name);
          setModalityNames(names);
        } else {
          // Se ambos falharem, apenas exibimos os IDs como fallback
          console.error("Não foi possível obter nomes das modalidades");
        }
      }
    } catch (error) {
      console.error("Erro ao buscar nomes das modalidades:", error);
    }
  };

  // Função para formatar a data
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR')
  }

  // Renderiza estado de carregamento
  if (loading) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Carregando dados da filiação...</CardTitle>
            <CardDescription>Aguarde enquanto processamos sua informação</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Renderiza estado de erro
  if (error) {
    return (
      <div className="container mx-auto py-10 max-w-3xl">
        <Card className="border-red-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-red-600">Erro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter className="flex justify-center">
            <Link href="/dashboard/meu-perfil">
              <Button>Voltar para Meu Perfil</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <div className="w-full flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Filiação Confirmada com Sucesso!</CardTitle>
          <CardDescription>
            Sua filiação à Federação Goiana de Ciclismo foi processada e confirmada.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-6">
            {athleteData && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Detalhes da Filiação</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Nome</p>
                    <p className="font-medium">{athleteData.fullName || session?.user?.name}</p>
                  </div>
                  
                  {athleteData.category && (
                    <div>
                      <p className="text-sm text-gray-500">Categoria</p>
                      <p className="font-medium">{athleteData.category}</p>
                    </div>
                  )}
                  
                  {athleteData.modalities && (
                    <div className="col-span-2">
                      <p className="text-sm text-gray-500">Modalidades</p>
                      <p className="font-medium">
                        {modalityNames.length > 0 
                          ? modalityNames.join(', ') 
                          : (Array.isArray(athleteData.modalities) 
                              ? athleteData.modalities.join(', ') 
                              : athleteData.modalities)}
                      </p>
                    </div>
                  )}
                  
                  {athleteData.membershipStartDate && (
                    <div>
                      <p className="text-sm text-gray-500">Data de Início</p>
                      <p className="font-medium">{formatDate(athleteData.membershipStartDate)}</p>
                    </div>
                  )}
                  
                  {athleteData.membershipEndDate && (
                    <div>
                      <p className="text-sm text-gray-500">Válido até</p>
                      <p className="font-medium">{formatDate(athleteData.membershipEndDate)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h3 className="text-lg font-semibold text-blue-700 mb-2">Próximos Passos</h3>
              <ul className="list-disc list-inside space-y-2 text-blue-800">
                <li>Um email de confirmação foi enviado para seu endereço cadastrado</li>
                <li>Você já pode participar de eventos organizados pela Federação na categoria em que foi realizada a filiação</li>
                <li>Acesse seu perfil para ver detalhes completos da filiação</li>
              </ul>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard/meu-perfil">
            <Button className="w-full">Ver Meu Perfil</Button>
          </Link>
          <Link href="/eventos">
            <Button variant="outline" className="w-full">Ver Eventos Disponíveis</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export default function FiliationConfirmationPage() {
  return (
    <Suspense fallback={<div className="container mx-auto py-10 max-w-3xl">
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Carregando dados da filiação...</CardTitle>
          <CardDescription>Aguarde enquanto processamos sua informação</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    </div>}>
      <FiliationConfirmationContent />
    </Suspense>
  )
}
