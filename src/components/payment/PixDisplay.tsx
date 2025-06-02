// Placeholder for PixDisplay component
import React from 'react';
import { PaymentStatus } from '@prisma/client';

interface PixDisplayProps {
  qrCode: string;
  amount: number;
  status: PaymentStatus | null;
}

const PixDisplay: React.FC<PixDisplayProps> = ({ qrCode, amount, status }) => {
  // TODO: Implement actual UI with QR code image, copy button, status updates
  return (
    <div className="p-4 border rounded-md text-center space-y-4">
      <h3 className="text-lg font-semibold">Pague com PIX</h3>
      <p>Escaneie o QR Code abaixo ou copie o código:</p>
      {/* Placeholder for QR Code image */}
      <div className="w-40 h-40 bg-gray-200 mx-auto flex items-center justify-center text-sm text-gray-500">
        [QR Code Image]
      </div>
      <textarea 
        readOnly 
        value={qrCode} 
        className="w-full p-2 border rounded text-xs bg-gray-100 h-24 resize-none"
      />
      <button 
        onClick={() => navigator.clipboard.writeText(qrCode)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Copiar Código PIX
      </button>
      {status && <p className="mt-4">Status: <strong>{status}</strong></p>}
      <p className="text-xs text-gray-500">Aguardando confirmação do pagamento...</p>
    </div>
  );
};

export default PixDisplay;
