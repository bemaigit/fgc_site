'use client'

import React, { useState } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Upload, FileText, X, Download, Eye, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { FormErrorMessage } from '@/components/ui/form-error-message'

export function EventRegulationTab() {
  const { formData, updateRegulation, errors } = useEventForm()
  const { regulation } = formData

  // Estados locais
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [previewText, setPreviewText] = useState(false)

  // Manipuladores de eventos
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      
      // Verificar se é um PDF ou documento de texto
      if (
        selectedFile.type === 'application/pdf' ||
        selectedFile.type === 'application/msword' ||
        selectedFile.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        selectedFile.type === 'text/plain'
      ) {
        setFile(selectedFile)
      } else {
        toast.error('Por favor, selecione um arquivo PDF ou documento de texto')
      }
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
  }

  const handleUpload = async () => {
    if (!file) return
    
    setUploading(true)
    
    try {
      // Criar FormData para enviar o arquivo
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'regulation')
      formData.append('prefix', 'eventos/regulamentos')
      
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
      console.log('Resposta do upload do regulamento:', data)
      
      // Processar a URL para extrair apenas o caminho relativo
      let filePath = `eventos/regulamentos/${file.name}`
      
      // Se recebemos uma URL completa, extrair apenas o caminho
      if (data.url && data.url.includes('://')) {
        try {
          const urlObj = new URL(data.url)
          // Remover domínio e prefixos conhecidos
          let path = urlObj.pathname
            .replace(/^\/storage\//, '') // Remove /storage/ se existir
            .replace(/^\/fgc\//, '')    // Remove /fgc/ se existir

          // Se ainda não tem o prefixo correto, adicionar
          if (!path.startsWith('eventos/regulamentos/')) {
            path = `eventos/regulamentos/${path.split('/').pop() || ''}`
          }
          
          filePath = path
          console.log('Caminho processado a partir da URL:', filePath)
        } catch (error) {
          console.warn('Erro ao processar URL, usando caminho padrão:', error)
          // Manter o caminho padrão definido acima
        }
      }
      
      // Construir URL para o proxy de regulamentos
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin
      const proxyUrl = `${baseUrl}/api/events/regulation?path=${encodeURIComponent(filePath)}`
      
      console.log('Upload do regulamento completo:', {
        originalUrl: data.url,
        path: filePath,
        proxyUrl: proxyUrl
      })
      
      // Atualizar o estado do formulário com a URL do arquivo
      updateRegulation({
        regulationUrl: proxyUrl,
        regulationFilename: file.name
      })
      
      // Limpar o arquivo selecionado
      setFile(null)
      
      toast.success('Regulamento enviado com sucesso')
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao enviar regulamento')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveRegulation = () => {
    updateRegulation({
      regulationUrl: '',
      regulationFilename: '',
      regulationText: ''
    })
    toast.success('Regulamento removido')
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateRegulation({ regulationText: e.target.value })
  }

  const togglePreviewText = () => {
    setPreviewText(!previewText)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Regulamento do Evento</h3>
              <p className="text-sm text-muted-foreground">
                Adicione o regulamento oficial do seu evento. Você pode fazer upload de um arquivo ou escrever diretamente.
              </p>
            </div>
            
            {/* Opção para escolher entre arquivo ou texto */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="useText">Usar Texto em vez de Arquivo</Label>
                <p className="text-sm text-muted-foreground">
                  Ative para escrever o regulamento diretamente
                </p>
              </div>
              <Switch
                id="useText"
                checked={regulation.useTextRegulation}
                onCheckedChange={(checked) => 
                  updateRegulation({ useTextRegulation: checked })
                }
              />
            </div>
            
            {/* Seção de upload de arquivo */}
            {!regulation.useTextRegulation && (
              <div className="space-y-4">
                {!regulation.regulationUrl ? (
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
                              PDF, DOC, DOCX ou TXT (max. 10MB)
                            </p>
                          </div>
                          <input
                            type="file"
                            id="regulation-upload"
                            accept=".pdf,.doc,.docx,.txt"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('regulation-upload')?.click()}
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
                              disabled={uploading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                            <Button
                              onClick={handleUpload}
                              disabled={uploading}
                            >
                              {uploading ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Enviando...
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
                          <p className="font-medium">{regulation.regulationFilename}</p>
                          <p className="text-sm text-muted-foreground">
                            Regulamento do evento
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(regulation.regulationUrl, '_blank')}
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => {
                            const link = document.createElement('a')
                            link.href = regulation.regulationUrl
                            link.download = regulation.regulationFilename || 'regulamento.pdf'
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
                          onClick={handleRemoveRegulation}
                          className="text-destructive"
                          title="Remover"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                
                {errors.regulationUrl && (
                  <FormErrorMessage>{errors.regulationUrl}</FormErrorMessage>
                )}
              </div>
            )}
            
            {/* Seção de texto */}
            {regulation.useTextRegulation && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="regulationText">Texto do Regulamento</Label>
                  {regulation.regulationText && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={togglePreviewText}
                    >
                      {previewText ? 'Editar' : 'Visualizar'}
                    </Button>
                  )}
                </div>
                
                {!previewText ? (
                  <Textarea
                    id="regulationText"
                    value={regulation.regulationText || ''}
                    onChange={handleTextChange}
                    placeholder="Digite o regulamento do evento aqui..."
                    className="min-h-[300px] font-mono"
                  />
                ) : (
                  <div className="border rounded-md p-4 min-h-[300px] prose max-w-none">
                    {regulation.regulationText.split('\n').map((paragraph: string, index: number) => (
                      <p key={index}>{paragraph}</p>
                    ))}
                  </div>
                )}
                
                {errors.regulationText && (
                  <FormErrorMessage>{errors.regulationText}</FormErrorMessage>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
