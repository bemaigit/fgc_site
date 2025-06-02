'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle } from "lucide-react"

interface Modality {
  id: string
  name: string
  description: string
  maxParticipants: number
  currentParticipants: number
  price: number
}

interface ModalitySelectorProps {
  modalities: Modality[]
  selectedModalityId?: string
  onSelect: (modalityId: string) => void
}

export function ModalitySelector({ 
  modalities, 
  selectedModalityId, 
  onSelect 
}: ModalitySelectorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Modalidades</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {modalities.map((modality) => {
          const isSelected = modality.id === selectedModalityId
          const availableSpots = modality.maxParticipants - modality.currentParticipants
          const isFull = availableSpots <= 0

          return (
            <Card 
              key={modality.id}
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => !isFull && onSelect(modality.id)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{modality.name}</h3>
                    <p className="text-sm text-gray-500">{modality.description}</p>
                  </div>
                  {isSelected && (
                    <CheckCircle className="h-6 w-6 text-primary" />
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Badge variant={isFull ? "destructive" : "secondary"}>
                    {isFull 
                      ? "Esgotado" 
                      : `${availableSpots} vagas restantes`
                    }
                  </Badge>
                  <span className="font-semibold">
                    R$ {modality.price.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
