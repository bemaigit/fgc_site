'use client'

import React, { useState, useEffect } from 'react';
import { Trash2, ArrowUp, ArrowDown } from 'lucide-react';

interface Banner {
  id: string;
  title: string;
  image: string;
  link: string;
  order: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BannerEditor = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [image, setImage] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Carrega os banners existentes
  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/banners');
      if (!response.ok) throw new Error('Erro ao carregar banners');
      const data = await response.json();
      setBanners(data);
    } catch (err) {
      console.error('Erro ao carregar banners:', err);
      setError('Erro ao carregar banners existentes');
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('O tamanho máximo da imagem é 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      setImage(file);
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSuccess(false);
    setError(null);
    setIsLoading(true);

    try {
      if (!image) {
        setError('Por favor, selecione uma imagem');
        return;
      }

      if (!title.trim()) {
        setError('Por favor, insira um título para o banner');
        return;
      }

      if (!link.trim()) {
        setError('Por favor, insira um link de redirecionamento');
        return;
      }

      const formData = new FormData();
      formData.append('file', image);

      // Upload da imagem
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error('Erro no upload da imagem');
      }

      const { url } = await uploadRes.json();
      console.log('URL original após upload:', url);

      if (!url) {
        throw new Error('URL da imagem não retornada pelo servidor');
      }
      
      // Processar a URL para extrair apenas o caminho relativo
      let imagePath = '';
      try {
        // Converter para objeto URL para manipulação
        const urlObj = new URL(url);
        
        // Remover qualquer prefixo conhecido
        imagePath = urlObj.pathname
          .replace(/^\/storage\//, '') // Remove /storage/ se existir
          .replace(/^\/fgc\//, '');    // Remove /fgc/ se existir
        
        console.log('Caminho extraído da URL:', imagePath);
      } catch (error) {
        // Se não for uma URL válida, usar a string original com limpeza básica
        console.warn('Erro ao processar URL, usando original:', error);
        imagePath = url
          .replace(/^https?:\/\/[^\/]+\/storage\//, '')
          .replace(/^https?:\/\/[^\/]+\/fgc\//, '')
          .replace(/^storage\//, '')
          .replace(/^fgc\//, '');
      }
      
      console.log('Caminho final para salvar no banco:', imagePath);

      // Cria o banner
      const createRes = await fetch('/api/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          image: imagePath, // Usar o caminho relativo processado
          link: link.trim(),
          order: banners.length // Novo banner vai para o final
        }),
      });

      if (!createRes.ok) {
        throw new Error('Erro ao criar banner');
      }

      setSuccess(true);
      setImage(null);
      setTitle('');
      setLink('');
      fetchBanners(); // Recarrega a lista
    } catch (err) {
      console.error('Erro ao salvar banner:', err);
      setError('Erro ao salvar o banner. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (bannerId: string) => {
    try {
      const response = await fetch(`/api/banners?id=${bannerId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao deletar banner');
      }

      setSuccess(true);
      fetchBanners(); // Recarrega a lista
    } catch (err) {
      setError('Erro ao deletar o banner. Tente novamente.');
      console.error(err);
    }
  };

  const handleReorder = async (bannerId: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === bannerId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= banners.length) return;

    try {
      // Atualiza a ordem dos banners afetados
      await Promise.all([
        fetch(`/api/banners?id=${bannerId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: newIndex }),
        }),
        fetch(`/api/banners?id=${banners[newIndex].id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: currentIndex }),
        }),
      ]);

      fetchBanners(); // Recarrega a lista com a nova ordem
    } catch (err) {
      setError('Erro ao reordenar os banners');
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">Gerenciar Banners</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Título do Banner</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Digite o título do banner"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Imagem do Banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
            required
          />
          {image && (
            <div className="mt-4">
              <img
                src={URL.createObjectURL(image)}
                alt="Pré-visualização do banner"
                className="max-w-full h-auto rounded"
              />
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Link de Redirecionamento</label>
          <input
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://exemplo.com"
            className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded">
            {error}
          </div>
        )}

        {success && (
          <div className="p-4 text-sm text-green-700 bg-green-100 rounded">
            Banner salvo com sucesso!
          </div>
        )}

        <div className="flex justify-end space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isLoading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Salvando...' : 'Salvar Banner'}
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Banners Existentes</h2>
        <div className="space-y-4">
          {banners.map((banner, index) => (
            <div key={banner.id} className="p-4 border rounded flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {banner.image && (
                  <img
                    src={banner.image}
                    alt={banner.title}
                    className="w-24 h-16 object-cover rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = '/placeholder-banner.jpg';
                      target.onerror = null;
                    }}
                  />
                )}
                <div>
                  <p className="font-medium">{banner.title}</p>
                  <p className="text-sm text-gray-500">{banner.link}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {index > 0 && (
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Mover para cima"
                    onClick={() => handleReorder(banner.id, 'up')}
                  >
                    <ArrowUp className="w-5 h-5" />
                  </button>
                )}
                {index < banners.length - 1 && (
                  <button
                    className="p-2 text-gray-500 hover:text-gray-700"
                    title="Mover para baixo"
                    onClick={() => handleReorder(banner.id, 'down')}
                  >
                    <ArrowDown className="w-5 h-5" />
                  </button>
                )}
                <button
                  className="p-2 text-red-500 hover:text-red-700"
                  title="Deletar banner"
                  onClick={() => handleDelete(banner.id)}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BannerEditor;
