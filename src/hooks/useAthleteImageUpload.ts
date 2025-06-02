import { useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';

type UploadResult = {
  success: boolean;
  imageUrl?: string;
  error?: string;
};

/**
 * Hook para gerenciar o upload de imagens de perfil de atletas
 * 
 * @returns {Object} - Funções e estados para upload de imagem
 */
export function useAthleteImageUpload() {
  const { data: session, update } = useSession();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * Faz upload de uma imagem para o perfil do atleta
   * 
   * @param file - Arquivo de imagem a ser enviado
   * @param athleteId - ID do atleta (opcional, pega da sessão se não informado)
   * @returns Promise com o resultado do upload
   */
  const uploadImage = useCallback(async (file: File, athleteId?: string): Promise<UploadResult> => {
    if (!file) {
      return { success: false, error: 'Nenhum arquivo selecionado' };
    }

    // Validação do tipo de arquivo
    if (!file.type.startsWith('image/')) {
      return { success: false, error: 'O arquivo deve ser uma imagem' };
    }

    // Validação do tamanho do arquivo (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'A imagem deve ter no máximo 5MB' };
    }

    // Se não tiver um ID de atleta e não estiver autenticado, retorna erro
    const targetAthleteId = athleteId || (session?.user as any)?.athleteId;
    if (!targetAthleteId) {
      return { success: false, error: 'ID do atleta não encontrado' };
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('image', file);

      // Simular progresso (opcional, pode ser removido se não for necessário UI de progresso)
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const next = prev + Math.random() * 10;
          return next >= 90 ? 90 : next; // Não chega a 100% até a conclusão
        });
      }, 100);

      const response = await fetch(`/api/athletes/${targetAthleteId}/upload-image`, {
        method: 'POST',
        body: formData,
        // Não definir Content-Type manualmente, o navegador fará isso corretamente com o boundary
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao fazer upload da imagem');
      }

      const result = await response.json();
      
      // Atualizar a sessão com a nova imagem
      if (result.imageUrl) {
        await update({
          ...session,
          user: {
            ...session?.user,
            image: result.imageUrl,
          },
        });
      }

      return { success: true, imageUrl: result.imageUrl };
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setUploadError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsUploading(false);
      // Resetar progresso após um curto período para permitir a animação
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }, [session, update]);

  // Função para formatar o tamanho do arquivo em formato legível
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Função para validar o arquivo antes do upload
  const validateImageFile = (file: File): { valid: boolean; error?: string } => {
    // Tipos de imagem permitidos
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    
    if (!file) {
      return { valid: false, error: 'Nenhum arquivo selecionado' };
    }
    
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'Tipo de arquivo não suportado. Use JPEG, PNG, WebP ou GIF.' };
    }
    
    // Tamanho máximo: 5MB
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Arquivo muito grande. Tamanho máximo: ${formatFileSize(maxSize)}` 
      };
    }
    
    return { valid: true };
  };

  return {
    uploadImage,
    isUploading,
    uploadError,
    uploadProgress,
    clearError: () => setUploadError(null),
    formatFileSize,
    validateImageFile,
  };
}

export default useAthleteImageUpload;
