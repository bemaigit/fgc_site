'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  Smartphone, 
  Mail, 
  Sliders, 
  Server,
  RefreshCw,
  Globe,
  Shield,
  Check,
  AlertCircle,
  AlertTriangle,
  MessageSquare,
  Settings
} from 'lucide-react';
import { WhatsAppManager } from './components/whatsapp-manager';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

export default function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  
  // Estado para armazenar configurações reais
  const [config, setConfig] = useState({
    whatsapp: {
      enabled: false,
      provider: 'meow',
      apiUrl: '',
      apiKey: '',
      instanceName: '',
      webhookEnabled: false,
      webhookUrl: '',
      status: 'disconnected',
      phoneNumber: '',
      connectionState: 'unknown'
    },
    email: {
      enabled: false,
      provider: 'smtp',
      host: '',
      port: 587,
      user: '',
      password: '********',
      fromName: '',
      fromEmail: '',
      status: 'disconnected'
    },
    general: {
      defaultChannel: 'whatsapp',
      maxRetries: 3,
      retryInterval: 300,
      batchSize: 50,
      batchDelay: 5,
      logRetention: 30
    }
  });

  // Função para carregar configurações da API
  const loadConfigs = async () => {
    try {
      const response = await fetch('/api/notifications/configs');
      if (!response.ok) {
        throw new Error('Erro ao carregar configurações');
      }
      
      const data = await response.json();
      setConfig(data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      setSaveError('Não foi possível carregar as configurações.');
    }
  };

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadConfigs();
  }, []);

  // Atualiza as configurações do WhatsApp
  const handleWhatsAppConfigChange = (field: string, value: any) => {
    setConfig({
      ...config,
      whatsapp: {
        ...config.whatsapp,
        [field]: value
      }
    });
  };

  // Atualiza as configurações de Email
  const handleEmailConfigChange = (field: string, value: any) => {
    setConfig({
      ...config,
      email: {
        ...config.email,
        [field]: value
      }
    });
  };

  // Atualiza configurações gerais
  const handleGeneralConfigChange = (field: string, value: any) => {
    setConfig({
      ...config,
      general: {
        ...config.general,
        [field]: value
      }
    });
  };

  // Salvar configurações
  const handleSaveConfig = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      const response = await fetch('/api/notifications/configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar configurações');
      }
      
      setSaveSuccess(true);
      
      // Recarregar configurações para garantir consistência
      await loadConfigs();
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      setSaveError(error.message || 'Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  // Verificar status do WhatsApp
  const checkWhatsAppStatus = async () => {
    setIsCheckingStatus(true);
    
    try {
      const response = await fetch('/api/notifications/whatsapp/status');
      if (!response.ok) {
        throw new Error('Erro ao verificar status');
      }
      
      const data = await response.json();
      
      // Atualizar o estado com as informações recebidas
      setConfig({
        ...config,
        whatsapp: {
          ...config.whatsapp,
          status: data.connected ? 'connected' : 'disconnected',
          phoneNumber: data.phoneNumber || '',
          connectionState: data.state || 'unknown'
        }
      });
    } catch (error) {
      console.error('Erro ao verificar status:', error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notificacoes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configurações de Notificação</h1>
            <p className="text-muted-foreground">
              Configure os canais e parâmetros do sistema de notificações
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant={saveSuccess ? "default" : "default"} 
            onClick={handleSaveConfig}
            disabled={isSaving}
            className={saveSuccess ? "bg-green-600 hover:bg-green-700" : ""}
          >
            {saveSuccess ? (
              <>
                <Check className="mr-2 h-4 w-4" />
                Salvo!
              </>
            ) : isSaving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Configurações
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="whatsapp" className="space-y-6">
        <TabsList className="w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="whatsapp" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <Smartphone className="mr-2 h-4 w-4" />
            WhatsApp
          </TabsTrigger>
          <TabsTrigger value="email" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <Mail className="mr-2 h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="general" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <Sliders className="mr-2 h-4 w-4" />
            Configurações Gerais
          </TabsTrigger>
        </TabsList>
        
        {/* Configurações do WhatsApp - Agora usando Evolution API */}
        <TabsContent value="whatsapp" className="space-y-4">
          <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-emerald-800">Configurações do WhatsApp</CardTitle>
                  <CardDescription className="text-emerald-700/80">
                    Configure e gerencie suas instâncias do WhatsApp para envio de notificações
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="whatsapp-enabled"
                      checked={config.whatsapp.enabled}
                      onCheckedChange={(checked) => 
                        handleWhatsAppConfigChange('enabled', checked)
                      }
                    />
                    <Label htmlFor="whatsapp-enabled" className="font-medium">
                      {config.whatsapp.enabled ? 'Ativado' : 'Desativado'}
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Integração do WhatsApp Manager */}
              <WhatsAppManager />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Configurações do Email */}
        <TabsContent value="email" className="space-y-4">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-none shadow-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-blue-800">Configurações de Email</CardTitle>
                  <CardDescription className="text-blue-700/80">
                    Configure a integração com serviço de email para notificações
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="email-enabled"
                      checked={config.email.enabled}
                      onCheckedChange={(checked) => 
                        handleEmailConfigChange('enabled', checked)
                      }
                    />
                    <Label htmlFor="email-enabled" className="font-medium">
                      {config.email.enabled ? 'Ativado' : 'Desativado'}
                    </Label>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status da Conexão */}
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <StatusIndicator status={config.email.status} />
                    <div>
                      <h3 className="font-medium">Status da Conexão</h3>
                      <p className="text-sm text-muted-foreground">
                        {config.email.status === 'connected'
                          ? `Conectado ao serviço de email`
                          : config.email.status === 'disconnected'
                          ? 'Desconectado'
                          : 'Erro de conexão'}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Verificar Conexão
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                    >
                      Enviar Teste
                    </Button>
                  </div>
                </div>
              </div>

              {/* Configuração do Provedor */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Provedor</Label>
                  <Select
                    value={config.email.provider}
                    onValueChange={(value) => handleEmailConfigChange('provider', value)}
                  >
                    <SelectTrigger id="email-provider">
                      <SelectValue placeholder="Selecione o provedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="smtp">SMTP</SelectItem>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="mailgun">Mailgun</SelectItem>
                      <SelectItem value="ses">Amazon SES</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-port">Porta</Label>
                  <Input
                    id="email-port"
                    type="number"
                    value={config.email.port}
                    onChange={(e) => handleEmailConfigChange('port', parseInt(e.target.value))}
                  />
                </div>
              </div>

              {/* Configuração do Servidor */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email-host">Servidor SMTP</Label>
                  <Input
                    id="email-host"
                    value={config.email.host}
                    onChange={(e) => handleEmailConfigChange('host', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-user">Usuário</Label>
                  <Input
                    id="email-user"
                    value={config.email.user}
                    onChange={(e) => handleEmailConfigChange('user', e.target.value)}
                  />
                </div>
              </div>

              {/* Configuração de Senha */}
              <div className="space-y-2">
                <Label htmlFor="email-password">Senha</Label>
                <Input
                  id="email-password"
                  type="password"
                  value={config.email.password}
                  onChange={(e) => handleEmailConfigChange('password', e.target.value)}
                />
              </div>

              {/* Configuração de Remetente */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email-from-name">Nome do Remetente</Label>
                  <Input
                    id="email-from-name"
                    value={config.email.fromName}
                    onChange={(e) => handleEmailConfigChange('fromName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email-from-email">Email do Remetente</Label>
                  <Input
                    id="email-from-email"
                    type="email"
                    value={config.email.fromEmail}
                    onChange={(e) => handleEmailConfigChange('fromEmail', e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações Gerais */}
        <TabsContent value="general" className="space-y-4">
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-amber-800">Configurações Gerais</CardTitle>
              <CardDescription className="text-amber-700/80">
                Configure parâmetros globais do sistema de notificações
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Canal Padrão */}
              <div className="space-y-2">
                <Label htmlFor="default-channel">Canal Padrão</Label>
                <Select
                  value={config.general.defaultChannel}
                  onValueChange={(value) => handleGeneralConfigChange('defaultChannel', value)}
                >
                  <SelectTrigger id="default-channel">
                    <SelectValue placeholder="Selecione o canal padrão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Canal utilizado quando não for especificado outro canal
                </p>
              </div>

              {/* Configurações de Retry */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="max-retries">Número Máximo de Retentativas</Label>
                  <Input
                    id="max-retries"
                    type="number"
                    min="0"
                    max="10"
                    value={config.general.maxRetries}
                    onChange={(e) => handleGeneralConfigChange('maxRetries', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número de vezes que o sistema tentará reenviar mensagens com falha
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retry-interval">Intervalo Entre Retentativas (segundos)</Label>
                  <Input
                    id="retry-interval"
                    type="number"
                    min="30"
                    max="3600"
                    value={config.general.retryInterval}
                    onChange={(e) => handleGeneralConfigChange('retryInterval', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de espera antes de tentar enviar novamente uma mensagem com falha
                  </p>
                </div>
              </div>

              {/* Configurações de Lote */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="batch-size">Tamanho do Lote</Label>
                  <Input
                    id="batch-size"
                    type="number"
                    min="10"
                    max="500"
                    value={config.general.batchSize}
                    onChange={(e) => handleGeneralConfigChange('batchSize', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Número máximo de mensagens processadas em um lote
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="batch-delay">Atraso Entre Mensagens (segundos)</Label>
                  <Input
                    id="batch-delay"
                    type="number"
                    min="1"
                    max="60"
                    value={config.general.batchDelay}
                    onChange={(e) => handleGeneralConfigChange('batchDelay', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tempo de espera entre o envio de mensagens em um lote
                  </p>
                </div>
              </div>

              {/* Retenção de Logs */}
              <div className="space-y-2">
                <Label htmlFor="log-retention">Retenção de Logs (dias)</Label>
                <Input
                  id="log-retention"
                  type="number"
                  min="1"
                  max="365"
                  value={config.general.logRetention}
                  onChange={(e) => handleGeneralConfigChange('logRetention', parseInt(e.target.value))}
                />
                <p className="text-sm text-muted-foreground">
                  Período que os logs de notificações serão mantidos no sistema
                </p>
              </div>

              {/* Informações de Sistema */}
              <div className="rounded-lg border p-4 space-y-4">
                <h3 className="font-medium">Informações do Sistema</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Redis Status:</p>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Conectado</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Banco de Dados:</p>
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span>Conectado</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Versão da API:</p>
                    <span>1.0.0</span>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Última Sincronização:</p>
                    <span>{new Date().toLocaleString('pt-BR')}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Componente para indicador de status
function StatusIndicator({ status }: { status: string }) {
  let bgColor = 'bg-gray-500';
  
  if (status === 'connected') {
    bgColor = 'bg-green-500';
  } else if (status === 'error') {
    bgColor = 'bg-red-500';
  } else if (status === 'disconnected') {
    bgColor = 'bg-amber-500';
  }
  
  return (
    <div className={`h-3 w-3 rounded-full ${bgColor}`}></div>
  );
};
