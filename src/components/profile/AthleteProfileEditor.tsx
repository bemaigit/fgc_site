'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import { 
  Save, Plus, Trash2, Edit, X, Check, Instagram, Facebook, Twitter, Globe, ArrowUp 
} from 'lucide-react'
import { storageService } from '@/lib/storage'
import { processAthleteGalleryUrl } from '@/lib/processAthleteGalleryUrl'
import { AthleteGalleryView } from './AthleteGalleryView'

// Função auxiliar para converter URLs externas para o proxy local
const convertToProxyUrl = (url: string): string => {
  if (!url) return ''
  
  // Se a URL já for relativa usando nosso proxy, retorna como está
  if (url.startsWith('/storage/') || url.startsWith('/api/athlete-gallery/image')) {
    return url
  }
  
  // Verificar se é uma URL absoluta ou relativa
  if (!url.startsWith('http')) {
    // É uma URL relativa, simplificar o retorno para evitar erros
    console.log('URL já é relativa, retornando como está:', url);
    return url;
  }
  
  // URL do storage externo (MinIO, S3, etc.)
  // Exemplo: https://dev.bemai.com.br/storage/athlete-gallery/1747356301420-904kwq6jobr.png
  try {
    const urlObj = new URL(url)
    const pathParts = urlObj.pathname.split('/')
    
    // Remove /storage/ do caminho se presente
    if (pathParts[1] === 'storage') {
      pathParts.splice(0, 2) // Remove os dois primeiros elementos ("" e "storage")
    } else {
      pathParts.splice(0, 1) // Remove apenas o primeiro elemento ("")
    }
    
    // Retorna o caminho relativo para nosso proxy local
    return `/storage/${pathParts.join('/')}`
  } catch (err) {
    console.error('Erro ao converter URL:', err)
    return url // Retorna a URL original em caso de erro
  }
}

// Interfaces
interface Modality {
  id: string
  name: string
}

interface Category {
  id: string
  name: string
}

interface Gender {
  id: string
  name: string
}

interface AthleteProfile {
  id?: string
  athleteId: string
  biography: string | null
  achievements: string | null
  socialMedia: {
    instagram?: string
    facebook?: string
    twitter?: string
    youtube?: string
    tiktok?: string
  } | null
  websiteUrl: string | null
  gender?: string
  // Campos adicionados para as relações
  modalityId?: string | null
  categoryId?: string | null
  genderId?: string | null
}

interface GalleryImage {
  id: string
  imageUrl: string
  imageUrlClean?: string
  directUrl?: string // URL processada para exibição
  title: string | null
  description: string | null
  featured: boolean
  order: number
}

