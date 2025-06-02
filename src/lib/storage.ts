import { Client } from 'minio'

// Interface para metadados do arquivo
interface FileMetadata {
  filename: string
  contentType: string
  size: number
  prefix?: string
}

export class StorageService {
  private client: Client
  private bucket: string = 'fgc'
  private prefix: string = ''

  constructor() {
    // Em ambiente Docker, use o nome do serviço como hostname
    const endpoint = process.env.MINIO_ENDPOINT || 'http://minio:9000'
    const parsedEndpoint = new URL(endpoint)
    
    console.log('[StorageService] Inicializando cliente MinIO com endpoint:', endpoint);
    
    this.client = new Client({
      endPoint: parsedEndpoint.hostname,
      port: Number(parsedEndpoint.port) || 9000,
      useSSL: endpoint.startsWith('https'),
      accessKey: process.env.MINIO_ACCESS_KEY || '',
      secretKey: process.env.MINIO_SECRET_KEY || '',
      region: process.env.MINIO_REGION || 'us-east-1'
    })
    
    console.log('[StorageService] Cliente MinIO configurado com:', {
      endPoint: parsedEndpoint.hostname,
      port: Number(parsedEndpoint.port) || 9000,
      useSSL: endpoint.startsWith('https'),
      region: process.env.MINIO_REGION || 'us-east-1'
    })
  }

