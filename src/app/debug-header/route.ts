import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { storageService } from '@/lib/storage';

export async function GET() {
  try {
    // Buscar configuração do header
    console.log('[DEBUG] Buscando configuração do header...');
    const config = await prisma.headerConfig.findFirst({
      where: { 
        id: 'default-header',
        isActive: true
      }
    });
    console.log('[DEBUG] Configuração encontrada:', config);

    // Testar acesso ao MinIO diretamente
    let testResult = {
      config,
      minioTests: {} as any
    };

    if (config?.logo) {
      console.log('[DEBUG] Logo encontrada no banco de dados:', config.logo);
      
      let path = config.logo;
      
      // 1. Extrair nome do arquivo da URL completa
      if (path.includes('storage/header/')) {
        const parts = path.split('storage/header/');
        if (parts.length > 1) {
          path = parts[1];
          console.log('[DEBUG] Nome do arquivo extraído:', path);
        }
      }

      // 2. Verificar se o arquivo existe no MinIO
      const testPaths = [
        { desc: 'com prefixo header, caminho direto', prefix: 'header', path },
        { desc: 'sem prefixo, caminho completo', prefix: '', path: `header/${path}` },
        { desc: 'com prefixo, apenas nome do arquivo', prefix: 'header', path: path.split('/').pop() || path }
      ];

      // Executar testes para cada caminho
      for (const test of testPaths) {
        console.log(`[DEBUG] Testando acesso ao MinIO: ${test.desc}`);
        console.log(`[DEBUG] Prefixo: ${test.prefix}, Path: ${test.path}`);
        
        try {
          storageService.setPrefix(test.prefix);
          // Verificar se o arquivo existe tentando acessá-lo via getFileStream
          const fileStream = await storageService.getFileStream(test.path);
          const exists = !!fileStream;
          testResult.minioTests[`test_${test.prefix}_${test.path}`] = {
            exists: !!fileStream,
            prefix: test.prefix,
            path: test.path,
            description: test.desc
          };
          console.log(`[DEBUG] ${test.desc} - Arquivo existe: ${exists}`);
        } catch (error) {
          console.error(`[DEBUG] Erro ao verificar arquivo ${test.path}:`, error);
          testResult.minioTests[`test_${test.prefix}_${test.path}`] = {
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            prefix: test.prefix,
            path: test.path,
            description: test.desc
          };
        }
      }
    }

    // Retornar resultados do diagnóstico
    return NextResponse.json({
      success: true,
      message: 'Diagnóstico do header concluído',
      ...testResult
    });
  } catch (error) {
    console.error('[DEBUG] Erro ao fazer diagnóstico:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}
