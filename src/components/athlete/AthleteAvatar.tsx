import Image from 'next/image';
import { useState } from 'react';
import { processAthleteImageUrl } from '@/lib/processAthleteImageUrl';

interface AthleteAvatarProps {
  src: string | null | undefined;
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
  priority?: boolean;
}

/**
 * Componente para exibir a foto de perfil de um atleta
 * 
 * @param src - URL da imagem do perfil (pode ser relativa ou absoluta)
 * @param alt - Texto alternativo para acessibilidade
 * @param width - Largura da imagem em pixels
 * @param height - Altura da imagem em pixels (opcional, se não definido, será igual à largura)
 * @param className - Classes CSS adicionais
 * @param fallbackSrc - URL de fallback caso a imagem principal falhe
 * @param priority - Se true, prioriza o carregamento da imagem (para LCP)
 */
export function AthleteAvatar({
  src,
  alt = 'Foto de perfil',
  width = 100,
  height,
  className = '',
  fallbackSrc = '/images/user-placeholder.png',
  priority = false,
}: AthleteAvatarProps) {
  const [imgSrc, setImgSrc] = useState(processAthleteImageUrl(src || ''));
  const [hasError, setHasError] = useState(false);

  // Se não houver src ou ocorrer erro, usar fallback
  const imageSrc = !src || hasError ? fallbackSrc : imgSrc;
  const imageAlt = alt || 'Foto de perfil';
  const imageHeight = height || width;

  // Estilos para o container
  const containerStyle = {
    width: `${width}px`,
    height: `${imageHeight}px`,
    position: 'relative' as const,
    overflow: 'hidden',
    borderRadius: '50%', // Torna a imagem redonda
    backgroundColor: '#f5f5f5',
  };

  // Estilos para a imagem
  const imageStyle = {
    objectFit: 'cover' as const,
    objectPosition: 'center',
  };

  // Função para lidar com erros de carregamento
  const handleError = () => {
    console.error(`Erro ao carregar a imagem: ${src}`);
    setHasError(true);
  };

  return (
    <div className={`athlete-avatar ${className}`} style={containerStyle}>
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={width}
        height={imageHeight}
        style={imageStyle}
        onError={handleError}
        priority={priority}
        unoptimized={imageSrc.startsWith('/api/')} // Desativa otimização para imagens do proxy
      />
    </div>
  );
}

export default AthleteAvatar;
