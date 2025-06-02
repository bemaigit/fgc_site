'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useEffect, useState } from 'react';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
}

export function QRCodeModal({ isOpen, onClose, qrCode }: QRCodeModalProps) {
  const [isClient, setIsClient] = useState(false);

  // Garantir que o componente seja renderizado apenas no cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleDownload = () => {
    if (!qrCode) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrCode}`;
    link.download = 'whatsapp-qrcode.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isClient) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Conectar WhatsApp</DialogTitle>
          <DialogDescription>
            Escaneie o QR Code com o aplicativo do WhatsApp para conectar sua conta.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col items-center justify-center space-y-4 py-4">
          {qrCode ? (
            <div className="p-4 bg-white rounded-lg">
              <img 
                src={`data:image/png;base64,${qrCode}`} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64 object-contain"
              />
            </div>
          ) : (
            <div className="w-64 h-64 flex items-center justify-center bg-muted rounded-lg">
              <p className="text-muted-foreground text-center p-4">
                Gerando QR Code...
              </p>
            </div>
          )}
          
          <div className="text-sm text-muted-foreground text-center">
            <p>1. Abra o WhatsApp no seu celular</p>
            <p>2. Toque em <strong>Menu</strong> ou <strong>Configurações</strong> e selecione <strong>Aparelhos conectados</strong></p>
            <p>3. Toque em <strong>Conectar um aparelho</strong></p>
            <p>4. Aponte a câmera para o QR Code</p>
          </div>
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Baixar QR Code
            </Button>
            <Button onClick={onClose}>Já escaneei o código</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
