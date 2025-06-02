'use client';

import { useState, useEffect } from 'react';
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
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';

const modalidadeSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  price: z.string()
    .min(1, 'Preço é obrigatório')
    .refine((val) => !isNaN(Number(val)), 'Preço deve ser um número válido')
    .transform((val) => Number(val)),
  active: z.boolean().default(true),
  order: z.string().min(1, 'Ordem é obrigatória'),
});

type Modalidade = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  order: number;
};

export function ModalidadesForm() {
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Carregar modalidades ao montar o componente
  useEffect(() => {
    loadModalidades();
  }, []);

  const form = useForm<z.infer<typeof modalidadeSchema>>({
    resolver: zodResolver(modalidadeSchema),
    defaultValues: {
      name: '',
      price: '',
      active: true,
      order: '',
    },
  });

  async function onSubmit(values: z.infer<typeof modalidadeSchema>) {
    try {
      // Aqui vai a lógica de salvar/atualizar
      const response = await fetch('/api/filiacao/modalidades', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...values,
          order: parseInt(values.order),
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar modalidade');

      toast({
        title: 'Sucesso',
        description: editingId 
          ? 'Modalidade atualizada com sucesso'
          : 'Modalidade criada com sucesso',
      });

      form.reset();
      setEditingId(null);
      // Recarregar lista
      loadModalidades();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar modalidade',
        variant: 'destructive',
      });
    }
  }

  async function loadModalidades() {
    try {
      const response = await fetch('/api/filiacao/modalidades');
      if (!response.ok) throw new Error('Erro ao carregar modalidades');
      const data = await response.json();
      setModalidades(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar modalidades',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Tem certeza que deseja excluir esta modalidade?')) return;

    try {
      const response = await fetch(`/api/filiacao/modalidades/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir modalidade');

      toast({
        title: 'Sucesso',
        description: 'Modalidade excluída com sucesso',
      });

      loadModalidades();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir modalidade',
        variant: 'destructive',
      });
    }
  }

  function handleEdit(modalidade: Modalidade) {
    setEditingId(modalidade.id);
    form.reset({
      name: modalidade.name,
      price: modalidade.price.toString(),
      active: modalidade.active,
      order: modalidade.order !== undefined ? modalidade.order.toString() : '0',
    });
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome da Modalidade</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: BMX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Preço</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    placeholder="Ex: 100.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="order"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ordem</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="Ex: 1" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="active"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormLabel>Ativo</FormLabel>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit">
            {editingId ? 'Atualizar' : 'Adicionar'} Modalidade
          </Button>
          {editingId && (
            <Button 
              type="button" 
              variant="outline" 
              className="ml-2"
              onClick={() => {
                setEditingId(null);
                form.reset();
              }}
            >
              Cancelar
            </Button>
          )}
        </form>
      </Form>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Preço</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {modalidades.map((modalidade) => (
            <TableRow key={modalidade.id}>
              <TableCell>{modalidade.name}</TableCell>
              <TableCell>R$ {Number(modalidade.price).toFixed(2)}</TableCell>
              <TableCell>{modalidade.order}</TableCell>
              <TableCell>{modalidade.active ? 'Ativo' : 'Inativo'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(modalidade)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(modalidade.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  Excluir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
