'use client'

import React, { useState, useEffect } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Upload, FileText, X, Download, Eye, Loader2, Trophy, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { FormErrorMessage } from '@/components/ui/form-error-message'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

// Definição de tipos para resultados
type EventResult = {
  id?: string
  position: number
  athleteName: string
  clubName?: string
  result: string
  categoryId: string
  categoryName?: string  // Adicionado para corresponder aos dados da API
  EventCategory?: {      // Adicionado para corresponder aos dados da API
    id: string
    name: string
  }
}

type ResultCategory = {
  categoryId: string
  categoryName: string
  results: EventResult[]
}

export function EventResultsTab() {
  const { formData, updateResults, errors, eventId } = useEventForm()
  const { resultsFile } = formData.results

  // Estados locais
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [topResults, setTopResults] = useState<EventResult[]>([])
  const [showTopResults, setShowTopResults] = useState(false)
  // Agrupar resultados por categoria
  const [resultsByCategory, setResultsByCategory] = useState<Record<string, ResultCategory>>({})

  // Manipuladores de eventos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Verificar se é um formato válido para resultados
      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.type === 'application/msword' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        selectedFile.type === 'text/plain' ||
        selectedFile.type === 'application/vnd.ms-excel' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        selectedFile.type === 'text/csv'
      ) {
        setFile(selectedFile)
        setTopResults([])
        setShowTopResults(false)
      } else {
        toast.error('Por favor, selecione um arquivo PDF, Excel, CSV ou documento de texto')
      }
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    setTopResults([])
    setShowTopResults(false)
  }

  // Função para processar o arquivo e extrair os 5 primeiros colocados
  const processResultsFile = async () => {
    if (!file || !eventId) return
    
    // Verificar se é um formato processável (Excel ou CSV)
    const isProcessable = 
      file.type === 'application/vnd.ms-excel' ||
      file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      file.type === 'text/csv' ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.xls') ||
      file.name.endsWith('.xlsx')
    
    if (!isProcessable) {
      toast.error('Apenas arquivos Excel ou CSV podem ser processados para extração de resultados')
      return
    }
    
    setProcessing(true)
    
    try {
      // Criar FormData para enviar o arquivo
      const formData2 = new FormData()
      formData2.append('file', file)
      
      // Enviar para o endpoint de processamento
      const response = await fetch(`/api/events/${eventId}/process-results`, {
        method: 'POST',
        body: formData2
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao processar resultados')
      }
      
      const data = await response.json()
      
      // Atualizar o estado com os resultados processados
      const results = data.data || []
      setTopResults(results)
      
      // Agrupar os resultados por categoria
      const groupedResults: Record<string, ResultCategory> = {}
      
      results.forEach((result: EventResult) => {
        const categoryId = result.categoryId || 'sem-categoria'
        
        if (!groupedResults[categoryId]) {
          // Tentar obter o nome da categoria ou usar fallback
          const categoryName = result.categoryName || 'Categoria ' + categoryId
          
          groupedResults[categoryId] = {
            categoryId,
            categoryName,
            results: []
          }
        }
        
        groupedResults[categoryId].results.push(result)
      })
      
      setResultsByCategory(groupedResults)
      setShowTopResults(true)
      
      toast.success(`${results.length} resultados destacados extraídos com sucesso`)
    } catch (error) {
      console.error('Erro ao processar resultados:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao processar resultados')
    } finally {
      setProcessing(false)
    }
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    
    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'results')
      formData.append('prefix', 'eventos/resultados')
      
      // Enviar para o servidor
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }
      
      const data = await response.json()
      console.log('Resposta do upload de resultados:', data)
      
      // Processar a URL para extrair apenas o caminho relativo
      let filePath = `eventos/resultados/${file.name}`
      
      // Se recebemos uma URL completa, extrair apenas o caminho
      if (data.url && data.url.includes('://')) {
        try {
          const urlObj = new URL(data.url)
          // Remover domínio e prefixos conhecidos
          let path = urlObj.pathname
            .replace(/^\/storage\//, '') // Remove /storage/ se existir
            .replace(/^\/fgc\//, '')    // Remove /fgc/ se existir

          // Se ainda não tem o prefixo correto, adicionar
          if (!path.startsWith('eventos/resultados/')) {
            path = `eventos/resultados/${path.split('/').pop() || ''}`
          }
          
          filePath = path
          console.log('Caminho processado a partir da URL:', filePath)
        } catch (error) {
          console.warn('Erro ao processar URL, usando caminho padrão:', error)
          // Manter o caminho padrão definido acima
        }
      }
      
      // Construir URL para o proxy de resultados
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const proxyUrl = `${baseUrl}/api/events/results?path=${encodeURIComponent(filePath)}`
      
      console.log('Upload de resultados completo:', {
        originalUrl: data.url,
        path: filePath,
        proxyUrl: proxyUrl
      })
      
      // Definir a URL do arquivo no estado do formulário
      updateResults({
        resultsFile: proxyUrl
      })
      
      // Se for um arquivo Excel ou CSV, processar os resultados
      const isProcessable = 
        file.type === 'application/vnd.ms-excel' ||
        file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        file.type === 'text/csv' ||
        file.name.endsWith('.csv') ||
        file.name.endsWith('.xls') ||
        file.name.endsWith('.xlsx')
      
      if (isProcessable && eventId) {
        // Processar o arquivo para extrair os 5 primeiros colocados
        await processResultsFile()
      } else if (eventId) {
        toast.info('O arquivo não está em formato processável (Excel/CSV)')
      } else {
        toast.info('Salve o evento primeiro para processar os resultados')
      }
      
      // Limpar o arquivo selecionado
      setFile(null)
      
      toast.success('Arquivo de resultados enviado com sucesso')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar arquivo')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveResults = async () => {
    if (!eventId) {
      toast.error('ID do evento não encontrado')
      return
    }

    try {
      // Primeiro, executar diagnóstico para ver o que está acontecendo
      console.log('Executando diagnóstico de remoção para o evento:', eventId)
      const diagResponse = await fetch(`/api/events/${eventId}/test-remove`)
      const diagData = await diagResponse.json()
      console.log('Diagnóstico de remoção:', diagData)
      
      // Mostrar indicador de carregamento
      const toastId = toast.loading('Removendo resultados...')
      
      // Forçar a abordagem de SQL direto que sabemos que funciona
      // IMPORTANTE: Não devemos usar "url=NULL" pois isso enviaría a string literal "NULL" 
      // Precisamos usar um endpoint que entenda que queremos definir o valor como NULL
      const url = `/api/events/${eventId}/results`
      console.log('Tentando definir resultsFile como NULL via endpoint:', url)
      
      const updateResponse = await fetch(url, {
        method: 'PUT', // Alterado de POST para PUT para corresponder ao endpoint
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ resultsFile: null }) // Aqui enviamos null de forma explícita
      })
      
      const updateData = await updateResponse.json()
      console.log('Resposta da API de atualização:', updateResponse.status, updateData)
      
      if (!updateResponse.ok) {
        throw new Error(updateData.error || 'Erro ao limpar URL de resultados')
      }
      
      // Também tentar excluir o arquivo do MinIO através do endpoint remove-results
      console.log('Tentando excluir arquivo no MinIO...')
      const response = await fetch(`/api/events/${eventId}/remove-results`, {
        method: 'DELETE',
      })
      
      const responseData = await response.json()
      console.log('Resposta da API de remoção:', response.status, responseData)
      
      // Não verificar response.ok aqui porque já atualizamos o banco de dados
      
      // Atualizar o estado local
      updateResults({
        resultsFile: ''
      })
      setTopResults([])
      setShowTopResults(false)
      
      toast.dismiss(toastId)
      toast.success('Resultados removidos com sucesso')
    } catch (error) {
      console.error('Erro ao remover resultados:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao remover resultados')
    }
  }

  // Gerar resultsByCategory se estiver vazio e tivermos resultados
  useEffect(() => {
    if (topResults.length > 0 && Object.keys(resultsByCategory).length === 0) {
      const groupedResults: Record<string, ResultCategory> = {};
      
      topResults.forEach((result) => {
        const categoryId = result.categoryId || 'sem-categoria';
        
        if (!groupedResults[categoryId]) {
          // Tentar obter o nome da categoria a partir de diferentes propriedades
          const categoryName = 
            result.categoryName || 
            (result.EventCategory?.name) || 
            'Categoria ' + categoryId;
          
          groupedResults[categoryId] = {
            categoryId,
            categoryName,
            results: []
          };
        }
        
        groupedResults[categoryId].results.push(result);
      });
      
      setResultsByCategory(groupedResults);
    }
  }, [topResults, resultsByCategory]);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Resultados do Evento</h3>
              <p className="text-sm text-muted-foreground">
                Adicione os resultados oficiais do evento. Estes resultados serão exibidos na página do evento após sua realização.
              </p>
            </div>
            
            {/* Seção de upload de arquivo */}
            <div className="space-y-4">
              {!resultsFile ? (
                <>
                  {!file ? (
                    <div 
                      className="border-2 border-dashed rounded-md p-8 text-center border-muted-foreground/25"
                    >
                      <div className="flex flex-col items-center justify-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10">
                          <Upload className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">
                            Clique para selecionar um arquivo
                          </p>
                          <p className="text-sm text-muted-foreground">
                            PDF, Excel, CSV, DOC, DOCX ou TXT (max. 10MB)
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            <span className="font-medium text-primary">Dica:</span> Para extração automática dos 5 primeiros colocados, use Excel ou CSV.
                          </p>
                        </div>
                        <input
                          type="file"
                          id="results-upload"
                          accept=".pdf,.doc,.docx,.txt,.xls,.xlsx,.csv"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('results-upload')?.click()}
                        >
                          Selecionar Arquivo
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-primary" />
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleRemoveFile}
                            className="text-destructive"
                            disabled={uploading || processing}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={handleUpload}
                            disabled={uploading || processing}
                          >
                            {uploading ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Enviando...
                              </>
                            ) : processing ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processando...
                              </>
                            ) : 'Enviar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="border rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-medium">Resultados do evento</p>
                        <p className="text-sm text-muted-foreground">
                          Arquivo de resultados
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => window.open(resultsFile, '_blank')}
                        title="Visualizar"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          const link = document.createElement('a')
                          link.href = resultsFile
                          link.download = 'resultados.pdf'
                          document.body.appendChild(link)
                          link.click()
                          document.body.removeChild(link)
                        }}
                        title="Baixar"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={handleRemoveResults}
                        className="text-destructive"
                        title="Remover"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              
              {errors.resultsFile && (
                <FormErrorMessage>{errors.resultsFile}</FormErrorMessage>
              )}
            </div>

            {/* Exibição dos resultados destacados */}
            {showTopResults && topResults.length > 0 && (
              <div className="mt-6 space-y-4">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-medium">Resultados Destacados Extraídos</h3>
                </div>
                
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Resultados processados automaticamente</AlertTitle>
                  <AlertDescription>
                    Os 5 primeiros colocados de cada categoria foram extraídos do arquivo e serão exibidos na página do evento.
                    Você pode visualizá-los abaixo.
                  </AlertDescription>
                </Alert>

                <Accordion type="single" collapsible className="w-full">
                  {Object.values(resultsByCategory).map((category) => (
                    <AccordionItem key={category.categoryId} value={category.categoryId}>
                      <AccordionTrigger className="hover:no-underline">
                        <span className="font-medium">{category.categoryName}</span>
                        <Badge className="ml-2">{category.results.length}</Badge>
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
                              .sort((a: EventResult, b: EventResult) => a.position - b.position)
                              .map((result: EventResult) => (
                                <TableRow key={result.id || `${result.categoryId}-${result.position}`}>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
