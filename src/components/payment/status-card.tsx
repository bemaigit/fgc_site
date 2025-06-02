import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Icons } from "@/components/ui/icons"
import Link from "next/link"

interface PaymentStatusCardProps {
  status: "success" | "error" | "pending"
  title: string
  message: string
  protocol?: string
  paymentDetails?: {
    method: string
    value: string
    dueDate?: string
    qrCode?: string
    barcode?: string
  }
  actions?: {
    primary?: {
      label: string
      href: string
    }
    secondary?: {
      label: string
      href: string
    }
  }
}

const statusConfig = {
  success: {
    icon: <Icons.checkCircle className="h-12 w-12 text-success" />,
    className: "border-success/20"
  },
  error: {
    icon: <Icons.xCircle className="h-12 w-12 text-destructive" />,
    className: "border-destructive/20"
  },
  pending: {
    icon: <Icons.clock className="h-12 w-12 text-warning" />,
    className: "border-warning/20"
  }
}

export function PaymentStatusCard({
  status,
  title,
  message,
  protocol,
  paymentDetails,
  actions
}: PaymentStatusCardProps) {
  const config = statusConfig[status]

  return (
    <Card className={config.className}>
      <CardHeader>
        <div className="flex flex-col items-center space-y-2">
          {config.icon}
          <CardTitle>{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          
          {protocol && (
            <div className="text-sm bg-muted p-2 rounded">
              <p>Protocolo: <span className="font-medium">{protocol}</span></p>
            </div>
          )}

          {paymentDetails && (
            <div className="space-y-2 text-sm">
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <p>Forma de pagamento: {paymentDetails.method}</p>
                <p>Valor: {paymentDetails.value}</p>
                {paymentDetails.dueDate && (
                  <p>Vencimento: {paymentDetails.dueDate}</p>
                )}
              </div>

              {paymentDetails.qrCode && (
                <div className="flex flex-col items-center space-y-2">
                  <img
                    src={paymentDetails.qrCode}
                    alt="QR Code para pagamento"
                    className="w-48 h-48"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentDetails.qrCode!)
                    }}
                  >
                    <Icons.copy className="mr-2 h-4 w-4" />
                    Copiar código PIX
                  </Button>
                </div>
              )}

              {paymentDetails.barcode && (
                <div className="space-y-2">
                  <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                    {paymentDetails.barcode}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      navigator.clipboard.writeText(paymentDetails.barcode!)
                    }}
                  >
                    <Icons.copy className="mr-2 h-4 w-4" />
                    Copiar código de barras
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
      {actions && (
        <CardFooter className="flex flex-col space-y-2">
          {actions.primary && (
            <Button asChild className="w-full">
              <Link href={actions.primary.href}>
                {actions.primary.label}
              </Link>
            </Button>
          )}
          {actions.secondary && (
            <Button asChild variant="outline" className="w-full">
              <Link href={actions.secondary.href}>
                {actions.secondary.label}
              </Link>
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  )
}
