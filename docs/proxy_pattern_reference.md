# Padrão de Proxy para Imagens - Documentação de Referência

Este documento descreve o padrão bem-sucedido implementado para os banners de filiação, que pode ser usado como referência para outras seções.

## O Problema

1. URLs absolutas com domínios diferentes entre ambientes (localhost vs bemai.com.br)
2. Problemas com espaços e caracteres especiais nos nomes dos arquivos
3. Inconsistência nos prefixos (`/storage/`, `/fgc/`, etc.)

## Solução Implementada

### 1. Endpoint de Proxy

Um endpoint que serve como intermediário entre a aplicação e o MinIO:

```typescript
// Em /api/filiacao/banner/image/route.ts
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const path = searchParams.get('path');
  
  // Tenta múltiplos formatos do caminho (com/sem espaços, com/sem prefixos)
  const pathsToTry = [...]; // Diferentes variações do caminho
  
  // Busca no MinIO e retorna o arquivo
  // ...
}
```

### 2. Processamento no Upload

Ao fazer upload, extraímos apenas o caminho relativo:

```typescript
// Em componentes de upload
const { url } = await response.json();
let path = '';

try {
  const urlObj = new URL(url);
  path = urlObj.pathname.replace(/^\\/storage\\//, '');
} catch (error) {
  // Fallback
}

// Salvar apenas "path" no banco
```

### 3. Uso no Frontend

No frontend, sempre usar o endpoint de proxy:

```typescript
// Em componentes que exibem imagens
const getImageUrl = (path) => {
  if (!path) return '';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
  return `${baseUrl}/api/filiacao/banner/image?path=${encodeURIComponent(path)}`;
}
```

## Lista de Verificação para Implementação

1. ✅ Identificar o componente que faz upload
2. ✅ Modificar o componente para salvar apenas caminhos relativos
3. ✅ Criar (ou adaptar) um endpoint de proxy
4. ✅ Atualizar os componentes de frontend para usar o proxy
5. ✅ Testar em desenvolvimento e produção

## Testado e Verificado

Esta solução foi testada e funciona corretamente tanto em:
- Ambiente de desenvolvimento (localhost)
- Ambiente de produção (bemai.com.br)
