import { TestGatewayResponse } from "@/types/gateway"

interface SuccessToastProps {
  data: TestGatewayResponse
}

interface ErrorToastProps {
  error: Error
}

export function SuccessToast({ data }: SuccessToastProps) {
  return (
    <div className="space-y-2 pt-2">
      <div className="text-green-600 font-medium">✓ Gateway testado com sucesso</div>
      
      <div className="text-sm space-y-1 mt-2">
        <div>ID da Transação: <span className="font-mono">{data.testTransactionId}</span></div>
        <div>Status: <span className="font-medium">{data.details.status}</span></div>
        <div>Valor: <span className="font-medium">R$ {data.details.amount.toFixed(2)}</span></div>
        <div>Provider: <span className="font-medium">{data.details.provider}</span></div>
      </div>

      {data.details.paymentUrl && (
        <div className="mt-2">
          <a 
            href={data.details.paymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-700 text-sm flex items-center"
          >
            Ver página de pagamento
            <svg 
              className="w-4 h-4 ml-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" 
              />
            </svg>
          </a>
        </div>
      )}

      {data.details.qrCode && (
        <div className="mt-2 text-sm text-green-600">
          ✓ QR Code PIX gerado com sucesso
        </div>
      )}

      <div className="text-xs text-gray-500 mt-2">
        Essa é uma transação de teste e não será cobrada.
      </div>
    </div>
  )
}

export function ErrorToast({ error }: ErrorToastProps) {
  return (
    <div className="space-y-2 pt-2">
      <div className="text-red-600">✕ Falha ao testar o gateway</div>
      <div className="text-sm text-gray-700">
        {error.message || "Erro ao testar gateway"}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        Verifique as credenciais e configurações do gateway.
      </div>
    </div>
  )
}