import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Configurações de Pagamento - FGC",
  description: "Configurações do sistema de pagamento da Federação Goiana de Ciclismo"
}

export default function PaymentSettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
