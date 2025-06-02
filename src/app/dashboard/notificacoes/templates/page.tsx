'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash, 
  Copy,
  Check,
  MessageSquare,
  Mail,
  Search,
  FileCheck
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Tipos de mensagem disponíveis
const messageTypes = [
  { id: 'PAYMENT_APPROVED', name: 'Pagamento Aprovado' },
  { id: 'PAYMENT_FAILED', name: 'Pagamento Falhou' },
  { id: 'REGISTRATION_APPROVED', name: 'Inscrição Aprovada' },
  { id: 'EVENT_REMINDER', name: 'Lembrete de Evento' },
  { id: 'MEMBERSHIP_EXPIRING', name: 'Filiação Expirando' },
  { id: 'GENERIC', name: 'Mensagem Genérica' },
  { id: 'WELCOME', name: 'Boas-vindas' },
  { id: 'BIRTHDAY', name: 'Aniversário' },
  { id: 'RESULTS', name: 'Resultados' },
];

// Dados de exemplo para templates
const mockTemplates = [
  {
    id: '1',
    name: 'Pagamento Aprovado',
    type: 'PAYMENT_APPROVED',
    channel: 'whatsapp',
    content: 'Olá {{nome}}, seu pagamento de R$ {{valor}} foi aprovado com sucesso! Comprovante disponível em sua área do atleta.',
    variables: ['nome', 'valor'],
    active: true,
    createdAt: '2025-03-15T10:30:00'
  },
  {
    id: '2',
    name: 'Inscrição Confirmada',
    type: 'REGISTRATION_APPROVED',
    channel: 'whatsapp',
    content: 'Olá {{nome}}, sua inscrição no evento {{evento}} foi confirmada! Detalhes disponíveis em sua área do atleta.',
    variables: ['nome', 'evento'],
    active: true,
    createdAt: '2025-03-17T14:45:00'
  },
  {
    id: '3',
    name: 'Lembrete de Evento',
    type: 'EVENT_REMINDER',
    channel: 'email',
    content: 'Olá {{nome}},\n\nEste é um lembrete para o evento {{evento}} que acontecerá em {{data}} às {{hora}}.\n\nLocal: {{local}}\n\nNão se esqueça de levar seus documentos e equipamentos.\n\nAtenciosamente,\nFederação Goiana de Ciclismo',
    variables: ['nome', 'evento', 'data', 'hora', 'local'],
    active: true,
    createdAt: '2025-03-20T09:15:00'
  },
  {
    id: '4',
    name: 'Filiação Expirando',
    type: 'MEMBERSHIP_EXPIRING',
    channel: 'whatsapp',
    content: 'Olá {{nome}}, sua filiação expira em {{dias}} dias. Renove agora para continuar aproveitando todos os benefícios!',
    variables: ['nome', 'dias'],
    active: true,
    createdAt: '2025-03-22T11:00:00'
  },
  {
    id: '5',
    name: 'Pagamento Falhou',
    type: 'PAYMENT_FAILED',
    channel: 'whatsapp',
    content: 'Olá {{nome}}, identificamos um problema com seu pagamento de R$ {{valor}}. Por favor, verifique os dados e tente novamente.',
    variables: ['nome', 'valor'],
    active: true,
    createdAt: '2025-03-25T16:20:00'
  }
];

