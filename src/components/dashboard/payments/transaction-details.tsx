"use client"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TransactionStatus } from "@/lib/payment/types"
import { formatCurrency, formatDate } from "@/lib/utils"

interface TransactionDetailsProps {
  isOpen: boolean
  onClose: () => void
  transaction: {
    id: string
    protocol: string
    customerName: string
    customerEmail: string
    customerDocument: string
    amount: number
    status: TransactionStatus
    paymentMethod: string
    createdAt: string
    updatedAt: string
    metadata: Record<string, unknown>
    history: {
      status: TransactionStatus
      timestamp: string
      description: string
    }[]
  } | null
}

const statusConfig: Record<TransactionStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' }> = {
  [TransactionStatus.PENDING]: {
    label: "Pendente",
    variant: "warning",
  },
  [TransactionStatus.PROCESSING]: {
    label: "Processando",
    variant: "warning",
  },
  [TransactionStatus.PAID]: {
    label: "Pago",
    variant: "success",
  },
  [TransactionStatus.FAILED]: {
    label: "Falhou",
    variant: "destructive",
  },
  [TransactionStatus.REFUNDED]: {
    label: "Reembolsado",
    variant: "secondary",
  },
  [TransactionStatus.CANCELLED]: {
    label: "Cancelado",
    variant: "secondary",
  },
  [TransactionStatus.APPROVED]: {
    label: "Aprovado",
    variant: "success",
  },
  [TransactionStatus.ERROR]: {
    label: "Erro",
    variant: "destructive",
  },
  [TransactionStatus.EXPIRED]: {
    label: "Expirado",
    variant: "secondary",
  },
  [TransactionStatus.REJECTED]: {
    label: "Rejeitado",
    variant: "destructive",
  }
}

export function TransactionDetails({
  isOpen,
  onClose,
  transaction,
}: TransactionDetailsProps) {
  if (!transaction) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Detalhes da Transação</DialogTitle>
          <DialogDescription>
            Protocolo: {transaction.protocol}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[600px]">
          <div className="space-y-6 p-4">
            {/* Status Atual */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              <Badge variant={statusConfig[transaction.status].variant}>
                {statusConfig[transaction.status].label}
              </Badge>
            </div>

            {/* Informações do Cliente */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Informações do Cliente</h4>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Nome:</span>
                  <span>{transaction.customerName}</span>
                  <span className="text-muted-foreground">Email:</span>
                  <span>{transaction.customerEmail}</span>
                  <span className="text-muted-foreground">Documento:</span>
                  <span>{transaction.customerDocument}</span>
                </div>
              </div>
            </div>

            {/* Detalhes do Pagamento */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Detalhes do Pagamento</h4>
              <div className="rounded-lg border p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Valor:</span>
                  <span>{formatCurrency(transaction.amount)}</span>
                  <span className="text-muted-foreground">Método:</span>
                  <span>{transaction.paymentMethod}</span>
                  <span className="text-muted-foreground">Data:</span>
                  <span>{formatDate(transaction.createdAt)}</span>
                  <span className="text-muted-foreground">Última atualização:</span>
                  <span>{formatDate(transaction.updatedAt)}</span>
                </div>
              </div>
            </div>

            {/* Metadados */}
            {Object.keys(transaction.metadata).length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Metadados</h4>
                <div className="rounded-lg border p-4">
                  <pre className="text-xs whitespace-pre-wrap">
                    {JSON.stringify(transaction.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* Histórico */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Histórico</h4>
              <div className="rounded-lg border divide-y">
                {transaction.history.map((event, index) => (
                  <div key={index} className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant={statusConfig[event.status].variant}>
                        {statusConfig[event.status].label}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(event.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm">{event.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
