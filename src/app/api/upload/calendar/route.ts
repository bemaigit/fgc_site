import { NextRequest, NextResponse } from 'next/server';
import { minioClient } from '@/lib/minio';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File | null;
    const regulation = formData.get('regulation') as File | null;
    const uploaded: { imageUrl?: string; regulationUrl?: string } = {};

    // Determinar o baseUrl para as URLs da API
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    
    // Upload imagem
    if (image) {
      const ext = image.name.split('.').pop();
      const filename = `calendario/${randomUUID()}.${ext}`;
      const arrayBuffer = await image.arrayBuffer();
      await minioClient.putObject(
        process.env.MINIO_BUCKET!,
        filename,
        Buffer.from(arrayBuffer),
        undefined,
        { 'Content-Type': image.type }
      );
      
      // Retornar a URL usando o novo endpoint de proxy
      uploaded.imageUrl = `${baseUrl}/api/calendar/image?path=${encodeURIComponent(filename)}`;
      
      // Logar o caminho da imagem para depuração
      console.log(`[Calendar Upload] Imagem salva em: ${filename}`);
      console.log(`[Calendar Upload] URL do proxy da imagem: ${uploaded.imageUrl}`);
    }

    // Upload regulamento
    if (regulation) {
      const ext = regulation.name.split('.').pop();
      const filename = `calendario/regulamento/${randomUUID()}.${ext}`;
      const arrayBuffer = await regulation.arrayBuffer();
      await minioClient.putObject(
        process.env.MINIO_BUCKET!,
        filename,
        Buffer.from(arrayBuffer),
        undefined,
        { 'Content-Type': regulation.type }
      );
      
      // Por enquanto, mantemos a URL direta para o regulamento
      // Em uma futura atualização, podemos criar um proxy específico para regulamentos
      uploaded.regulationUrl = `${process.env.MINIO_ENDPOINT}/${process.env.MINIO_BUCKET}/${filename}`;
      
      // Logar o caminho do regulamento para depuração
      console.log(`[Calendar Upload] Regulamento salvo em: ${filename}`);
      console.log(`[Calendar Upload] URL do regulamento: ${uploaded.regulationUrl}`);
    }

    return NextResponse.json(uploaded);
  } catch (err) {
    return NextResponse.json({ error: 'Erro ao fazer upload.' }, { status: 500 });
  }
}
