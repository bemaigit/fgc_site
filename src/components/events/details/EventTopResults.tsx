'use client'

import React from 'react'
import Link from 'next/link'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Trophy, FileText, Download, Loader2, ListFilter, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useEventTopResults } from '@/hooks/useEventTopResults'
import { EventTopResult } from '@/types/event-top-result'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface EventTopResultsProps {
  eventId: string
  resultsFile?: string | null
}

interface CategoryResults {
  categoryId: string
  categoryName: string
  results: EventTopResult[]
}

// Estendendo o tipo EventTopResult para incluir a relação EventCategory
interface EventTopResultWithRelations extends EventTopResult {
  EventCategory?: {
    id: string
    name: string
  }
}

export function EventTopResults({ eventId, resultsFile }: EventTopResultsProps) {
  const { data, isLoading, isError } = useEventTopResults(eventId)
  
  // Agrupar resultados por categoria
  const resultsByCategory = React.useMemo(() => {
    if (!data || data.length === 0) return {}
    
    // Log para depuração
    console.log('Dados recebidos da API:', data)
    
    // SOLUÇÃO DEFINITIVA: Usar a fonte de dados original (categoryId ou o campo de categoria)
    // para agrupar os resultados, evitando QUALQUER tipo de lógica de junção por gênero
    return data.reduce((acc: Record<string, CategoryResults>, item) => {
      // Converter para o tipo estendido para acessar EventCategory
      const result = item as EventTopResultWithRelations
      
      // 1. O resultado já tem informação de categoria? Se sim, usar
      // 2. Caso não tenha, usar o categoryId como chave única
      // Isso garante que cada resultado fique na categoria original do CSV
      
      // A chave tem que ser exclusiva para cada categoria real do CSV
      const categoryKey = result.categoryId
      
      // Obter o nome legível da categoria
      const categoryName = result.EventCategory?.name || `Categoria ${categoryKey}`
      
      if (!acc[categoryKey]) {
        acc[categoryKey] = {
          categoryId: result.categoryId,
          categoryName: categoryName,
          results: []
        }
      }
      
      acc[categoryKey].results.push(result)
      return acc
    }, {})
  }, [data])
  
  // Verificar se há resultados para exibir
  const hasResults = Object.keys(resultsByCategory).length > 0
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  
  if (isError) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Não foi possível carregar os resultados.</p>
      </div>
    )
  }
  
  if (!hasResults && !resultsFile) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Os resultados deste evento ainda não estão disponíveis.</p>
      </div>
    )
  }
  
  // Renderizar o botão de resultados completos com ou sem tooltip
  const renderResultsButton = () => {
    if (resultsFile) {
      return (
        <Link href={`/eventos/${eventId}/resultados`} passHref>
          <Button variant="outline" size="sm" className="flex items-center">
            <ListFilter className="h-4 w-4 mr-2" />
            Ver todos os resultados
          </Button>
        </Link>
      )
    } else {
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center" disabled>
                <ListFilter className="h-4 w-4 mr-2" />
                Ver todos os resultados
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Este evento não possui arquivo de resultados completos</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
            Resultados do Evento
          </div>
          {renderResultsButton()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Arquivo de resultados completo */}
        {resultsFile && (
          <div className="border rounded-md p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-6 w-6 text-primary" />
                <div>
                  <p className="font-medium">Resultados completos</p>
                  <p className="text-sm text-muted-foreground">
                    Arquivo oficial com todos os resultados do evento
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (resultsFile) {
                    const link = document.createElement('a')
                    link.href = resultsFile
                    link.target = '_blank'
                    link.rel = 'noopener noreferrer'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }
                }}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar
              </Button>
            </div>
          </div>
        )}
        
        {!resultsFile && (
          <div className="border border-yellow-200 bg-yellow-50 rounded-md p-4">
            <div className="flex items-center text-yellow-800">
              <AlertCircle className="h-5 w-5 mr-2" />
              <p className="text-sm">Este evento ainda não possui um arquivo de resultados completos.</p>
            </div>
          </div>
        )}
        
        {/* Resultados destacados */}
        {hasResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Destaques por Categoria</h3>
              {resultsFile ? (
                <Link href={`/eventos/${eventId}/resultados`} passHref>
                  <Button variant="outline" size="sm" className="flex items-center text-primary border-primary hover:bg-primary/10">
                    <ListFilter className="h-4 w-4 mr-2" />
                    Ver classificação completa
                  </Button>
                </Link>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center" 
                  disabled
                >
                  <ListFilter className="h-4 w-4 mr-2" />
                  Ver classificação completa
                </Button>
              )}
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {Object.values(resultsByCategory).map((category: CategoryResults) => (
                <AccordionItem key={`category-${category.categoryName}`} value={category.categoryName}>
                  <AccordionTrigger className="hover:no-underline">
                    <span className="font-medium">{category.categoryName}</span>
                    <Badge className="ml-2 bg-green-600 hover:bg-green-700">Resultados Top 5</Badge>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-16">Posição</TableHead>
                          <TableHead>Atleta</TableHead>
                          <TableHead>Clube</TableHead>
                          <TableHead className="text-right">Resultado</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {category.results
                          .sort((a: EventTopResult, b: EventTopResult) => a.position - b.position)
                          .map((result: EventTopResult, index: number) => (
                            <TableRow 
                              key={`${category.categoryId}-${result.id}-${index}-${result.position}-${result.athleteName}`}
                            >
                              <TableCell>
                                <Badge 
                                  variant={result.position <= 3 ? "default" : "outline"}
                                  className={
                                    result.position === 1 
                                      ? "bg-yellow-500 hover:bg-yellow-600" 
                                      : result.position === 2 
                                      ? "bg-gray-400 hover:bg-gray-500" 
                                      : result.position === 3 
                                      ? "bg-amber-700 hover:bg-amber-800"
                                      : ""
                                  }
                                >
                                  {result.position}º
                                </Badge>
                              </TableCell>
                              <TableCell>{result.athleteName}</TableCell>
                              <TableCell>{result.clubName || '-'}</TableCell>
                              <TableCell className="text-right font-mono">{result.result}</TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
