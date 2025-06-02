'use client'

import React, { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Download, Loader2, AlertCircle, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useEventTopResults } from '@/hooks/useEventTopResults'
import { fetcher } from '@/lib/fetcher'

interface EventResult {
  position: number
  athleteName: string
  clubName?: string
  categoryName?: string
  result: string
  [key: string]: any
}

export default function EventResultsPage() {
  const params = useParams()
  const eventId = params.id as string
  const [event, setEvent] = useState<any>(null)
  const [results, setResults] = useState<EventResult[]>([])
  const [filteredResults, setFilteredResults] = useState<EventResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [categories, setCategories] = useState<string[]>([])

  // Buscar dados do evento
  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const eventData = await fetcher(`/api/events/${eventId}/basic`)
        setEvent(eventData)
      } catch (err) {
        console.error('Erro ao buscar dados do evento:', err)
        setError('Não foi possível carregar os dados do evento.')
      }
    }

    fetchEventData()
  }, [eventId])

  // Buscar resultados completos
  useEffect(() => {
    const fetchResults = async () => {
      setIsLoading(true)
      try {
        if (event?.resultsFile) {
          // Verificar se a URL é válida antes de tentar acessá-la
          if (event.resultsFile === 'NULL' || event.resultsFile === 'null' || event.resultsFile === '') {
            throw new Error('Este evento não possui arquivo de resultados válido.')
          }
          
          console.log('URL original do arquivo:', event.resultsFile)
          
          // Usar o proxy para evitar problemas de CORS
          const proxyUrl = `/api/proxy/results?url=${encodeURIComponent(event.resultsFile)}`
          console.log('Usando proxy para acessar arquivo:', proxyUrl)
          
          try {
            // Fazer o download do arquivo de resultados através do proxy
            const response = await fetch(proxyUrl)
            
            if (!response.ok) {
              // Capturar resposta de erro do servidor para diagnóstico
              try {
                const errorData = await response.json()
                console.error('Erro detalhado do proxy:', errorData)
                throw new Error(`Não foi possível acessar o arquivo de resultados: ${errorData.error || 'Erro desconhecido'}`)
              } catch (parseError) {
                // Se não conseguir obter JSON de erro, usar mensagem genérica
                throw new Error(`Erro ao baixar arquivo: ${response.status} ${response.statusText}`)
              }
            }
            
            const text = await response.text()
            console.log('Conteúdo do arquivo:', text.substring(0, 200) + '...')
            
            // Processar o CSV
            const parsedResults = parseCSV(text)
            console.log(`Resultados processados: ${parsedResults.length}`, parsedResults.slice(0, 2))
            
            // Garantir que estamos atualizando o estado com resultados válidos
            if (parsedResults && parsedResults.length > 0) {
              setResults(parsedResults)
              setFilteredResults(parsedResults)
            
              // Extrair categorias únicas
              const uniqueCategories = [...new Set(parsedResults.map(r => r.categoryName))].filter(Boolean)
              setCategories(uniqueCategories as string[])
            } else {
              console.error('Nenhum resultado válido foi processado do CSV')
              throw new Error('Não foi possível extrair resultados do arquivo. O formato pode estar incorreto.')
            }
          } catch (fetchError) {
            console.error('Erro ao buscar arquivo via proxy:', fetchError)
            throw fetchError // Re-lançar o erro para ser tratado no bloco catch principal
          }
        } else {
          setError('Este evento não possui arquivo de resultados. Verifique se o evento já foi concluído e se os resultados estão sendo processados. Você ainda pode ver os destaques por categoria na página do evento.')
        }
      } catch (err) {
        console.error('Erro ao buscar resultados:', err)
        setError('Não foi possível carregar os resultados completos. Você pode verificar os destaques por categoria na página principal do evento.')
      } finally {
        setIsLoading(false)
      }
    }

    if (event && eventId) {
      fetchResults()
    }
  }, [event, eventId])

  // Filtrar resultados
  useEffect(() => {
    if (!results.length) return

    let filtered = [...results]
    
    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(r => r.categoryName === selectedCategory)
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        r => 
          (r.athleteName?.toLowerCase() || '').includes(term) || 
          (r.clubName?.toLowerCase() || '').includes(term) ||
          (r.result?.toLowerCase() || '').includes(term)
      )
    }
    
    // Verificar se há resultados após filtrar
    console.log(`Total de resultados filtrados: ${filtered.length}/${results.length}`)
    
    setFilteredResults(filtered)
  }, [searchTerm, selectedCategory, results])

  // Função para processar o CSV
  const parseCSV = (csvText: string): EventResult[] => {
    try {
      console.log('Iniciando processamento do CSV...')
      const lines = csvText.split('\n')
      
      if (lines.length < 2) {
        console.error('Arquivo CSV inválido: menos de 2 linhas')
        return []
      }
      
      console.log(`Total de linhas no CSV: ${lines.length}`)
      console.log(`Cabeçalho do CSV: ${lines[0]}`)
      
      // Processamento mais robusto do cabeçalho
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      console.log('Cabeçalhos processados:', headers)
      
      // Mapear índices importantes
      const positionIndex = headers.findIndex(h => h.includes('pos') || h === 'colocação' || h === 'colocacao')
      const nameIndex = headers.findIndex(h => h.includes('atleta') || h.includes('nome') || h.includes('competidor'))
      const clubIndex = headers.findIndex(h => h.includes('clube') || h.includes('equipe') || h.includes('team'))
      const categoryIndex = headers.findIndex(h => h.includes('categ') || h.includes('class'))
      const resultIndex = headers.findIndex(h => h.includes('result') || h.includes('tempo') || h.includes('time') || h.includes('pontos') || h.includes('score'))
      
      console.log('Índices encontrados:', { positionIndex, nameIndex, clubIndex, categoryIndex, resultIndex })
      
      const parsedResults = lines.slice(1)
        .filter(line => line.trim() !== '')
        .map((line, index) => {
          try {
            const values = line.split(',').map(v => v.trim())
            
            if (values.length < Math.max(positionIndex, nameIndex, clubIndex, categoryIndex, resultIndex) + 1) {
              console.warn(`Linha ${index + 2} com número insuficiente de campos: ${values.length}`, line)
              // Preencher com valores vazios se necessário
              while (values.length <= Math.max(positionIndex, nameIndex, clubIndex, categoryIndex, resultIndex)) {
                values.push('')
              }
            }
            
            const result: EventResult = {
              position: positionIndex >= 0 ? parseInt(values[positionIndex]) || 0 : 0,
              athleteName: nameIndex >= 0 ? values[nameIndex] || '' : '',
              clubName: clubIndex >= 0 ? values[clubIndex] || '' : '',
              categoryName: categoryIndex >= 0 ? values[categoryIndex] || '' : '',
              result: resultIndex >= 0 ? values[resultIndex] || '' : '',
            }
            
            // Adicionar campos adicionais se existirem
            for (let i = 0; i < values.length; i++) {
              if (i !== positionIndex && i !== nameIndex && i !== clubIndex && 
                  i !== categoryIndex && i !== resultIndex && headers[i]) {
                result[headers[i]] = values[i]
              }
            }
            
            return result
          } catch (lineError) {
            console.error(`Erro ao processar linha ${index + 2}:`, lineError, line)
            return {
              position: 0,
              athleteName: `[Erro na linha ${index + 2}]`,
              clubName: '',
              categoryName: '',
              result: ''
            }
          }
        })
        .sort((a, b) => {
          // Primeiro ordenar por categoria
          if (a.categoryName !== b.categoryName) {
            return (a.categoryName || '').localeCompare(b.categoryName || '')
          }
          // Depois por posição
          return a.position - b.position
        });
      
      console.log(`Total de resultados após processamento: ${parsedResults.length}`);
      console.log('Primeiros 3 resultados:', JSON.stringify(parsedResults.slice(0, 3)));
      
      return parsedResults;
    } catch (error) {
      console.error('Erro ao processar CSV:', error)
      return []
    }
  }

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <Link href={`/eventos/${eventId}`}>
          <Button variant="outline" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para o evento
          </Button>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2" />
              Resultados não disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="border border-amber-200 bg-amber-50 rounded-md p-4">
                <p className="text-amber-800">{error}</p>
              </div>
              
              <div className="rounded-md p-4 border">
                <h3 className="text-lg font-medium mb-2">Por que isso acontece?</h3>
                <p className="text-muted-foreground mb-4">
                  Os resultados completos são exibidos quando um arquivo de resultados é carregado no sistema. 
                  Isso geralmente ocorre após a conclusão do evento.
                </p>
                
                <h3 className="text-lg font-medium mb-2">O que fazer agora?</h3>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>Verifique se o evento já foi concluído</li>
                  <li>Se o evento já ocorreu, os resultados podem estar sendo processados</li>
                  <li>Você ainda pode ver os destaques por categoria na página do evento</li>
                </ul>
              </div>
              
              <div className="flex justify-center">
                <Link href={`/eventos/${eventId}`}>
                  <Button className="mt-4">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar para a página do evento
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Link href={`/eventos/${eventId}`}>
        <Button variant="outline" className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para o evento
        </Button>
      </Link>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-primary mr-2" />
              Resultados Completos
            </div>
            {event?.resultsFile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (event.resultsFile) {
                    // Usar o proxy para download também
                    const proxyUrl = `/api/proxy/results?url=${encodeURIComponent(event.resultsFile)}`
                    const link = document.createElement('a')
                    link.href = proxyUrl
                    
                    // Extrair o nome do arquivo original da URL
                    const fileName = event.resultsFile.split('/').pop() || 'resultados.csv'
                    
                    // Configurar o download com o nome do arquivo
                    link.download = fileName
                    
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  }
                }}
                className="flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar arquivo original
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="search">Buscar</Label>
              <Input
                id="search"
                placeholder="Buscar por atleta, clube ou resultado..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full md:w-64">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="all">Todas as categorias</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredResults.length > 0 ? (
            <>
              <div className="mb-4 text-sm text-muted-foreground">
                Exibindo {filteredResults.length} resultados
                {selectedCategory !== 'all' ? ` na categoria ${selectedCategory}` : ''}
                {searchTerm ? ` filtrados por "${searchTerm}"` : ''}
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Posição</TableHead>
                      <TableHead>Atleta</TableHead>
                      <TableHead>Clube</TableHead>
                      {selectedCategory === 'all' && <TableHead>Categoria</TableHead>}
                      <TableHead className="text-right">Resultado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredResults.map((result, index) => (
                      <TableRow key={`result-${index}-${result.position}-${result.athleteName}`}>
                        <TableCell>{result.position || '-'}º</TableCell>
                        <TableCell>{result.athleteName || '-'}</TableCell>
                        <TableCell>{result.clubName || '-'}</TableCell>
                        {selectedCategory === 'all' && <TableCell>{result.categoryName || '-'}</TableCell>}
                        <TableCell className="text-right font-mono">{result.result || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum resultado encontrado com os filtros atuais.</p>
              {searchTerm || selectedCategory !== 'all' ? (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                >
                  Limpar filtros
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
