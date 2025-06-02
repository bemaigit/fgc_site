'use client'

import { useCallback } from 'react'
import { FileImage, Loader2, X } from 'lucide-react'
import Image from 'next/image'
import { useDropzone } from 'react-dropzone'
import { toast } from './use-toast'

interface ImageUploadProps {
  files: File[]
  onFilesSelected: (files: File[]) => void
  onFileRemove: (index: number) => void
  isUploading?: boolean
  maxFiles?: number
  maxSize?: number // em bytes
}

export function ImageUpload({
  files,
  onFilesSelected,
  onFileRemove,
  isUploading,
  maxFiles = 10,
  maxSize = 2 * 1024 * 1024, // 2MB default
}: ImageUploadProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const validFiles = acceptedFiles.filter((file) => {
        // Verificar tamanho
        if (file.size > maxSize) {
          toast({
            title: 'Arquivo muito grande',
            description: `O arquivo ${file.name} excede o tamanho máximo permitido de ${maxSize / 1024 / 1024}MB`,
            variant: 'destructive',
          })
          return false
        }

        // Verificar tipo
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Tipo de arquivo inválido',
            description: `O arquivo ${file.name} não é uma imagem`,
            variant: 'destructive',
          })
          return false
        }

        return true
      })

      if (validFiles.length + files.length > maxFiles) {
        toast({
          title: 'Limite de arquivos excedido',
          description: `Você pode enviar no máximo ${maxFiles} imagens`,
          variant: 'destructive',
        })
        return
      }

      onFilesSelected(validFiles)
    },
    [files.length, maxFiles, maxSize, onFilesSelected]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg']
    },
    maxSize,
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-colors duration-200 text-center
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-zinc-300'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} disabled={isUploading} />
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Enviando imagens...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <FileImage className="h-8 w-8 text-zinc-400" />
            <div className="text-sm text-zinc-600">
              <p>
                <span className="font-semibold text-primary">
                  Clique para selecionar
                </span>{' '}
                ou arraste as imagens aqui
              </p>
              <p className="text-xs text-zinc-400 mt-1">
                JPEG/JPG até {maxSize / 1024 / 1024}MB
              </p>
            </div>
          </div>
        )}
      </div>

      {files.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="relative aspect-square rounded-lg overflow-hidden group"
            >
              <Image
                src={URL.createObjectURL(file)}
                alt={file.name}
                className="object-cover"
                fill
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              <button
                type="button"
                onClick={() => onFileRemove(index)}
                className="absolute top-1 right-1 p-1 rounded-full bg-zinc-900/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                disabled={isUploading}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
