'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useDropzone } from 'react-dropzone'
import { AlertCircle, FileText, CheckCircle2, Upload } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface BulkImportDialogProps {
  isOpen: boolean
  onClose: () => void
  onImportCompleted: () => void
}

interface ChampionshipEvent {
  id: string
  name: string
  year: number
}

export default function BulkImportDialog({
  isOpen,
  onClose,
  onImportCompleted,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [events, setEvents] = useState<ChampionshipEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [previewData, setPreviewData] = useState<string[][]>([])
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'preview' | 'error' | 'success'>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')

  // Carregar eventos disponíveis
  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch('/api/championships/events')
        if (!response.ok) {
          throw new Error('Erro ao carregar eventos')
        }
        const data = await response.json()
        setEvents(data)
      } catch (error) {
        console.error('Erro ao carregar eventos:', error)
        toast.error('Erro ao carregar eventos. Por favor, recarregue a página.')
      }
    }

    if (isOpen) {
      fetchEvents()
      // Reset state when opening
      setFile(null)
      setSelectedEventId('')
      setPreviewData([])
      setUploadStatus('idle')
      setErrorMessage('')
    }
  }, [isOpen])

  // Configuração do dropzone para upload de arquivos
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv'],
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      handleFileUpload(acceptedFiles)
    },
  })

  // Gerar prévia dos dados do CSV
  const handleFileUpload = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    const uploadedFile = acceptedFiles[0]
    setFile(uploadedFile)
    
    try {
      // Ler o conteúdo do arquivo para pré-visualização
      const text = await uploadedFile.text()
      const rows = text.split('\n')
        .map(row => row.split(',').map(cell => cell.trim()))
        .filter(row => row.length > 1 && row.some(cell => cell !== '')) // Remover linhas vazias
      
      if (rows.length < 2) {
        setErrorMessage('O arquivo CSV deve conter um cabeçalho e pelo menos uma linha de dados.')
        setUploadStatus('error')
        return
      }
      
      // Verificar cabeçalho
      const header = rows[0]
      const requiredColumns = ['athleteId', 'modalityId', 'categoryId', 'gender', 'position', 'city', 'team']
      const missingColumns = requiredColumns.filter(col => !header.includes(col))
      
      if (missingColumns.length > 0) {
        setErrorMessage(`Colunas obrigatórias não encontradas: ${missingColumns.join(', ')}`)
        setUploadStatus('error')
        return
      }
      
      // Mostrar preview com até 5 linhas (incluindo o cabeçalho)
      setPreviewData(rows.slice(0, 6))
      setUploadStatus('preview')
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setErrorMessage('Erro ao processar o arquivo. Verifique se é um CSV válido.')
      setUploadStatus('error')
    }
  }

  // Função para enviar o arquivo CSV para processamento
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !selectedEventId) {
      toast.error('Selecione um arquivo CSV e um evento.')
      return
    }
    
    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('eventId', selectedEventId)
      
      const response = await fetch('/api/championships/import', {
        method: 'POST',
        body: formData,
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao importar campeões')
      }
      
      const result = await response.json()
      
      toast.success(`Importação concluída com sucesso! ${result.imported} campeões importados.`)
      setUploadStatus('success')
      setTimeout(() => {
        onImportCompleted()
        onClose()
      }, 2000)
    } catch (error: any) {
      console.error('Erro ao importar campeões:', error)
      setErrorMessage(error.message || 'Erro ao importar campeões. Por favor, tente novamente.')
      setUploadStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Função para baixar o template CSV
  const downloadTemplate = () => {
    const header = 'athleteId,modalityId,categoryId,gender,position,city,team\n'
    const sampleRow = 'atleta-id,modalidade-id,categoria-id,MALE,1,Goiânia,Equipe Exemplo\n'
    
    const csvContent = header + sampleRow
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    
    const link = document.createElement('a')
    link.href = url
    link.download = 'template_campeoes.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            Importação em Massa de Campeões
          </DialogTitle>
          <DialogDescription>
            Importe múltiplos campeões de uma só vez usando um arquivo CSV.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Seleção de evento */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="event" className="text-right">
                Evento
              </Label>
              <div className="col-span-3">
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um evento de campeonato" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} ({event.year})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Área de upload */}
            <div className="col-span-4 mt-2">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-md p-6 text-center cursor-pointer
                  ${isDragActive ? 'border-primary bg-primary/10' : 'border-gray-300'}
                  ${uploadStatus === 'error' ? 'border-destructive' : ''}
                  ${uploadStatus === 'success' ? 'border-green-500' : ''}
                `}
              >
                <input {...getInputProps()} disabled={loading} />
                
                {uploadStatus === 'idle' && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <p>Arraste e solte um arquivo CSV aqui, ou clique para selecionar</p>
                    <p className="text-xs text-muted-foreground">
                      Apenas arquivos CSV são suportados
                    </p>
                  </div>
                )}

                {uploadStatus === 'preview' && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="h-10 w-10 text-primary" />
                    <p>
                      <strong>{file?.name}</strong> ({(file?.size / 1024).toFixed(2)} KB)
                    </p>
                  </div>
                )}

                {uploadStatus === 'error' && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <AlertCircle className="h-10 w-10 text-destructive" />
                    <p className="text-destructive">{errorMessage}</p>
                    <p className="text-xs">Clique aqui para selecionar outro arquivo</p>
                  </div>
                )}

                {uploadStatus === 'success' && (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="h-10 w-10 text-green-500" />
                    <p className="text-green-500">Importação concluída com sucesso!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Template CSV */}
            <div className="col-span-4 flex justify-center mt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={downloadTemplate}
                disabled={loading}
              >
                Baixar Template CSV
              </Button>
            </div>

            {/* Preview dos dados */}
            {uploadStatus === 'preview' && previewData.length > 0 && (
              <div className="col-span-4 mt-4">
                <p className="text-sm font-medium mb-2">Prévia dos dados:</p>
                <div className="border rounded-md overflow-x-auto max-h-40">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-muted">
                      <tr>
                        {previewData[0].map((header, index) => (
                          <th
                            key={index}
                            className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {previewData.slice(1).map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-2 py-1 text-xs text-gray-500 truncate max-w-[100px]"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {previewData.length > 6 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Exibindo apenas as primeiras 5 linhas de {previewData.length - 1} total.
                  </p>
                )}
              </div>
            )}

            {/* Mensagem informativa */}
            <Alert className="col-span-4 mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Importante</AlertTitle>
              <AlertDescription>
                O CSV deve conter as colunas: athleteId, modalityId, categoryId, gender, position, city, team. 
                Os IDs devem existir no sistema. Gênero deve ser "MALE" ou "FEMALE".
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || uploadStatus !== 'preview' || !selectedEventId}
            >
              {loading ? 'Importando...' : 'Importar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
