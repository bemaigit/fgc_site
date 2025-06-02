"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { PaymentProvider, EntityType, PaymentMethod } from "@/lib/payment/types"
import { GatewayCard } from "./GatewayCard"
import { AddGatewayDialog } from "./AddGatewayDialog"

export function GatewayList(): React.ReactElement {
  const [gateways, setGateways] = React.useState<any[]>([])
  const [isAddingGateway, setIsAddingGateway] = React.useState(false)
  const [testingGateway, setTestingGateway] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const { toast } = useToast()

  // Função de log condicional
  const debugLog = (message: string, data?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(message, data)
    }
  }

  const loadGateways = React.useCallback(async () => {
    try {
      setIsLoading(true)
      debugLog("Carregando gateways")

      const response = await fetch("/api/payments/gateway")
      debugLog("Resposta da API (GET):", {
        status: response.status,
        ok: response.ok
      })

      if (!response.ok) {
        throw new Error("Falha ao carregar gateways")
      }

      const data = await response.json()
      debugLog("Gateways carregados:", data)
      
      setGateways(data)
    } catch (error) {
      console.error("Erro ao carregar gateways:", error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os gateways",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  React.useEffect(() => {
    loadGateways()
  }, [loadGateways])

  const addGateway = React.useCallback(async (data: any) => {
    try {
      debugLog("Iniciando addGateway com dados:", data)

      // Verificação prévia de dados
      if (!data.name) {
        debugLog("Nome do gateway não fornecido")
        throw new Error("Nome do gateway é obrigatório")
      }

      if (!data.provider) {
        debugLog("Provider não fornecido")
        throw new Error("Provider do gateway é obrigatório")
      }

      debugLog("Credenciais (chaves):", Object.keys(data.credentials || {}))

      const response = await fetch("/api/payments/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      debugLog("Resposta raw:", response)

      let responseData;
      try {
        responseData = await response.json()
      } catch (e) {
        throw new Error("Não foi possível interpretar a resposta do servidor")
      }

      debugLog("Dados de resposta:", responseData)

      if (!response.ok) {
        console.error("Resposta não OK:", responseData) // Mantemos erro real
        throw new Error(responseData.error || "Erro ao adicionar gateway")
      }

      toast({
        title: "Sucesso",
        description: "Gateway adicionado com sucesso",
      })

      setIsAddingGateway(false)
      await loadGateways()
      
      return responseData
    } catch (error) {
      console.error("Erro crítico em addGateway:", error) // Mantemos erro real
      toast({
        title: "Erro Crítico",
        description: error instanceof Error 
          ? `Detalhes: ${error.message}` 
          : "Erro desconhecido ao adicionar gateway",
        variant: "destructive"
      })

      throw error
    }
  }, [loadGateways, toast])

  const updateGateway = async (id: string, data: any) => {
    try {
      debugLog("Atualizando gateway:", { id, data })
      
      const url = new URL("/api/payments/gateway", window.location.origin)
      url.searchParams.append("id", id)

      const response = await fetch(url.toString(), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Falha ao atualizar gateway")
      }

      debugLog("Gateway atualizado:", responseData)

      toast({
        title: "Sucesso",
        description: "Gateway atualizado com sucesso",
      })

      await loadGateways()
    } catch (error) {
      console.error("Erro ao atualizar gateway:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o gateway",
        variant: "destructive",
      })
    }
  }

  const deleteGateway = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este gateway?")) return

    try {
      debugLog("Excluindo gateway:", id)
      
      const url = new URL("/api/payments/gateway", window.location.origin)
      url.searchParams.append("id", id)

      const response = await fetch(url.toString(), {
        method: "DELETE",
      })

      const responseData = await response.json()

      if (!response.ok) {
        throw new Error(responseData.error || "Falha ao excluir gateway")
      }

      debugLog("Gateway excluído com sucesso")

      toast({
        title: "Sucesso",
        description: "Gateway excluído com sucesso",
      })

      await loadGateways()
    } catch (error) {
      console.error("Erro ao excluir gateway:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Não foi possível excluir o gateway",
        variant: "destructive",
      })
    }
  }

  const handleChangePriority = async (id: string, direction: "up" | "down") => {
    const currentIndex = gateways.findIndex(g => g.id === id)
    if (currentIndex === -1) return

    let newPriority: number
    const gatewaysCount = gateways.length

    if (direction === "up" && currentIndex > 0) {
      newPriority = gateways[currentIndex - 1].priority + 1
    } else if (direction === "down" && currentIndex < gatewaysCount - 1) {
      newPriority = Math.max(0, gateways[currentIndex + 1].priority - 1)
    } else {
      return
    }

    await updateGateway(id, { priority: newPriority })
  }

  const handleOpenAddGateway = () => {
    debugLog("Abrindo modal de adição")
    setIsAddingGateway(true)
  }

  const createPagSeguroDirectly = async () => {
    try {
      const gatewayData = {
        name: "PagSeguro Direct",
        provider: "PAGSEGURO",
        active: true,
        allowedMethods: ["PIX", "CREDIT_CARD", "BOLETO", "DEBIT_CARD"],
        entityTypes: ["ATHLETE", "CLUB", "EVENT", "FEDERATION"],
        checkoutType: "TRANSPARENT",
        sandbox: true,
        webhook: {
          retryAttempts: 3,
          retryInterval: 5000
        },
        urls: {
          success: "http://localhost:3000/pagamento/sucesso",
          failure: "http://localhost:3000/pagamento/erro",
          notification: "http://localhost:3000/api/payments/gateway/webhook"
        },
        credentials: {
          email: "teste@sandbox.pagseguro.com.br",
          token: "42DCB74D7EC0445A9AD0850DF8C5D1283",
          appId: "sandbox_app_id",
          appKey: "sandbox_app_key" 
        }
      };
      
      console.log("Dados preparados:", gatewayData);
      
      const response = await fetch("/api/payments/gateway", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(gatewayData)
      });
      
      console.log("Status da resposta:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Gateway criado com sucesso:", data);
        toast({
          title: "Sucesso",
          description: "Gateway PagSeguro criado diretamente!"
        });
        loadGateways(); // Recarrega a lista
      } else {
        const errorData = await response.json();
        console.error("Erro ao criar gateway:", errorData);
        toast({
          title: "Erro",
          description: "Falha ao criar PagSeguro: " + (errorData.error || "Erro desconhecido"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      toast({
        title: "Erro",
        description: "Erro na requisição: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive"
      });
    }
  };

  // Função para atualizar credenciais do PagSeguro
  const updatePagSeguroCredentials = async () => {
    try {
      // Buscar gateways existentes para encontrar o ID do PagSeguro
      console.log("Buscando gateways existentes...");
      const gatewaysResponse = await fetch("/api/payments/gateway");
      const gateways = await gatewaysResponse.json();
      console.log("Gateways encontrados:", gateways);
      
      // Encontrar o gateway PagSeguro
      const pagSeguroGateway = gateways.find((g: {provider: string, id: string}) => g.provider === "PAGSEGURO");
      console.log("Gateway PagSeguro encontrado:", pagSeguroGateway);
      
      if (!pagSeguroGateway) {
        toast({
          title: "Erro",
          description: "Gateway PagSeguro não encontrado",
          variant: "destructive"
        });
        return;
      }
      
      console.log("Atualizando credenciais do PagSeguro com ID:", pagSeguroGateway.id);
      
      // Credenciais reais do sandbox
      const updatedCredentials = {
        token: "887712521728452",          // Nome direto para o adapter reconhecer
        appId: "app0155491563",            // Nome direto para o adapter reconhecer
        appKey: "2A75ECF1E1E1FB6FF4A63FB222D1BBB2", // Nome direto para o adapter reconhecer
        email: "v7363473067977521584@sandbox.pagseguro.com.br", // Nome direto para o adapter reconhecer
        
        // Também manter as versões com prefixo para o banco de dados
        pagseguroToken: "887712521728452",
        pagseguroAppId: "app0155491563",
        pagseguroAppKey: "2A75ECF1E1E1FB6FF4A63FB222D1BBB2",
        pagseguroEmail: "v7363473067977521584@sandbox.pagseguro.com.br"
      };
      
      // Dados completos para atualização
      const updateData = {
        id: pagSeguroGateway.id, // Adicionar o ID no corpo da requisição também
        active: true,
        credentials: updatedCredentials
      };
      
      console.log("Enviando requisição de atualização:", updateData);
      
      // Atualizar o gateway existente - corrigido para usar o formato correto com ID como query parameter
      const response = await fetch(`/api/payments/gateway?id=${pagSeguroGateway.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          active: true,
          credentials: updatedCredentials
        })
      });
      
      console.log("Status da resposta:", response.status);
      const responseData = await response.json();
      console.log("Dados da resposta:", responseData);
      
      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Credenciais do PagSeguro atualizadas!"
        });
        loadGateways(); // Recarrega a lista
      } else {
        console.error("Erro ao atualizar credenciais:", responseData);
        toast({
          title: "Erro",
          description: "Falha ao atualizar credenciais: " + (responseData.error || "Erro desconhecido"),
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar credenciais:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar credenciais: " + (error instanceof Error ? error.message : String(error)),
        variant: "destructive"
      });
    }
  };

  return (
    <div className="h-full w-full overflow-auto px-4 py-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex justify-between items-center sticky top-0 bg-background py-4 z-10">
          <h2 className="text-lg font-semibold">Gateways de Pagamento</h2>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={createPagSeguroDirectly}
              className="bg-yellow-50 hover:bg-yellow-100 text-yellow-800 border-yellow-300"
            >
              Criar PagSeguro Direto
            </Button>
            <Button 
              variant="outline" 
              onClick={updatePagSeguroCredentials}
              className="bg-green-50 hover:bg-green-100 text-green-800 border-green-300"
            >
              Atualizar Credenciais PagSeguro
            </Button>
            <Button onClick={handleOpenAddGateway}>
              Adicionar Gateway
            </Button>
          </div>
        </div>

        <AddGatewayDialog
          open={isAddingGateway}
          onOpenChange={setIsAddingGateway}
          onSubmit={addGateway}
        />

        <div className="grid gap-4 pb-6">
          {isLoading ? (
            <div className="text-center py-4">Carregando...</div>
          ) : gateways.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Nenhum gateway configurado
            </div>
          ) : (
            gateways.map((gateway, index) => (
              <GatewayCard
                key={gateway.id}
                gateway={gateway}
                testingId={testingGateway}
                isFirst={index === 0}
                isLast={index === gateways.length - 1}
                onTest={setTestingGateway}
                onDelete={deleteGateway}
                onUpdate={updateGateway}
                onChangePriority={handleChangePriority}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
