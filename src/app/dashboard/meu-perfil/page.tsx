"use client"

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Loader2, AlertCircle, User, Calendar, Trophy, Award, Building, Camera } from 'lucide-react'
import { UserProfileSettings } from '@/components/profile/UserProfileSettings'
import ProfileDetails from './components/ProfileDetails'
import EventsList from './components/EventsList'
import Rankings from './components/Rankings'
import ClubManager from './components/ClubManager'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'
import { processUserImageUrl } from '@/lib/processUserImageUrl'
import { AthleteProfileEditor } from '@/components/profile/AthleteProfileEditor'

// Interfaces para os dados
interface UserData {
  id: string
  name: string
  email: string
  image?: string
  role: string
}

interface AthleteData {
  id: string
  fullName: string
  cpf: string
  birthDate: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  modalities: string[]
  category: string
  active: boolean
  paymentStatus: string
  userId?: string | null
}

interface EventRegistration {
  id: string
  eventId: string
  userId: string
  createdAt: string
  title: string
  startDate: string
  endDate: string
  location: string
  status: string
}

interface ClubData {
  id: string
  clubName: string
  cnpj: string
  responsibleName: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  zipCode: string
  active: boolean
  paymentStatus: string
}

interface ProfileData {
  user: UserData
  athlete: AthleteData | null
  hasFiliation: boolean
  eventRegistrations: EventRegistration[]
  isManager: boolean
  managedClub: ClubData | null
  clubAthletes: AthleteData[] | null
}

