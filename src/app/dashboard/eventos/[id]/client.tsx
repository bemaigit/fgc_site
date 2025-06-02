'use client'

import React from 'react'
import { EventFormProvider, useEventForm } from '@/contexts/EventFormContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

// Importação dos componentes de abas
import { EventBasicInfoTab } from '@/components/dashboard/events/tabs/EventBasicInfoTab'
import { EventLocationTab } from '@/components/dashboard/events/tabs/EventLocationTab'
import { EventModalityTab } from '@/components/dashboard/events/tabs/EventModalityTab'
import { EventPricingTab } from '@/components/dashboard/events/tabs/EventPricingTab'
import { EventAdvancedPricingTab } from '@/components/dashboard/events/tabs/EventAdvancedPricingTab'
import { EventImagesTab } from '@/components/dashboard/events/tabs/EventImagesTab'
import { EventRegulationTab } from '@/components/dashboard/events/tabs/EventRegulationTab'
import { EventResultsTab } from '@/components/dashboard/events/tabs/EventResultsTab'

interface EventEditClientProps {
  eventId: string
}

// Componente principal que usa o Provider
export function EventEditClient({ eventId }: EventEditClientProps) {
  return (
    <EventFormProvider eventId={eventId}>
      <EventEditForm />
    </EventFormProvider>
  )
}

// Componente filho que acessa o contexto
function EventEditForm() {
  const router = useRouter()
  const { submitForm, isLoading } = useEventForm()

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Editar Evento</h1>
          <p className="text-muted-foreground">
            Edite as informações do evento ou faça upload de novas imagens e documentos
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => router.push('/dashboard/eventos')}
        >
          Voltar
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="basic-info" className="w-full">
            <TabsList className="grid grid-cols-8 mb-8">
              <TabsTrigger value="basic-info">Informações Básicas</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
              <TabsTrigger value="modality">Modalidades</TabsTrigger>
              <TabsTrigger value="pricing">Preços</TabsTrigger>
              <TabsTrigger value="advanced-pricing">Preços Avançados</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="regulation">Regulamento</TabsTrigger>
              <TabsTrigger value="results">Resultados</TabsTrigger>
            </TabsList>

            <TabsContent value="basic-info">
              <EventBasicInfoTab />
            </TabsContent>

            <TabsContent value="location">
              <EventLocationTab />
            </TabsContent>

            <TabsContent value="modality">
              <EventModalityTab />
            </TabsContent>

            <TabsContent value="pricing">
              <EventPricingTab />
            </TabsContent>

            <TabsContent value="advanced-pricing">
              <EventAdvancedPricingTab />
            </TabsContent>

            <TabsContent value="images">
              <EventImagesTab />
            </TabsContent>

            <TabsContent value="regulation">
              <EventRegulationTab />
            </TabsContent>

            <TabsContent value="results">
              <EventResultsTab />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const result = await submitForm('DRAFT')
                  if (result.success) {
                    toast.success('Evento salvo como rascunho')
                    // Opcionalmente, redirecionar para a lista de eventos
                    // router.push('/dashboard/eventos')
                  } else {
                    toast.error(`Erro ao salvar: ${result.error || 'Erro desconhecido'}`)
                  }
                } catch (error) {
                  toast.error('Erro ao salvar o evento')
                  console.error(error)
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Salvando...' : 'Salvar como Rascunho'}
            </Button>

            <Button
              onClick={async () => {
                try {
                  const result = await submitForm('PUBLISHED')
                  if (result.success) {
                    toast.success('Evento atualizado com sucesso')
                    // Opcionalmente, redirecionar para a lista de eventos
                    // router.push('/dashboard/eventos')
                  } else {
                    toast.error(`Erro ao atualizar: ${result.error || 'Erro desconhecido'}`)
                  }
                } catch (error) {
                  toast.error('Erro ao atualizar o evento')
                  console.error(error)
                }
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Atualizando...' : 'Atualizar Evento'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}