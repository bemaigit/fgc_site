'use client'

import React, { useState } from 'react'
import { useEventForm } from '@/contexts/EventFormContext'
import { Card, CardContent } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { DatePicker } from '@/components/ui/date-picker'
import { Plus, Trash2, Clock } from 'lucide-react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'

// Tipo para o lote de preço
type PricingTier = {
  id?: string;
  name: string;
  price: number;
  startDate: Date | null;
  endDate: Date | null;
  endTime?: string;
  maxEntries?: number | null;
};

export function EventPricingTab() {
  const { formData, updatePricing, errors } = useEventForm()
  const { pricing } = formData

  // Estado local para o formulário de novo lote
  const [newTier, setNewTier] = useState<PricingTier>({
    name: '',
    price: 0,
    startDate: null,
    endDate: null,
    endTime: '23:59',
    maxEntries: 100 // Valor padrão
  })

  // Manipuladores de eventos
  const handleIsFreeChange = (checked: boolean) => {
    updatePricing({ isFree: checked })
  }

  const handleNewTierChange = (field: keyof PricingTier, value: string | number | Date | null) => {
    setNewTier(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleAddTier = () => {
    // Validação básica
    if (!newTier.name || newTier.price <= 0) {
      return
    }

    // Adicionar novo lote com ID temporário
    const newTierId = `temp-${Date.now()}`
    
    // Garantir que o preço seja um número válido
    const price = typeof newTier.price === 'string' 
      ? parseFloat(newTier.price) 
      : newTier.price;
      
    console.log('Adicionando lote com preço:', price);
    
    const newTierWithId = { 
      ...newTier, 
      id: newTierId,
      price: price
    }
    
    updatePricing({
      pricingTiers: [...pricing.pricingTiers, newTierWithId]
    })

    // Limpar o formulário
    setNewTier({
      name: '',
      price: 0,
      startDate: null,
      endDate: null,
      endTime: '23:59',
      maxEntries: 100
    })
  }

  const handleRemoveTier = (id: string) => {
    updatePricing({
      pricingTiers: pricing.pricingTiers.filter(tier => tier.id !== id)
    })
  }

  // Formatar preço para exibição
  const formatCurrency = (value: number) => {
    try {
      // Garantir que value seja um número válido
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      
      if (isNaN(numValue)) {
        console.error('Valor inválido para formatação de moeda:', value);
        return 'R$ 0,00';
      }
      
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(numValue);
    } catch (error) {
      console.error('Erro ao formatar moeda:', error);
      return 'R$ 0,00';
    }
  }

  // Formatar data para exibição
  const formatDate = (date: Date | null | string) => {
    if (!date) return '-'
    
    try {
      // Converter para objeto Date se for string
      const dateObj = date instanceof Date ? date : new Date(date)
      
      // Verificar se a data é válida após a conversão
      if (isNaN(dateObj.getTime())) {
        console.warn('Data inválida após conversão:', date)
        return '-'
      }
      
      return new Intl.DateTimeFormat('pt-BR').format(dateObj)
    } catch (error) {
      console.warn('Erro ao formatar data:', error, date)
      return '-'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* Opção de evento gratuito */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isFree">Evento Gratuito</Label>
                <p className="text-sm text-muted-foreground">
                  Marque esta opção se o evento não tiver custo de inscrição
                </p>
              </div>
              <Switch
                id="isFree"
                checked={pricing.isFree}
                onCheckedChange={handleIsFreeChange}
              />
            </div>

            {/* Seção de lotes de preço (visível apenas se não for gratuito) */}
            {!pricing.isFree && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">Lotes de Preço</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure os diferentes lotes de preço para o evento
                  </p>
                </div>

                {/* Formulário para adicionar novo lote */}
                <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-4 border rounded-md">
                  <div className="space-y-2">
                    <Label htmlFor="tierName">Nome do Lote</Label>
                    <Input
                      id="tierName"
                      value={newTier.name}
                      onChange={(e) => handleNewTierChange('name', e.target.value)}
                      placeholder="Ex: Lote 1, Promocional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tierPrice">Preço (R$)</Label>
                    <Input
                      id="tierPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newTier.price || ''}
                      onChange={(e) => {
                        // Garantir que o valor seja um número válido
                        const inputValue = e.target.value;
                        let numValue = 0;
                        
                        try {
                          // Remover formatação de moeda se existir
                          const cleanValue = inputValue.replace(/[^\d.,]/g, '').replace(',', '.');
                          numValue = parseFloat(cleanValue);
                          
                          if (isNaN(numValue)) numValue = 0;
                          
                          console.log('Valor do preço convertido:', numValue);
                        } catch (error) {
                          console.error('Erro ao converter preço:', error);
                        }
                        
                        handleNewTierChange('price', numValue);
                      }}
                      placeholder="0,00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tierStartDate">Data de Início</Label>
                    <DatePicker
                      id="tierStartDate"
                      selected={newTier.startDate}
                      onSelect={(date: Date | null) => handleNewTierChange('startDate', date)}
                      placeholder="Selecione a data"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tierEndDate">Data de Término</Label>
                    <DatePicker
                      id="tierEndDate"
                      selected={newTier.endDate}
                      onSelect={(date: Date | null) => handleNewTierChange('endDate', date)}
                      placeholder="Selecione a data"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="tierEndTime">Horário de Término</Label>
                    <div className="flex items-center space-x-2">
                      <Clock size={16} className="text-muted-foreground" />
                      <Input
                        id="tierEndTime"
                        type="time"
                        value={newTier.endTime || '23:59'}
                        onChange={(e) => handleNewTierChange('endTime', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tierMaxEntries">Vagas Máximas</Label>
                    <Input
                      id="tierMaxEntries"
                      type="number"
                      min="1"
                      value={newTier.maxEntries || ''}
                      onChange={(e) => handleNewTierChange('maxEntries', parseInt(e.target.value))}
                      placeholder="100"
                    />
                  </div>

                  <div className="md:col-span-6 flex justify-end">
                    <Button
                      type="button"
                      onClick={handleAddTier}
                      disabled={!newTier.name || newTier.price <= 0}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Adicionar Lote
                    </Button>
                  </div>
                </div>

                {/* Tabela de lotes adicionados */}
                {pricing.pricingTiers.length > 0 ? (
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nome</TableHead>
                          <TableHead>Preço</TableHead>
                          <TableHead>Início</TableHead>
                          <TableHead>Término</TableHead>
                          <TableHead>Horário</TableHead>
                          <TableHead>Vagas Máximas</TableHead>
                          <TableHead className="w-[100px]">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pricing.pricingTiers.map((tier) => (
                          <TableRow key={tier.id}>
                            <TableCell>{tier.name}</TableCell>
                            <TableCell>
                              {formatCurrency(tier.price)}
                            </TableCell>
                            <TableCell>{formatDate(tier.startDate)}</TableCell>
                            <TableCell>{formatDate(tier.endDate)}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <Clock size={14} className="text-muted-foreground" />
                                <span>{tier.endTime || '23:59'}</span>
                              </div>
                            </TableCell>
                            <TableCell>{tier.maxEntries}</TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveTier(tier.id!)}
                                className="text-destructive"
                              >
                                <Trash2 size={16} />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-8 border rounded-md">
                    <p className="text-muted-foreground">
                      Nenhum lote de preço adicionado
                    </p>
                  </div>
                )}

                {errors.pricingTiers && (
                  <div>
                    {errors.pricingTiers[0]}
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
