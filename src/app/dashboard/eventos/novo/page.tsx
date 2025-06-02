'use client'

import React, { useState } from 'react'
import { EventFormProvider, useEventForm } from '@/contexts/EventFormContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'

// Importação dos componentes de abas
import { EventBasicInfoTab } from '@/components/dashboard/events/tabs/EventBasicInfoTab'
import { EventLocationTab } from '@/components/dashboard/events/tabs/EventLocationTab'
import { EventModalityTab } from '@/components/dashboard/events/tabs/EventModalityTab'
import { EventPricingTab } from '@/components/dashboard/events/tabs/EventPricingTab'
import { EventImagesTab } from '@/components/dashboard/events/tabs/EventImagesTab'
import { EventRegulationTab } from '@/components/dashboard/events/tabs/EventRegulationTab'
import { EventAdvancedPricingTab } from '@/components/dashboard/events/tabs/EventAdvancedPricingTab'

// Componente interno para o conteúdo do formulário
function EventFormContent() {
  const router = useRouter()
  const { submitForm, isValid } = useEventForm()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDraftSaving, setIsDraftSaving] = useState(false)

  const handlePublish = async () => {
    setIsSubmitting(true)
    try {
      // Validar o formulário antes de enviar
      if (!isValid()) {
        toast.error('Por favor, corrija os erros antes de publicar o evento')
        return
      }

      // Enviar o formulário com status PUBLISHED
      const result = await submitForm('PUBLISHED')
      
      if (result.success) {
        toast.success('Evento publicado com sucesso')
        // Redirecionar para a lista de eventos
        router.push('/dashboard/eventos')
      } else {
        toast.error(result.error || 'Erro ao publicar evento')
      }
    } catch (error) {
      console.error('Erro ao publicar evento:', error)
      toast.error('Ocorreu um erro ao publicar o evento')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSaveDraft = async () => {
    setIsDraftSaving(true)
    try {
      // Enviar o formulário com status DRAFT
      const result = await submitForm('DRAFT')
      
      if (result.success) {
        toast.success('Evento salvo como rascunho')
      } else {
        toast.error(result.error || 'Erro ao salvar rascunho')
      }
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error)
      toast.error('Ocorreu um erro ao salvar o rascunho')
    } finally {
      setIsDraftSaving(false)
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Criar Novo Evento</h1>
          <p className="text-muted-foreground">
            Preencha as informações do evento e depois adicione as imagens e documentos
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
            <TabsList className="grid grid-cols-7 mb-8">
              <TabsTrigger value="basic-info">Informações Básicas</TabsTrigger>
              <TabsTrigger value="location">Localização</TabsTrigger>
              <TabsTrigger value="modality">Modalidades</TabsTrigger>
              <TabsTrigger value="pricing">Preços</TabsTrigger>
              <TabsTrigger value="advanced-pricing">Preços Avançados</TabsTrigger>
              <TabsTrigger value="images">Imagens</TabsTrigger>
              <TabsTrigger value="regulation">Regulamento</TabsTrigger>
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
          </Tabs>
          
          <div className="flex justify-end space-x-4 mt-8">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isDraftSaving}
            >
              {isDraftSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar como Rascunho'
              )}
            </Button>
            
            <Button
              onClick={handlePublish}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publicando...
                </>
              ) : (
                'Publicar Evento'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NewEventPage() {
  return (
    <EventFormProvider>
      <EventFormContent />
    </EventFormProvider>
  )
}
