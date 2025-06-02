import { useEffect, useState, useCallback } from 'react';
import './CarouselBanner.css';

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

export const CarouselBanner = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca os banners da API
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('/api/banners');
        if (!response.ok) throw new Error('Erro ao carregar banners');
        const data = await response.json();
        // Filtra apenas banners com URLs de imagem válidas
        const validBanners = data.filter((banner: Banner) => 
          banner.image && 
          banner.image.trim() !== '' && 
          banner.image !== 'null' && 
          banner.image !== 'undefined'
        );
        setBanners(validBanners);
      } catch (err) {
        console.error('Erro ao carregar banners:', err);
        setError('Não foi possível carregar os banners');
      } finally {
        setIsLoading(false);
      }
    };

    fetchBanners();
  }, []);

  // Autoplay
  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => prev === banners.length - 1 ? 0 : prev + 1);
    }, 5000); // Muda a cada 5 segundos

    return () => clearInterval(interval);
  }, [banners.length]);

  // Remove banner com imagem inválida
  const handleImageError = useCallback((bannerId: string) => {
    setBanners(prev => prev.filter(b => b.id !== bannerId));
    // Se o banner atual foi removido, ajusta o índice
    setCurrentIndex(prev => prev >= banners.length - 1 ? 0 : prev);
  }, [banners.length]);

  // Não renderiza nada se não houver banners válidos
  if (isLoading) {
    return null;
  }

  if (error) {
    return null;
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <div className="carousel" aria-label="Banner rotativo" style={{marginTop: 0, marginBottom: 0}}>
      <div 
        className="carousel-container" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="carousel-slide">
            {banner.link ? (
              <a 
                href={banner.link} 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label={banner.title || 'Banner'}
                style={{display: 'block', lineHeight: 0}}
              >
                <img 
                  src={banner.image || '/placeholder-banner.jpg'} 
                  alt={banner.title || 'Banner'} 
                  onError={() => handleImageError(banner.id)}
                  style={{display: 'block', margin: 0}}
                />
              </a>
            ) : (
              <img 
                src={banner.image || '/placeholder-banner.jpg'} 
                alt={banner.title || 'Banner'} 
                onError={() => handleImageError(banner.id)}
                style={{display: 'block', margin: 0}}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
