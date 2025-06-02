"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, Settings, Users, Bike, RefreshCcw, Download, Trash } from "lucide-react"

const configSections = [
  {
    title: "Pagamentos",
    description: "Configurações de pagamento, gateways e taxas",
    icon: <CreditCard className="w-6 h-6" />,
    href: "/dashboard/configuracoes/pagamentos",
    items: [
      "Gateways de pagamento",
      "Valores por modalidade",
      "Transações",
      "Relatórios"
    ]
  },
  {
    title: "Sistema",
    description: "Configurações gerais do sistema",
    icon: <Settings className="w-6 h-6" />,
    href: "/dashboard/configuracoes/sistema",
    items: [
      "Emails e notificações"
    ]
  },
  {
    title: "Usuários",
    description: "Gerenciamento de usuários e permissões",
    icon: <Users className="w-6 h-6" />,
    href: "/dashboard/configuracoes/usuarios",
    items: [
      "Administradores",
      "Moderadores",
      "Permissões",
      "Logs de acesso"
    ]
  },
  {
    title: "Modalidades",
    description: "Configuração de modalidades e categorias",
    icon: <Bike className="w-6 h-6" />,
    href: "/dashboard/configuracoes/modalidades",
    items: [
      "Lista de modalidades",
      "Categorias",
      "Regras e pontuações",
      "Temporadas"
    ]
  }
]

export default function ConfiguracoesPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">
          Gerencie todas as configurações do sistema
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {configSections.map((section) => (
          <Card 
            key={section.title}
            className="hover:scale-[1.02] hover:shadow-lg transition-all duration-200 cursor-pointer shadow-sm"
            onClick={() => router.push(section.href)}
          >
            <CardHeader>
              <div className="flex items-center space-x-4">
                {section.icon}
                <div>
                  <CardTitle>{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ações Rápidas */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">Ações Rápidas</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Button variant="outline" className="w-full">
            <RefreshCcw className="mr-2 h-4 w-4" />
            Limpar Cache
          </Button>
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Backup Manual
          </Button>
          <Button variant="outline" className="w-full text-destructive hover:text-destructive">
            <Trash className="mr-2 h-4 w-4" />
            Limpar Logs
          </Button>
        </div>
      </div>
    </div>
  )
}