export default function MeuPerfilPage() {
  const { data: session, status } = useSession()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileData, setProfileData] = useState<ProfileData | null>(null)
  
  // Referência à função de busca para uso em callbacks
  const fetchProfileData = async () => {
    if (status === 'loading') return
    if (!session?.user?.id) {
      setError('Usuário não autenticado')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('Iniciando fetch para /api/athletes/me')
      const response = await fetch(`/api/athletes/me`)
      
      console.log('Status da resposta:', response.status, response.statusText)
      
      if (!response.ok) {
        // Tenta ler o corpo da resposta mesmo em caso de erro
        const errorData = await response.json().catch(() => ({ error: 'Não foi possível ler detalhes do erro' }))
        console.error('Detalhes do erro da API:', errorData)
        throw new Error(`Falha ao carregar dados do perfil: ${response.status} ${errorData.error || ''}`)
      }
      
      const data = await response.json()
      console.log('Dados do perfil recebidos:', data)
      setProfileData(data)
    } catch (error: any) {
      console.error('Erro ao carregar dados do perfil:', error)
      setError(`Não foi possível carregar seus dados: ${error?.message || 'Erro desconhecido'}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfileData()
  }, [session, status])

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando dados do perfil...</p>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Acesso negado</AlertTitle>
        <AlertDescription>
          Você precisa estar autenticado para acessar esta página.
        </AlertDescription>
      </Alert>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando dados do perfil...</p>
      </div>
    )
  }
  


  return (
    <div className="container mx-auto py-6">
      {/* Botão para voltar à página inicial */}
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Button variant="outline" size="sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1"><path d="M5 12h14"></path><path d="m5 12 4 4"></path><path d="m5 12 4-4"></path></svg>
            Voltar para o site
          </Button>
        </Link>
      </div>
      
      {profileData && (
        <>
          {/* Card de informações básicas do usuário */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={profileData.user.image ? processUserImageUrl(profileData.user.image) : '/images/placeholder-athlete.jpg'} 
                    onError={(e) => {
                      console.error('Erro ao carregar imagem de perfil');
                      e.currentTarget.src = '/images/placeholder-athlete.jpg';
                    }}
                  />
                  <AvatarFallback className="text-2xl">
                    {profileData.user.name?.substring(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{profileData.user.name}</h2>
                  <p className="text-muted-foreground">{profileData.user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                      {profileData.user.role}
                    </span>
                    
                    {profileData.hasFiliation ? (
                      <span className="px-2 py-1 rounded-md bg-green-100 text-green-800 text-xs font-medium">
                        Atleta Filiado
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-medium">
                        Não Filiado
                      </span>
                    )}
                  </div>
                </div>
                
                {!profileData.hasFiliation && (
                  <div className="mt-4 md:mt-0">
                    <Link href="/filiacao/formulario">
                      <Button className="w-full">
                        Realizar Filiação
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Tabs de conteúdo */}
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-4">
              <TabsTrigger value="profile">
                <User className="mr-2 h-4 w-4" />
                Perfil
              </TabsTrigger>
              <TabsTrigger value="events">
                <Calendar className="mr-2 h-4 w-4" />
                Eventos
              </TabsTrigger>
              <TabsTrigger value="rankings">
                <Trophy className="mr-2 h-4 w-4" />
                Rankings
              </TabsTrigger>
              {profileData.isManager && profileData.managedClub && (
                <TabsTrigger value="club">
                  <Building className="mr-2 h-4 w-4" />
                  Clube
                </TabsTrigger>
              )}
            </TabsList>
            
            <TabsContent value="profile" className="mt-6 space-y-8">
              {/* Componente de edição de perfil básico - visível para todos os usuários */}
              <UserProfileSettings 
                user={profileData.user}
                athletePhone={profileData.athlete?.phone || null}
                onUpdate={(updatedUserData: any) => setProfileData({
                  ...profileData,
                  user: { ...profileData.user, ...updatedUserData }
                })}
              />
              
              {/* Exibição condicional do perfil de atleta */}
              {profileData.hasFiliation ? (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-xl font-semibold mb-4">Dados de Atleta</h3>
                  <ProfileDetails 
                    user={session?.user}
                    athlete={profileData.athlete}
                    onUpdate={(updatedData) => setProfileData({
                      ...profileData,
                      athlete: { ...profileData.athlete, ...updatedData }
                    })}
                  />
                  
                  {/* Nova seção para o perfil público do atleta */}
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold">Perfil Público do Atleta</h3>
                      <div className="flex items-center">
                        <Link href={`/atletas/${profileData.athlete?.id}`} target="_blank">
                          <Button variant="outline" size="sm" className="flex items-center gap-2">
                            <Camera size={16} />
                            <span>Visualizar Perfil Público</span>
                          </Button>
                        </Link>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 mb-4">
                      Adicione informações ao seu perfil público de atleta, incluindo biografia, conquistas e fotos.
                      Seu perfil será visível para outros usuários e visitantes do site na seção "Conheça nossos Atletas".                      
                    </p>
                    <AthleteProfileEditor />
                  </div>
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Perfil de Atleta</CardTitle>
                    <CardDescription>
                      Você ainda não possui um perfil de atleta em nosso sistema.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p>
                        Para ter acesso a todas as funcionalidades disponíveis, como participação em rankings e 
                        torneios oficiais, é necessário realizar sua filiação como atleta.
                      </p>
                      <Alert>
                        <Award className="h-4 w-4" />
                        <AlertTitle>Filiação de Atleta</AlertTitle>
                        <AlertDescription>
                          Realize sua filiação para participar de competições oficiais e ter acesso a benefícios exclusivos.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Link href="/filiacao/formulario" className="w-full">
                      <Button className="w-full">Realizar Filiação Agora</Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
            
            <TabsContent value="events" className="mt-6">
              {/* Sempre renderizamos o EventsList, que agora busca os eventos diretamente da API */}
              <EventsList />
            </TabsContent>
            
            <TabsContent value="rankings" className="mt-6">
              {profileData.hasFiliation ? (
                <Rankings athleteId={profileData.athlete?.id || ''} />
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Rankings</CardTitle>
                    <CardDescription>
                      Você precisa ser um atleta filiado para participar dos rankings.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p>Atletas filiados podem participar de competições oficiais e acumular pontos nos rankings.</p>
                  </CardContent>
                  <CardFooter>
                    <Link href="/filiacao/formulario" className="w-full">
                      <Button className="w-full">Realizar Filiação</Button>
                    </Link>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
            
            {/* Aba de Clube para Dirigentes */}
            {profileData.isManager && profileData.managedClub && (
              <TabsContent value="club" className="mt-6">
                <ClubManager 
                  managedClub={profileData.managedClub} 
                  clubAthletes={profileData.clubAthletes?.map(athlete => ({
                    ...athlete,
                    userId: athlete.userId || null // Garantir que userId nunca é undefined
                  })) || []} 
                  onRefresh={() => {
                    // Recarregar os dados do perfil
                    fetchProfileData();
                  }}
                />
              </TabsContent>
            )}
          </Tabs>
        </>
      )}
    </div>
  )
}
