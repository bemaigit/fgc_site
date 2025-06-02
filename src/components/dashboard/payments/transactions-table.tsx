import { 
  TransactionStatus,
  PaymentMethod
} from "@/lib/payment/types"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface Transaction {
  id: string
  status: TransactionStatus
  amount: number
  description: string
  paymentMethod: PaymentMethod
  createdAt: string
}

interface TransactionsTableProps {
  transactions: Transaction[]
  isLoading?: boolean
  onRefresh?: () => void
  onViewDetails?: (id: string) => void
  onRefund?: (id: string) => void
}

const statusConfig: Record<TransactionStatus, { label: string; variant: "warning" | "success" | "destructive" | "default" }> = {
  [TransactionStatus.PENDING]: {
    label: "Pendente",
    variant: "warning",
  },
  [TransactionStatus.APPROVED]: {
    label: "Aprovado",
    variant: "success",
  },
  [TransactionStatus.REJECTED]: {
    label: "Rejeitado",
    variant: "destructive",
  },
  [TransactionStatus.CANCELLED]: {
    label: "Cancelado",
    variant: "default",
  },
  [TransactionStatus.REFUNDED]: {
    label: "Estornado",
    variant: "default",
  },
  [TransactionStatus.ERROR]: {
    label: "Erro",
    variant: "destructive",
  },
  [TransactionStatus.PROCESSING]: {
    label: "Processando",
    variant: "warning",
  },
  [TransactionStatus.EXPIRED]: {
    label: "Expirado",
    variant: "default",
  },
  [TransactionStatus.PAID]: {
    label: "Pago",
    variant: "success",
  },
  [TransactionStatus.FAILED]: {
    label: "Falha",
    variant: "destructive",
  }
}

export function TransactionsTable({ 
  transactions,
  isLoading = false,
  onRefresh,
  onViewDetails,
  onRefund
}: TransactionsTableProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Carregando transações...
      </div>
    )
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Nenhuma transação encontrada
      </div>
    )
  }

  return (
    <div>
      {onRefresh && (
        <div className="flex justify-end mb-4">
          <button
            onClick={onRefresh}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Atualizar
          </button>
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">ID</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Valor</TableHead>
            <TableHead>Descrição</TableHead>
            <TableHead>Método</TableHead>
            <TableHead>Data</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id} className="group">
              <TableCell className="font-mono">{transaction.id}</TableCell>
              <TableCell>
                <Badge variant={statusConfig[transaction.status].variant}>
                  {statusConfig[transaction.status].label}
                </Badge>
              </TableCell>
              <TableCell>R$ {transaction.amount.toFixed(2)}</TableCell>
              <TableCell>{transaction.description}</TableCell>
              <TableCell>{transaction.paymentMethod}</TableCell>
              <TableCell>
                {new Date(transaction.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex justify-end gap-2">
                  {onViewDetails && (
                    <button
                      onClick={() => onViewDetails(transaction.id)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Detalhes
                    </button>
                  )}
                  {onRefund && transaction.status === TransactionStatus.PAID && (
                    <button
                      onClick={() => onRefund(transaction.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Reembolsar
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
