"use client"

import { type ReactElement } from "react"
import { Button } from "@/components/ui/button"
import { GatewayConfig } from "@/lib/payment/types"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react"

interface GatewayCardProps {
  gateway: GatewayConfig
  testingId: string | null
  isFirst: boolean
  isLast: boolean
  onTest: (id: string | null) => void
  onDelete: (id: string) => void
  onUpdate: (id: string, data: Partial<GatewayConfig>) => void
  onChangePriority: (id: string, direction: "up" | "down") => void
}

export function GatewayCard({
  gateway,
  testingId,
  isFirst,
  isLast,
  onTest,
  onDelete,
  onUpdate,
  onChangePriority,
}: GatewayCardProps): ReactElement {
  const { toast } = useToast()
  const isTesting = testingId === gateway.id

  const handleToggleActive = () => {
    onUpdate(gateway.id, { active: !gateway.active })
  }

  const handleTest = async () => {
    try {
      console.log("GatewayCard - Iniciando teste:", gateway.id);
      onTest(gateway.id);

      const paymentData = {
        gatewayId: gateway.id,
        amount: 1.00, // ou qualquer valor de teste que você deseja usar
        description: "Teste de integração",
      };

      const response = await fetch("/api/payments/gateway/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const data = await response.json();
      console.log("GatewayCard - Resultado do teste:", data);

      if (data.success) {
        toast({
          title: "Sucesso",
          description: "Gateway testado com sucesso",
        });
      } else {
        throw new Error(data.error || "Falha no teste do gateway");
      }
    } catch (error) {
      console.error("GatewayCard - Erro no teste:", error);
      toast({
        title: "Erro no teste",
        description: error instanceof Error ? error.message : "Falha ao testar gateway",
        variant: "destructive",
      });
    } finally {
      onTest(null);
    }
  }

  return (
    <Card className={gateway.active ? "" : "opacity-60"}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle>{gateway.name}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">{gateway.provider}</Badge>
            <Badge variant={gateway.active ? "default" : "secondary"}>
              {gateway.active ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        </div>
        <Switch checked={gateway.active} onCheckedChange={handleToggleActive} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h4 className="mb-2 text-sm font-medium">Métodos de Pagamento</h4>
            <div className="flex flex-wrap gap-2">
              {gateway.allowedMethods.map((method) => (
                <Badge key={method} variant="secondary">
                  {method}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium">Tipos de Entidade</h4>
            <div className="flex flex-wrap gap-2">
              {gateway.entityTypes.map((type) => (
                <Badge key={type} variant="secondary">
                  {type}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={isFirst}
            onClick={() => onChangePriority(gateway.id, "up")}
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={isLast}
            onClick={() => onChangePriority(gateway.id, "down")}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTest}
            disabled={isTesting}
          >
            {isTesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Testar"
            )}
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(gateway.id)}
          >
            Excluir
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}