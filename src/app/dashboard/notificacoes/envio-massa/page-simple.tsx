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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function EnvioMassaSimplePage() {
  // Estados
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState('whatsapp');
  const [delay, setDelay] = useState(1000);

  // Função para validar arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'text/csv') {
        setError('Por favor, selecione um arquivo CSV válido');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  // Função para enviar mensagens
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      setError('Por favor, selecione um arquivo CSV com os destinatários');
      return;
    }

    if (!message.trim()) {
      setError('Por favor, digite uma mensagem para enviar');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('message', message);
      formData.append('channel', channel);
      formData.append('delayBetweenMessages', delay.toString());

      const response = await fetch('/api/notifications/csv', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao enviar notificações');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setIsLoading(false);
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
            <h1 className="text-3xl font-bold tracking-tight">Envio em Massa</h1>
            <p className="text-muted-foreground">
              Envie notificações para múltiplos destinatários via CSV
            </p>
          </div>
        </div>
      </div>

      {success ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-600">Notificações Enviadas com Sucesso</CardTitle>
            <CardDescription>
              Suas notificações foram enfileiradas e estão sendo enviadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>O processo de envio está em andamento. Você pode verificar o status no histórico de notificações.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={() => setSuccess(false)}>Enviar Mais Notificações</Button>
          </CardFooter>
        </Card>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Upload de CSV</CardTitle>
              <CardDescription>
                Faça upload de um arquivo CSV com a lista de destinatários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="csv-file">Arquivo CSV</Label>
                <Input 
                  id="csv-file" 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  O arquivo CSV deve conter uma coluna com número de telefone (para WhatsApp) ou email.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensagem</CardTitle>
              <CardDescription>
                Digite a mensagem que será enviada para todos os destinatários
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="channel">Canal</Label>
                  <select 
                    id="channel"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    disabled={isLoading}
                  >
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Digite sua mensagem aqui..." 
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Você pode usar variáveis como {'{nome}'} ou {'{email}'} que serão substituídas por valores do CSV.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="delay">Intervalo entre mensagens (ms)</Label>
                  <Input 
                    id="delay"
                    type="number"
                    min={300}
                    max={3000}
                    step={100}
                    value={delay}
                    onChange={(e) => setDelay(parseInt(e.target.value))}
                    disabled={isLoading}
                  />
                  <p className="text-sm text-muted-foreground">
                    Um intervalo maior reduz o risco de bloqueio por envio excessivo (recomendado: 1000ms).
                  </p>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button type="submit" disabled={isLoading || !selectedFile}>
                {isLoading ? (
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
        </form>
      )}
    </div>
  );
}
