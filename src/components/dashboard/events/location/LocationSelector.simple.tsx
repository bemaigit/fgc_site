'use client'

import { useEffect, useState } from 'react'
import { type UseFormReturn } from 'react-hook-form'
import { FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2, MapPin } from 'lucide-react'
import { useStates } from '@/hooks/location/useStates'
import { useCities } from '@/hooks/location/useCities'
import { type LocationFormValues } from './EventLocationEditor'
import { SimpleMapComponent } from '@/components/ui/map/SimpleMapComponent'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface LocationSelectorProps {
  disabled?: boolean
  form: UseFormReturn<LocationFormValues>
}

export function LocationSelector({ 
  disabled = false,
  form
}: LocationSelectorProps) {
  const { states = [], isLoading: isLoadingStates } = useStates()
  const selectedState = form.watch('stateId')
  const { cities = [], isLoading: isLoadingCities } = useCities(selectedState)
  
  const latitude = form.watch('latitude')
  const longitude = form.watch('longitude')
  const addressDetails = form.watch('addressDetails')
  const cityId = form.watch('cityId')
  const stateId = form.watch('stateId')
  
  const [fullAddress, setFullAddress] = useState<string>('')
  
  // Atualiza o endereço completo para busca no mapa quando os campos mudam
  useEffect(() => {
    const selectedCity = cities.find(city => city.id === cityId)
    const selectedStateObj = states.find(state => state.id === stateId)
    
    let address = addressDetails || ''
    
    if (selectedCity) {
      address = address ? `${address}, ${selectedCity.name}` : selectedCity.name
    }
    
    if (selectedStateObj) {
      address = address ? `${address}, ${selectedStateObj.name}` : selectedStateObj.name
    }
    
    address = address ? `${address}, Brasil` : 'Brasil'
    
    setFullAddress(address)
  }, [addressDetails, cityId, stateId, cities, states])
  
  // Função para atualizar as coordenadas quando o mapa é clicado
  const handleMapCoordinatesChange = (lat: number, lng: number) => {
    form.setValue('latitude', lat, { shouldValidate: true, shouldDirty: true })
    form.setValue('longitude', lng, { shouldValidate: true, shouldDirty: true })
  }
  
  const hasCoordinates = latitude !== undefined && longitude !== undefined

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Estados */}
        <FormField
          control={form.control}
          name="stateId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Estado *</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={(value) => {
                  field.onChange(value)
                  form.setValue('cityId', '')
                }}
                disabled={disabled || isLoadingStates}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um estado" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {isLoadingStates ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    states.map((state) => (
                      <SelectItem key={state.id} value={state.id}>
                        {state.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Cidades */}
        <FormField
          control={form.control}
          name="cityId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cidade *</FormLabel>
              <Select 
                value={field.value} 
                onValueChange={field.onChange}
                disabled={disabled || isLoadingCities || !selectedState}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma cidade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                  {isLoadingCities ? (
                    <div className="flex items-center justify-center p-4">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </div>
                  ) : (
                    cities.map((city) => (
                      <SelectItem key={city.id} value={city.id}>
                        {city.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {/* Endereço */}
      <FormField
        control={form.control}
        name="addressDetails"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Endereço *</FormLabel>
            <FormControl>
              <Input
                placeholder="Digite o endereço completo do evento"
                disabled={disabled}
                {...field}
              />
            </FormControl>
            <FormDescription>
              Informe o endereço completo incluindo rua, número e bairro
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* CEP */}
      <FormField
        control={form.control}
        name="zipCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>CEP (opcional)</FormLabel>
            <FormControl>
              <Input
                placeholder="00000-000"
                disabled={disabled}
                {...field}
                value={field.value || ''}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      
      {/* Mapa */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Localização no Mapa</CardTitle>
            {hasCoordinates && (
              <Badge variant="outline" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="text-xs">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </span>
              </Badge>
            )}
          </div>
          <CardDescription>
            Selecione a localização exata do evento no mapa ou busque pelo endereço
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SimpleMapComponent
            latitude={latitude}
            longitude={longitude}
            onChange={handleMapCoordinatesChange}
            address={fullAddress}
            disabled={disabled}
          />
        </CardContent>
      </Card>
      
      {/* Campos ocultos para latitude e longitude */}
      <div className="hidden">
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="hidden"
                  {...field}
                  value={field.value === undefined ? '' : field.value}
                />
              </FormControl>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  type="hidden"
                  {...field}
                  value={field.value === undefined ? '' : field.value}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
