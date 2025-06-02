'use client'

import { useState } from 'react'
import { DashboardHeader } from '@/components/dashboard/DashboardHeader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ChampionsTable from './components/ChampionsTable'
import CreateChampionForm from './components/CreateChampionForm'

export default function ChampionsPage() {
  const [activeTab, setActiveTab] = useState('lista')

  return (
    <div className="container mx-auto px-4 py-6">
      <DashboardHeader
        title="Gerenciamento de Campeões Goianos"
        description="Adicione, edite e gerencie os campeões goianos por modalidade, categoria e gênero."
      />

      <Tabs 
        defaultValue="lista" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="mt-6"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="lista">Lista de Campeões</TabsTrigger>
          <TabsTrigger value="adicionar">Adicionar Campeão</TabsTrigger>
        </TabsList>
        
        <TabsContent value="lista" className="mt-6">
          <ChampionsTable />
        </TabsContent>
        
        <TabsContent value="adicionar" className="mt-6">
          <CreateChampionForm 
            onSuccess={() => setActiveTab('lista')} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