export default function TemplatesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [templates, setTemplates] = useState(mockTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [channelFilter, setChannelFilter] = useState('all');
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    type: '',
    channel: '',
    content: '',
    active: true
  });
  
  // Verificar autorização
  const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';
  
  useEffect(() => {
    // Redirecionar se não estiver autenticado
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }
    
    // Carregar templates do backend
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/notifications/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error('Erro ao buscar templates:', error);
      }
    };
    
    fetchTemplates();
  }, [status, router]);
  
  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesChannel = channelFilter === 'all' || template.channel === channelFilter;
    
    return matchesSearch && matchesChannel;
  });

  // Manipular abertura do modal (editar ou criar)
  const handleOpenModal = (template: any = null, isEdit = false) => {
    if (isAdmin) {
      if (template) {
        setFormData({
          id: template.id,
          name: template.name,
          type: template.type,
          channel: template.channel,
          content: template.content,
          active: template.active
        });
        setSelectedTemplate(template);
      } else {
        setFormData({
          id: '',
          name: '',
          type: '',
          channel: '',
          content: '',
          active: true
        });
        setSelectedTemplate(null);
      }
      
      setIsEditMode(isEdit);
      setIsDialogOpen(true);
    }
  };

  // Salvar template (criar ou editar)
  const handleSaveTemplate = () => {
    if (isAdmin) {
      if (isEditMode && selectedTemplate) {
        // Editar template existente
        setTemplates(
          templates.map(t => 
            t.id === selectedTemplate.id ? { 
              ...t, 
              ...formData, 
              variables: extractVariables(formData.content) 
            } : t
          )
        );
      } else {
        // Criar novo template
        const newTemplate = {
          ...formData,
          id: `${templates.length + 1}`,
          variables: extractVariables(formData.content),
          createdAt: new Date().toISOString()
        };
        setTemplates([...templates, newTemplate]);
      }
      
      setIsDialogOpen(false);
    }
  };

  // Excluir template
  const handleDeleteTemplate = () => {
    if (isAdmin) {
      if (selectedTemplate) {
        setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
        setIsDeleteDialogOpen(false);
      }
    }
  };

  // Duplicar template
  const handleDuplicateTemplate = (template: any) => {
    if (isAdmin) {
      const newTemplate = {
        ...template,
        id: `${templates.length + 1}`,
        name: `${template.name} (Cópia)`,
        createdAt: new Date().toISOString()
      };
      setTemplates([...templates, newTemplate]);
    }
  };

  // Extrair variáveis do conteúdo (formato {{variavel}})
  const extractVariables = (content: string) => {
    const matches = content.match(/\{\{([^}]+)\}\}/g) || [];
    return matches.map(match => match.replace(/\{\{|\}\}/g, ''));
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
            <h1 className="text-3xl font-bold tracking-tight">Templates de Notificação</h1>
            <p className="text-muted-foreground">
              Crie e gerencie modelos para envio de notificações
            </p>
          </div>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenModal(null)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Template
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>
            Refine a lista de templates usando os filtros abaixo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou tipo..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Templates Disponíveis</CardTitle>
          <CardDescription>
            {filteredTemplates.length} templates encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="grid" className="w-full">
            <TabsList className="grid w-full max-w-xs grid-cols-2">
              <TabsTrigger value="grid">Cartões</TabsTrigger>
              <TabsTrigger value="table">Tabela</TabsTrigger>
            </TabsList>
            
            <TabsContent value="grid" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className={`overflow-hidden ${!template.active ? 'opacity-60' : ''}`}>
                    <CardHeader className="border-b bg-muted/40 px-5 py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {template.channel === 'whatsapp' ? (
                            <MessageSquare className="h-4 w-4 text-green-500" />
                          ) : (
                            <Mail className="h-4 w-4 text-blue-500" />
                          )}
                          <CardTitle className="text-base font-semibold">
                            {template.name}
                          </CardTitle>
                        </div>
                        <div className="flex items-center">
                          {template.active ? (
                            <Badge variant="success" className="text-xs">Ativo</Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">Inativo</Badge>
                          )}
                        </div>
                      </div>
                      <CardDescription>{template.type}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="max-h-32 overflow-hidden text-ellipsis">
                        <p className="whitespace-pre-wrap text-sm">
                          {template.content}
                        </p>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-1">
                        {template.variables.map((variable) => (
                          <Badge key={variable} variant="outline" className="text-xs">
                            {`{{${variable}}}`}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <div className="border-t bg-muted/40 p-3 flex justify-end gap-2">
                      {isAdmin && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedTemplate(template);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDuplicateTemplate(template)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleOpenModal(template, true)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
              
              {filteredTemplates.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <FileCheck className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold">Nenhum template encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou crie um novo template
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="table">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Canal</TableHead>
                      <TableHead>Variáveis</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Criado em</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTemplates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          Nenhum template encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredTemplates.map((template) => (
                        <TableRow key={template.id}>
                          <TableCell className="font-medium">
                            {template.name}
                          </TableCell>
                          <TableCell>{template.type}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {template.channel === 'whatsapp' ? (
                                <MessageSquare className="h-4 w-4 text-green-500" />
                              ) : (
                                <Mail className="h-4 w-4 text-blue-500" />
                              )}
                              <span className="capitalize">
                                {template.channel}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {template.variables.slice(0, 3).map((variable) => (
                                <Badge 
                                  key={variable} 
                                  variant="outline" 
                                  className="text-xs"
                                >
                                  {variable}
                                </Badge>
                              ))}
                              {template.variables.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{template.variables.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {template.active ? (
                              <Badge variant="success">Ativo</Badge>
                            ) : (
                              <Badge variant="outline">Inativo</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {isAdmin && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedTemplate(template);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleDuplicateTemplate(template)}
                                  >
                                    <Copy className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => handleOpenModal(template, true)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Diálogo para Criar/Editar Template */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Template' : 'Novo Template'}
            </DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? 'Atualize os dados do template de notificação' 
                : 'Preencha os dados para criar um novo template'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome do Template</Label>
                <Input
                  id="name"
                  placeholder="Ex: Confirmação de Pagamento"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type">Tipo de Notificação</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {messageTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="channel">Canal</Label>
                <Select
                  value={formData.channel}
                  onValueChange={(value) => setFormData({ ...formData, channel: value })}
                >
                  <SelectTrigger id="channel">
                    <SelectValue placeholder="Selecione o canal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 flex items-center justify-between">
                <Label htmlFor="active">Status do Template</Label>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, active: checked })
                    }
                  />
                  <Label htmlFor="active" className="font-normal">
                    {formData.active ? 'Ativo' : 'Inativo'}
                  </Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="content">Conteúdo</Label>
              <Textarea
                id="content"
                placeholder="Digite o conteúdo da mensagem aqui. Use {{variavel}} para campos dinâmicos."
                className="min-h-[200px]"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Use chaves duplas para variáveis (Ex: {'{{'}'nome{'}}'}, {'{{'}'valor{'}}'}). Essas variáveis serão substituídas pelos valores correspondentes ao enviar a mensagem.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label>Variáveis Detectadas</Label>
              <div className="flex flex-wrap gap-2 rounded-md border p-2 min-h-[40px]">
                {extractVariables(formData.content).map((variable) => (
                  <Badge key={variable} variant="secondary">
                    {variable}
                  </Badge>
                ))}
                {extractVariables(formData.content).length === 0 && (
                  <p className="text-sm text-muted-foreground px-2">
                    Nenhuma variável detectada
                  </p>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" onClick={handleSaveTemplate}>
              {isEditMode ? 'Atualizar Template' : 'Criar Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação para Excluir */}
      <AlertDialog 
        open={isDeleteDialogOpen} 
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Template?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o template{' '}
              <span className="font-medium">{selectedTemplate?.name}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTemplate}
              className="bg-red-600 hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Componente auxiliar para Label
const Label = ({ htmlFor, children, className = "" }) => {
  return (
    <label 
      htmlFor={htmlFor} 
      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}
    >
      {children}
    </label>
  );
};
