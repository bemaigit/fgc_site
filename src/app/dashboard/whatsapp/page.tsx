'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Plus, RefreshCw, Trash2, QrCode } from 'lucide-react';
import { evolutionService, InstanceStatus } from '@/lib/whatsapp/evolution-service';
import { QRCodeModal } from '@/app/dashboard/whatsapp/components/qr-code-modal';

export default function WhatsAppManager() {
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
      const data = await evolutionService.listInstances();
      setInstances(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error);
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
      case 'qrcode':
        return 'bg-yellow-500';
      case 'disconnected':
      case 'auth_error':
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
      case 'qrcode':
        return 'Aguardando QR Code';
      case 'disconnected':
        return 'Desconectado';
      case 'auth_error':
        return 'Erro de autenticação';
      default:
        return status;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gerenciador de WhatsApp</h1>
        <p className="text-muted-foreground">
          Gerencie suas instâncias do WhatsApp para envio de notificações
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Nova Instância</CardTitle>
          <CardDescription>
            Crie uma nova instância do WhatsApp para enviar mensagens
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="instanceName" className="sr-only">
                Nome da Instância
              </Label>
              <Input
                id="instanceName"
                placeholder="Digite um nome para a instância"
                value={newInstanceName}
                onChange={(e) => setNewInstanceName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateInstance()}
              />
            </div>
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
