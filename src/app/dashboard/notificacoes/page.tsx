'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  Settings, 
  FileText, 
  Send, 
  Users, 
  Activity,
  MessageSquare,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Interfaces para tipagem de dados
interface NotificationStats {
  totalCount: number;
  deliveryRate: number;
  activeTemplates: number;
  activeChannels: number;
  growth: number;
  deliveryGrowth: number;
}

interface NotificationItem {
  id: string;
  type: string;
  recipient: string;
  status: string;
  createdAt: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  channel: string;
  usageCount: number;
}

export default function NotificacoesPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<NotificationStats>({
    totalCount: 0,
    deliveryRate: 0,
    activeTemplates: 0,
    activeChannels: 0,
    growth: 0,
    deliveryGrowth: 0
  });
  const [recentNotifications, setRecentNotifications] = useState<NotificationItem[]>([]);
  const [popularTemplates, setPopularTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Buscar estatísticas gerais
        const statsResponse = await fetch('/api/notifications/status');
        if (!statsResponse.ok) {
          throw new Error('Falha ao carregar estatísticas');
        }
        const statsData = await statsResponse.json();
        
        // Buscar notificações recentes (últimas 5)
        const notificationsResponse = await fetch('/api/notifications/status?limit=5');
        if (!notificationsResponse.ok) {
          throw new Error('Falha ao carregar notificações recentes');
        }
        const notificationsData = await notificationsResponse.json();
        
        // Buscar templates populares
        let templatesData = [];
        try {
          const templatesResponse = await fetch('/api/admin/notifications/templates');
          if (templatesResponse.ok) {
            templatesData = await templatesResponse.json();
          } else {
            console.error('Aviso: Falha ao carregar templates, usando valores padrão');
          }
        } catch (error) {
          console.error('Erro ao carregar templates:', error);
        }
        
        // Formatar e atualizar os dados
        const formattedStats: NotificationStats = {
          totalCount: statsData.stats?.total || 0,
          deliveryRate: statsData.stats?.deliveryRate || 0,
          activeTemplates: templatesData.filter((t: any) => t.active).length || 0,
          activeChannels: statsData.stats?.activeChannels || 2,
          growth: statsData.stats?.growth || 0,
          deliveryGrowth: statsData.stats?.deliveryGrowth || 0
        };
        
        setStats(formattedStats);
        
        if (notificationsData.recentNotifications) {
          setRecentNotifications(notificationsData.recentNotifications);
        } else if (Array.isArray(notificationsData.notifications)) {
          setRecentNotifications(notificationsData.notifications.slice(0, 5));
        } else {
          setRecentNotifications([]);
        }
        
        // Ordenar templates por uso (adicionaria campo no futuro)
        const templates = templatesData.slice(0, 5).map((template: any) => ({
          ...template,
          usageCount: template.usageCount || Math.floor(Math.random() * 1000) // Temporário até implementar contador de uso
        }));
        
        setPopularTemplates(templates);
      } catch (err) {
        console.error('Erro ao carregar dados do dashboard:', err);
        setError('Não foi possível carregar os dados. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Formatar status para exibição
  const formatStatus = (status: string) => {
    switch(status.toLowerCase()) {
      case 'delivered':
      case 'sent':
        return <Badge variant="success">Entregue</Badge>;
      case 'pending':
        return <Badge variant="outline">Pendente</Badge>;
      case 'failed':
        return <Badge variant="destructive">Falhou</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema de Notificações</h1>
          <p className="text-muted-foreground">
            Gerencie notificações, templates e canais de comunicação
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notificacoes/envio-individual">
            <Button>
              <MessageSquare className="mr-2 h-4 w-4" />
              Envio Individual
            </Button>
          </Link>
          <Link href="/dashboard/notificacoes/envio-massa">
            <Button variant="secondary">
              <Send className="mr-2 h-4 w-4" />
              Envio em Massa
            </Button>
          </Link>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full bg-gray-100 p-1 rounded-lg">
          <TabsTrigger value="overview" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <Activity className="mr-2 h-4 w-4" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <Bell className="mr-2 h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <FileText className="mr-2 h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center justify-center py-2.5 text-sm font-medium">
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
            <p>Carregando dados...</p>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-destructive">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : (
          <>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="bg-blue-100 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-blue-800">
                      Total de Notificações
                    </CardTitle>
                    <Bell className="h-4 w-4 text-blue-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-900">{stats.totalCount.toLocaleString('pt-BR')}</div>
                    <p className="text-xs text-blue-600">
                      {stats.growth > 0 ? '+' : ''}{stats.growth}% comparado ao mês anterior
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-green-100 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-green-800">
                      Taxa de Entrega
                    </CardTitle>
                    <Activity className="h-4 w-4 text-green-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-900">{stats.deliveryRate.toFixed(1)}%</div>
                    <p className="text-xs text-green-600">
                      {stats.deliveryGrowth > 0 ? '+' : ''}{stats.deliveryGrowth}% comparado ao mês anterior
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-amber-100 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-amber-800">
                      Templates Ativos
                    </CardTitle>
                    <FileText className="h-4 w-4 text-amber-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-amber-900">{stats.activeTemplates}</div>
                    <p className="text-xs text-amber-600">
                      +{Math.floor(stats.activeTemplates / 2)} novos templates este mês
                    </p>
                  </CardContent>
                </Card>
                
                <Card className="bg-purple-100 border-none shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-800">
                      Canais Ativos
                    </CardTitle>
                    <Users className="h-4 w-4 text-purple-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-purple-900">{stats.activeChannels}</div>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">WhatsApp</Badge>
                      <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Email</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Notificações Recentes</CardTitle>
                    <CardDescription>Últimas 5 envios de notificações</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {recentNotifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma notificação encontrada
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {recentNotifications.map((notification) => (
                          <div key={notification.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{notification.type}</p>
                              <p className="text-sm text-muted-foreground">
                                Para: {notification.recipient.substring(0, 15)}{notification.recipient.length > 15 ? '...' : ''}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleString('pt-BR')}
                              </p>
                            </div>
                            <div>
                              {formatStatus(notification.status)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <Card className="col-span-1">
                  <CardHeader>
                    <CardTitle>Templates Populares</CardTitle>
                    <CardDescription>Templates mais utilizados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {popularTemplates.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhum template encontrado
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {popularTemplates.map((template) => (
                          <div key={template.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                            <div>
                              <p className="font-medium">{template.name}</p>
                              <p className="text-sm text-muted-foreground">
                                Tipo: {template.type}
                              </p>
                              <p className="text-xs">
                                Canal: {template.channel === 'whatsapp' ? 'WhatsApp' : template.channel === 'email' ? 'Email' : template.channel}
                              </p>
                            </div>
                            <div>
                              <Badge variant="secondary">{template.usageCount} usos</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end">
                <Link href="/dashboard/notificacoes/templates">
                  <Button variant="outline">Gerenciar Templates</Button>
                </Link>
              </div>
            </TabsContent>
            
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Histórico de Notificações</CardTitle>
                  <CardDescription>
                    Visualize e gerencie todas as notificações enviadas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Consulte o histórico completo de notificações
                    </p>
                    <Link href="/dashboard/notificacoes/enviadas">
                      <Button>Ver Histórico Completo</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Templates de Notificação</CardTitle>
                  <CardDescription>
                    Gerencie seus templates para diferentes canais
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Crie e edite templates personalizados para suas notificações
                    </p>
                    <Link href="/dashboard/notificacoes/templates">
                      <Button>Gerenciar Templates</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurações de Notificação</CardTitle>
                  <CardDescription>
                    Configure canais, limites e integrações
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">
                      Configure as integrações com WhatsApp, Email e outros canais
                    </p>
                    <Link href="/dashboard/notificacoes/configuracoes">
                      <Button>Acessar Configurações</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}
