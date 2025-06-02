'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Copy, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';

// Tipos
interface Template {
  id: string;
  name: string;
  type: string;
  content: string;
  variables: string[];
  channel: string;
}

export interface MessageConfig {
  type: 'template' | 'custom';
  templateId?: string;
  customMessage?: string;
  subject?: string;
}

interface MessageSelectorProps {
  channel: 'whatsapp' | 'email';
  onChange: (config: MessageConfig) => void;
  csvColumns?: string[];
}

const MessageSelector: React.FC<MessageSelectorProps> = ({
  channel,
  onChange,
  csvColumns = []
}) => {
  // Estado para tipo de mensagem (template ou personalizada)
  const [messageType, setMessageType] = useState<'template' | 'custom'>('template');
  
  // Estado para templates e carregamento
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estado para template e mensagem personalizada
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState('');
  const [subject, setSubject] = useState('');
  
  // Carregar templates da API
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Buscar templates do canal específico
        const response = await fetch(`/api/admin/notifications/templates?channel=${channel}`);
        
        if (!response.ok) {
          throw new Error('Falha ao carregar templates');
        }
        
        const data = await response.json();
        
        if (Array.isArray(data) && data.length > 0) {
          setTemplates(data);
          // Selecionar o primeiro template por padrão
          setSelectedTemplateId(data[0].id);
          // Notificar o componente pai sobre a seleção inicial
          onChange({
            type: 'template',
            templateId: data[0].id
          });
        } else {
          setTemplates([]);
          setError('Nenhum template disponível para este canal');
        }
      } catch (err) {
        console.error('Erro ao buscar templates:', err);
        setError('Erro ao carregar templates. Tente novamente mais tarde.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTemplates();
  }, [channel, onChange]);
  
  // Enviar alterações para o componente pai
  useEffect(() => {
    const config: MessageConfig = {
      type: messageType
    };
    
    if (messageType === 'template') {
      config.templateId = selectedTemplateId;
    } else {
      config.customMessage = customMessage;
      if (channel === 'email') {
        config.subject = subject;
      }
    }
    
    onChange(config);
  }, [messageType, selectedTemplateId, customMessage, subject, channel, onChange]);
  
  // Obter o template selecionado
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);
  
  // Função para inserir variável no texto personalizado
  const insertVariable = (variable: string) => {
    const textArea = document.getElementById('customMessage') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const text = textArea.value;
      const newText = text.substring(0, start) + `{{${variable}}}` + text.substring(end);
      setCustomMessage(newText);
      
      // Focar no textarea e posicionar o cursor após a variável inserida
      setTimeout(() => {
        textArea.focus();
        const newPosition = start + variable.length + 4; // +4 para os caracteres {{ e }}
        textArea.setSelectionRange(newPosition, newPosition);
      }, 0);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Mensagem</CardTitle>
        <CardDescription>
          Selecione um template ou crie uma mensagem personalizada
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="ml-2">Carregando templates...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          <>
            <RadioGroup
              value={messageType}
              onValueChange={(value) => setMessageType(value as 'template' | 'custom')}
              className="mb-4"
            >
              <div className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value="template" id="template" />
                <Label htmlFor="template">Usar template</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="custom" />
                <Label htmlFor="custom">Criar mensagem personalizada</Label>
              </div>
            </RadioGroup>
            
            {messageType === 'template' ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="templateSelect">Selecione um template</Label>
                  <Select 
                    value={selectedTemplateId} 
                    onValueChange={setSelectedTemplateId}
                    disabled={templates.length === 0}
                  >
                    <SelectTrigger id="templateSelect">
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {selectedTemplate && (
                  <div className="mt-4 space-y-2">
                    <Label>Prévia do template</Label>
                    <div className="p-3 rounded border bg-muted/50 whitespace-pre-wrap">
                      {selectedTemplate.content}
                    </div>
                    
                    {selectedTemplate.variables.length > 0 && (
                      <div className="mt-2">
                        <Label>Variáveis disponíveis</Label>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedTemplate.variables.map((variable) => (
                            <div 
                              key={variable}
                              className="px-2 py-1 bg-primary/10 text-primary rounded text-xs flex items-center"
                            >
                              {variable}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {channel === 'email' && (
                  <div>
                    <Label htmlFor="subject">Assunto</Label>
                    <Input
                      id="subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Digite o assunto do email"
                    />
                  </div>
                )}
                
                <div>
                  <Label htmlFor="customMessage">Mensagem</Label>
                  <Textarea
                    id="customMessage"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={`Digite sua mensagem personalizada para ${channel === 'whatsapp' ? 'WhatsApp' : 'Email'}`}
                    className="min-h-[150px]"
                  />
                </div>
                
                {csvColumns.length > 0 && (
                  <div>
                    <Label>Inserir variáveis do CSV</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {csvColumns.map((column) => (
                        <Button
                          key={column}
                          variant="outline"
                          size="sm"
                          onClick={() => insertVariable(column)}
                          className="flex items-center"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          {column}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MessageSelector;
