'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Upload, FileText } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'

interface RankingUploadProps {
  onUploadSuccess: () => void
}

interface RankingConfiguration {
  id: string
  name: string
  gender: string
  modality: string
  category: string
  season: number
}

export function RankingUpload({ onUploadSuccess }: RankingUploadProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [rankingId, setRankingId] = useState<string>("")
  const [stageName, setStageName] = useState<string>("")
  const [date, setDate] = useState<string>("")
  const [season, setSeason] = useState<string>(new Date().getFullYear().toString())
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    entriesCount: number;
    stageId: string;
  } | null>(null)

  // Query para rankings
  const { data: rankings, isLoading: rankingsLoading, error: rankingsError } = useQuery<RankingConfiguration[]>({
    queryKey: ['rankingConfigurations'],
    queryFn: async () => {
      console.log('Buscando configurações de ranking...')
      const res = await fetch('/api/ranking-configurations')
      if (!res.ok) {
        console.error('Erro ao buscar configurações:', res.status, res.statusText)
        throw new Error('Erro ao buscar configurações de ranking')
      }
      const data = await res.json()
      console.log('Dados das configurações de ranking recebidos:', data)
      return data.data || []
    }
  })

  // Efeito para mostrar um toast se houver erro na busca de rankings
  useEffect(() => {
    if (rankingsError) {
      console.error('Erro ao carregar rankings:', rankingsError)
      toast({
        title: "Erro ao carregar rankings",
        description: "Não foi possível carregar a lista de rankings. Tente novamente mais tarde.",
        variant: "destructive"
      })
    }
  }, [rankingsError, toast])

  // Efeito para debug - mostrar os rankings carregados
  useEffect(() => {
    if (rankings) {
      console.log('Rankings disponíveis:', rankings.length)
      rankings.forEach(r => console.log(`- ${r.name} (${r.id})`))
    }
  }, [rankings])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: "Formato inválido",
          description: "Por favor, selecione um arquivo CSV",
          variant: "destructive"
        })
        return
      }
      setSelectedFile(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      toast({
        title: "Arquivo não selecionado",
        description: "Por favor, selecione um arquivo CSV para upload",
        variant: "destructive"
      })
      return
    }

    if (!rankingId) {
      toast({
        title: "Ranking não selecionado",
        description: "Por favor, selecione um ranking",
        variant: "destructive"
      })
      return
    }

    if (!stageName) {
      toast({
        title: "Nome da etapa não informado",
        description: "Por favor, informe o nome da etapa",
        variant: "destructive"
      })
      return
    }

    if (!date) {
      toast({
        title: "Data não informada",
        description: "Por favor, informe a data da etapa",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('rankingId', rankingId)
      formData.append('stageName', stageName)
      formData.append('date', date)
      formData.append('season', season)

      const response = await fetch('/api/rankings/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.clone().json()
        throw new Error(errorData.error || 'Erro ao fazer upload')
      }

      const uploadData = await response.json()
      setUploadResult(uploadData)

      toast({
        title: "Upload realizado com sucesso",
        description: "Os resultados foram processados e o ranking foi atualizado",
        variant: "default"
      })

      // Limpar formulário após sucesso
      setSelectedFile(null)
      setRankingId("")
      setStageName("")
      setDate("")
      
      // Invalidar todas as queries relacionadas a rankings para atualizar os dados em toda a aplicação
      queryClient.invalidateQueries({ queryKey: ['rankingEntries'] })
      queryClient.invalidateQueries({ queryKey: ['rankingConfigurations'] })
      
      // Notificar componente pai
      onUploadSuccess()
      
    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: "Erro no upload",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar o arquivo",
        variant: "destructive"
      })
      setUploadResult(null)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Upload de Resultados</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Faça upload de um arquivo CSV com os resultados de uma etapa do ranking.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ranking">Ranking</Label>
            <Select 
              value={rankingId} 
              onValueChange={setRankingId}
              disabled={rankingsLoading || !rankings || rankings.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  rankingsLoading 
                    ? "Carregando rankings..." 
                    : rankings && rankings.length > 0 
                    ? "Selecione um ranking" 
                    : "Nenhum ranking disponível"
                } />
              </SelectTrigger>
              <SelectContent>
                {rankings && rankings.length > 0 ? (
                  rankings.map((ranking) => (
                    <SelectItem key={ranking.id} value={ranking.id}>
                      {ranking.name} ({ranking.modality} - {ranking.category} - {ranking.gender === 'MALE' ? 'Masculino' : 'Feminino'} - {ranking.season})
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="none" disabled>Nenhum ranking encontrado</SelectItem>
                )}
              </SelectContent>
            </Select>
            {rankingsError && (
              <p className="text-sm text-red-500">Erro ao carregar rankings. Tente novamente.</p>
            )}
            {!rankingsLoading && rankings && rankings.length === 0 && (
              <p className="text-sm text-amber-500">
                Nenhum ranking disponível. Crie um ranking primeiro na aba "Criar Ranking".
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="stageName">Nome da Etapa</Label>
            <Input
              id="stageName"
              placeholder="Ex: 1ª Etapa"
              value={stageName}
              onChange={(e) => setStageName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="date">Data da Etapa</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="season">Temporada</Label>
            <Input
              id="season"
              placeholder="Ano da temporada"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById('file')?.click()}
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {selectedFile ? selectedFile.name : "Selecionar arquivo CSV"}
              </Button>
            </div>
            {selectedFile && (
              <div className="flex items-center text-sm text-muted-foreground">
                <FileText className="mr-2 h-4 w-4" />
                <span>{selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)</span>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" disabled={isUploading} className="w-full">
          {isUploading ? "Enviando..." : "Fazer Upload"}
        </Button>
      </form>

      {uploadResult && (
        <div className="mt-6 p-4 border rounded-md bg-green-50 dark:bg-green-900/20">
          <h3 className="text-lg font-medium text-green-800 dark:text-green-300 mb-2">
            Upload realizado com sucesso!
          </h3>
          <div className="space-y-2 text-sm">
            <p><strong>Mensagem:</strong> {uploadResult.message}</p>
            <p><strong>Registros processados:</strong> {uploadResult.entriesCount}</p>
            <p><strong>ID da etapa:</strong> {uploadResult.stageId}</p>
          </div>
        </div>
      )}
    </div>
  )
}
