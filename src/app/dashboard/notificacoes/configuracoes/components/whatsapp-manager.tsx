'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, QrCode, Download } from 'lucide-react';
import { evolutionService, InstanceStatus } from '@/lib/whatsapp/evolution-service';

// QR Code Modal Component Inline
interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  qrCode: string;
}

function QRCodeModal({ isOpen, onClose, qrCode }: QRCodeModalProps) {
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

export function WhatsAppManager() {
  const [instances, setInstances] = useState<InstanceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [selectedQrCode, setSelectedQrCode] = useState<string | null>(null);
  const [statusChecks, setStatusChecks] = useState<Record<string, boolean>>({});

  // Carregar instâncias
  const loadInstances = async () => {
    try {
      setLoading(true);
      console.log('WhatsAppManager: Carregando instâncias...');
      
      // Testar conexão com a API
      const testResponse = await fetch('/api/whatsapp/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      const testData = await testResponse.json();
      console.log('WhatsAppManager: Teste de conexão:', testData);
      
      // Carregar instâncias normalmente
      const data = await evolutionService.listInstances();
      console.log('WhatsAppManager: Instâncias recebidas:', data);
      
      if (Array.isArray(data) && data.length > 0) {
        console.log('WhatsAppManager: Instâncias encontradas:', data.length);
        setInstances(data);
      } else {
        console.log('WhatsAppManager: Nenhuma instância encontrada ou formato inesperado');
        setInstances([]);
      }
    } catch (error) {
      console.error('WhatsAppManager: Erro ao carregar instâncias:', error);
      toast.error('Não foi possível carregar as instâncias');
    } finally {
      setLoading(false);
    }
  };

  // Carregar instâncias ao montar o componente
  useEffect(() => {
    loadInstances();
  }, []);

  // Criar nova instância
  const handleCreateInstance = async () => {
    if (!newInstanceName.trim()) {
      toast.error('Por favor, insira um nome para a instância');
      return;
    }

    // Verificar se já não existe uma instância com este nome
    if (instances.some(i => i.instanceName === newInstanceName)) {
      toast.error(`Já existe uma instância com o nome "${newInstanceName}"`);
      return;
    }

    try {
      setIsCreating(true);
      await evolutionService.createInstance(newInstanceName);
      toast.success('Instância criada com sucesso!');
      setNewInstanceName('');
      await loadInstances();
    } catch (error) {
      console.error('Erro ao criar instância:', error);
      toast.error(`Erro ao criar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsCreating(false);
    }
  };

  // Iniciar instância e mostrar QR Code
  const handleStartInstance = async (instanceName: string) => {
    try {
      setStatusChecks(prev => ({ ...prev, [instanceName]: true }));
      const result = await evolutionService.startInstance(instanceName);
      
      if (result.data?.qrcode?.base64) {
        setSelectedQrCode(result.data.qrcode.base64);
      } else {
        toast.info('Aguardando conexão...');
        // Verificar status periodicamente
        checkInstanceStatus(instanceName);
      }
    } catch (error) {
      console.error('Erro ao iniciar instância:', error);
      toast.error(`Erro ao iniciar instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setStatusChecks(prev => ({ ...prev, [instanceName]: false }));
    }
  };

  // Verificar status da instância
  const checkInstanceStatus = async (instanceName: string) => {
    try {
      const status = await evolutionService.getInstanceStatus(instanceName);
      
      if (status.instance.status === 'connected') {
        toast.success(`Instância ${instanceName} conectada com sucesso!`);
        await loadInstances();
        return;
      }
      
      // Se ainda não estiver conectado, verificar novamente após 2 segundos
      if (statusChecks[instanceName]) {
        setTimeout(() => checkInstanceStatus(instanceName), 2000);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    }
  };

  // Excluir instância
  const handleDeleteInstance = async (instanceName: string) => {
    if (!confirm(`Tem certeza que deseja excluir a instância ${instanceName}?`)) {
      return;
    }

    try {
      await evolutionService.deleteInstance(instanceName);
      toast.success('Instância excluída com sucesso!');
      await loadInstances();
    } catch (error) {
      console.error('Erro ao excluir instância:', error);
      toast.error(`Erro ao excluir instância: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  // Obter cor do status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-blue-500';
      case 'disconnected':
        return 'bg-amber-500';
      case 'qrcode':
        return 'bg-purple-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Obter texto do status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'disconnected':
        return 'Desconectado';
      case 'qrcode':
        return 'Aguardando QR Code';
      case 'error':
        return 'Erro de conexão';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Instância</CardTitle>
          <CardDescription>
            Crie uma nova instância do WhatsApp para enviar mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Digite um nome para a instância"
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleCreateInstance} disabled={isCreating}>
              {isCreating ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Instância
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Instâncias</CardTitle>
              <CardDescription>
                Gerencie suas instâncias do WhatsApp
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={loadInstances} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : instances.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma instância encontrada. Crie uma nova instância para começar.
            </div>
          ) : (
            <div className="space-y-4">
              {instances.map((instance) => (
                <div
                  key={instance.instance.instanceName}
                  className="border rounded-lg p-4 flex justify-between items-center"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(instance.instance.status)}`} />
                    <div>
                      <div className="font-medium">{instance.instance.instanceName}</div>
                      <div className="text-sm text-muted-foreground">
                        {getStatusText(instance.instance.status)}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {instance.instance.status === 'qrcode' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartInstance(instance.instance.instanceName)}
                        disabled={statusChecks[instance.instance.instanceName]}
                      >
                        {statusChecks[instance.instance.instanceName] ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <QrCode className="h-4 w-4 mr-2" />
                        )}
                        Mostrar QR Code
                      </Button>
                    )}
                    {instance.instance.status === 'disconnected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStartInstance(instance.instance.instanceName)}
                        disabled={statusChecks[instance.instance.instanceName]}
                      >
                        {statusChecks[instance.instance.instanceName] ? (
                          <>
                            <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                            Conectando...
                          </>
                        ) : (
                          'Conectar'
                        )}
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteInstance(instance.instance.instanceName)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <QRCodeModal
        isOpen={!!selectedQrCode}
        onClose={() => setSelectedQrCode(null)}
        qrCode={selectedQrCode || ''}
      />
    </div>
  );
}
