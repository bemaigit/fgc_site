'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Loader2, Upload, RefreshCw, Trash } from 'lucide-react';
import './card-filiation.css';

// Validação do formulário
const cardFiliationSchema = z.object({
  type: z.enum(['ATHLETE', 'CLUB']),
  title: z.string().min(3, { message: 'O título deve ter pelo menos 3 caracteres' }),
  // Aceitar tanto URLs completas quanto caminhos relativos
  image: z.string().min(1, { message: 'A imagem é obrigatória' }),
  buttonText: z.string().optional(),
  // Aceita URL completa ou URL relativa (iniciando com /)
  buttonUrl: z.string()
    .refine(
      (val) => {
        if (!val) return true; // Opcional
        return val.startsWith('/') || val.startsWith('http') || val.startsWith('https'); 
      }, 
      { message: 'URL deve ser um endereço válido (ex: https://site.com ou /pagina)' }
    )
    .optional(),
  buttonPosition: z.string().default('bottom-right'),
  active: z.boolean().default(true),
});

type CardFiliation = z.infer<typeof cardFiliationSchema> & { id?: string };

export function CardFiliationForm() {
  const [activeTab, setActiveTab] = useState<string>('ATHLETE');
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [athleteBanner, setAthleteBanner] = useState<CardFiliation | null>(null);
  const [clubBanner, setClubBanner] = useState<CardFiliation | null>(null);

  // Função para obter a URL da prévia da imagem
  const getPreviewImageUrl = (url: string) => {
    if (!url) return '';
    
    console.log('Processando URL da imagem (original):', url);
    
    // Sempre preferir o endpoint melhorado para lidar com todos os casos
    // Isso garantirá que as imagens sejam carregadas corretamente independente de
    // terem espaços, hífens ou prefixos nos caminhos
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    
    // CASO 1: Se já é uma URL formada com o endpoint melhorado
    if (url.includes('/api/filiacao/banner/image') && url.includes('path=')) {
      console.log('URL já está no formato correto:', url);
      return url;
    }
    
    // CASO 2: Se for uma URL completa com protocolo
    if (url.includes('://')) {
      try {
        const urlObj = new URL(url);
        
        // Se for uma URL do MinIO ou outro storage
        if (urlObj.pathname.includes('/storage/') || urlObj.pathname.includes('/fgc/')) {
          // Extrair apenas o caminho relativo depois de storage/ ou fgc/
          const path = urlObj.pathname
            .replace(/^\/storage\//, '')
            .replace(/^\/fgc\//, '');
            
          // Usar o endpoint melhorado para garantir acesso correto
          const imageUrl = `${baseUrl}/api/filiacao/banner/image?path=${encodeURIComponent(path)}`;
          console.log('URL processada de URL completa:', imageUrl);
          return imageUrl;
        }
        
        // Outra URL externa, manter como está
        return url;
      } catch (error) {
        console.error('Erro ao processar URL da prévia:', error);
        // Tentar usar o endpoint mesmo assim
        return `${baseUrl}/api/filiacao/banner/image?path=${encodeURIComponent(url)}`;
      }
    }
    
    // CASO 3: Caminho relativo (sem protocolo)
    // Pode começar com / ou não
    let processedPath = url;
    
    // Remover prefixos se existirem
    if (processedPath.startsWith('/storage/')) {
      processedPath = processedPath.substring(9); // Remove '/storage/'
    } else if (processedPath.startsWith('/fgc/')) {
      processedPath = processedPath.substring(5); // Remove '/fgc/'
    } else if (processedPath.startsWith('storage/')) {
      processedPath = processedPath.substring(8); // Remove 'storage/'
    } else if (processedPath.startsWith('fgc/')) {
      processedPath = processedPath.substring(4); // Remove 'fgc/'
    }
    
    // Usar o endpoint melhorado para garantir acesso correto
    const imageUrl = `${baseUrl}/api/filiacao/banner/image?path=${encodeURIComponent(processedPath)}`;
    console.log('URL processada de caminho relativo:', imageUrl);
    return imageUrl;
  };

  const form = useForm<CardFiliation>({
    resolver: zodResolver(cardFiliationSchema),
    defaultValues: {
      type: 'ATHLETE',
      title: '',
      image: '',
      buttonText: '',
      buttonPosition: 'bottom-right',
      active: true
    },
  });

  // Carregar dados do banner ao iniciar
  useEffect(() => {
    loadBanners();
  }, []);

  // Atualizar formulário quando mudar de aba
  useEffect(() => {
    const currentBanner = activeTab === 'ATHLETE' ? athleteBanner : clubBanner;
    if (currentBanner) {
      form.reset({
        ...currentBanner,
        // Garantir que valores null sejam convertidos para string vazia
        buttonText: currentBanner.buttonText || '',
        buttonUrl: currentBanner.buttonUrl || '',
        type: activeTab as 'ATHLETE' | 'CLUB'
      });
    } else {
      form.reset({
        type: activeTab as 'ATHLETE' | 'CLUB',
        title: activeTab === 'ATHLETE' ? 'Filiação de Atleta' : 'Filiação de Clube',
        image: '',
        buttonText: '',
        buttonUrl: '',
        buttonPosition: 'bottom-right',
        active: true
      });
    }
  }, [activeTab, athleteBanner, clubBanner]);

  // Carregar banners do servidor
  const loadBanners = async () => {
    try {
      setIsLoading(true);
      
      // Carregar banner de atleta
      const athleteResponse = await fetch('/api/filiacao/banner?type=ATHLETE');
      if (athleteResponse.ok) {
        const data = await athleteResponse.json();
        // Garantir que os campos opcionais nunca sejam null
        if (data[0]) {
          data[0].buttonText = data[0].buttonText || '';
          data[0].buttonUrl = data[0].buttonUrl || '';
        }
        setAthleteBanner(data[0] || null);
      }
      
      // Carregar banner de clube
      const clubResponse = await fetch('/api/filiacao/banner?type=CLUB');
      if (clubResponse.ok) {
        const data = await clubResponse.json();
        // Garantir que os campos opcionais nunca sejam null
        if (data[0]) {
          data[0].buttonText = data[0].buttonText || '';
          data[0].buttonUrl = data[0].buttonUrl || '';
        }
        setClubBanner(data[0] || null);
      }
    } catch (error) {
      console.error('Erro ao carregar banners:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os banners',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Upload de imagem para o MinIO
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'banner');
      formData.append('prefix', 'filiacao-banners'); // Adiciona um prefixo específico
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) throw new Error('Falha ao fazer upload da imagem');
      
      const { url } = await response.json();
      console.log('URL da imagem após upload (original):', url);
      
      // TRATAMENTO MELHORADO: Garantir que apenas o caminho relativo seja salvo
      // independentemente do domínio de origem (localhost, ngrok, bemai.com.br)
      let path = '';
      
      try {
        // Converter para objeto URL para manipulação
        const urlObj = new URL(url);
        
        // Remover qualquer prefixo conhecido
        path = urlObj.pathname
          .replace(/^\/storage\//, '') // Remove /storage/ se existir
          .replace(/^\/fgc\//, '')     // Remove /fgc/ se existir
          .replace(/^\/api\/.*\?path=/, ''); // Remove proxy API se existir
        
        console.log('Caminho extraído da URL:', path);
      } catch (error) {
        // Se não for uma URL válida, usar a string original
        console.warn('Erro ao processar URL, usando original:', error);
        path = url
          .replace(/^https?:\/\/[^\/]+\/storage\//, '')
          .replace(/^https?:\/\/[^\/]+\/fgc\//, '')
          .replace(/^storage\//, '')
          .replace(/^fgc\//, '');
      }
      
      // Verificar se o prefixo está incluído
      if (!path.startsWith('filiacao-banners/')) {
        path = `filiacao-banners/${path}`;
      }
      
      console.log('Caminho final para salvar no banco:', path);
      
      // Definir apenas o caminho relativo da imagem no formulário
      form.setValue('image', path);
      
      toast({
        title: 'Upload concluído',
        description: 'A imagem foi carregada com sucesso',
      });
    } catch (error) {
      console.error('Erro no upload:', error);
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível carregar a imagem',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Salvar banner
  const onSubmit = async (values: CardFiliation) => {
    try {
      setIsLoading(true);
      
      const currentBanner = activeTab === 'ATHLETE' ? athleteBanner : clubBanner;
      
      // Garantir que o tipo esteja definido corretamente
      const data = {
        ...values,
        type: activeTab, // Certificar que o tipo é definido explicitamente
        id: currentBanner?.id
      };
      
      console.log('Enviando dados para salvar banner:', JSON.stringify(data));
      
      const response = await fetch('/api/filiacao/banner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      console.log('Resposta do servidor:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erro detalhado da API:', errorData);
        throw new Error(`Falha ao salvar banner: ${response.status} ${response.statusText}`);
      }
      
      const savedBanner = await response.json();
      console.log('Banner salvo com sucesso:', savedBanner);
      
      if (activeTab === 'ATHLETE') {
        setAthleteBanner(savedBanner);
      } else {
        setClubBanner(savedBanner);
      }
      
      toast({
        title: 'Sucesso',
        description: 'Banner de filiação salvo com sucesso',
      });
      
      await loadBanners(); // Recarregar todos os banners
    } catch (error) {
      console.error('Erro ao salvar banner:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar o banner',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir banner
  const deleteBanner = async () => {
    try {
      setIsLoading(true);
      
      const currentBanner = activeTab === 'ATHLETE' ? athleteBanner : clubBanner;
      if (!currentBanner?.id) {
        toast({
          title: 'Erro',
          description: 'Não há banner para excluir',
          variant: 'destructive',
        });
        return;
      }
      
      const response = await fetch(`/api/filiacao/banner?id=${currentBanner.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Falha ao excluir banner');
      
      if (activeTab === 'ATHLETE') {
        setAthleteBanner(null);
      } else {
        setClubBanner(null);
      }
      
      form.reset({
        type: activeTab as 'ATHLETE' | 'CLUB',
        title: activeTab === 'ATHLETE' ? 'Filiação de Atleta' : 'Filiação de Clube',
        image: '',
        buttonText: '',
        buttonPosition: 'bottom-right',
        active: true
      });
      
      toast({
        title: 'Sucesso',
        description: 'Banner excluído com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir banner:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível excluir o banner',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="ATHLETE">Card de Atleta</TabsTrigger>
          <TabsTrigger value="CLUB">Card de Clube</TabsTrigger>
        </TabsList>

        <TabsContent value="ATHLETE">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do card" {...field} />
                    </FormControl>
                    <FormDescription>
                      Usado para acessibilidade e SEO
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium">Imagem do Banner</label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('athlete-banner-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Fazer upload
                      </>
                    )}
                  </Button>
                  <Input
                    id="athlete-banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Input 
                    placeholder="ou cole a URL da imagem" 
                    value={form.watch('image')}
                    onChange={(e) => form.setValue('image', e.target.value)}
                  />
                </div>
                
                {form.watch('image') && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Prévia da imagem:</p>
                    <div className="preview-container">
                      <div className="preview-image-container">
                        <img 
                          src={getPreviewImageUrl(form.watch('image'))} 
                          alt="Prévia do banner de atleta"
                          className="preview-image" 
                          onError={(e) => {
                            console.error('Erro ao carregar imagem:', e);
                            // Usar um placeholder que existe no projeto
                            e.currentTarget.src = '/placeholder-banner.jpg';
                            e.currentTarget.alt = 'Erro ao carregar imagem';
                          }}
                        />
                      </div>
                      <div className="preview-info">
                        <p>Resolução recomendada: 800x500 pixels</p>
                        <p>A imagem será exibida em tamanho completo no banner.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do Botão (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Filiar atleta agora" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Se não for fornecido, usará o texto padrão baseado no status de login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buttonUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Botão (opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="/filiacao/formulario" 
                        {...field} 
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormDescription>
                      Se não for fornecido, usará a URL padrão de filiação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buttonPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição do Botão</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a posição do botão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                        <SelectItem value="bottom-center">Inferior Centro</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ativar Banner</FormLabel>
                      <FormDescription>
                        Quando ativado, este banner será exibido na página inicial
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || !athleteBanner?.id}
                  onClick={deleteBanner}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Excluir
                    </>
                  )}
                </Button>

                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={loadBanners}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>

                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    onClick={() => console.log('Botão SALVAR do banner de ATLETA clicado', { 
                      formData: form.getValues(),
                      isValid: form.formState.isValid,
                      errors: form.formState.errors 
                    })}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Banner'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>

        <TabsContent value="CLUB">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Título do card" {...field} />
                    </FormControl>
                    <FormDescription>
                      Usado para acessibilidade e SEO
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <label className="block text-sm font-medium">Imagem do Banner</label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('club-banner-upload')?.click()}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Fazer upload
                      </>
                    )}
                  </Button>
                  <Input
                    id="club-banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <Input 
                    placeholder="ou cole a URL da imagem" 
                    value={form.watch('image')}
                    onChange={(e) => form.setValue('image', e.target.value)}
                  />
                </div>
                
                {form.watch('image') && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Prévia da imagem:</p>
                    <div className="preview-container">
                      <div className="preview-image-container">
                        <img 
                          src={getPreviewImageUrl(form.watch('image'))} 
                          alt="Prévia do banner de atleta"
                          className="preview-image" 
                          onError={(e) => {
                            console.error('Erro ao carregar imagem:', e);
                            // Usar um placeholder que existe no projeto
                            e.currentTarget.src = '/placeholder-banner.jpg';
                            e.currentTarget.alt = 'Erro ao carregar imagem';
                          }}
                        />
                      </div>
                      <div className="preview-info">
                        <p>Resolução recomendada: 800x500 pixels</p>
                        <p>A imagem será exibida em tamanho completo no banner.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="buttonText"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto do Botão (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Filiar clube agora" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se não for fornecido, usará o texto padrão baseado no status de login
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buttonUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL do Botão (opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="/filiacao/clube/formulario" {...field} />
                    </FormControl>
                    <FormDescription>
                      Se não for fornecido, usará a URL padrão de filiação
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="buttonPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Posição do Botão</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a posição do botão" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="bottom-right">Inferior Direito</SelectItem>
                        <SelectItem value="bottom-center">Inferior Centro</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ativar Banner</FormLabel>
                      <FormDescription>
                        Quando ativado, este banner será exibido na página inicial
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  disabled={isLoading || !clubBanner?.id}
                  onClick={deleteBanner}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash className="mr-2 h-4 w-4" />
                      Excluir
                    </>
                  )}
                </Button>

                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={loadBanners}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Atualizar
                  </Button>

                  <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      'Salvar Banner'
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </TabsContent>
      </Tabs>

      <Card className="p-4 bg-muted">
        <CardContent className="pt-4">
          <h3 className="font-semibold mb-4">Instruções de Uso</h3>
          <ul className="list-disc pl-5 space-y-2 text-sm">
            <li>Os cards de filiação são exibidos lado a lado na página inicial na seção "Filiação".</li>
            <li>Você pode personalizar a aparência de cada card (atleta e clube) individualmente.</li>
            <li>Somente um banner ativo pode existir para cada tipo (atleta ou clube).</li>
            <li>Se nenhum banner estiver configurado, o sistema exibirá o card padrão.</li>
            <li>Recomendação: use imagens com proporção 16:9 para melhor exibição.</li>
            <li>As imagens são armazenadas na pasta "card filiação" no bucket do MinIO.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
