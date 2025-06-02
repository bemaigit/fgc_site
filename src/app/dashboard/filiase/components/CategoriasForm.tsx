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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

const categoriaSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  active: z.boolean().default(true),
  order: z.string().min(1, 'Ordem é obrigatória'),
  modalityIds: z.array(z.string()).min(1, 'É necessário selecionar pelo menos uma modalidade'),
});

type Categoria = {
  id: string;
  name: string;
  active: boolean;
  order: number;
  modalities?: Array<{
    id: string;
    name: string;
  }>;
};

type Modalidade = {
  id: string;
  name: string;
  price: number;
  active: boolean;
  order: number;
};

export function CategoriasForm() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Carregar categorias e modalidades ao montar o componente
  useEffect(() => {
    loadCategorias();
    loadModalidades();
  }, []);

  const form = useForm<z.infer<typeof categoriaSchema>>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: {
      name: '',
      active: true,
      order: '',
      modalityIds: [],
    },
  });

  async function onSubmit(values: z.infer<typeof categoriaSchema>) {
    try {
      // Aqui vai a lógica de salvar/atualizar
      const response = await fetch('/api/filiacao/categorias', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          ...values,
          order: parseInt(values.order),
        }),
      });

      if (!response.ok) throw new Error('Erro ao salvar categoria');

      toast({
        title: 'Sucesso',
        description: editingId 
          ? 'Categoria atualizada com sucesso'
          : 'Categoria criada com sucesso',
      });

      form.reset();
      setEditingId(null);
      // Recarregar lista
      loadCategorias();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao salvar categoria',
        variant: 'destructive',
      });
    }
  }

  async function loadCategorias() {
    try {
      const response = await fetch('/api/filiacao/categorias?includeModality=true');
      if (!response.ok) throw new Error('Erro ao carregar categorias');
      const data = await response.json();
      setCategorias(data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao carregar categorias',
        variant: 'destructive',
      });
    }
  }

  async function loadModalidades() {
    try {
      const response = await fetch('/api/filiacao/modalidades?active=true');
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
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const response = await fetch(`/api/filiacao/categorias/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir categoria');

      toast({
        title: 'Sucesso',
        description: 'Categoria excluída com sucesso',
      });

      loadCategorias();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao excluir categoria',
        variant: 'destructive',
      });
    }
  }

  function handleEdit(categoria: Categoria) {
    setEditingId(categoria.id);
    form.reset({
      name: categoria.name,
      active: categoria.active,
      order: categoria.order.toString(),
      modalityIds: categoria.modalities ? categoria.modalities.map(m => m.id) : [],
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
                <FormLabel>Nome da Categoria</FormLabel>
                <FormControl>
                  <Input placeholder="Ex: ELITE" {...field} />
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
            name="modalityIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modalidades</FormLabel>
                <div className="border rounded-md p-4 space-y-3">
                  <FormLabel>Selecione uma ou mais modalidades:</FormLabel>
                  {modalidades.map((modalidade) => (
                    <div key={modalidade.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`modalidade-${modalidade.id}`}
                        checked={field.value?.includes(modalidade.id)}
                        onCheckedChange={(checked) => {
                          const currentValues = field.value || [];
                          if (checked) {
                            field.onChange([...currentValues, modalidade.id]);
                          } else {
                            field.onChange(currentValues.filter((value) => value !== modalidade.id));
                          }
                        }}
                      />
                      <label htmlFor={`modalidade-${modalidade.id}`} className="text-sm font-medium">
                        {modalidade.name}
                      </label>
                    </div>
                  ))}
                </div>
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
            {editingId ? 'Atualizar' : 'Adicionar'} Categoria
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
            <TableHead>Modalidades</TableHead>
            <TableHead>Ordem</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categorias.map((categoria) => (
            <TableRow key={categoria.id}>
              <TableCell>{categoria.name}</TableCell>
              <TableCell>
                {categoria.modalities?.length ? 
                  categoria.modalities.map(m => m.name).join(', ') : 
                  'Não definida'}
              </TableCell>
              <TableCell>{categoria.order}</TableCell>
              <TableCell>{categoria.active ? 'Ativo' : 'Inativo'}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(categoria)}
                >
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(categoria.id)}
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
