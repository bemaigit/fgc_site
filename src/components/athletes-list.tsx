'use client'

import { useAthletes } from '@/hooks'
import Image from 'next/image'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Loader2, Trash2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { processProfileImageUrl } from '@/lib/processProfileImageUrl'

interface AthletesListProps {
  modalityId?: string
  categoryId?: string
  gender?: string
  onDelete: (id: string) => void
  isDeleting: boolean
  athleteToDelete: string | null
}

export function AthletesList({
  modalityId,
  categoryId,
  gender,
  onDelete,
  isDeleting,
  athleteToDelete
}: AthletesListProps) {
  // Busca atletas com os filtros selecionados
  const { 
    athletes, 
    isLoading, 
    error 
  } = useAthletes({
    modality: modalityId,
    category: categoryId,
    gender
  })

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Carregando atletas...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Erro</AlertTitle>
        <AlertDescription>
          {error}
        </AlertDescription>
      </Alert>
    )
  }

  if (!athletes || athletes.length === 0) {
    return (
      <Alert>
        <AlertTitle>Nenhum atleta encontrado</AlertTitle>
        <AlertDescription>
          Não foram encontrados atletas com os filtros selecionados.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Modalidade</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Gênero</TableHead>
            <TableHead>Cidade</TableHead>
            <TableHead>Equipe</TableHead>
            <TableHead>Pontos</TableHead>
            <TableHead>Posição</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {athletes.map((athlete: any) => (
            <TableRow key={athlete.id}>
              <TableCell className="font-medium">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8">
                    {athlete.profileImage && (
                      <AvatarImage 
                        src={processProfileImageUrl(athlete.profileImage)} 
                        alt={athlete.fullName || 'Foto do atleta'}
                        className="object-cover"
                      />
                    )}
                    <AvatarFallback>
                      {athlete.fullName?.charAt(0) || 'A'}
                    </AvatarFallback>
                  </Avatar>
                  <span>{athlete.fullName}</span>
                </div>
              </TableCell>
              <TableCell>{athlete.modality}</TableCell>
              <TableCell>{athlete.category}</TableCell>
              <TableCell>{athlete.gender === 'MASCULINO' ? 'Masculino' : 'Feminino'}</TableCell>
              <TableCell>{athlete.city}</TableCell>
              <TableCell>{athlete.team || '-'}</TableCell>
              <TableCell>{athlete.points}</TableCell>
              <TableCell>{athlete.position}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onDelete(athlete.id)}
                  disabled={isDeleting && athleteToDelete === athlete.id}
                >
                  {isDeleting && athleteToDelete === athlete.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-red-500" />
                  )}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