  // Inicializa o bucket se não existir
  private async initBucket() {
    try {
      const exists = await this.client.bucketExists(this.bucket)
      if (!exists) {
        await this.client.makeBucket(this.bucket, process.env.MINIO_REGION || 'us-east-1')
        // Define política pública para o bucket (apenas em desenvolvimento)
        if (process.env.NODE_ENV === 'development') {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${this.bucket}/*`],
              },
            ],
          }
          await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy))
        }
      }
    } catch (error) {
      console.error('Erro ao inicializar bucket:', error)
      throw new Error(`Falha ao inicializar bucket ${this.bucket}`)
    }
  }

  // Método para alterar o prefixo
  setPrefix(prefix: string) {
    this.prefix = prefix.endsWith('/') ? prefix : `${prefix}/`
  }

  // Upload de arquivo
  async uploadFile(file: Buffer, metadata: FileMetadata): Promise<string> {
    try {
      console.log('Iniciando upload de arquivo:', {
        filename: metadata.filename,
        size: metadata.size,
        contentType: metadata.contentType,
        hasBuffer: !!file,
        bufferLength: file?.length,
        prefix: metadata.prefix,
        instancePrefix: this.prefix
      })
      
      await this.initBucket()
      
      // Usa o prefixo dos metadados se fornecido, caso contrário usa o prefixo da instância
      const prefix = metadata.prefix || this.prefix
      
      // Remove barras iniciais e finais extras
      const cleanFilename = metadata.filename.replace(/^\/+|\/+$/g, '')
      
      // Combina o prefix com o nome do arquivo
      const key = prefix ? `${prefix}${cleanFilename}` : cleanFilename
      
      console.log('Configuração de upload para MinIO:', {
        bucket: this.bucket,
        prefix,
        originalFilename: metadata.filename,
        cleanFilename,
        finalKey: key,
        size: metadata.size,
        contentType: metadata.contentType,
        hasBuffer: !!file,
        bufferLength: file?.length
      })
      
      await this.client.putObject(
        this.bucket,
        key,
        file,
        metadata.size,
        { 'Content-Type': metadata.contentType }
      )

      const url = await this.getUrl(key)
      console.log('Upload concluído com sucesso:', { key, url })
      return url
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erro detalhado no upload:', {
          error,
          message: error.message,
          stack: error.stack,
          metadata
        })
        throw new Error(`Erro no upload: ${error.message}`)
      }
      throw new Error('Erro desconhecido no upload')
    }
  }

  // Gera URL pública
  async getUrl(key: string): Promise<string> {
    try {
      console.log('[StorageService] Iniciando geração de URL para chave:', key);
      
      // Remove qualquer barra inicial do key se existir
      let cleanKey = key.replace(/^\/+/, '')
      
      console.log('[StorageService] Chave após remoção de barras iniciais:', cleanKey);
      
      // Verifica se o path já começa com o nome do bucket para evitar duplicação
      if (cleanKey.startsWith(`${this.bucket}/`)) {
        // Se já começa com o bucket, remove o prefixo do bucket
        cleanKey = cleanKey.substring(this.bucket.length + 1);
        console.log('[StorageService] Removido prefixo de bucket da chave:', cleanKey);
      } else if (cleanKey.startsWith('fgc/')) {
        // Se começa com 'fgc/' (nome do bucket), remove o prefixo
        cleanKey = cleanKey.substring(4);
        console.log('[StorageService] Removido prefixo "fgc/" da chave:', cleanKey);
      }
      
      // Garante que espaços e caracteres especiais sejam codificados corretamente no URL
      const encodedKey = cleanKey.split('/').map(part => encodeURIComponent(part)).join('/')
      
      // Determinar qual estratégia de URL usar para o ambiente
      const isDocker = process.env.MINIO_ENDPOINT?.includes('minio:') || false;
      const isProduction = process.env.NODE_ENV === 'production';
      
      console.log('[StorageService] Gerando URL para arquivo:', {
        originalKey: key,
        cleanKey,
        encodedKey,
        nodeEnv: process.env.NODE_ENV,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'não definido',
        isDocker,
        isProduction
      })

      // Verifica se o arquivo existe no bucket apenas se não for acessado via ngrok
      // Isso evita o erro de timeout quando o MinIO não está acessível via ngrok
      // Mas isso também pode causar problemas em Docker
      if (!isDocker && !process.env.NEXT_PUBLIC_BASE_URL) {
        try {
          await this.client.statObject(this.bucket, cleanKey)
        } catch (error) {
          console.error('[StorageService] Erro ao verificar arquivo:', error)
          throw new Error(`Arquivo não encontrado: ${cleanKey}`)
        }
      }

      // Em ambiente Docker ou desenvolvimento
      if (!isProduction) {
        // Sempre usar o proxy em ambiente Docker
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const url = `${baseUrl}/api/proxy/storage/${encodedKey}`
        console.log('[StorageService] URL gerada via proxy:', url)
        return url
      }
      
      // Em produção, gera URL assinada
      const presignedUrl = await this.client.presignedGetObject(this.bucket, cleanKey, 24 * 60 * 60) // 24 horas
      console.log('[StorageService] URL gerada via presigned URL (produção):', presignedUrl)
      return presignedUrl
    } catch (error) {
      console.error('Erro ao gerar URL:', error)
      throw new Error('Falha ao gerar URL do arquivo')
    }
  }

  // Garante que a URL seja absoluta
  ensureAbsoluteUrl(path: string): string {
    if (!path) return ''
    
    // Se já for uma URL absoluta, retorna como está
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path
    }

    // Remove barras iniciais extras
    let cleanPath = path.replace(/^\/+/, '')
    
    // Não adiciona o bucket ao caminho porque o proxy irá manipular isso
    // Mantém apenas o caminho puro para o arquivo (sem prefix do bucket)
    if (cleanPath.startsWith(`${this.bucket}/`)) {
      // Se já começa com o nome do bucket, remove-o para o proxy
      cleanPath = cleanPath.substring(this.bucket.length + 1)
    } else if (cleanPath.startsWith('fgc/')) {
      // Se começa com 'fgc/' (nome do bucket), remove-o para o proxy
      cleanPath = cleanPath.substring(4)
    }
    
    // Garante que espaços e caracteres especiais sejam codificados corretamente no URL
    const encodedPath = cleanPath.split('/').map(part => encodeURIComponent(part)).join('/')
    
    console.log('Convertendo caminho para URL absoluta:', {
      originalPath: path,
      cleanPath,
      encodedPath,
      nodeEnv: process.env.NODE_ENV,
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'não definido'
    })
    
    // Usa o proxy interno da aplicação para todos os ambientes
    // Isso contorna problemas de SSL e CORS
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL?.replace(/[\[\]\(\)]/g, '').replace(/\/+$/, '') 
      || 'http://localhost:3000'
    
    // Usa o novo endpoint de proxy
    const url = `${baseUrl}/api/proxy/storage/${encodedPath}`
    console.log('URL gerada via proxy interno:', url)
    return url
  }

  // Remove arquivo
  async deleteFile(key: string): Promise<void> {
    try {
      const cleanKey = key.replace(/^\/+/, '')
      await this.client.removeObject(this.bucket, cleanKey)
    } catch (error) {
      console.error('Erro ao deletar arquivo:', error)
      throw new Error('Falha ao deletar arquivo')
    }
  }

  // Lista arquivos
  async listFiles(prefix?: string): Promise<string[]> {
    try {
      const objects: string[] = []
      // Combina o prefixo base com o prefixo adicional, se houver
      const fullPrefix = prefix ? `${this.prefix}${prefix}` : this.prefix
      const stream = this.client.listObjects(this.bucket, fullPrefix)
      
      return new Promise((resolve, reject) => {
        stream.on('data', (obj) => {
          if (obj.name) objects.push(obj.name)
        })
        stream.on('end', () => resolve(objects))
        stream.on('error', reject)
      })
    } catch (error) {
      console.error('Erro ao listar arquivos:', error)
      throw new Error('Falha ao listar arquivos')
    }
  }

  // Verificar os metadados de um arquivo
  async statObject(key: string): Promise<{size: number, metaData: any} | null> {
    try {
      // Remove qualquer barra inicial do key se existir
      let cleanKey = key.replace(/^\/+/, '')
      
      const stats = await this.client.statObject(this.bucket, cleanKey)
      return {
        size: stats.size,
        metaData: stats.metaData
      }
    } catch (error) {
      console.error('Erro ao obter metadados do arquivo:', error)
      return null
    }
  }
  
  // Obter arquivo como buffer para servir via proxy
  async getFile(key: string, prefix: string = this.prefix): Promise<Buffer | null> {
    try {
      // Remove qualquer barra inicial do key se existir
      let cleanKey = key.replace(/^\/+/, '');
      
      // Decodifica a URL para garantir que caracteres especiais sejam tratados corretamente
      cleanKey = decodeURIComponent(cleanKey);
      
      // Remove parâmetros de consulta, se houver
      cleanKey = cleanKey.split('?')[0];
      
      console.log('Iniciando busca de arquivo no MinIO:', {
        originalKey: key,
        decodedKey: cleanKey,
        prefix,
        bucket: this.bucket,
        timestamp: new Date().toISOString()
      });
      
      // Lista de chaves a serem tentadas
      const keysToTry: string[] = [];
      
      // 1. Tenta com a chave exata fornecida (já limpa)
      keysToTry.push(cleanKey);
      
      // 2. Se houver um prefixo, tenta com o prefixo adicionado
      if (prefix) {
        // Remove o prefixo se já estiver no início da chave para evitar duplicação
        const normalizedKey = cleanKey.startsWith(prefix) 
          ? cleanKey 
          : `${prefix}${cleanKey}`;
        
        // Remove duplicação de 'athlete-gallery/'
        const deduplicatedKey = normalizedKey.replace(
          /athlete-gallery\/athlete-gallery\//g, 
          'athlete-gallery/'
        );
        
        keysToTry.push(deduplicatedKey);
      }
      
      // 3. Tenta apenas com o nome do arquivo (última parte do caminho)
      const fileName = cleanKey.split('/').pop();
      if (fileName) {
        // Tenta com diferentes variações do nome do arquivo
        // Importante: criar variações com caixa diferente para os nomes de arquivo
        const variations = [
          fileName, // Nome original
          fileName.toLowerCase(), // Tudo minúsculo
          fileName.toUpperCase(), // Tudo maiúsculo
          fileName.charAt(0).toUpperCase() + fileName.slice(1).toLowerCase(), // Primeira letra maiúscula
          fileName.charAt(0).toLowerCase() + fileName.slice(1) // Primeira letra minúscula (se o resto for maiúsculo)
        ];

        // Verificar se o nome começa com 'Athlete-' e adicionar variação com 'athlete-'
        if (fileName.startsWith('Athlete-')) {
          const lowerVariation = 'athlete-' + fileName.substring(8);
          variations.push(lowerVariation);
        } else if (fileName.startsWith('athlete-')) {
          const upperVariation = 'Athlete-' + fileName.substring(8);
          variations.push(upperVariation);
        }
        
        // Log para debug
        console.log('Variações de nomes sendo testadas:', variations);
        
        // Adiciona variações à lista de tentativas
        variations.forEach(variation => {
          // Adiciona com e sem prefixo
          keysToTry.push(variation);
          if (prefix) {
            keysToTry.push(`${prefix}${variation}`);
          }
          // Adiciona com 'athlete-gallery/'
          keysToTry.push(`athlete-gallery/${variation}`);
          
          // Adicional: Tenta prefixo sem 'athlete-gallery'
          // Se um caminho for athlete-gallery/athlete-1747502740691-35cy1l00.jpg
          // Tenta também apenas athlete-1747502740691-35cy1l00.jpg
          if (variation.toLowerCase().startsWith('athlete-') || 
              variation.startsWith('Athlete-')) {
            keysToTry.push(variation);
          }
          
          // Tenta com estrutura completa de pastas
          if (prefix) {
            keysToTry.push(`storage/${prefix}${variation}`);
            keysToTry.push(`fgc/${prefix}${variation}`);
          }
          keysToTry.push(`storage/athlete-gallery/${variation}`);
          keysToTry.push(`fgc/athlete-gallery/${variation}`);
        });
      }
      
      // Remove duplicatas e itens vazios
      const uniqueKeys = [...new Set(keysToTry)].filter(k => k && k.trim() !== '');
      
      console.log('Chaves a serem tentadas no MinIO:', uniqueKeys);
      
      // Tenta cada chave até encontrar o arquivo
      for (const currentKey of uniqueKeys) {
        try {
          console.log('Tentando obter arquivo do MinIO:', {
            bucket: this.bucket,
            key: currentKey,
            hasSpaces: currentKey.includes(' '),
            timestamp: new Date().toISOString()
          });
          
          const stream = await this.client.getObject(this.bucket, currentKey);
          
          // Converte o stream em buffer
          const fileBuffer = await new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            let totalSize = 0;
            
            stream.on('data', (chunk) => {
              chunks.push(chunk);
              totalSize += chunk.length;
            });
            
            stream.on('end', () => {
              const buffer = Buffer.concat(chunks);
              console.log('Arquivo obtido com sucesso do MinIO:', {
                key: currentKey,
                size: totalSize,
                bufferLength: buffer.length
              });
              resolve(buffer);
            });
            
            stream.on('error', (err) => {
              console.error('Erro ao ler stream do MinIO:', {
                error: err,
                key: currentKey,
                bucket: this.bucket,
                timestamp: new Date().toISOString()
              });
              reject(err);
            });
          });
          
          if (fileBuffer && fileBuffer.length > 0) {
            console.log('Arquivo encontrado e retornado:', {
              key: currentKey,
              size: fileBuffer.length,
              firstBytes: fileBuffer.slice(0, 10).toString('hex')
            });
            return fileBuffer;
          } else {
            console.log('Arquivo encontrado mas está vazio:', currentKey);
          }
        } catch (err) {
          // Se não for um erro de "não encontrado", registra o erro
          const errorMessage = err instanceof Error ? err.message : String(err);
          if (!errorMessage.includes('not found') && !errorMessage.includes('NoSuchKey')) {
            console.error('Erro ao obter arquivo do MinIO:', {
              error: err,
              key: currentKey,
              bucket: this.bucket,
              timestamp: new Date().toISOString()
            });
          } else {
            console.log(`Arquivo não encontrado: ${currentKey}`);
          }
        }
      }
      
      console.error(`Arquivo não encontrado após tentar as seguintes chaves: ${uniqueKeys.join(', ')}`);
      return null;
    } catch (error) {
      console.error('Erro ao obter arquivo:', error)
      return null
    }
  }
  
  // Obter stream do arquivo para servir via proxy
  async getFileStream(key: string, prefix: string = this.prefix): Promise<NodeJS.ReadableStream | null> {
    try {
      // Remove qualquer barra inicial do key se existir
      let cleanKey = key.replace(/^\/+/, '')
      
      // Decodifica a URL para garantir que caracteres especiais sejam tratados corretamente
      cleanKey = decodeURIComponent(cleanKey)
      
      // Se houver um prefixo, adiciona ao início da chave
      if (prefix) {
        cleanKey = `${prefix}${cleanKey}`
      }
      
      console.log('Tentando obter stream do arquivo do MinIO:', {
        bucket: this.bucket,
        key: cleanKey,
        hasSpaces: cleanKey.includes(' '),
        timestamp: new Date().toISOString()
      })
      
      // Se temos um caminho com espaço, vamos tentar múltiplas variações
      const keysToTry = [cleanKey];
      
      // Se o caminho contiver 'perfil atleta', adicionar outras variações
      if (cleanKey.includes('perfil atleta')) {
        // Extrair apenas o nome do arquivo
        const fileName = cleanKey.split('/').pop() || cleanKey;
        console.log(`Caminho contém 'perfil atleta'. Arquivo: ${fileName}`);
        
        // Adicionar outras variações de caminho para tentar
        keysToTry.push(
          `perfil atleta/${fileName}`,
          `athlete/profile/${fileName}`,
          `athlete/${fileName}`,
          fileName
        );
      }
      
      // Remover duplicatas
      const uniqueKeys = [...new Set(keysToTry)];
      console.log('Tentando as seguintes chaves:', uniqueKeys);
      
      // Tentar cada caminho possível
      for (const currentKey of uniqueKeys) {
        try {
          console.log(`Tentando obter arquivo com a chave: ${currentKey}`);
          // Tenta obter o stream com a chave atual
          const stream = await this.client.getObject(this.bucket, currentKey);
          
          // Adiciona tratamento de erros ao stream
          const wrappedStream = new Promise<NodeJS.ReadableStream>((resolve, reject) => {
            stream.on('error', (err) => {
              console.error('Erro ao ler stream do MinIO:', {
                error: err,
                key: currentKey,
                bucket: this.bucket
              })
              reject(err)
            })
            
            // Se chegou aqui, o stream foi aberto com sucesso
            console.log('Stream obtido com sucesso do MinIO:', currentKey)
            resolve(stream)
          });
          
          return await wrappedStream;
        } catch (err) {
          console.log(`Não foi possível obter stream com a chave: ${currentKey}`);
          // Continuar tentando a próxima chave
        }
      }
      
      // Se chegou aqui, nenhuma das chaves funcionou
      console.error(`Não foi possível obter arquivo após tentar ${uniqueKeys.length} variações de caminho`)
      return null;
    } catch (error) {
      console.error('Erro ao obter stream do arquivo:', error)
      return null
    }
  }
}

// Exporta uma instância única do serviço
export const storageService = new StorageService()
