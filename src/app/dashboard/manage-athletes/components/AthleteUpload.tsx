'use client'

import { useState } from 'react'
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

interface Modality {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
  modalityId: string
}

interface AthleteUploadProps {
  onUploadSuccess: () => void
}

export function AthleteUpload({ onUploadSuccess }: AthleteUploadProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [modalityId, setModalityId] = useState<string>("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [gender, setGender] = useState<string>("MASCULINO")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    count: number;
    errors: number;
  } | null>(null)

  // Query para modalidades
  const { data: modalities = [] } = useQuery({
    queryKey: ['rankingModalities'],
    queryFn: async () => {
      const res = await fetch('/api/rankings/modalities')
      if (!res.ok) throw new Error('Erro ao buscar modalidades')
      const data = await res.json()
      return data 
    }
  })

  // Query para categorias filtradas por modalidade
  const { data: categories = [] } = useQuery({
    queryKey: ['rankingCategories', modalityId],
    queryFn: async () => {
      if (!modalityId) return []
      const res = await fetch(`/api/rankings/categories?modalityId=${modalityId}`)
      if (!res.ok) throw new Error('Erro ao buscar categorias')
      const data = await res.json()
      return data 
    },
    enabled: !!modalityId
  })

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

    if (!modalityId) {
      toast({
        title: "Modalidade não selecionada",
        description: "Por favor, selecione uma modalidade",
        variant: "destructive"
      })
      return
    }

    if (!categoryId) {
      toast({
        title: "Categoria não selecionada",
        description: "Por favor, selecione uma categoria",
        variant: "destructive"
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('modalityId', modalityId)
      formData.append('categoryId', categoryId)
      formData.append('gender', gender)

      const response = await fetch('/api/rankings/athletes/upload', {
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
        description: `${uploadData.count} atletas foram adicionados com sucesso. ${uploadData.errors} erros encontrados.`,
        variant: "default"
      })

      // Limpar formulário após sucesso
      setSelectedFile(null)
      setModalityId("")
      setCategoryId("")
      
      // Invalidar queries relacionadas a atletas
      queryClient.invalidateQueries({ queryKey: ['athletes'] })
      
      // Notificar componente pai
      onUploadSuccess()
    } catch (error) {
      console.error('Erro ao fazer upload:', error)
      toast({
        title: "Erro ao fazer upload",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="flex-1"
              />
              {selectedFile && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{selectedFile.name}</span>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              O arquivo CSV deve conter colunas para: nome, cidade, equipe, pontos e posição.
              Opcionalmente pode conter: modalidade, categoria, gênero, cpf, data de nascimento, endereço, estado, cep e telefone.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="modality">Modalidade</Label>
            <Select 
              value={modalityId} 
              onValueChange={setModalityId}
            >
              <SelectTrigger id="modality">
                <SelectValue placeholder="Selecione uma modalidade" />
              </SelectTrigger>
              <SelectContent>
                {modalities?.map((modality: Modality) => (
                  <SelectItem key={modality.id} value={modality.id}>
                    {modality.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select 
              value={categoryId} 
              onValueChange={setCategoryId}
              disabled={!modalityId}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories?.map((category: Category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="gender">Gênero</Label>
            <Select 
              value={gender} 
              onValueChange={setGender}
            >
              <SelectTrigger id="gender">
                <SelectValue placeholder="Selecione um gênero" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MASCULINO">Masculino</SelectItem>
                <SelectItem value="FEMININO">Feminino</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Button type="submit" disabled={isUploading} className="w-full">
          {isUploading ? (
            <>
              <Upload className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Fazer Upload
            </>
          )}
        </Button>
      </form>

      {uploadResult && (
        <div className={`p-4 rounded-md ${
          uploadResult.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        }`}>
          <h3 className="font-medium">Resultado do Upload</h3>
          <p>Atletas adicionados: {uploadResult.count}</p>
          <p>Erros encontrados: {uploadResult.errors}</p>
        </div>
      )}
    </div>
  )
}
