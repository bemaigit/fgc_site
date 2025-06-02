'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import { FormErrorMessage } from '@/components/ui/form-error-message'
import { useEventForm } from '@/contexts/EventFormContext'
import { toast } from 'sonner'

// Tipo para resposta da API de CEP
type CepResponse = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
};

export function EventLocationTab() {
  const { formData, updateLocation, errors } = useEventForm()
  const { location } = formData

  // Estado para gerenciar o carregamento do CEP
  const [loadingCep, setLoadingCep] = useState(false)
  
  // Estados para países, estados e cidades
  const [countries, setCountries] = useState([{ id: '1', name: 'Brasil' }])
  const [states, setStates] = useState<any[]>([])
  const [cities, setCities] = useState<any[]>([])

  // Função para formatar o CEP
  const formatCep = (cep: string) => {
    return cep.replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  // Função para buscar endereço pelo CEP
  const fetchAddressByCep = async (cep: string) => {
    if (cep.length < 8) return

    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length !== 8) return

    try {
      setLoadingCep(true)
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)

      if (!response.ok) {
        throw new Error('Falha ao buscar CEP')
      }

      const data: CepResponse = await response.json()

      if (data.erro) {
        toast.error('CEP não encontrado')
        return
      }

      // Atualizar o endereço com os dados do CEP
      updateLocation({
        addressDetails: `${data.logradouro}, ${data.bairro}`,
        city: data.localidade,
        state: data.uf,
        country: 'Brasil'
      })

    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      toast.error('Erro ao buscar CEP')
    } finally {
      setLoadingCep(false)
    }
  }

  // Manipulador de evento para o campo de CEP
  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCep = formatCep(e.target.value)
    updateLocation({ zipCode: formattedCep })

    // Se o CEP estiver completo, buscar o endereço
    if (formattedCep.replace(/\D/g, '').length === 8) {
      fetchAddressByCep(formattedCep)
    }
  }

  // Buscar estados brasileiros da API do IBGE
  useEffect(() => {
    const fetchStates = async () => {
      try {
        const response = await fetch('https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome')
        if (response.ok) {
          const data = await response.json()
          setStates(data.map((state: any) => ({
            id: state.id.toString(),
            name: state.nome,
            sigla: state.sigla
          })))
        }
      } catch (error) {
        console.error('Erro ao buscar estados:', error)
      }
    }

    fetchStates()
  }, [])

  // Buscar cidades do estado selecionado
  useEffect(() => {
    const fetchCities = async () => {
      if (!location.stateId) return

      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${location.stateId}/municipios?orderBy=nome`)
        if (response.ok) {
          const data = await response.json()
          setCities(data.map((city: any) => ({
            id: city.id.toString(),
            name: city.nome,
            stateId: location.stateId
          })))
        }
      } catch (error) {
        console.error('Erro ao buscar cidades:', error)
      }
    }

    fetchCities()
  }, [location.stateId])

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-2">
        <h2 className="text-2xl font-bold tracking-tight">Localização</h2>
        <p className="text-muted-foreground">
          Informe os detalhes da localização do evento
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="zipCode">CEP</Label>
              <div className="relative">
                <Input
                  id="zipCode"
                  value={location.zipCode || ''}
                  onChange={handleCepChange}
                  placeholder="Digite o CEP"
                  maxLength={9}
                />
                {loadingCep && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Digite o CEP para autopreenchimento do endereço
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Local do Evento</Label>
              <Input
                id="location"
                value={location.location || ''}
                onChange={(e) => updateLocation({ location: e.target.value })}
                placeholder="Digite o nome do local do evento"
              />
              {errors.location && (
                <FormErrorMessage>{errors.location[0]}</FormErrorMessage>
              )}
              <p className="text-xs text-muted-foreground">
                Nome do local onde o evento será realizado (ex: Ginásio Municipal, Centro de Convenções)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="locationUrl">Link do Google Maps</Label>
              <Input
                id="locationUrl"
                value={location.locationUrl || ''}
                onChange={(e) => updateLocation({ locationUrl: e.target.value })}
                placeholder="Cole aqui o link do Google Maps para o local do evento"
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: https://maps.app.goo.gl/exemplo ou https://www.google.com/maps?q=...
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressDetails">Detalhes do Endereço</Label>
              <Input
                id="addressDetails"
                value={location.addressDetails || ''}
                onChange={(e) => updateLocation({ addressDetails: e.target.value })}
                placeholder="Rua, número, complemento"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country">País</Label>
                <Select
                  value={location.countryId || ''}
                  onValueChange={(value) => updateLocation({ countryId: value })}
                >
                  <SelectTrigger id="country">
                    <SelectValue placeholder="Selecione um país" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.id} value={country.id}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state">Estado</Label>
                <Select
                  value={location.stateId || ''}
                  onValueChange={(value) => updateLocation({ 
                    stateId: value,
                    cityId: '' // Resetar cidade quando o estado mudar
                  })}
                  disabled={!location.countryId}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Cidade</Label>
                <Select
                  value={location.cityId || ''}
                  onValueChange={(value) => updateLocation({ cityId: value })}
                  disabled={!location.stateId}
                >
                  <SelectTrigger id="city">
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[200px]">
                    {cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