export function AthleteProfileEditor() {
  const { data: session } = useSession()
  
  // Estado para o perfil do atleta
  const [profile, setProfile] = useState<AthleteProfile>({
    athleteId: '',
    biography: '',
    achievements: '',
    socialMedia: {
      instagram: '',
      facebook: '',
      twitter: ''
    },
    websiteUrl: ''
  })
  
  // Estados para gerenciar galeria
  const [gallery, setGallery] = useState<GalleryImage[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  
  // Estados para modalidades, categorias e gêneros
  const [modalities, setModalities] = useState<Modality[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [genders, setGenders] = useState<Gender[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)
  
  // Estados de UI
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'profile' | 'gallery'>('profile')
  
  // Estados para edição de imagem
  const [editingImage, setEditingImage] = useState<string | null>(null)
  const [imageTitle, setImageTitle] = useState('')
  const [imageDescription, setImageDescription] = useState('')
  const [imageFeatured, setImageFeatured] = useState(false)
  
  // Estado para armazenar o ID real do atleta na tabela Athlete
  const [realAthleteId, setRealAthleteId] = useState<string | null>(null)

  // Carrega o perfil e a galeria do atleta
  useEffect(() => {
    if (session?.user?.id) {
      fetchRealAthleteId(session.user.id) // Primeiro buscar o ID real do atleta
      fetchModalitiesCategoriesGenders() // Buscar opções para os seletores
    }
  }, [session])
  
  // Monitora mudanças no realAthleteId para carregar a galeria
  useEffect(() => {
    if (realAthleteId) {
      console.log('ID do atleta alterado, carregando galeria...', realAthleteId)
      fetchAthleteGallery(realAthleteId)
      fetchAthleteProfile(realAthleteId)
    }
  }, [realAthleteId])
  
  // Busca o ID real do atleta a partir do ID do usuário
  const fetchRealAthleteId = async (userId: string) => {
    try {
      setLoading(true)
      console.log('Buscando ID real do atleta para userId:', userId)
      
      // URL correta: /api/athletes (endpoint que tem suporte para filtro por userId)
      const response = await fetch(`/api/athletes?userId=${userId}`)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Resposta da API de atleta:', data)
        
        // Verificar estrutura da resposta - pode ser um objeto ou uma lista
        let athlete = null
        if (data && data.id) {
          // Resposta é diretamente o objeto atleta
          athlete = data
        } else if (data && data.athletes && data.athletes.length > 0) {
          // Resposta contém uma lista de atletas
          athlete = data.athletes[0]
        }
        
        if (athlete && athlete.id) {
          console.log('Atleta encontrado:', athlete)
          // Guarda o ID do atleta como está, sem modificações
          const athleteId = athlete.id
          console.log('ID do atleta:', athleteId)
          setRealAthleteId(athleteId)
          
          // Buscar a galeria do atleta diretamente aqui também
          fetchAthleteGallery(athleteId)
          
          return athleteId
        } else {
          console.log('Nenhum atleta encontrado para este usuário ou estrutura de resposta inválida')
          setRealAthleteId(null)
          return null
        }
      }
    } catch (err) {
      console.error('Erro ao buscar ID do atleta:', err)
      setError('Não foi possível carregar seu perfil. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  // Funções para gerenciar o perfil e galeria
  const fetchAthleteProfile = async (athleteId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/athlete-profiles/${athleteId}`)
      
      if (response.ok) {
        const data = await response.json()
        setProfile({
          athleteId,
          biography: data.biography || '',
          achievements: data.achievements || '',
          socialMedia: data.socialMedia || {
            instagram: '',
            facebook: '',
            twitter: ''
          },
          websiteUrl: data.websiteUrl || '',
          gender: data.gender || '',
          modalityId: data.modalityId || null,
          categoryId: data.categoryId || null,
          genderId: data.genderId || null
        })
      } else {
        setProfile({
          athleteId,
          biography: '',
          achievements: '',
          socialMedia: {
            instagram: '',
            facebook: '',
            twitter: ''
          },
          websiteUrl: '',
          gender: '',
          modalityId: null,
          categoryId: null,
          genderId: null
        })
      }
    } catch (err) {
      console.error('Erro ao buscar perfil:', err)
      setError('Não foi possível carregar seu perfil. Tente novamente mais tarde.')
    } finally {
      setLoading(false)
    }
  }

  // Função para processar dados da galeria e padronizar URLs
  const processGalleryData = (data: GalleryImage[]) => {
    // Validação e log dos dados recebidos
    if (!data || !Array.isArray(data)) {
      console.log('Dados da galeria inválidos:', data);
      return [];
    }

    if (data.length > 0) {
      console.log(`Recebidas ${data.length} imagens na galeria`);
      console.log('Estrutura da primeira imagem:', JSON.stringify(data[0], null, 2));
    }
    
    // Processa cada imagem individualmente
    const processedImages = data.map(image => {
      if (!image.imageUrl) {
        console.log('Imagem sem URL:', image);
        return image;
      }
      
      try {
        // Se a URL já for completa (HTTP/HTTPS), usa o proxy
        if (image.imageUrl.startsWith('http://') || image.imageUrl.startsWith('https://')) {
          const proxyUrl = `/api/proxy?url=${encodeURIComponent(image.imageUrl)}`;
          console.log('URL HTTP convertida para proxy:', { 
            id: image.id,
            original: image.imageUrl, 
            proxy: proxyUrl 
          });
          
          return {
            ...image,
            directUrl: proxyUrl,
            imageUrlClean: image.imageUrl.split('/').pop() || ''
          };
        }
        
        // Extrai o nome do arquivo da URL
        const parts = image.imageUrl.split('/');
        const fileName = parts[parts.length - 1]; // Última parte do caminho
        
        // Se não tiver um nome de arquivo válido, retorna a imagem original
        if (!fileName) {
          console.warn('Nome de arquivo não encontrado na URL:', image.imageUrl);
          return image;
        }
        
        // Cria uma URL processada para a API de imagens
        const apiUrl = `/api/athlete-gallery/image?path=athlete-gallery/${encodeURIComponent(fileName)}`;
        
        console.log('URL processada para imagem:', {
          id: image.id,
          original: image.imageUrl,
          apiUrl: apiUrl
        });
        
        return {
          ...image,
          directUrl: apiUrl,
          imageUrlClean: fileName
        };
      } catch (error) {
        console.error('Erro ao processar URL da imagem:', error, image);
        return image; // Retorna a imagem original em caso de erro
      }
    });
    
    // Atualiza o estado com as imagens processadas
    setGallery(processedImages);
    return processedImages;
  };
  
  // Busca a galeria do atleta
  const fetchAthleteGallery = async (athleteId: string) => {
    try {
      // Se for um ID temporário, tenta buscar usando o userId
      if (athleteId.startsWith('temp_')) {
        const userId = athleteId.replace('temp_', '');
        console.log('ID temporário detectado, tentando buscar galeria usando userId:', userId);
        
        // Usar o userId diretamente na consulta da galeria
        const response = await fetch(`/api/athlete-gallery?userId=${userId}`);
        
        if (response.ok) {
          const data = await response.json();
          console.log(`Galeria buscada via userId: ${data.length} imagens`);
          processGalleryData(data);
          return;
        } else {
          const errorText = await response.text();
          console.error('Falha ao buscar galeria via userId:', errorText);
        }
      }
      
      // Busca normal usando athleteId
      console.log('Buscando galeria para o atleta ID:', athleteId);
      const response = await fetch(`/api/athlete-gallery?athleteId=${athleteId}`);
      
      if (response.ok) {
        const data = await response.json();
        processGalleryData(data);
      } else {
        const errorText = await response.text();
        console.error('Erro ao buscar galeria:', errorText);
        setError('Não foi possível carregar as imagens. Tente novamente mais tarde.');
      }
    } catch (err) {
      console.error('Erro ao buscar galeria:', err);
      setError('Não foi possível carregar suas fotos. Tente novamente mais tarde.');
    }
  };

  // Busca modalidades, categorias e gêneros disponíveis
  const fetchModalitiesCategoriesGenders = async () => {
    try {
      setLoadingOptions(true)
      const response = await fetch('/api/modalities-categories')
      
      if (response.ok) {
        const data = await response.json()
        setModalities(data.modalities || [])
        
        // Processar categorias para eliminar duplicatas por nome
        // Manter apenas a primeira ocorrência de cada categoria por nome
        const categoriesByName = new Map<string, Category>();
        (data.categories || []).forEach((category: Category) => {
          if (!categoriesByName.has(category.name)) {
            categoriesByName.set(category.name, category);
          }
        });
        
        // Converter o Map de volta para um array
        const uniqueCategories = Array.from(categoriesByName.values());
        setCategories(uniqueCategories)
        
        setGenders(data.genders || [])
      }
    } catch (err) {
      console.error('Erro ao buscar opções:', err)
    } finally {
      setLoadingOptions(false)
    }
  }

  // Carrega o perfil e a galeria do atleta
  useEffect(() => {
    if (session?.user?.id) {
      fetchRealAthleteId(session.user.id) // Primeiro buscar o ID real do atleta
      fetchModalitiesCategoriesGenders() // Buscar opções para os seletores
    }
  }, [session])

  // Manipuladores para os campos de texto
  const handleBiographyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, biography: e.target.value }))
  }
  
  const handleAchievementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setProfile(prev => ({ ...prev, achievements: e.target.value }))
  }
  
  const handleSocialMediaChange = (network: string, value: string) => {
    setProfile(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [network]: value
      }
    }))
  }
  
  const handleWebsiteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProfile(prev => ({ ...prev, websiteUrl: e.target.value }))
  }
  
  // Salva o perfil do atleta
  const saveProfile = async () => {
    if (!realAthleteId || !profile) return

    try {
      setSaving(true)
      setError(null)

      // Normalizar o ID do atleta (remover prefixo temp_ se presente)
      let athleteId = realAthleteId
      if (athleteId.startsWith('temp_')) {
        athleteId = athleteId.replace('temp_', '')
        console.log('ID normalizado para salvar perfil (removido prefixo temp_):', athleteId)
      }

      const response = await fetch(`/api/athlete-profiles/${athleteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...profile,
          athleteId
        })
      })

      if (!response.ok) {
        throw new Error('Falha ao salvar perfil')
      }

      setSuccess('Perfil salvo com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Erro ao salvar perfil:', err)
      setError('Não foi possível salvar seu perfil. Tente novamente mais tarde.')
    } finally {
      setSaving(false)
    }
  }

  // Manipuladores para os campos de seleção
  const handleModalityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, modalityId: e.target.value || null }))
  }

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, categoryId: e.target.value || null }))
  }

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfile(prev => ({ ...prev, genderId: e.target.value || null }))
  }

  // Manipuladores para a galeria
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !session?.user?.id || !profile) return
    
    const file = e.target.files[0]
    
    // Valida o tipo e tamanho do arquivo
    if (!file.type.startsWith('image/')) {
      setError('Apenas imagens são permitidas')
      return
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      setError('O tamanho máximo permitido é 5MB')
      return
    }
    
    try {
      setIsUploading(true)
      setUploadProgress(0)
      setError(null)
      
      // Prepara o FormData para upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'athlete-gallery')
      
      // Intervalo simulado para mostrar progresso
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 300)
      
      // Faz o upload do arquivo
      const uploadRes = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      
      if (!uploadRes.ok) {
        throw new Error('Falha no upload da imagem')
      }
      
      const { url } = await uploadRes.json()
      
      // Processar a URL para usar o proxy
      const processedUrl = processAthleteGalleryUrl(url)
      console.log('URL processada para banco de dados:', {
        original: url,
        processed: processedUrl
      })
      
      // Usa o ID real do atleta que buscamos anteriormente
      // Se não tiver o ID real, não podemos continuar
      if (!realAthleteId) {
        throw new Error('ID do atleta não disponível')
      }
      
      // Normalizar o ID do atleta (remover prefixo temp_ se presente)
      let athleteId = realAthleteId
      if (athleteId.startsWith('temp_')) {
        athleteId = athleteId.replace('temp_', '')
        console.log('ID normalizado para upload (removido prefixo temp_):', athleteId)
      }
      
      console.log('Enviando imagem para a galeria do atleta ID:', athleteId)
      
      // Adiciona a imagem à galeria com título e descrição
      const response = await fetch('/api/athlete-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          athleteId,
          imageUrl: processedUrl,
          featured: gallery.length === 0, // Se for a primeira imagem, marca como destacada
          title: imageTitle || null,
          description: imageDescription || null
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao adicionar imagem à galeria')
      }
      
      clearInterval(progressInterval)
      setUploadProgress(100)
      
      // Atualiza a galeria com o ID correto do atleta
      fetchAthleteGallery(realAthleteId)
      
      // Limpa os campos de título e descrição
      setImageTitle('')
      setImageDescription('')
      
      // Reseta o progresso após 1 segundo
      setTimeout(() => {
        setUploadProgress(0)
      }, 1000)
    } catch (err) {
      console.error('Erro no upload:', err)
      setError('Falha ao enviar a imagem. Tente novamente mais tarde.')
    } finally {
      setIsUploading(false)
    }
  }
  
  // Inicia a edição de uma imagem
  const startEditingImage = (image: GalleryImage) => {
    setEditingImage(image.id)
    setImageTitle(image.title || '')
    setImageDescription(image.description || '')
    setImageFeatured(image.featured)
  }
  
  // Cancela a edição de uma imagem
  const cancelEditingImage = () => {
    setEditingImage(null)
    setImageTitle('')
    setImageDescription('')
    setImageFeatured(false)
  }
  
  // Salva as alterações de uma imagem
  const saveImageChanges = async (imageId: string) => {
    if (!session?.user?.id) return
    
    try {
      setError(null)
      
      const response = await fetch(`/api/athlete-gallery/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: imageTitle,
          description: imageDescription,
          featured: imageFeatured
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao atualizar imagem')
      }
      
      // Atualiza a galeria com o ID correto do atleta
      if (realAthleteId) {
        fetchAthleteGallery(realAthleteId)
      }
      
      // Reseta o estado de edição
      cancelEditingImage()
    } catch (err) {
      console.error('Erro ao atualizar imagem:', err)
      setError('Não foi possível atualizar a imagem. Tente novamente mais tarde.')
    }
  }
  
  // Remove uma imagem da galeria
  const deleteImage = async (imageId: string) => {
    if (!session?.user?.id || !confirm('Tem certeza que deseja remover esta imagem?')) return
    
    try {
      setError(null)
      console.log(`Tentando excluir imagem com ID: ${imageId}`)
      
      const response = await fetch(`/api/athlete-gallery/${imageId}`, {
        method: 'DELETE'
      })
      
      const responseData = await response.json()
      console.log('Resposta da exclusão:', responseData)
      
      if (!response.ok) {
        throw new Error('Falha ao remover imagem')
      }
      
      // Atualiza a galeria com o ID correto do atleta
      if (realAthleteId) {
        fetchAthleteGallery(realAthleteId)
      }
    } catch (err) {
      console.error('Erro ao remover imagem:', err)
      setError('Não foi possível remover a imagem. Tente novamente mais tarde.')
    }
  }
  
  // Marca uma imagem como destacada
  const setFeaturedImage = async (imageId: string) => {
    if (!session?.user?.id) return
    
    try {
      setError(null)
      
      const response = await fetch(`/api/athlete-gallery/${imageId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          featured: true
        })
      })
      
      if (!response.ok) {
        throw new Error('Falha ao destacar imagem')
      }
      
      // Atualiza a galeria com o ID correto do atleta
      if (realAthleteId) {
        fetchAthleteGallery(realAthleteId)
      }
    } catch (err) {
      console.error('Erro ao destacar imagem:', err)
      setError('Não foi possível destacar a imagem. Tente novamente mais tarde.')
    }
  }
  
  // Se não houver sessão ou usuário, não mostra nada
  if (!session || !session.user) {
    return null
  }
  
  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h2 className="text-xl font-bold text-[#08285d] mb-6">Meu Perfil de Atleta</h2>
      
      {/* Abas para navegar entre perfil e galeria */}
      <div className="flex border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'profile'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Informações
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'gallery'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-blue-500'
          }`}
          onClick={() => setActiveTab('gallery')}
        >
          Galeria de Fotos
        </button>
      </div>
      
      {/* Exibe erros ou mensagens de sucesso */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-md p-3 mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-600 rounded-md p-3 mb-4">
          {success}
        </div>
      )}
      
      {loading ? (
        <div className="flex justify-center items-center py-10">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Aba de informações do perfil */}
          {activeTab === 'profile' && (
            <div>
              <div className="space-y-6">
                {/* Biografia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Biografia
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                    placeholder="Conte um pouco sobre você, sua história no ciclismo..."
                    value={profile.biography || ''}
                    onChange={handleBiographyChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Sua biografia será exibida publicamente na sua página de perfil.
                  </p>
                </div>
                
                {/* Conquistas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Conquistas
                  </label>
                  <textarea
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[150px]"
                    placeholder="Liste suas principais conquistas, pódios, recordes..."
                    value={profile.achievements || ''}
                    onChange={handleAchievementsChange}
                  />
                </div>
                
                {/* Redes sociais */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Redes Sociais
                  </label>
                  
                  <div className="space-y-3">
                    {/* Instagram */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-pink-50 text-pink-500">
                        <Instagram size={20} />
                      </div>
                      <input
                        type="text"
                        className="ml-3 flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Seu usuário do Instagram (ex: @ciclista)"
                        value={profile.socialMedia?.instagram || ''}
                        onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
                      />
                    </div>
                    
                    {/* Facebook */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-500">
                        <Facebook size={20} />
                      </div>
                      <input
                        type="text"
                        className="ml-3 flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Seu perfil do Facebook (ex: seuusuario)"
                        value={profile.socialMedia?.facebook || ''}
                        onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
                      />
                    </div>
                    
                    {/* Twitter */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-400">
                        <Twitter size={20} />
                      </div>
                      <input
                        type="text"
                        className="ml-3 flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Seu usuário do Twitter (ex: @ciclista)"
                        value={profile.socialMedia?.twitter || ''}
                        onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
                      />
                    </div>
                    
                    {/* Website */}
                    <div className="flex items-center">
                      <div className="w-10 h-10 flex items-center justify-center rounded-full bg-green-50 text-green-500">
                        <Globe size={20} />
                      </div>
                      <input
                        type="text"
                        className="ml-3 flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Seu site ou blog (ex: www.meusite.com)"
                        value={profile.websiteUrl || ''}
                        onChange={handleWebsiteChange}
                      />
                    </div>
                  </div>
                </div>
                
                {/* Seção de Modalidade, Categoria e Gênero */}
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-4">Informações Esportivas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Modalidade */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Modalidade Principal
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={profile.modalityId || ''}
                        onChange={handleModalityChange}
                      >
                        <option value="">Selecione uma modalidade</option>
                        {loadingOptions ? (
                          <option disabled>Carregando...</option>
                        ) : (
                          modalities.map(modality => (
                            <option key={modality.id} value={modality.id}>
                              {modality.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    {/* Categoria */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={profile.categoryId || ''}
                        onChange={handleCategoryChange}
                      >
                        <option value="">Selecione uma categoria</option>
                        {loadingOptions ? (
                          <option disabled>Carregando...</option>
                        ) : (
                          categories.map(category => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    
                    {/* Gênero */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Gênero
                      </label>
                      <select
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={profile.genderId || ''}
                        onChange={handleGenderChange}
                      >
                        <option value="">Selecione um gênero</option>
                        {loadingOptions ? (
                          <option disabled>Carregando...</option>
                        ) : (
                          genders.map(gender => (
                            <option key={gender.id} value={gender.id}>
                              {gender.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                  </div>
                </div>
                
                {/* Botão de salvar */}
                <div className="pt-4">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-md px-4 py-2 font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Salvar Perfil</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Aba de galeria */}
          {activeTab === 'gallery' && (
            <div>
              {/* Upload de imagem */}
              <div className="mb-6 border border-dashed border-gray-300 rounded-lg p-6">
                <div className="space-y-4">
                  {/* Campos de título e descrição */}
                  <div>
                    <label htmlFor="image-title" className="block text-sm font-medium text-gray-700 mb-1">
                      Título da foto (opcional)
                    </label>
                    <input
                      type="text"
                      id="image-title"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Ex.: Primeira competição"
                      value={imageTitle}
                      onChange={(e) => setImageTitle(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="image-description" className="block text-sm font-medium text-gray-700 mb-1">
                      Descrição (opcional)
                    </label>
                    <textarea
                      id="image-description"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Adicione detalhes sobre esta foto"
                      value={imageDescription}
                      onChange={(e) => setImageDescription(e.target.value)}
                      disabled={isUploading}
                    />
                  </div>
                  
                  <div className="pt-2">
                    <input
                      type="file"
                      id="image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={isUploading}
                    />
                    
                    <label
                      htmlFor="image-upload"
                      className={`flex flex-col items-center justify-center cursor-pointer border-2 border-dashed border-gray-300 rounded-lg p-6 transition-colors ${
                        isUploading 
                          ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                          : 'hover:bg-gray-50 hover:border-blue-400'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center mb-3">
                        <Plus size={24} />
                      </div>
                      <p className="text-gray-700 font-medium">Clique para adicionar uma foto</p>
                      <p className="text-sm text-gray-500 mt-1">
                        PNG, JPG ou WEBP (máximo 5MB)
                      </p>
                    </label>
                  </div>
                </div>
                
                {/* Barra de progresso */}
                {uploadProgress > 0 && (
                  <div className="mt-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {uploadProgress < 100 ? 'Enviando...' : 'Concluído!'}
                    </p>
                  </div>
                )}
              </div>
              
              {/* Lista de imagens */}
              {gallery.length > 0 ? (
                <>
                  {editingImage ? (
                    // Modo de edição para a imagem selecionada
                    <div className="border rounded-lg p-4 mb-4 bg-white">
                      <h3 className="text-lg font-medium mb-3">Editar Imagem</h3>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                        <input
                          type="text"
                          value={imageTitle}
                          onChange={(e) => setImageTitle(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Adicione um título"
                        />
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                        <textarea
                          value={imageDescription}
                          onChange={(e) => setImageDescription(e.target.value)}
                          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Adicione uma descrição"
                          rows={3}
                        />
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={cancelEditingImage}
                          className="flex items-center gap-1 border border-gray-300 text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded text-sm"
                        >
                          <X size={16} />
                          <span>Cancelar</span>
                        </button>
                        
                        <button
                          onClick={() => saveImageChanges(editingImage)}
                          className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded text-sm hover:bg-blue-700"
                        >
                          <Check size={16} />
                          <span>Salvar Alterações</span>
                        </button>
                      </div>
                    </div>
                  ) : null}
                  
                  {/* Componente de Visualização da Galeria */}
                  <AthleteGalleryView 
                    images={gallery}
                    onEdit={startEditingImage}
                    onDelete={deleteImage}
                    onSetFeatured={setFeaturedImage}
                  />
                </>
              ) : (
                <div className="text-center py-10 border rounded-lg bg-gray-50">
                  <p className="text-gray-600">
                    Você ainda não adicionou nenhuma foto à sua galeria.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Adicione fotos para complementar seu perfil de atleta.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
