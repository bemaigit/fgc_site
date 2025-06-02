'use client';

import React from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  RadioGroup,
  RadioGroupItem,
} from '@/components/ui/radio-group';
import { MessageSquare, Mail, Clock, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// As versões incompatíveis do Radix UI estão causando problemas
// Como estamos no contexto da aplicação principal, é melhor modificar
// nosso componente para não tentar usar novos componentes que possam
// causar conflitos de versões

export interface SendConfig {
  channel: 'whatsapp' | 'email';
  priority: 'low' | 'normal' | 'high';
  delayBetweenMessages: number;
  sendImmediately: boolean;
}

interface SendConfigComponentProps {
  config: SendConfig;
  onChange: (config: SendConfig) => void;
  totalRecipients?: number;
}

export const SendConfigComponent: React.FC<SendConfigComponentProps> = ({
  config,
  onChange,
  totalRecipients = 0
}) => {
  // Calcular tempo estimado
  const calculateEstimatedTime = () => {
    if (!totalRecipients) return '';
    
    // Tempo total em ms
    const totalTimeMs = totalRecipients * config.delayBetweenMessages;
    
    // Converter para minutos
    const minutes = Math.floor(totalTimeMs / 60000);
    const seconds = Math.floor((totalTimeMs % 60000) / 1000);
    
    if (minutes < 1) {
      return `${seconds} segundos`;
    } else if (minutes === 1) {
      return `1 minuto e ${seconds} segundos`;
    } else {
      return `${minutes} minutos e ${seconds} segundos`;
    }
  };
  
  // Calcular limite por hora baseado no delay
  const calculateHourlyLimit = () => {
    const messagesPerHour = Math.floor(3600000 / config.delayBetweenMessages);
    return messagesPerHour;
  };
  
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base">Canal de Envio</Label>
        <RadioGroup 
          value={config.channel}
          onValueChange={(value) => onChange({...config, channel: value as 'whatsapp' | 'email'})}
          className="flex space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="whatsapp" id="channel-whatsapp" />
            <Label htmlFor="channel-whatsapp" className="flex items-center gap-1 cursor-pointer">
              <MessageSquare className="h-4 w-4 text-green-500" />
              WhatsApp
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="email" id="channel-email" />
            <Label htmlFor="channel-email" className="flex items-center gap-1 cursor-pointer">
              <Mail className="h-4 w-4 text-blue-500" />
              Email
            </Label>
          </div>
        </RadioGroup>
      </div>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-base">Intervalo entre mensagens</Label>
          <span className="text-sm font-medium">{config.delayBetweenMessages}ms</span>
        </div>
        <div className="flex items-center space-x-4">
          <Input
            type="number"
            className="w-full"
            min={300}
            max={3000}
            step={100}
            value={config.delayBetweenMessages}
            onChange={(e) => {
              const value = parseInt(e.target.value);
              // Garantir que o valor esteja dentro dos limites
              const clampedValue = Math.min(Math.max(value, 300), 3000);
              onChange({...config, delayBetweenMessages: clampedValue});
            }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Mínimo: 300ms</span>
          <span>Máximo: 3000ms</span>
        </div>
        
        {config.channel === 'whatsapp' && config.delayBetweenMessages < 1000 && (
          <Alert variant="warning" className="mt-2">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Intervalos muito curtos podem causar bloqueios temporários no WhatsApp. 
              Recomendamos pelo menos 1000ms entre mensagens.
            </AlertDescription>
          </Alert>
        )}
        
        {totalRecipients > 0 && (
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>
              Tempo estimado para {totalRecipients} destinatários: 
              <strong className="ml-1">{calculateEstimatedTime()}</strong>
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm mt-1">
          <span>Limite estimado: <strong>{calculateHourlyLimit()}</strong> mensagens/hora</span>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label className="text-base">Prioridade</Label>
        <div>
          <select 
            value={config.priority} 
            onChange={(e) => onChange({...config, priority: e.target.value as 'low' | 'normal' | 'high'})}
          >
            <option value="low">Baixa</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
          </select>
        </div>
        <p className="text-xs text-muted-foreground">
          Mensagens com prioridade alta serão enviadas antes de outras na fila.
        </p>
      </div>
      
      <div className="flex items-center space-x-2">
        <Switch 
          id="send-immediately" 
          checked={config.sendImmediately}
          onCheckedChange={(checked) => onChange({...config, sendImmediately: checked})}
        />
        <Label htmlFor="send-immediately">
          Enviar Imediatamente
        </Label>
        <AlertTriangle className="h-4 w-4 text-amber-500 cursor-help" />
        <span className="text-xs text-muted-foreground">
          O envio imediato pode gerar sobrecarga no sistema. Recomendamos esta opção apenas para lotes 
          pequenos (até 100 destinatários). Para lotes maiores, o sistema processará em segundo plano.
        </span>
      </div>
    </div>
  );
};

export default SendConfigComponent;
