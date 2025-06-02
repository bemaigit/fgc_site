import { storageService } from '@/lib/storage';

export async function fileExists() {
  try {
    // Testar diferentes combinações de caminhos
    const paths = [
      { prefix: 'header', path: '1747235294290-kydolz2iqn9.png' },
      { prefix: '', path: 'header/1747235294290-kydolz2iqn9.png' }
    ];
    
    const results: any = {};
    
    for (const test of paths) {
      try {
        console.log(`Testando: prefix=${test.prefix}, path=${test.path}`);
        storageService.setPrefix(test.prefix);
        const stream = await storageService.getFileStream(test.path);
        results[`${test.prefix}/${test.path}`] = !!stream;
      } catch (error) {
        console.error(`Erro ao testar caminho ${test.prefix}/${test.path}:`, error);
        results[`${test.prefix}/${test.path}`] = false;
      }
    }
    
    console.log('Resultados dos testes:', results);
    return results;
  } catch (error) {
    console.error('Erro ao verificar arquivos:', error);
    return { error: true };
  }
}
