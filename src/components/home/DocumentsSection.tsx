'use client'

import { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Download, LogIn, ChevronRight, FileText, FileSpreadsheet, FileType, File } from 'lucide-react'
import { formatFileSize } from '@/lib/utils'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { processDocumentUrl } from '@/lib/processDocumentUrl'

interface Document {
  id: string
  title: string
  description?: string
  fileName: string
  fileSize: number
  mimeType: string
  downloads: number
  createdAt: string
  fileUrl?: string
}

export default function DocumentsSection() {
  const { data: session } = useSession()
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  const sliderRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/documents')
      if (!response.ok) throw new Error('Erro ao carregar documentos')
      const data = await response.json()
      const sortedData = data.sort((a: Document, b: Document) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setDocuments(sortedData)
      setError(null)
    } catch (err) {
      console.error('Erro ao carregar documentos:', err)
      setError('Não foi possível carregar os documentos')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async (doc: Document) => {
    if (!session) return

    try {
      setDownloading(doc.id)
      setError(null)
      
      // Podemos usar o proxy diretamente se já temos a URL do arquivo
      if (doc.fileUrl) {
        // Usar o processador de URL para obter a URL via proxy
        const proxyUrl = processDocumentUrl(doc.fileUrl)
        
        const link = window.document.createElement('a')
        link.href = proxyUrl
        link.download = doc.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Atualizar o contador de downloads (opcional, pode ser removido se causar problemas)
        try {
          await fetch(`/api/documents/update-downloads/${doc.id}`, {
            method: 'POST'
          })
        } catch (e) {
          console.warn('Erro ao atualizar contador de downloads:', e)
        }
        
        return
      }
      
      // Caso não tenhamos a URL direta, usamos o endpoint original
      const response = await fetch(`/api/documents/download/${doc.id}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Erro ao gerar link de download' }))
        throw new Error(errorData.error || 'Erro ao gerar link de download')
      }

      const data = await response.json()
      
      if (!data.url) {
        throw new Error('URL de download inválida')
      }
      
      const link = window.document.createElement('a')
      link.href = data.url
      link.download = doc.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Erro ao baixar documento:', err)
      setError(err instanceof Error ? err.message : 'Erro ao baixar o documento')
    } finally {
      setDownloading(null)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    const slider = sliderRef.current;
    setStartX(e.pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
    slider.style.cursor = 'grabbing'; 
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !sliderRef.current) return;
    e.preventDefault();
    const slider = sliderRef.current;
    const x = e.pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5; 
    slider.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging || !sliderRef.current) return;
    setIsDragging(false);
    sliderRef.current.style.cursor = 'grab'; 
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (!sliderRef.current) return;
    setIsDragging(true);
    const slider = sliderRef.current;
    setStartX(e.touches[0].pageX - slider.offsetLeft);
    setScrollLeft(slider.scrollLeft);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !sliderRef.current) return;
    const slider = sliderRef.current;
    const x = e.touches[0].pageX - slider.offsetLeft;
    const walk = (x - startX) * 1.5;
    slider.scrollLeft = scrollLeft - walk;
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="lg" /> 
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{error}</p>
        <button 
          onClick={fetchDocuments}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Tentar novamente
        </button>
      </div>
    )
  }

  if (documents.length === 0) {
     return (
       <div className="text-center py-8">
         <p className="text-gray-500">Nenhum documento disponível no momento.</p>
       </div>
     ) 
   }

  return (
    <section className="py-6 pb-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-bold text-[#08285d]">Documentos</h2>
          <Link 
            href="/documentos" 
            className="text-sm text-[#08285d] hover:text-[#7db0de] flex items-center"
          >
            Ver todos <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        <p className="text-sm sm:text-base text-gray-600 mt-2 mb-6">
          Acesse os documentos oficiais<br className="inline sm:hidden" /> 
          da Federação Goiana de Ciclismo
        </p>
      </div>

      <div 
        ref={containerRef} 
        className="w-full max-w-[1300px] mx-auto pl-3 pr-0 sm:pl-4 sm:pr-0 md:px-6 relative overflow-hidden"
      >
        <div 
          ref={sliderRef}
          className="overflow-x-auto scrollbar-hide cursor-grab active:cursor-grabbing"
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none' 
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUpOrLeave} 
          onMouseLeave={handleMouseUpOrLeave} 
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="flex gap-3 sm:gap-4 md:gap-5 overflow-x-visible snap-x snap-mandatory scrollbar-hide min-w-full">
            {documents.map((doc) => {
              // Determinar o ícone baseado no tipo de arquivo
              let FileIcon = FileText;
              if (doc.mimeType.includes('pdf')) {
                FileIcon = FileType;
              } else if (doc.mimeType.includes('spreadsheet') || doc.mimeType.includes('excel') || doc.fileName.endsWith('.xlsx') || doc.fileName.endsWith('.xls')) {
                FileIcon = FileSpreadsheet;
              }
              
              return (
                <div 
                  key={doc.id} 
                  className="flex-shrink-0 snap-start pr-3 sm:pr-4 first:ml-0 w-[45%] sm:w-[45%] md:w-[32%] lg:w-[24%] xl:w-[20%]"
                >
                  <div
                    className="bg-white rounded-xl border-2 border-[#08285d] shadow-[0_4px_10px_rgba(0,0,0,0.3)] hover:shadow-[0_6px_15px_rgba(0,0,0,0.3)] transition-all duration-300 h-full flex flex-col overflow-hidden"
                  >
                    <div className="p-4 sm:p-5 flex-grow flex flex-col"> 
                      <div className="flex items-start mb-2">
                        <div className="bg-blue-50 p-1.5 rounded-lg mr-2">
                          <FileIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <h3 className="text-xs sm:text-sm font-medium text-gray-800 line-clamp-2 flex-1">{doc.title}</h3>
                      </div>
                      
                      {doc.description && (
                        <p className="text-gray-500 text-xs mb-1 line-clamp-2">{doc.description}</p> 
                      )}
                      
                      <div className="flex justify-end items-center text-xs text-gray-500 mt-auto pt-1 border-t border-gray-100"> 
                        <span>{doc.downloads} downloads</span>
                      </div>
                    </div>
                      
                    <div className="px-3 pb-2"> 
                      {session ? (
                        <button
                          onClick={() => handleDownload(doc)}
                          disabled={downloading === doc.id}
                          className="w-full flex items-center justify-center gap-1 bg-blue-600 hover:bg-blue-700 text-white py-1.5 px-2 rounded-md transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-xs font-medium"
                        >
                          {downloading === doc.id ? (
                            <span className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full" />
                          ) : (
                            <Download className="h-3 w-3" />
                          )}
                          <span className="truncate"> 
                            {downloading === doc.id ? 'Baixando...' : 'Baixar'}
                          </span>
                        </button>
                      ) : (
                        <Link 
                          href="/login" 
                          className="w-full flex items-center justify-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-1.5 px-2 rounded-md transition-all transform hover:-translate-y-0.5 text-xs font-medium"
                        >
                          <LogIn className="h-3 w-3" />
                          <span className="truncate">Login para baixar</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
