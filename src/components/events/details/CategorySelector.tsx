'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle } from "lucide-react"

interface Category {
  id: string
  name: string
  ageRange: string
  gender: 'M' | 'F' | 'U' // M = Masculino, F = Feminino, U = Unissex
  maxParticipants: number
  currentParticipants: number
}

interface CategorySelectorProps {
  categories: Category[]
  selectedCategoryId?: string
  onSelect: (categoryId: string) => void
  userAge?: number // Opcional: para validação de idade
  userGender?: 'M' | 'F' // Opcional: para validação de gênero
}

export function CategorySelector({
  categories,
  selectedCategoryId,
  onSelect,
  userAge,
  userGender
}: CategorySelectorProps) {
  function isEligible(category: Category) {
    if (!userAge || !userGender) return true // Se não temos dados do usuário, não validamos
    
    // Validação de gênero
    if (category.gender !== 'U' && category.gender !== userGender) {
      return false
    }

    // Validação de idade (exemplo: "18-35" ou "40+")
    const [minAge, maxAge] = category.ageRange.split('-').map(age => 
      age.includes('+') ? Number.MAX_VALUE : Number(age)
    )
    
    return userAge >= minAge && userAge <= maxAge
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Categorias</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const isSelected = category.id === selectedCategoryId
          const availableSpots = category.maxParticipants - category.currentParticipants
          const isFull = availableSpots <= 0
          const eligible = isEligible(category)

          return (
            <Card
              key={category.id}
              className={`
                cursor-pointer transition-all
                ${isSelected ? 'ring-2 ring-primary' : ''}
                ${!eligible ? 'opacity-50' : ''}
              `}
              onClick={() => eligible && !isFull && onSelect(category.id)}
            >
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-gray-500">
                      {category.gender === 'M' && 'Masculino'}
                      {category.gender === 'F' && 'Feminino'}
                      {category.gender === 'U' && 'Unissex'}
                      {' • '}
                      {category.ageRange} anos
                    </p>
                  </div>
                  {isSelected ? (
                    <CheckCircle className="h-6 w-6 text-primary" />
                  ) : !eligible && (
                    <AlertCircle className="h-6 w-6 text-yellow-500" />
                  )}
                </div>

                <div className="flex justify-between items-center">
                  <Badge 
                    variant={
                      isFull ? "destructive" : 
                      !eligible ? "secondary" : 
                      "default"
                    }
                  >
                    {isFull 
                      ? "Esgotado" 
                      : !eligible
                      ? "Não elegível"
                      : `${availableSpots} vagas restantes`
                    }
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
