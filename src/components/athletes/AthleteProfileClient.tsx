'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { processProfileImageUrl } from '@/lib/processProfileImageUrl'
import { useRouter } from 'next/navigation'
import { Instagram, Twitter, Facebook, Globe, ChevronLeft, Trophy, Calendar, MapPin, Home, X, Award, Medal } from 'lucide-react'
import { AthleteDetails } from '@/types/athlete'

interface AthleteProfileClientProps {
  athlete: AthleteDetails
}

export function AthleteProfileClient({ athlete }: AthleteProfileClientProps) {
  const router = useRouter()
  
  // Estado para o lightbox da galeria
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageTitle, setSelectedImageTitle] = useState<string | null>(null)
  const [selectedImageDescription, setSelectedImageDescription] = useState<string | null>(null)
  
  // Calcula a idade do atleta
  const calculateAge = (birthDate: string) => {
    const today = new Date()
    const birthDateObj = new Date(birthDate)
    let age = today.getFullYear() - birthDateObj.getFullYear()
    const monthDiff = today.getMonth() - birthDateObj.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--
    }
    
    return age
  }
  
  // Formata a data para exibição
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  
  // Abre o lightbox com a imagem selecionada
  const openLightbox = (imageUrl: string, title: string | null, description: string | null) => {
    setSelectedImage(imageUrl)
    setSelectedImageTitle(title)
    setSelectedImageDescription(description)
    // Previne o scroll do body enquanto o lightbox está aberto
    document.body.style.overflow = 'hidden'
  }
  
  // Fecha o lightbox
  const closeLightbox = () => {
    setSelectedImage(null)
    setSelectedImageTitle(null)
    setSelectedImageDescription(null)
    // Restaura o scroll
    document.body.style.overflow = 'auto'
  }
  
  return (
    <>
      {/* Cabeçalho do perfil com informações principais */}
      <div className="bg-[#08285d] text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center mb-6">
            <button
              onClick={() => router.push('/atletas')}
              className="flex items-center gap-1 text-gray-300 hover:text-white"
            >
              <ChevronLeft size={16} />
              <span>Voltar para atletas</span>
            </button>
          </div>
          
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            {/* Foto do atleta - ajustada para manter formato redondo em todos os dispositivos */}
            <div className="mx-auto w-36 h-36 md:w-48 md:h-48 relative rounded-full overflow-hidden bg-gray-200 border-4 border-white flex-shrink-0">
              {athlete.profileImage ? (
                <Image
                  src={processProfileImageUrl(athlete.profileImage)}
                  alt={athlete.fullName}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 192px"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/images/placeholder-athlete.jpg'
                    target.onerror = null
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-200">
                  <Image
                    src="/images/placeholder-athlete.jpg"
                    alt="Imagem não disponível"
                    width={192}
                    height={192}
                    className="object-cover"
                  />
                </div>
              )}
            </div>
            
            {/* Informações básicas */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-4xl font-bold">{athlete.fullName}</h1>
              
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {/* Clube */}
                <div className="flex items-center gap-2">
                  <Home size={18} className="text-blue-400" />
                  <span>Clube: {athlete.club.name}</span>
                </div>
                
                {/* Modalidade */}
                {athlete.modality && (
                  <div className="flex items-center gap-2">
                    <Medal size={18} className="text-gray-400" />
                    <span>Modalidade: {athlete.modality}</span>
                  </div>
                )}
                
                {/* Categoria */}
                <div className="flex items-center gap-2">
                  <Trophy size={18} className="text-yellow-500" />
                  <span>Categoria: {athlete.category}</span>
                </div>
                
                {/* Idade */}
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-gray-300" />
                  <span>{calculateAge(athlete.birthDate)} anos ({formatDate(athlete.birthDate)})</span>
                </div>
                
                {/* Localidade */}
                <div className="flex items-center gap-2">
                  <MapPin size={18} className="text-red-400" />
                  <span>{athlete.city}, {athlete.state}</span>
                </div>
              </div>
              
              {/* Redes sociais */}
              {athlete.socialMedia && Object.values(athlete.socialMedia).some(value => value) && (
                <div className="mt-4 flex gap-3 justify-center md:justify-start">
                  {athlete.socialMedia.instagram && (
                    <a 
                      href={athlete.socialMedia.instagram.startsWith('http') 
                        ? athlete.socialMedia.instagram 
                        : `https://instagram.com/${athlete.socialMedia.instagram.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-pink-400 transition-colors p-2"
                    >
                      <Instagram size={24} />
                    </a>
                  )}
                  
                  {athlete.socialMedia.facebook && (
                    <a 
                      href={athlete.socialMedia.facebook.startsWith('http') 
                        ? athlete.socialMedia.facebook 
                        : `https://facebook.com/${athlete.socialMedia.facebook}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-400 transition-colors p-2"
                    >
                      <Facebook size={24} />
                    </a>
                  )}
                  
                  {athlete.socialMedia.twitter && (
                    <a 
                      href={athlete.socialMedia.twitter.startsWith('http') 
                        ? athlete.socialMedia.twitter 
                        : `https://twitter.com/${athlete.socialMedia.twitter.replace('@', '')}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-blue-400 transition-colors p-2"
                    >
                      <Twitter size={24} />
                    </a>
                  )}
                  
                  {athlete.websiteUrl && (
                    <a 
                      href={athlete.websiteUrl.startsWith('http') 
                        ? athlete.websiteUrl 
                        : `https://${athlete.websiteUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-white hover:text-green-400 transition-colors p-2"
                    >
                      <Globe size={24} />
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal: biografia, conquistas e galeria */}
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Coluna da esquerda: biografia e conquistas */}
          <div className="lg:col-span-2 space-y-8">
            {/* Biografia */}
            {athlete.biography ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-[#08285d] mb-4">Biografia</h2>
                <div className="prose max-w-none">
                  {athlete.biography.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-[#08285d] mb-4">Biografia</h2>
                <p className="text-gray-500 text-center py-6">
                  Biografia não disponível.
                </p>
              </div>
            )}
            
            {/* Conquistas */}
            {athlete.achievements ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-[#08285d] mb-4">Conquistas</h2>
                <div className="prose max-w-none">
                  {athlete.achievements.split('\n').map((paragraph, index) => (
                    <p key={index} className="mb-4 text-gray-700">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-[#08285d] mb-4">Conquistas</h2>
                <p className="text-gray-500 text-center py-6">
                  Conquistas não disponíveis.
                </p>
              </div>
            )}
          </div>
          
          {/* Coluna da direita: galeria de fotos */}
          <div>
            {athlete.gallery.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-[#08285d] mb-4">Galeria de Fotos</h2>
                <div className="grid grid-cols-2 gap-3">
                  {athlete.gallery.map((image) => (
                    <div 
                      key={image.id} 
                      className="relative aspect-square overflow-hidden rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => openLightbox(image.imageUrl, image.title, image.description)}
                    >
                      <Image
                        src={image.imageUrl.startsWith('http') 
                          ? image.imageUrl 
                          : `/api/proxy?url=${encodeURIComponent(image.imageUrl)}`
                        }
                        alt={image.title || athlete.fullName}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = '/images/placeholder-athlete.jpg'
                          target.onerror = null
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-bold text-[#08285d] mb-4">Galeria de Fotos</h2>
                <p className="text-gray-500 text-center py-6">
                  Nenhuma foto disponível no momento.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Lightbox para visualização de imagens */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-4xl w-full h-full flex flex-col items-center justify-center">
            {/* Botão de fechar */}
            <button
              onClick={closeLightbox}
              className="absolute top-2 right-2 text-white bg-black bg-opacity-50 p-2 rounded-full hover:bg-opacity-70 z-10"
            >
              <X size={24} />
            </button>
            
            {/* Imagem */}
            <div className="relative max-h-[80vh] max-w-full">
              <Image
                src={selectedImage.startsWith('http') 
                  ? selectedImage 
                  : `/api/proxy?url=${encodeURIComponent(selectedImage)}`
                }
                alt={selectedImageTitle || athlete.fullName}
                width={1200}
                height={800}
                className="object-contain max-h-[80vh]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/images/placeholder-athlete.jpg'
                  target.onerror = null
                }}
              />
            </div>
            
            {/* Título e descrição da imagem */}
            {(selectedImageTitle || selectedImageDescription) && (
              <div className="bg-black bg-opacity-70 p-4 mt-4 max-w-2xl text-center">
                {selectedImageTitle && (
                  <h3 className="text-white font-bold text-lg mb-2">{selectedImageTitle}</h3>
                )}
                {selectedImageDescription && (
                  <p className="text-gray-300">{selectedImageDescription}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
