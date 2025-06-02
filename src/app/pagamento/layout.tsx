import { Metadata } from "next"
import { Header } from "@/components/header"
import { PaymentFooter } from "@/components/payment-footer"

export const metadata: Metadata = {
  title: "Pagamento - Federação Goiana de Ciclismo",
  description: "Status do pagamento",
}

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">
        <main className="flex-1">{children}</main>
      </div>
      <PaymentFooter />
    </div>
  )
}
