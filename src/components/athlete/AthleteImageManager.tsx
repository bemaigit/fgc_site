'use client'

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageUpload } from '@/components/athlete/ImageUpload'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { processProfileImageUrl } from '@/lib/processProfileImageUrl'
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog'
import { Search, Upload } from 'lucide-react'

// Interface para tipo de atleta
interface Athlete {
  id: string
  fullName: string
  image: string | null
}

export function AthleteImageManager() {
  const [athletes, setAthletes] = useState<Athlete[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAthlete, setSelectedAthlete] = useState<Athlete | null>(null)
  const [showUploadDialog, setShowUploadDialog] = useState(false)

  // Buscar lista de atletas
  useEffect(() => {
    async function fetchAthletes() {
      try {
        setLoading(true)
        const response = await fetch('/api/athletes')
        
        if (!response.ok) {
          throw new Error('Erro ao buscar atletas')
        }
        
        const data = await response.json()
        if (data.athletes) {
          setAthletes(data.athletes)
        } else {
          console.error('Formato de resposta inesperado:', data)
          setAthletes([])
          setError('Formato de resposta inesperado da API')
        }
      } catch (err) {
        console.error('Erro ao buscar atletas:', err)
        setError('Não foi possível carregar a lista de atletas')
      } finally {
        setLoading(false)
      }
    }
    
    fetchAthletes()
  }, [])

  // Filtrar atletas com base no termo de busca
  const filteredAthletes = athletes.filter(athlete => 
    athlete.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Lidar com upload bem-sucedido
  const handleUploadSuccess = (imageUrl: string) => {
    if (selectedAthlete) {
      // Atualizar o atleta na lista local
      setAthletes(prevAthletes => 
        prevAthletes.map(athlete => 
          athlete.id === selectedAthlete.id 
            ? { ...athlete, image: imageUrl } 
            : athlete
        )
      )
      
      // Atualizar o atleta selecionado
      setSelectedAthlete({ ...selectedAthlete, image: imageUrl })
      
      // Fechar o modal após um breve atraso
      setTimeout(() => {
        setShowUploadDialog(false)
      }, 1500)
    }
  }

  // Abrir o diálogo de upload para um atleta específico
  const openUploadDialog = (athlete: Athlete) => {
    setSelectedAthlete(athlete)
    setShowUploadDialog(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
        <span className="ml-2">Carregando atletas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Barra de busca */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-grow">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar atleta por nome..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de atletas */}
      {filteredAthletes.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]">Foto</TableHead>
                <TableHead>Nome do Atleta</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAthletes.map((athlete) => (
                <TableRow key={athlete.id}>
                  <TableCell>
                    <Avatar className="h-10 w-10">
                      <AvatarImage 
                        src={athlete.image ? processProfileImageUrl(athlete.image) : ''} 
                        alt={athlete.fullName} 
                      />
                      <AvatarFallback>
                        {athlete.fullName.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TableCell>
                  <TableCell className="font-medium">{athlete.fullName}</TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openUploadDialog(athlete)}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload Foto
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center p-4 border rounded-md">
          Nenhum atleta encontrado para o termo de busca.
        </div>
      )}

      {/* Diálogo de upload de imagem */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Foto do Atleta</DialogTitle>
            <DialogDescription>
              Faça o upload de uma foto para {selectedAthlete?.fullName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center py-4">
            {selectedAthlete && (
              <ImageUpload 
                athleteId={selectedAthlete.id} 
                currentImage={selectedAthlete.image}
                onSuccess={handleUploadSuccess}
              />
            )}
            
            <div className="mt-4 text-gray-500 text-sm text-center">
              <p>A imagem será redimensionada para 300x300 pixels.</p>
              <p>Formatos aceitos: JPG, PNG, GIF</p>
              <p>Tamanho máximo: 5MB</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowUploadDialog(false)}
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
