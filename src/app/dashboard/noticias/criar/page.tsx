'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { processNewsImageUrl } from '@/lib/processNewsImageUrl'

const newsSchema = z.object({
  title: z.string().min(3, 'Título muito curto'),
  content: z.string().min(10, 'Conteúdo muito curto'),
  excerpt: z.string().max(160, 'Resumo muito longo').optional(),
  published: z.boolean().default(false),
})

type NewsFormData = z.infer<typeof newsSchema>

// Interface para as props do Editor
interface TiptapEditorProps {
  value: string;
  onChange: (content: string) => void;
}

// Componente do Editor Tiptap
const TiptapEditor = ({ value, onChange }: TiptapEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-300 rounded-md">
      <div className="bg-gray-100 p-2 border-b border-gray-300 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bold') ? 'bg-[#08285d] text-white' : 'bg-white'}`}
        >
          Negrito
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-2 py-1 rounded ${editor.isActive('italic') ? 'bg-[#08285d] text-white' : 'bg-white'}`}
        >
          Itálico
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`px-2 py-1 rounded ${editor.isActive('heading', { level: 2 }) ? 'bg-[#08285d] text-white' : 'bg-white'}`}
        >
          Título
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-2 py-1 rounded ${editor.isActive('bulletList') ? 'bg-[#08285d] text-white' : 'bg-white'}`}
        >
          Lista
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-2 py-1 rounded ${editor.isActive('orderedList') ? 'bg-[#08285d] text-white' : 'bg-white'}`}
        >
          Lista Numerada
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL:')
            if (url) {
              editor.chain().focus().setLink({ href: url }).run()
            }
          }}
          className={`px-2 py-1 rounded ${editor.isActive('link') ? 'bg-[#08285d] text-white' : 'bg-white'}`}
        >
          Link
        </button>
        <button
          type="button"
          onClick={() => {
            const url = window.prompt('URL da imagem:')
            if (url) {
              editor.chain().focus().setImage({ src: url }).run()
            }
          }}
          className="px-2 py-1 rounded bg-white"
        >
          Imagem
        </button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-4 min-h-[300px]" />
    </div>
  )
}

export default function CreateNewsPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [coverImage, setCoverImage] = useState<File | null>(null)
  const [additionalImages, setAdditionalImages] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<NewsFormData>({
    resolver: zodResolver(newsSchema),
  })

  const onSubmit = async (data: NewsFormData) => {
    setIsSubmitting(true)
    try {
      // Primeiro faz upload da imagem de capa
      let coverImageUrl = ''
      if (coverImage) {
        const formData = new FormData()
        formData.append('file', coverImage)
        formData.append('type', 'news') // Indicar que é uma imagem de notícia
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        })
        
        const { url, proxyUrl } = await uploadRes.json()
        // Extrair apenas o caminho relativo para armazenar no banco de dados
        // isso garante compatibilidade com o proxy em todos os ambientes
        let relativePath = '';
        try {
          // Tentar extrair o caminho relativo da URL completa
          const urlObj = new URL(url);
          relativePath = urlObj.pathname.replace(/^\/storage\//, '').replace(/^\/fgc\//, '');
        } catch (error) {
          // Se não é uma URL válida, assumir que já é um caminho relativo
          relativePath = url;
        }
        
        coverImageUrl = relativePath
        console.log('Imagem de capa processada:', { url, proxyUrl, relativePath })
      }

      // Upload de imagens adicionais
      const additionalImageUrls = await Promise.all(
        additionalImages.map(async (file) => {
          const formData = new FormData()
          formData.append('file', file)
          formData.append('type', 'news') // Indicar que é uma imagem de notícia
          
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
          })
          
          const { url, proxyUrl } = await uploadRes.json()
          // Extrair o caminho relativo da imagem adicional
          let relativePath = '';
          try {
            // Tentar extrair o caminho relativo da URL completa
            const urlObj = new URL(url);
            relativePath = urlObj.pathname.replace(/^\/storage\//, '').replace(/^\/fgc\//, '');
          } catch (error) {
            // Se não é uma URL válida, assumir que já é um caminho relativo
            relativePath = url;
          }
          
          console.log('Imagem adicional processada:', { url, proxyUrl, relativePath })
          return relativePath
        })
      )

      // Cria a notícia
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          coverImage: coverImageUrl,
          images: additionalImageUrls.map((url, index) => ({
            url,
            order: index,
          })),
        }),
      })

      if (!response.ok) throw new Error('Erro ao criar notícia')

      // Redireciona para a listagem
      window.location.href = '/dashboard/noticias'
    } catch (error) {
      console.error('Erro ao criar notícia:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Imagem muito grande. Máximo 2MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        alert('Arquivo não é uma imagem')
        return
      }
      setCoverImage(file)
    }
  }

  const handleAdditionalImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter((file) => {
      if (file.size > 2 * 1024 * 1024) {
        alert(`Imagem ${file.name} muito grande. Máximo 2MB`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        alert(`Arquivo ${file.name} não é uma imagem`)
        return false
      }
      return true
    })
    setAdditionalImages((prev) => [...prev, ...validFiles])
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Nova Notícia</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Título */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Título
          </label>
          <input
            type="text"
            id="title"
            {...register('title')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#7db0de] focus:outline-none focus:ring-1 focus:ring-[#7db0de] sm:text-sm"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* Imagem de Capa */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Imagem de Capa
          </label>
          <div className="mt-1 flex items-center space-x-4">
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#08285d] file:text-white hover:file:bg-[#7db0de]"
            />
            {coverImage && (
              <img
                src={URL.createObjectURL(coverImage)}
                alt="Preview"
                className="h-20 w-20 object-cover rounded-md"
              />
            )}
          </div>
        </div>

        {/* Imagens Adicionais */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Imagens Adicionais
          </label>
          <div className="mt-1">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleAdditionalImagesChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-[#08285d] file:text-white hover:file:bg-[#7db0de]"
            />
          </div>
          {additionalImages.length > 0 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {additionalImages.map((file, index) => (
                <img
                  key={index}
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${index + 1}`}
                  className="h-20 w-20 object-cover rounded-md"
                />
              ))}
            </div>
          )}
        </div>

        {/* Resumo */}
        <div>
          <label htmlFor="excerpt" className="block text-sm font-medium text-gray-700">
            Resumo
          </label>
          <textarea
            id="excerpt"
            {...register('excerpt')}
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-[#7db0de] focus:outline-none focus:ring-1 focus:ring-[#7db0de] sm:text-sm"
          />
          {errors.excerpt && (
            <p className="mt-1 text-sm text-red-600">{errors.excerpt.message}</p>
          )}
        </div>

        {/* Conteúdo */}
        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
            Conteúdo
          </label>
          <Controller
            name="content"
            control={control}
            render={({ field }) => (
              <TiptapEditor value={field.value || ''} onChange={field.onChange} />
            )}
          />
          {errors.content && (
            <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
          )}
        </div>

        {/* Status de Publicação */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="published"
            {...register('published')}
            className="h-4 w-4 rounded border-gray-300 text-[#08285d] focus:ring-[#7db0de]"
          />
          <label htmlFor="published" className="ml-2 block text-sm text-gray-900">
            Publicar imediatamente
          </label>
        </div>

        {/* Botões */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => window.location.href = '/dashboard/noticias'}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#08285d] hover:bg-[#7db0de] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#7db0de] disabled:opacity-50"
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}
