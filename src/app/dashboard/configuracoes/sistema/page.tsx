"use client"

import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Mail } from "lucide-react"

const systemSections = [
  {
    title: "Emails e Notificações",
    description: "Configure os canais e templates de notificação",
    icon: <Mail className="w-6 h-6" />,
    href: "/dashboard/configuracoes/sistema/emails-e-notificacoes",
  }
]

export default function ConfiguracoesSistemaPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Configurações do Sistema</h1>
        <p className="text-muted-foreground">
          Gerencie as configurações gerais do sistema
        </p>
      </div>

      <div className="grid gap-6">
        {systemSections.map((section) => (
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
          </Card>
        ))}
      </div>
    </div>
  )
}
