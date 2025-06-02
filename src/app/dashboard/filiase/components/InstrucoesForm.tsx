'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';

const instrucoesSchema = z.object({
  postPaymentInstructions: z.string().min(1, 'Instruções são obrigatórias'),
});

export function InstrucoesForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof instrucoesSchema>>({
    resolver: zodResolver(instrucoesSchema),
    defaultValues: {
      postPaymentInstructions: '',
    },
  });

  async function onSubmit(values: z.infer<typeof instrucoesSchema>) {
    try {
      setIsLoading(true);
      const response = await fetch('/api/filiacao/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error('Erro ao salvar instruções');

      toast({
        title: 'Sucesso',
        description: 'Instruções atualizadas com sucesso',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar instruções',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInstrucoes() {
    try {
      const response = await fetch('/api/filiacao/config');
      if (!response.ok) throw new Error('Erro ao carregar instruções');
      const data = await response.json();
      form.reset({
        postPaymentInstructions: data.postPaymentInstructions,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar instruções',
        variant: 'destructive',
      });
    }
  }

  // Carregar instruções ao montar o componente
  useState(() => {
    loadInstrucoes();
  });

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="postPaymentInstructions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instruções Pós-Pagamento</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Digite aqui as instruções que serão exibidas após o pagamento da filiação..."
                    className="min-h-[200px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Salvando...' : 'Salvar Instruções'}
          </Button>
        </form>
      </Form>

      <Card className="p-4 bg-muted">
        <h3 className="font-semibold mb-2">Preview das Instruções</h3>
        <div className="prose max-w-none">
          {form.watch('postPaymentInstructions')}
        </div>
      </Card>
    </div>
  );
}
