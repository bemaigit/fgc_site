'use client';

import React, { useState } from 'react';
import { ImageUpload } from '@/components/ui/image-upload';
import { useCreateCalendarEvent } from '@/hooks/calendar/useCreateCalendarEvent';

// Tipagem explícita para o estado do formulário
interface CalendarFormState {
  title: string;
  description: string;
  startdate: string;
  enddate: string;
  modality: string;
  category: string;
  city: string;
  uf: string;
  status: string;
  website: string;
  highlight: boolean;
  imageFiles: File[];
  regulationFile: File | null;
}

export default function CalendarForm({ initialData, onSubmit }: {
  initialData?: any;
  onSubmit?: (data: any) => void;
}) {
  // Estado local para todos os campos do formulário
  const [form, setForm] = useState<CalendarFormState>({
    title: '',
    description: '',
    startdate: '',
    enddate: '',
    modality: '',
    category: '',
    city: '',
    uf: '',
    status: '',
    website: '',
    highlight: false,
    imageFiles: [],
    regulationFile: null,
  });

  // Estado para upload de imagem
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Estado de loading para o botão de submit
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hook para criar evento no calendário
  const { createEvent } = useCreateCalendarEvent();

  // Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Upload de imagem
  const handleImageFilesSelected = (files: File[]) => {
    setForm((prev) => ({ ...prev, imageFiles: files }));
  };
  const handleImageFileRemove = (index: number) => {
    setForm((prev) => ({
      ...prev,
      imageFiles: prev.imageFiles.filter((_, i) => i !== index),
    }));
  };

  // Upload de regulamento
  const handleRegulationFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setForm((prev) => ({ ...prev, regulationFile: file }));
  };

  // Função auxiliar para upload dos arquivos
  async function uploadFiles(): Promise<{ imageUrl?: string; regulationUrl?: string }> {
    const formData = new FormData();
    if (form.imageFiles.length > 0) {
      formData.append('image', form.imageFiles[0]);
    }
    if (form.regulationFile) {
      formData.append('regulation', form.regulationFile);
    }
    if (formData.has('image') || formData.has('regulation')) {
      const res = await fetch('/api/upload/calendar', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Erro ao fazer upload dos arquivos');
      return res.json();
    }
    return {};
  }

  // Submit (enviar dados para API)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Upload dos arquivos para o MinIO
      const uploaded = await uploadFiles();
      // 2. Montar dados do evento
      const eventData = {
        title: form.title,
        description: form.description,
        startdate: form.startdate ? new Date(form.startdate).toISOString() : null,
        enddate: form.enddate ? new Date(form.enddate).toISOString() : null,
        modality: form.modality,
        category: form.category,
        city: form.city,
        uf: form.uf,
        status: form.status,
        website: form.website,
        highlight: form.highlight,
        imageurl: uploaded.imageUrl || undefined,
        regulationpdf: uploaded.regulationUrl || undefined,
      };
      // 3. Criar evento via API
      await createEvent(eventData);
      if (onSubmit) onSubmit(eventData);
      // TODO: feedback de sucesso/erro
    } catch (err) {
      // TODO: feedback de erro
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-xl space-y-4">
      <h2 className="text-xl font-bold mb-4">Novo Evento no Calendário</h2>
      <div>
        <label className="block font-medium mb-1">Título *</label>
        <input name="title" value={form.title} onChange={handleChange} required className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium mb-1">Descrição</label>
        <textarea name="description" value={form.description} onChange={handleChange} className="textarea textarea-bordered w-full" />
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1">Data Início *</label>
          <input name="startdate" type="datetime-local" value={form.startdate} onChange={handleChange} required className="input input-bordered w-full" />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">Data Fim *</label>
          <input name="enddate" type="datetime-local" value={form.enddate} onChange={handleChange} required className="input input-bordered w-full" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1">Modalidade *</label>
          <input name="modality" value={form.modality} onChange={handleChange} required className="input input-bordered w-full" />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">Categoria *</label>
          <input name="category" value={form.category} onChange={handleChange} required className="input input-bordered w-full" />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block font-medium mb-1">Cidade *</label>
          <input name="city" value={form.city} onChange={handleChange} required className="input input-bordered w-full" />
        </div>
        <div className="flex-1">
          <label className="block font-medium mb-1">UF *</label>
          <input name="uf" value={form.uf} maxLength={2} onChange={handleChange} required className="input input-bordered w-full" />
        </div>
      </div>
      <div>
        <label className="block font-medium mb-1">Status *</label>
        <input name="status" value={form.status} onChange={handleChange} required className="input input-bordered w-full" />
      </div>
      <div>
        <label className="block font-medium mb-1">Website</label>
        <input name="website" value={form.website} onChange={handleChange} className="input input-bordered w-full" />
      </div>
      <div className="flex items-center gap-2">
        <input name="highlight" type="checkbox" checked={form.highlight} onChange={handleChange} />
        <label className="font-medium">Destaque</label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Cartaz/Imagem do Evento (opcional)</label>
        <ImageUpload
          files={form.imageFiles}
          onFilesSelected={handleImageFilesSelected}
          onFileRemove={handleImageFileRemove}
          isUploading={isUploadingImage}
          maxFiles={1}
          maxSize={2 * 1024 * 1024}
        />
        <p className="text-xs text-muted-foreground">A imagem será enviada para o MinIO na pasta <b>calendario/</b>.</p>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-1">Regulamento (PDF ou arquivo, opcional)</label>
        <input type="file" accept=".pdf,.doc,.docx,.odt" onChange={handleRegulationFile} />
        {form.regulationFile && <span className="ml-2 text-xs">{form.regulationFile.name}</span>}
        <p className="text-xs text-muted-foreground">O regulamento será enviado para o MinIO na pasta <b>calendario/regulamento/</b>.</p>
      </div>
      <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Salvando...' : 'Salvar Evento'}
      </button>
    </form>
  );
}
