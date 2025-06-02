"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import MonacoEditor from "./monaco-editor"

const TEMPLATE_TYPES = [
  { id: "payment-created", label: "Pagamento Criado" },
  { id: "payment-approved", label: "Pagamento Aprovado" },
  { id: "payment-failed", label: "Pagamento Falhou" },
  { id: "filiation-created", label: "Filiação Criada" },
  { id: "filiation-approved", label: "Filiação Aprovada" },
  { id: "registration-created", label: "Inscrição Criada" },
  { id: "registration-approved", label: "Inscrição Aprovada" },
]

const NOTIFICATION_CHANNELS = [
  { id: "email", label: "Email" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "webhook", label: "Webhook" },
]

export default function GerenciadorTemplates() {
  const [selectedType, setSelectedType] = useState<string>("")
  const [selectedChannel, setSelectedChannel] = useState<string>("email")
  const [template, setTemplate] = useState<string>("")
  const [preview, setPreview] = useState<string>("")
  const [loading, setLoading] = useState(false)

  // Carregar template quando o tipo ou canal for selecionado
  useEffect(() => {
    if (selectedType && selectedChannel) {
      loadTemplate(selectedType, selectedChannel)
    }
  }, [selectedType, selectedChannel])

  const loadTemplate = async (type: string, channel: string) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/notifications/templates?type=${type}&channel=${channel}`
      )
      if (!response.ok) throw new Error("Erro ao carregar template")
      
      const templates = await response.json()
      if (templates.length > 0) {
        setTemplate(templates[0].content)
      } else {
        // Carregar template padrão baseado no tipo e canal
        setTemplate(getDefaultTemplate(type, channel))
      }
    } catch (error) {
      console.error("Erro ao carregar template:", error)
      toast({
        title: "Erro ao carregar template",
        description: "Não foi possível carregar o template selecionado.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/notifications/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: selectedType,
          channel: selectedChannel,
          name: TEMPLATE_TYPES.find(t => t.id === selectedType)?.label || selectedType,
          content: template,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || "Erro ao salvar template")
      }

      toast({
        title: "Template salvo",
        description: "O template foi salvo com sucesso.",
      })
    } catch (error) {
      console.error("Erro ao salvar template:", error)
      toast({
        title: "Erro ao salvar template",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePreview = async () => {
    try {
      // Gerar dados de exemplo baseado no tipo
      const sampleData = getSampleData(selectedType)
      
      const response = await fetch("/api/admin/notifications/templates/preview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          template,
          data: sampleData,
        }),
      })

      if (!response.ok) throw new Error("Erro ao gerar preview")
      
      const result = await response.json()
      setPreview(result.html)
    } catch (error) {
      console.error("Erro ao gerar preview:", error)
      toast({
        title: "Erro ao gerar preview",
        description: "Não foi possível gerar o preview do template.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Selecione o tipo de template" />
          </SelectTrigger>
          <SelectContent>
            {TEMPLATE_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedChannel} onValueChange={setSelectedChannel}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Selecione o canal" />
          </SelectTrigger>
          <SelectContent>
            {NOTIFICATION_CHANNELS.map((channel) => (
              <SelectItem key={channel.id} value={channel.id}>
                {channel.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => {
            setSelectedType("")
            setTemplate("")
            setPreview("")
          }}
        >
          Novo Template
        </Button>
      </div>

      {selectedType && selectedChannel && (
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="pt-6">
              <Tabs defaultValue="editor">
                <TabsList className="mb-4">
                  <TabsTrigger value="editor">Editor</TabsTrigger>
                  <TabsTrigger value="variables">Variáveis</TabsTrigger>
                </TabsList>

                <TabsContent value="editor">
                  <MonacoEditor
                    height="400px"
                    defaultLanguage={selectedChannel === "email" ? "handlebars" : "json"}
                    value={template}
                    onChange={(value) => setTemplate(value || "")}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      wordWrap: "on",
                      lineNumbers: "on",
                      folding: true,
                      lineDecorationsWidth: 0,
                      lineNumbersMinChars: 3,
                    }}
                  />
                </TabsContent>

                <TabsContent value="variables">
                  <div className="prose max-w-none">
                    <h4>Variáveis Disponíveis</h4>
                    <pre className="bg-muted p-4 rounded-md">
                      {JSON.stringify(getSampleData(selectedType), null, 2)}
                    </pre>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setTemplate("")}
                  disabled={loading}
                >
                  Limpar
                </Button>
                <Button 
                  variant="secondary"
                  onClick={handlePreview}
                  disabled={loading || !template}
                >
                  Visualizar
                </Button>
                <Button 
                  onClick={handleSave}
                  disabled={loading || !template}
                >
                  Salvar Template
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="prose max-w-none">
                <h3>Preview</h3>
                {preview ? (
                  <div 
                    className="p-4 bg-muted rounded-md"
                    dangerouslySetInnerHTML={{ __html: preview }}
                  />
                ) : (
                  <p className="text-muted-foreground">
                    Clique em "Visualizar" para ver como o template ficará
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Funções auxiliares
function getDefaultTemplate(type: string, channel: string): string {
  if (channel === "email") {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
  <p>{{message}}</p>
</body>
</html>`
  }

  if (channel === "whatsapp") {
    return JSON.stringify({
      name: type,
      language: "pt_BR",
      components: [
        {
          type: "body",
          parameters: [
            {
              type: "text",
              text: "{{message}}"
            }
          ]
        }
      ]
    }, null, 2)
  }

  return ""
}

function getSampleData(type: string) {
  const baseData = {
    title: "Título da Notificação",
    message: "Mensagem principal da notificação",
    date: new Date().toLocaleDateString("pt-BR"),
    protocol: "2025000123",
  }

  switch (type) {
    case "payment-created":
      return {
        ...baseData,
        title: "Pagamento Criado",
        amount: "R$ 150,00",
        dueDate: new Date().toLocaleDateString("pt-BR"),
        paymentLink: "https://exemplo.com/pagamento",
      }
    case "payment-approved":
      return {
        ...baseData,
        title: "Pagamento Aprovado",
        amount: "R$ 150,00",
        paidAt: new Date().toLocaleDateString("pt-BR"),
        transactionId: "123456789",
      }
    // Adicione mais casos conforme necessário
    default:
      return baseData
  }
}
