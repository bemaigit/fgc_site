"use client"

import { useState, useEffect } from 'react'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, Loader2, Medal, Trophy, TrendingUp } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import Link from 'next/link'

interface RankingPosition {
  id: string
  rankingId: string
  rankingName: string
  position: number
  points: number
  category: string
  year: number
}

interface ChampionPosition {
  id: string
  eventId: string
  eventName: string
  position: number
  category: string
  modality: string
  year: number
}

interface RankingsProps {
  athleteId: string
}

const Rankings = ({ athleteId }: RankingsProps) => {
  const [rankingPositions, setRankingPositions] = useState<RankingPosition[]>([])
  const [championPositions, setChampionPositions] = useState<ChampionPosition[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  
  const availableYears = Array.from(
    new Set([
      ...rankingPositions.map(rank => rank.year),
      ...championPositions.map(champ => champ.year),
      new Date().getFullYear()
    ])
  ).sort((a, b) => b - a) // Sort descending
  
  useEffect(() => {
    const fetchRankings = async () => {
      try {
        setLoading(true)
        
        // Carregar posições em rankings
        const rankingsResponse = await fetch(`/api/athletes/${athleteId}/rankings?year=${selectedYear}`)
        if (!rankingsResponse.ok) {
          throw new Error('Falha ao carregar dados de rankings')
        }
        const rankingsData = await rankingsResponse.json()
        setRankingPositions(rankingsData || [])
        
        // Carregar posições em campeonatos
        const championsResponse = await fetch(`/api/athletes/${athleteId}/championships?year=${selectedYear}`)
        if (!championsResponse.ok) {
          throw new Error('Falha ao carregar dados de campeonatos')
        }
        const championsData = await championsResponse.json()
        setChampionPositions(championsData || [])
        
      } catch (error) {
        console.error('Erro ao carregar rankings:', error)
        setError('Não foi possível carregar seus dados de ranking. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }
    
    fetchRankings()
  }, [athleteId, selectedYear])
  
  // Função para exibir badge com a posição
  const getPositionBadge = (position: number) => {
    if (position === 1) {
      return (
        <div className="flex items-center">
          <Badge className="bg-yellow-500 hover:bg-yellow-600 mr-2">1º</Badge>
          <Trophy className="h-4 w-4 text-yellow-500" />
        </div>
      )
    } else if (position === 2) {
      return (
        <div className="flex items-center">
          <Badge className="bg-gray-400 hover:bg-gray-500 mr-2">2º</Badge>
          <Medal className="h-4 w-4 text-gray-400" />
        </div>
      )
    } else if (position === 3) {
      return (
        <div className="flex items-center">
          <Badge className="bg-amber-700 hover:bg-amber-800 mr-2">3º</Badge>
          <Medal className="h-4 w-4 text-amber-700" />
        </div>
      )
    } else {
      return <Badge variant="outline">{position}º</Badge>
    }
  }
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Carregando seus dados de ranking...</p>
      </div>
    )
  }
  
  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }
  
  // Se não tiver dados para exibir
  if (rankingPositions.length === 0 && championPositions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Meus Rankings e Premiações</CardTitle>
              <CardDescription>
                Veja suas posições em rankings e campeonatos
              </CardDescription>
            </div>
            
            <Select 
              value={selectedYear.toString()} 
              onValueChange={value => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <TrendingUp className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">Sem dados de ranking para exibir</h3>
          <p className="text-muted-foreground text-center max-w-md mb-6">
            Você ainda não possui posições em rankings ou não participou de campeonatos neste ano.
            Participe de eventos para começar a acumular pontos!
          </p>
          <Button asChild>
            <Link href="/eventos">Ver Eventos Disponíveis</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Meus Rankings e Premiações</CardTitle>
            <CardDescription>
              Acompanhe suas posições em rankings e campeonatos
            </CardDescription>
          </div>
          
          <Select 
            value={selectedYear.toString()} 
            onValueChange={value => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Selecione o ano" />
            </SelectTrigger>
            <SelectContent>
              {availableYears.map(year => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="rankings" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="rankings">Rankings</TabsTrigger>
            <TabsTrigger value="championships">Campeonatos</TabsTrigger>
          </TabsList>
          
          <TabsContent value="rankings" className="space-y-6">
            {rankingPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Sem rankings para exibir</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Você ainda não possui posições em rankings neste ano.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ranking</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Posição</TableHead>
                      <TableHead className="text-right">Pontos</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rankingPositions.map((ranking) => (
                      <TableRow key={`ranking-${ranking.id}`}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/rankings/${ranking.rankingId}`} 
                            className="text-primary hover:underline"
                          >
                            {ranking.rankingName}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ranking.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getPositionBadge(ranking.position)}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {ranking.points} pts
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="championships" className="space-y-6">
            {championPositions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Trophy className="h-12 w-12 text-muted-foreground mb-3" />
                <h3 className="text-lg font-semibold mb-2">Sem premiações em campeonatos</h3>
                <p className="text-muted-foreground text-center max-w-md">
                  Você ainda não possui premiações em campeonatos neste ano.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campeonato</TableHead>
                      <TableHead>Modalidade</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead className="text-center">Colocação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {championPositions.map((champion) => (
                      <TableRow key={`champion-${champion.id}`}>
                        <TableCell className="font-medium">
                          <Link 
                            href={`/campeonatos/${champion.eventId}`} 
                            className="text-primary hover:underline"
                          >
                            {champion.eventName}
                          </Link>
                        </TableCell>
                        <TableCell>{champion.modality}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{champion.category}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {getPositionBadge(champion.position)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export default Rankings
