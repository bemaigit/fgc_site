'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';

// Componentes locais
import CSVUploader from './components/csv-uploader';
import MessageSelector, { MessageConfig } from './components/message-selector';
import SendConfigComponent, { SendConfig } from './components/send-config';
import ResultsDisplay, { ProcessResult } from './components/results-display';

export default function EnvioMassaPage() {
  // Estado para arquivo CSV
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  
  // Estado para configuração de mensagem
  const [messageConfig, setMessageConfig] = useState<MessageConfig>({
    type: 'template',
  });
  
  // Estado para configuração de envio
  const [sendConfig, setSendConfig] = useState<SendConfig>({
    channel: 'whatsapp',
    priority: 'normal',
    delayBetweenMessages: 1000,
    sendImmediately: false
  });
  
  // Estado para processamento e resultado
  const [isProcessing, setIsProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<ProcessResult | null>(null);
  
  // Extrair colunas do CSV
  const extractCsvColumns = async (file: File) => {
    try {
      const text = await file.text();
      const lines = text.split('\n');
      
      if (lines.length > 0) {
        const headers = lines[0].split(',').map(h => h.trim());
        setCsvColumns(headers);
      }
    } catch (error) {
      console.error('Erro ao extrair colunas do CSV:', error);
    }
  };
  
  // Manipular seleção de arquivo
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    extractCsvColumns(file);
    setProcessResult(null);
  };
  
  // Manipular remoção de arquivo
  const handleFileRemoved = () => {
    setSelectedFile(null);
    setCsvColumns([]);
    setProcessResult(null);
  };
  
  // Manipular mudança de canal
  const handleChannelChange = (channel: 'whatsapp' | 'email') => {
    setSendConfig(prev => ({
      ...prev,
      channel
    }));
  };
  
  // Processar envio de notificações
  const handleProcessSend = async () => {
    if (!selectedFile) {
      return;
    }
    
    setIsProcessing(true);
    setProcessResult(null);
    
    try {
      // Criar FormData para upload
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Adicionar configurações ao FormData
      formData.append('channel', sendConfig.channel);
      formData.append('priority', sendConfig.priority);
      formData.append('delayBetweenMessages', sendConfig.delayBetweenMessages.toString());
      formData.append('sendImmediately', sendConfig.sendImmediately.toString());
      
      // Adicionar configuração de mensagem
      if (messageConfig.type === 'template') {
        formData.append('messageType', 'template');
        formData.append('templateId', messageConfig.templateId || '');
      } else {
        formData.append('messageType', 'custom');
        formData.append('customMessage', messageConfig.customMessage || '');
        if (sendConfig.channel === 'email' && messageConfig.subject) {
          formData.append('subject', messageConfig.subject);
        }
      }
      
      // Enviar para a API
      const response = await fetch('/api/notifications/send', {
        method: 'PUT',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Erro no servidor: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Atualizar estado com resultado do processamento
      setProcessResult({
        success: result.success,
        totalProcessed: result.totalProcessed || 0,
        validNotifications: result.validCount || 0,
        invalidRows: result.invalidRows || [],
        queuedNotifications: result.queuedCount || 0,
        notificationIds: result.notificationIds || [],
        estimatedCompletionTime: result.estimatedCompletionTime || '',
        error: result.error
      });
    } catch (error) {
      console.error('Erro ao processar envio:', error);
      setProcessResult({
        success: false,
        totalProcessed: 0,
        validNotifications: 0,
        invalidRows: [],
        queuedNotifications: 0,
        notificationIds: [],
        estimatedCompletionTime: '',
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar envio'
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Verificar se pode enviar
  const canSend = () => {
    if (!selectedFile) return false;
    if (isProcessing) return false;
    
    if (messageConfig.type === 'template' && !messageConfig.templateId) {
      return false;
    }
    
    if (messageConfig.type === 'custom' && !messageConfig.customMessage) {
      return false;
    }
    
    if (sendConfig.channel === 'email' && 
        messageConfig.type === 'custom' && 
        !messageConfig.subject) {
      return false;
    }
    
    return true;
  };
  
  // Limpar resultado
  const handleDismissResult = () => {
    setProcessResult(null);
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
            <h1 className="text-3xl font-bold tracking-tight">Envio em Massa</h1>
            <p className="text-muted-foreground">
              Envie notificações para múltiplos destinatários via CSV
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue={sendConfig.channel} onValueChange={(v) => handleChannelChange(v as 'whatsapp' | 'email')}>
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
        </TabsList>
        
        <TabsContent value="whatsapp" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload CSV */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upload de CSV</CardTitle>
                <CardDescription>
                  Faça upload de um arquivo CSV com a lista de destinatários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVUploader 
                  onFileSelected={handleFileSelected}
                  onFileRemoved={handleFileRemoved}
                  isProcessing={isProcessing}
                  channel="whatsapp"
                />
              </CardContent>
            </Card>

            {/* Configurações de Envio */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Configure o envio das notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SendConfigComponent 
                  config={sendConfig}
                  onChange={setSendConfig}
                  totalRecipients={selectedFile ? csvColumns.length - 1 : 0}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Configurações de Mensagem */}
          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Mensagem</CardTitle>
                <CardDescription>
                  Configure a mensagem a ser enviada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MessageSelector
                  channel="whatsapp"
                  onChange={setMessageConfig}
                  csvColumns={csvColumns}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleFileRemoved} disabled={isProcessing}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleProcessSend} 
                  disabled={!canSend()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Notificações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Exibição de Resultados */}
          <ResultsDisplay 
            result={processResult}
            isProcessing={isProcessing}
            onDismiss={handleDismissResult}
          />
        </TabsContent>
        
        <TabsContent value="email" className="space-y-6 mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Upload CSV */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Upload de CSV</CardTitle>
                <CardDescription>
                  Faça upload de um arquivo CSV com a lista de destinatários
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CSVUploader 
                  onFileSelected={handleFileSelected}
                  onFileRemoved={handleFileRemoved}
                  isProcessing={isProcessing}
                  channel="email"
                />
              </CardContent>
            </Card>

            {/* Configurações de Envio */}
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Configure o envio das notificações
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SendConfigComponent 
                  config={sendConfig}
                  onChange={setSendConfig}
                  totalRecipients={selectedFile ? csvColumns.length - 1 : 0}
                />
              </CardContent>
            </Card>
          </div>
          
          {/* Configurações de Mensagem */}
          {selectedFile && (
            <Card>
              <CardHeader>
                <CardTitle>Mensagem</CardTitle>
                <CardDescription>
                  Configure a mensagem a ser enviada
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MessageSelector
                  channel="email"
                  onChange={setMessageConfig}
                  csvColumns={csvColumns}
                />
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleFileRemoved} disabled={isProcessing}>
                  Voltar
                </Button>
                <Button 
                  onClick={handleProcessSend} 
                  disabled={!canSend()}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Notificações
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Exibição de Resultados */}
          <ResultsDisplay 
            result={processResult}
            isProcessing={isProcessing}
            onDismiss={handleDismissResult}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
