'use client';

import React from 'react';
import { CheckCircle, AlertCircle, XCircle, Info, Clock, Link as LinkIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export interface ProcessResult {
  success: boolean;
  totalProcessed: number;
  validNotifications: number;
  invalidRows: { row: number; reason: string }[];
  queuedNotifications: number;
  notificationIds: string[];
  estimatedCompletionTime: string;
  error?: string;
}

interface ResultsDisplayProps {
  result: ProcessResult | null;
  isProcessing: boolean;
  onDismiss: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  isProcessing,
  onDismiss
}) => {
  if (!result && !isProcessing) return null;
  
  // Se ainda está processando
  if (isProcessing) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-500 animate-pulse" />
            Processando notificações
          </CardTitle>
          <CardDescription>
            Estamos processando seu arquivo CSV e preparando as notificações para envio
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={45} className="h-2" />
            <p className="text-sm text-muted-foreground text-center">
              Por favor, aguarde enquanto processamos seu arquivo
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Se resultado com erro
  if (result && !result.success) {
    return (
      <Card className="mt-6 border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5 text-red-500" />
            Falha no processamento
          </CardTitle>
          <CardDescription className="text-red-600">
            Não foi possível processar o arquivo CSV
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-red-700 mb-4">
            {result.error || 'Ocorreu um erro durante o processamento do arquivo.'}
          </p>
          <Button variant="outline" onClick={onDismiss}>
            Fechar
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  // Se resultado com sucesso
  if (result && result.success) {
    const hasInvalidRows = result.invalidRows && result.invalidRows.length > 0;
    const completionDate = new Date(result.estimatedCompletionTime);
    const formattedCompletionTime = completionDate.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <Card className="mt-6 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Notificações processadas com sucesso
          </CardTitle>
          <CardDescription className="text-green-600">
            Suas notificações foram adicionadas à fila de envio
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg border bg-white p-3">
              <div className="text-sm text-muted-foreground">Total processado</div>
              <div className="text-2xl font-bold mt-1">{result.totalProcessed}</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-sm text-muted-foreground">Notificações válidas</div>
              <div className="text-2xl font-bold mt-1 text-green-600">{result.validNotifications}</div>
            </div>
            <div className="rounded-lg border bg-white p-3">
              <div className="text-sm text-muted-foreground">Linhas com erro</div>
              <div className="text-2xl font-bold mt-1 text-amber-500">{result.invalidRows?.length || 0}</div>
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                {result.queuedNotifications} notificações foram adicionadas à fila de envio.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" />
              <span className="text-sm">
                Término estimado: <strong>{formattedCompletionTime}</strong>
              </span>
            </div>
          </div>
          
          {hasInvalidRows && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Detalhes das linhas com erro:</h3>
              <div className="rounded-lg border bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linha</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.invalidRows.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.row}</TableCell>
                        <TableCell>{row.reason}</TableCell>
                      </TableRow>
                    ))}
                    {result.invalidRows.length > 5 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">
                          + {result.invalidRows.length - 5} linhas adicionais com erro
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={onDismiss}>
            Fechar
          </Button>
          <Button variant="default" asChild>
            <a href="/dashboard/notificacoes/enviadas">
              <LinkIcon className="mr-2 h-4 w-4" />
              Ver status das notificações
            </a>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return null;
};

export default ResultsDisplay;
