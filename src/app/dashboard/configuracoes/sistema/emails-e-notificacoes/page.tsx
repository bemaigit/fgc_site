"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import ConfiguracaoGeral from "./components/configuracao-geral"
import GerenciadorTemplates from "./components/gerenciador-templates"
import MonitoramentoNotificacoes from "./components/monitoramento"

export default function EmailsNotificacoesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Emails e Notificações</h1>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList>
          <TabsTrigger value="geral">Configuração Geral</TabsTrigger>
          <TabsTrigger value="templates">Gerenciador de Templates</TabsTrigger>
          <TabsTrigger value="monitoramento">Monitoramento</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card>
            <CardHeader>
              <CardTitle>Configuração Geral</CardTitle>
              <CardDescription>
                Configure os canais de notificação e suas credenciais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ConfiguracaoGeral />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciador de Templates</CardTitle>
              <CardDescription>
                Gerencie os templates de notificação para diferentes canais
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GerenciadorTemplates />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoramento">
          <Card>
            <CardHeader>
              <CardTitle>Monitoramento de Notificações</CardTitle>
              <CardDescription>
                Visualize o status e histórico das notificações enviadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonitoramentoNotificacoes />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
