// Placeholder for BoletoDisplay component
import React from 'react';
import { PaymentStatus } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';

interface BoletoDisplayProps {
  url: string;
  amount: number;
  status: PaymentStatus | null;
}

const BoletoDisplay: React.FC<BoletoDisplayProps> = ({ url, amount, status }) => {
  // TODO: Implement actual UI with link/button to view/download boleto, status updates
  return (
    <div className="p-4 border rounded-md text-center space-y-4">
      <h3 className="text-lg font-semibold">Pague com Boleto</h3>
      <p>Valor: {formatCurrency(amount)}</p>
      <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer"
      >
        <Button className="w-full">
            Visualizar / Imprimir Boleto
        </Button>
      </a>
      <p className="text-xs text-gray-500">O pagamento do boleto pode levar até 3 dias úteis para ser confirmado.</p>
      {status && <p className="mt-4">Status: <strong>{status}</strong></p>}
      {status === 'PENDING' && <p className="text-xs text-gray-500">Aguardando confirmação do pagamento...</p>} 
    </div>
  );
};

export default BoletoDisplay;
