"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import { GatewayForm } from "./GatewayForm/index"
import type { GatewayFormData } from "./GatewayForm/types"

interface AddGatewayDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: GatewayFormData) => Promise<void>
}

export function AddGatewayDialog({ 
  open, 
  onOpenChange, 
  onSubmit 
}: AddGatewayDialogProps) {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: GatewayFormData) => {
    try {
      console.log("=== INÍCIO DA SUBMISSÃO DO GATEWAY ===");
      console.log("AddGatewayDialog - Iniciando submissão:", data)
      setIsSubmitting(true)
      
      const formattedData = {
        ...data,
        allowedMethods: data.allowedMethods,
        entityTypes: data.entityTypes,
        credentials: data.credentials
      }

      console.log("AddGatewayDialog - Dados formatados:", formattedData)
      console.log("AddGatewayDialog - Tipo dos dados:", typeof formattedData)
      
      // Verificação manual da estrutura do objeto
      console.log("AddGatewayDialog - Propriedades do objeto:", Object.keys(formattedData))
      console.log("AddGatewayDialog - Provider:", formattedData.provider)
      console.log("AddGatewayDialog - Credenciais:", formattedData.credentials)
      
      // Chamada à API diretamente para debug
      try {
        console.log("AddGatewayDialog - Enviando requisição fetch manual")
        const response = await fetch("/api/payments/gateway", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formattedData),
        })
        
        console.log("AddGatewayDialog - Resposta do fetch:", response.status)
        const responseData = await response.json()
        console.log("AddGatewayDialog - Dados da resposta:", responseData)
        
        // Continuar com o fluxo normal
        await onSubmit(formattedData)
      } catch (fetchError) {
        console.error("AddGatewayDialog - Erro no fetch manual:", fetchError)
        throw fetchError
      }
      
      console.log("AddGatewayDialog - Submissão concluída")
      toast({
        title: "Sucesso",
        description: "Gateway adicionado com sucesso"
      })
      
      onOpenChange(false)
    } catch (error) {
      console.error("AddGatewayDialog - Erro na submissão:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao adicionar gateway",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (!isSubmitting) {
      onOpenChange(false)
    }
  }

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newOpen) => {
        if (!isSubmitting) {
          onOpenChange(newOpen)
        }
      }}
    >
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => {
          if (isSubmitting) {
            e.preventDefault()
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Adicionar Gateway de Pagamento</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <GatewayForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}