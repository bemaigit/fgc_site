"use client"

import { GatewayList } from "./components/GatewayList"

export default function PaymentSettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-2">
          Configurações de Pagamento
        </h1>
        <p className="text-sm text-muted-foreground">
          Gerencie os gateways e configurações de pagamento
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <GatewayList />
      </div>
    </div>
  )
}
