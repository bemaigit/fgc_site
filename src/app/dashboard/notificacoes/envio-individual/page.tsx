'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Send, 
  Users,
  MessageSquare, 
  Mail, 
  Check,
  AlertCircle,
  Image,
  FileText,
  Phone,
  Search,
  Loader2
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
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
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

// Dados de exemplo de destinatários
interface Recipient {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  club: string;
  avatar?: string;
}

interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
  channel: string;
}

// Interface para variáveis de template
interface TemplateVariables {
  [key: string]: string | number | boolean | undefined | readonly string[];
}

// Interface para anexo de mídia
interface MediaAttachment {
  url?: string;
  type?: string;
  name?: string;
}

export default function EnvioIndividualPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [messageType, setMessageType] = useState('template');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [selectedChannel, setSelectedChannel] = useState('whatsapp');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecipientId, setSelectedRecipientId] = useState('');
  const [showRecipientDialog, setShowRecipientDialog] = useState(false);
  const [mediaAttachment, setMediaAttachment] = useState<MediaAttachment | null>(null);
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariables>({});
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [filteredRecipients, setFilteredRecipients] = useState<Recipient[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatePreview, setTemplatePreview] = useState('');
  const [recipientTypeFilter, setRecipientTypeFilter] = useState('todos');
  const [onlyWithPhone, setOnlyWithPhone] = useState(false);

  // Buscar templates do banco de dados
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const response = await fetch('/api/admin/notifications/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        } else {
          console.error('Erro ao carregar templates:', await response.text());
        }
      } catch (error) {
        console.error('Erro ao carregar templates:', error);
      } finally {
        setLoadingTemplates(false);
      }
    };
    
    fetchTemplates();
  }, []);
  
  // Função para buscar destinatários
  const fetchRecipients = async (searchQuery = '', typeFilter = 'todos') => {
    console.log('🔍 Buscando destinatários. Termo:', searchQuery, 'Tipo:', typeFilter);
    setLoadingRecipients(true);
    try {
      // Mapeando o filtro de tipo da UI para o backend
      const apiTypeFilter = 
        typeFilter === 'todos' ? 'all' : 
        typeFilter === 'atletas' ? 'atletas' : 
        typeFilter === 'dirigentes' ? 'dirigentes' : 'all';
      
      // Usando a API real novamente
      const url = `/api/notifications/recipients?search=${encodeURIComponent(searchQuery)}&type=${apiTypeFilter}&hasPhone=${onlyWithPhone}`;
      console.log('📡 Chamando API:', url);
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Dados recebidos:', data.totalCount, 'destinatários');
        console.log('🐞 Debug info:', data.debug);
        
        setRecipients(data.recipients);
        setFilteredRecipients(data.recipients);
      } else {
        console.error('❌ Erro ao buscar destinatários:', await response.text());
        setRecipients([]);
        setFilteredRecipients([]);
      }
    } catch (error) {
      console.error('❌ Erro ao buscar destinatários:', error);
      setRecipients([]);
      setFilteredRecipients([]);
    } finally {
      setLoadingRecipients(false);
    }
  };
  
  // Filtrar destinatários baseado na busca local
  const filterRecipients = (query: string) => {
    if (!query.trim()) {
      setFilteredRecipients(recipients);
      return;
    }
    
    const lowerQuery = query.toLowerCase();
    const filtered = recipients.filter(recipient => 
      recipient.name.toLowerCase().includes(lowerQuery) ||
      recipient.email.toLowerCase().includes(lowerQuery) ||
      recipient.phone.toLowerCase().includes(lowerQuery) ||
      recipient.club.toLowerCase().includes(lowerQuery)
    );
    
    setFilteredRecipients(filtered);
  };
  
  // Manipular mudança na busca
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log("Texto de busca alterado:", value); // Debug
    setSearchTerm(value);
    filterRecipients(value);
  };
  
  // Buscar destinatários quando o modal abrir
  const handleOpenRecipientDialog = () => {
    setShowRecipientDialog(true);
    fetchRecipients(searchTerm, recipientTypeFilter);
  };
  
  // Alternar filtro de usuários com número de telefone
  const handlePhoneFilterChange = (checked: boolean) => {
    setOnlyWithPhone(checked);
    fetchRecipients(searchTerm, recipientTypeFilter);
  };
  
  // Obter o destinatário selecionado
  const selectedRecipient = recipients.find(r => r.id === selectedRecipientId);

  // Template selecionado
  const template = selectedTemplate 
    ? templates.find(t => t.id === selectedTemplate) 
    : null;
    
  // Atualizar o preview do template quando as variáveis mudam
  const updateTemplatePreview = () => {
    if (!template) return;
    
    let previewText = template.content;
    
    // Substituir variáveis se existirem
    Object.entries(selectedVariables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      previewText = previewText.replace(regex, String(value));
    });
    
    // Destacar variáveis não preenchidas
    const missingVarsRegex = /{{([^}]+)}}/g;
    previewText = previewText.replace(missingVarsRegex, (match, varName) => {
      return `<span class="text-blue-500">${match}</span>`;
    });
    
    setTemplatePreview(previewText);
  };

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!selectedRecipient) {
      alert('Por favor, selecione um destinatário.');
      return;
    }
    
    if (messageType === 'template' && !selectedTemplate) {
      alert('Por favor, selecione um template.');
      return;
    }
    
    if (messageType === 'custom' && !customMessage.trim()) {
      alert('Por favor, digite uma mensagem.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Determinar o conteúdo da mensagem com base no tipo selecionado
      let messageContent = '';
      
      if (messageType === 'template') {
        // Recupera o template e aplica as variáveis
        const template = templates.find(t => t.id === selectedTemplate);
        if (!template) {
          throw new Error('Template não encontrado');
        }
        
        // Substitui as variáveis no conteúdo do template
        messageContent = template.content;
        Object.entries(selectedVariables).forEach(([key, value]) => {
          const regex = new RegExp(`{{${key}}}`, 'g');
          messageContent = messageContent.replace(regex, String(value));
        });
      } else {
        // Usa a mensagem personalizada
        messageContent = customMessage;
      }
      
      // Dados da notificação
      const notificationData = {
        recipient: selectedRecipient.phone, // Ou email dependendo do canal
        channel: selectedChannel,
        type: 'MANUAL',
        content: messageContent,
        priority: 'normal',
        variables: selectedVariables,
        metadata: {
          templateId: messageType === 'template' ? selectedTemplate : null,
          hasMediaAttachment: mediaAttachment ? "yes" : "no", // Usar string em vez de booleano
          isPersonalized: messageType === 'custom' ? "true" : "false", // Usar string em vez de booleano
          recipientName: selectedRecipient.name,
          recipientId: selectedRecipient.id,
          senderName: 'Sistema FGC',
        }
      };
      
      // Envia a notificação através da API - usando PATCH para envio direto (bypass da fila)
    console.log('Enviando mensagem diretamente (bypass da fila) para:', selectedRecipient.phone);
    console.log('Conteúdo da mensagem:', messageContent);
    
    const response = await fetch('/api/notifications/send', {
      method: 'PATCH', // Usando PATCH para envio direto em vez de POST que envia para a fila
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(notificationData),
    });
      
      if (!response.ok) {
        throw new Error('Falha ao enviar notificação');
      }
      
      // Exibe sucesso
      setIsSent(true);
      
      // Reset após mostrar mensagem de sucesso
      setTimeout(() => {
        setIsSent(false);
      }, 3000);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      alert(`Erro ao enviar mensagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Manipular seleção de template
  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Reset das variáveis do template
    const initialVariables: TemplateVariables = {};
    if (selectedRecipient) {
      // Preenche automaticamente o nome se tiver destinatário selecionado
      initialVariables['nome'] = selectedRecipient.name;
    }
    
    setSelectedVariables(initialVariables);
    
    // Atualiza canal com base no template
    setSelectedChannel(template.channel);
  };

  // Manipular seleção de destinatário
  const handleRecipientSelect = (recipient: Recipient) => {
    setSelectedRecipientId(recipient.id);
    setShowRecipientDialog(false);
    
    // Atualiza automaticamente a variável 'nome' se estiver usando template
    if (template && template.variables.includes('nome')) {
      setSelectedVariables({
        ...selectedVariables,
        nome: recipient.name
      });
    }
  };

  // Efeito colateral para atualizar preview
  useEffect(() => {
    updateTemplatePreview();
  }, [selectedTemplate, selectedVariables]);

  // Quando o tipo de destinatário é alterado no filtro
  const handleRecipientTypeChange = (value: string) => {
    console.log("🔄 Filtro alterado:", value);
    setRecipientTypeFilter(value);
    // Refazer a busca quando mudar o filtro
    fetchRecipients(searchTerm, value);
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/notificacoes">
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Envio Individual</h1>
            <p className="text-muted-foreground">
              Envie notificações personalizadas para destinatários individuais
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Painel de Destinatário */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Destinatário</CardTitle>
            <CardDescription>
              Selecione o destinatário da mensagem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedRecipient ? (
              <div className="rounded-lg border p-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedRecipient.avatar} />
                      <AvatarFallback>{selectedRecipient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-medium">{selectedRecipient.name}</h3>
                      <p className="text-sm text-muted-foreground">{selectedRecipient.club}</p>
                    </div>
                  </div>
                  <Badge variant="outline">{selectedRecipient.role}</Badge>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRecipient.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedRecipient.email}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowRecipientDialog(true)}
                  >
                    Alterar Destinatário
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                className="w-full h-32 flex flex-col gap-2"
                onClick={() => setShowRecipientDialog(true)}
              >
                <Users className="h-10 w-10 text-muted-foreground" />
                <span>Selecionar Destinatário</span>
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Painel de Mensagem */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Mensagem</CardTitle>
            <CardDescription>
              Compose a mensagem para enviar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tipo de Mensagem */}
            <RadioGroup 
              defaultValue="template" 
              value={messageType}
              onValueChange={setMessageType}
              className="flex space-x-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="template" id="template" />
                <Label htmlFor="template">Usar Template</Label>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Mensagem Personalizada</Label>
              </div>
            </RadioGroup>

            {/* Canal de Mensagem */}
            <div className="space-y-2">
              <Label>Canal</Label>
              <RadioGroup 
                value={selectedChannel}
                onValueChange={setSelectedChannel}
                className="flex space-x-1"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="whatsapp" id="whatsapp" />
                  <Label htmlFor="whatsapp" className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4 text-green-500" />
                    WhatsApp
                  </Label>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email" className="flex items-center gap-1">
                    <Mail className="h-4 w-4 text-blue-500" />
                    Email
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Conteúdo da Mensagem - Template */}
            {messageType === 'template' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="template-select">Template</Label>
                  <Select 
                    value={selectedTemplate} 
                    onValueChange={handleTemplateChange}
                  >
                    <SelectTrigger id="template-select">
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates
                        .filter(t => t.channel === selectedChannel)
                        .map(template => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {template && (
                  <>
                    {/* Variáveis do Template */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium">Variáveis do Template</h3>
                      {template.variables.map(variable => (
                        <div key={variable} className="space-y-2">
                          <Label htmlFor={`var-${variable}`}>{variable}</Label>
                          <Input
                            id={`var-${variable}`}
                            value={typeof selectedVariables[variable] === 'string' ? selectedVariables[variable] as string : ''}
                            onChange={e => {
                              const newVariables = {
                                ...selectedVariables,
                                [variable]: e.target.value
                              };
                              setSelectedVariables(newVariables);
                            }}
                            placeholder={`Valor para ${variable}`}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Preview da Mensagem */}
                    <div className="space-y-2">
                      <Label>Preview da Mensagem</Label>
                      <div className="rounded-lg border p-4 bg-muted/30">
                        <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: templatePreview }}></p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Conteúdo da Mensagem - Personalizada */}
            {messageType === 'custom' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-message">Mensagem</Label>
                  <Textarea
                    id="custom-message"
                    placeholder="Digite sua mensagem aqui..."
                    className="min-h-[120px]"
                    value={customMessage}
                    onChange={e => setCustomMessage(e.target.value)}
                  />
                </div>

                {/* Anexo de Mídia */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Anexar Mídia</Label>
                    <Switch 
                      checked={mediaAttachment !== null}
                      onCheckedChange={checked => {
                        if (!checked) setMediaAttachment(null);
                      }}
                    />
                  </div>
                  {mediaAttachment !== null ? (
                    <div className="flex items-center gap-2 rounded-lg border p-2">
                      <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                        <Image className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{mediaAttachment.name}</p>
                        <p className="text-xs text-muted-foreground">{mediaAttachment.type}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setMediaAttachment(null)}
                      >
                        Remover
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <Label
                        htmlFor="media-upload"
                        className="cursor-pointer flex flex-col items-center justify-center w-full h-20 rounded-lg border-2 border-dashed"
                      >
                        <div className="flex flex-col items-center pt-4 pb-5">
                          <FileText className="h-6 w-6 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            Clique para selecionar uma imagem
                          </p>
                        </div>
                        <Input
                          id="media-upload"
                          type="file"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              // Aqui seria feito o upload real do arquivo
                              // Por enquanto, apenas simulamos ter um anexo
                              setMediaAttachment({
                                name: e.target.files[0].name,
                                type: e.target.files[0].type,
                                url: URL.createObjectURL(e.target.files[0])
                              });
                            }
                          }}
                        />
                      </Label>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Formatos suportados: JPEG, PNG, PDF (máx. 5 MB)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between border-t p-4">
            <div>
              {selectedRecipient && (
                <div className="text-sm">
                  Destinatário: <span className="font-medium">{selectedRecipient.name}</span>
                </div>
              )}
            </div>
            <Button 
              disabled={isLoading || !selectedRecipient || (messageType === 'template' && !selectedTemplate) || (messageType === 'custom' && !customMessage.trim())}
              onClick={handleSendMessage}
            >
              {isLoading ? (
                <>Enviando...</>
              ) : isSent ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Enviado
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Dialog open={showRecipientDialog} onOpenChange={setShowRecipientDialog}>
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Selecionar Destinatário</DialogTitle>
            <DialogDescription>
              Escolha o destinatário para enviar a mensagem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 my-4">
            {/* Filtros em duas linhas para melhor organização */}
            <div className="flex flex-col md:flex-row gap-4">
              {/* Barra de busca */}
              <div className="flex-1 relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por nome, email ou telefone..." 
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-8 w-full"
                  autoFocus
                  autoComplete="off"
                />
              </div>
              
              {/* Filtros em linha com melhor espaçamento */}
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="recipient-type" className="whitespace-nowrap">Tipo:</Label>
                  <Select 
                    defaultValue="todos" 
                    onValueChange={handleRecipientTypeChange}
                  >
                    <SelectTrigger id="recipient-type" className="w-[140px]">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="atletas">Atletas</SelectItem>
                      <SelectItem value="dirigentes">Dirigentes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch 
                    id="phone-filter" 
                    checked={onlyWithPhone}
                    onCheckedChange={handlePhoneFilterChange}
                  />
                  <Label htmlFor="phone-filter" className="whitespace-nowrap">Apenas com WhatsApp</Label>
                </div>
              </div>
            </div>
          </div>
          
          {/* Tabela com scroll e altura fixa */}
          <div className="flex-1 overflow-hidden border rounded-md">
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-[150px]">Telefone</TableHead>
                    <TableHead className="w-[200px]">Email</TableHead>
                    <TableHead className="w-[100px]">Tipo</TableHead>
                    <TableHead className="w-[100px] text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingRecipients ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
                          <span>Carregando destinatários...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredRecipients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <Users className="h-8 w-8 mb-2" />
                          <span>Nenhum destinatário encontrado.</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredRecipients.map((recipient) => (
                      <TableRow key={recipient.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Avatar className="h-8 w-8">
                            {recipient.avatar ? (
                              <AvatarImage src={recipient.avatar} alt={recipient.name} />
                            ) : (
                              <AvatarFallback>
                                {recipient.name.substring(0, 1).toUpperCase()}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </TableCell>
                        <TableCell className="font-medium">{recipient.name}</TableCell>
                        <TableCell>{recipient.phone || '-'}</TableCell>
                        <TableCell>{recipient.email || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muted">
                            {recipient.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            size="sm" 
                            onClick={() => handleRecipientSelect(recipient)}
                          >
                            Selecionar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
          
          <DialogFooter className="mt-4 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowRecipientDialog(false)}>
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alerta de Sucesso */}
      {isSent && (
        <Alert className="fixed bottom-4 right-4 w-96 bg-green-50 border-green-200">
          <Check className="h-4 w-4 text-green-600" />
          <AlertTitle>Mensagem enviada com sucesso!</AlertTitle>
          <AlertDescription>
            A notificação foi enviada para {selectedRecipient?.name}.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
