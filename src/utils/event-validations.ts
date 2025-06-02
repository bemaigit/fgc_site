import { PricingTier } from '@/types/events'

export class EventValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'EventValidationError'
  }
}

/**
 * Valida as datas dos lotes para garantir que:
 * 1. Não há sobreposição de datas entre lotes
 * 2. As datas estão em ordem cronológica
 * 3. Não há gaps entre as datas dos lotes
 */
export function validatePricingTierDates(tiers: PricingTier[]) {
  if (!tiers.length) return true

  // Ordenar lotes por data de início
  const sortedTiers = [...tiers].sort((a, b) => 
    new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
  )

  let previousEndDate: Date | null = null

  for (let i = 0; i < sortedTiers.length; i++) {
    const currentTier = sortedTiers[i]
    const currentStartDate = new Date(currentTier.startDate)
    const currentEndDate = new Date(currentTier.endDate)

    // Validar se a data de fim é posterior à data de início
    if (currentEndDate <= currentStartDate) {
      throw new EventValidationError(
        `O lote "${currentTier.name}" tem data de fim anterior ou igual à data de início`
      )
    }

    // Se não é o primeiro lote, validar continuidade com o lote anterior
    if (previousEndDate) {
      // Verificar se há gap entre lotes
      if (currentStartDate.getTime() !== previousEndDate.getTime()) {
        throw new EventValidationError(
          `Há um intervalo entre o fim do lote anterior e o início do lote "${currentTier.name}"`
        )
      }
    }

    // Se não é o último lote, validar sobreposição com o próximo
    if (i < sortedTiers.length - 1) {
      const nextTier = sortedTiers[i + 1]
      const nextStartDate = new Date(nextTier.startDate)

      if (currentEndDate.getTime() !== nextStartDate.getTime()) {
        throw new EventValidationError(
          `Os lotes "${currentTier.name}" e "${nextTier.name}" têm datas sobrepostas ou gaps`
        )
      }
    }

    previousEndDate = currentEndDate
  }

  return true
}

/**
 * Garante que todos os lotes estejam dentro do período do evento
 */
export function validatePricingTiersWithinEventDates(
  tiers: PricingTier[],
  eventStartDate: Date,
  eventEndDate: Date
) {
  for (const tier of tiers) {
    const tierStartDate = new Date(tier.startDate)
    const tierEndDate = new Date(tier.endDate)

    if (tierStartDate < eventStartDate) {
      throw new EventValidationError(
        `O lote "${tier.name}" começa antes do início do evento`
      )
    }

    if (tierEndDate > eventEndDate) {
      throw new EventValidationError(
        `O lote "${tier.name}" termina após o fim do evento`
      )
    }
  }

  return true
}

/**
 * Verifica se um lote específico está válido em relação aos demais
 */
export function validatePricingTier(
  tier: PricingTier,
  allTiers: PricingTier[]
) {
  const otherTiers = allTiers.filter(t => t.id !== tier.id)
  const tierStartDate = new Date(tier.startDate)
  const tierEndDate = new Date(tier.endDate)

  // Validar se a data de fim é posterior à data de início
  if (tierEndDate <= tierStartDate) {
    throw new EventValidationError(
      'A data de fim deve ser posterior à data de início'
    )
  }

  // Verificar sobreposição com outros lotes
  for (const otherTier of otherTiers) {
    const otherStartDate = new Date(otherTier.startDate)
    const otherEndDate = new Date(otherTier.endDate)

    if (
      (tierStartDate >= otherStartDate && tierStartDate < otherEndDate) ||
      (tierEndDate > otherStartDate && tierEndDate <= otherEndDate) ||
      (tierStartDate <= otherStartDate && tierEndDate >= otherEndDate)
    ) {
      throw new EventValidationError(
        `O período do lote se sobrepõe ao período do lote "${otherTier.name}"`
      )
    }
  }

  return true
}
