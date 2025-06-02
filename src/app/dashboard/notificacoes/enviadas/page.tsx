'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Search, 
  MessageSquare, 
  Mail, 
  Filter, 
  Download,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Tradução dos status para exibição
const statusLabels: Record<string, { label: string; variant: 'default' | 'success' | 'secondary' | 'destructive' | 'outline' }> = {
  'pending': { label: 'Pendente', variant: 'secondary' },
  'sending': { label: 'Enviando', variant: 'default' },
  'delivered': { label: 'Entregue', variant: 'success' },
  'failed': { label: 'Falhou', variant: 'destructive' },
  'cancelled': { label: 'Cancelado', variant: 'outline' }
};

// Ícones para os canais
const channelIcons: Record<string, React.ReactNode> = {
  'whatsapp': <MessageSquare className="h-4 w-4" />,
  'email': <Mail className="h-4 w-4" />
};

// Definindo o tipo para as notificações
interface Notification {
  id: string;
  type: string;
  recipient: string;
  channel: string;
  status: string;
  createdAt: string;
  attempts: number;
}

export default function NotificacoesEnviadasPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  
  const pageSize = 10;
  const totalPages = Math.ceil(filteredNotifications.length / pageSize);

  // Buscar dados reais da API
  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('/api/notifications/history');
        if (response.ok) {
          const data = await response.json();
          setNotifications(data.notifications || []);
          setTotalCount(data.totalCount || 0);
          setFilteredNotifications(data.notifications || []);
        } else {
          console.error('Erro ao buscar notificações:', await response.text());
          setNotifications([]);
          setFilteredNotifications([]);
        }
      } catch (error) {
        console.error('Erro ao buscar notificações:', error);
        setNotifications([]);
        setFilteredNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Função para aplicar os filtros
  const applyFilters = () => {
    let filtered = [...notifications];
    
    if (searchTerm) {
      filtered = filtered.filter(
        (notification) => 
          notification.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter) {
      filtered = filtered.filter(notification => notification.status === statusFilter);
    }
    
    if (channelFilter) {
      filtered = filtered.filter(notification => notification.channel === channelFilter);
    }
    
    if (typeFilter) {
      filtered = filtered.filter(notification => notification.type === typeFilter);
    }
    
    setFilteredNotifications(filtered);
    setPage(1);
  };

  // Função para resetar os filtros
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setChannelFilter('');
    setTypeFilter('');
    setFilteredNotifications(notifications);
    setPage(1);
  };

  // Função para atualizar os dados
  const refreshData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/notifications/history');
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
        setTotalCount(data.totalCount || 0);
        applyFilters(); // Reaplicar filtros aos novos dados
      }
    } catch (error) {
      console.error('Erro ao atualizar notificações:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para exportar os dados
  const exportData = () => {
    // Em uma implementação real, isso geraria um CSV/Excel
    alert('Exportando dados...');
  };

  // Dados paginados
  const paginatedNotifications = filteredNotifications.slice(
    (page - 1) * pageSize,
    page * pageSize
  );

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
            <h1 className="text-3xl font-bold tracking-tight">Histórico de Notificações</h1>
            <p className="text-muted-foreground">
              Visualize e gerencie todas as notificações enviadas
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="default" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Refine a lista de notificações usando os filtros abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por ID ou destinatário..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="sending">Enviando</SelectItem>
                <SelectItem value="delivered">Entregue</SelectItem>
                <SelectItem value="failed">Falhou</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Canais</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="PAYMENT_APPROVED">Pagamento Aprovado</SelectItem>
                <SelectItem value="PAYMENT_FAILED">Pagamento Falhou</SelectItem>
                <SelectItem value="REGISTRATION_APPROVED">Registro Aprovado</SelectItem>
                <SelectItem value="EVENT_REMINDER">Lembrete de Evento</SelectItem>
                <SelectItem value="MEMBERSHIP_EXPIRING">Filiação Expirando</SelectItem>
              </SelectContent>
            </Select>

            <div className="md:col-span-5 flex justify-end gap-2">
              <Button variant="outline" onClick={resetFilters}>
                Limpar Filtros
              </Button>
              <Button onClick={applyFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notificações Enviadas</CardTitle>
          <CardDescription>
            {filteredNotifications.length} notificações encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">Canal</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Destinatário</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tentativas</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                    <p>Carregando notificações...</p>
                  </TableCell>
                </TableRow>
              ) : paginatedNotifications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10">
                    <p>Nenhuma notificação encontrada.</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedNotifications.map((notification) => (
                  <TableRow key={notification.id}>
                    <TableCell>
                      <div className="flex justify-center">
                        {channelIcons[notification.channel]}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {notification.id}
                    </TableCell>
                    <TableCell>
                      {notification.type}
                    </TableCell>
                    <TableCell className="font-mono text-xs">
                      {notification.recipient}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[notification.status]?.variant || 'secondary'}>
                        {statusLabels[notification.status]?.label || notification.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(notification.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-center">
                      {notification.attempts}
                    </TableCell>
                    <TableCell className="text-right">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedNotification(notification)}
                          >
                            Detalhes
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalhes da Notificação</DialogTitle>
                            <DialogDescription>
                              Informações completas sobre a notificação
                            </DialogDescription>
                          </DialogHeader>
                          {selectedNotification && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">ID da Notificação</h4>
                                  <p className="font-mono">{selectedNotification.id}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Status</h4>
                                  <Badge variant={statusLabels[selectedNotification.status]?.variant || 'secondary'}>
                                    {statusLabels[selectedNotification.status]?.label || selectedNotification.status}
                                  </Badge>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Tipo</h4>
                                  <p>{selectedNotification.type}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Canal</h4>
                                  <div className="flex items-center gap-1">
                                    {channelIcons[selectedNotification.channel]}
                                    <span className="capitalize">{selectedNotification.channel}</span>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Destinatário</h4>
                                  <p className="font-mono">{selectedNotification.recipient}</p>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium text-muted-foreground">Data de Envio</h4>
                                  <p>{new Date(selectedNotification.createdAt).toLocaleString('pt-BR')}</p>
                                </div>
                                <div className="col-span-2">
                                  <h4 className="text-sm font-medium text-muted-foreground">Conteúdo da Mensagem</h4>
                                  <div className="bg-muted p-3 rounded-md mt-1">
                                    <p className="whitespace-pre-wrap">Olá! Sua inscrição no evento foi confirmada com sucesso. Agradecemos a participação! Para mais informações, acesse sua área do atleta.</p>
                                  </div>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-medium mb-2">Histórico de Tentativas</h4>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>#</TableHead>
                                      <TableHead>Timestamp</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Detalhes</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {Array.from({ length: selectedNotification.attempts }, (_, i) => {
                                      const isSuccess = i === selectedNotification.attempts - 1 
                                        ? selectedNotification.status === 'delivered' 
                                        : false;
                                      return (
                                        <TableRow key={`attempt-${i}`}>
                                          <TableCell>{i + 1}</TableCell>
                                          <TableCell>
                                            {new Date(
                                              new Date(selectedNotification.createdAt).getTime() + (i * 5 * 60 * 1000)
                                            ).toLocaleString('pt-BR')}
                                          </TableCell>
                                          <TableCell>
                                            <Badge variant={isSuccess ? 'success' : 'destructive'}>
                                              {isSuccess ? 'Sucesso' : 'Falha'}
                                            </Badge>
                                          </TableCell>
                                          <TableCell className="font-mono text-xs">
                                            {isSuccess 
                                              ? 'Mensagem entregue com sucesso' 
                                              : 'Falha na entrega: telefone indisponível'}
                                          </TableCell>
                                        </TableRow>
                                      );
                                    })}
                                  </TableBody>
                                </Table>
                              </div>

                              <div className="flex justify-end gap-2">
                                <Button variant="outline">Reenviar</Button>
                                <Button variant="default">Fechar</Button>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div className="mt-4">
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              onPageChange={(newPage) => setPage(newPage)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
