import { NextRequest, NextResponse } from 'next/server'

// Esta função serve como um proxy para acessar arquivos de outras origens,
// evitando problemas de CORS
export async function GET(request: NextRequest) {
  try {
    // Obtém a URL do arquivo a ser acessado como um parâmetro de consulta
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')
    
    if (!fileUrl) {
      console.error('Proxy: URL do arquivo não fornecida')
      return NextResponse.json({ error: 'URL do arquivo não fornecida' }, { status: 400 })
    }
    
    // Verificar se a URL é 'NULL' ou string vazia, o que indica que não há arquivo
    if (fileUrl === 'NULL' || fileUrl === 'null' || fileUrl === '') {
      console.error('Proxy: URL inválida recebida:', fileUrl)
      return NextResponse.json({ error: 'Arquivo de resultados não encontrado ou removido' }, { status: 404 })
    }
    
    console.log(`Proxy: Buscando arquivo em: ${fileUrl}`)
    
    // Faz a requisição para o arquivo
    try {
      const response = await fetch(fileUrl, {
        headers: {
          'Accept': 'text/csv,text/plain,application/octet-stream,*/*'
        }
      })
      
      if (!response.ok) {
        console.error(`Proxy: Erro ao acessar arquivo: ${response.status} ${response.statusText}`)
        return NextResponse.json({ 
          error: `Não foi possível acessar o arquivo: ${response.status} ${response.statusText}` 
        }, { status: response.status })
      }
      
      // Obtém o conteúdo do arquivo como texto
      const fileContent = await response.text()
      console.log(`Proxy: Arquivo obtido com sucesso, tamanho: ${fileContent.length} bytes`)
      console.log(`Proxy: Primeiras linhas do arquivo:\n${fileContent.split('\n').slice(0, 3).join('\n')}...`)
      
      // Retorna o conteúdo do arquivo
      return new NextResponse(fileContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
    } catch (fetchError: any) {
      console.error('Proxy: Erro ao fazer fetch do arquivo:', fetchError)
      return NextResponse.json({ 
        error: `Erro ao buscar o arquivo: ${fetchError.message || 'Erro desconhecido'}` 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Proxy: Erro geral:', error)
    return NextResponse.json({ error: 'Erro ao processar o arquivo' }, { status: 500 })
  }
}
