import { NextRequest, NextResponse } from 'next/server';

/**
 * API de teste para busca de destinatários sem autenticação
 * (Apenas para depuração)
 */
export async function GET(req: NextRequest) {
  console.log('🧪 API DE TESTE: Buscando destinatários sem autenticação');
  
  try {
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const type = url.searchParams.get('type') || 'all';
    
    console.log(`🔍 Termo de busca: "${search}", Tipo: ${type}`);
    
    // Criar dados de exemplo para teste
    const exampleRecipients = [
      {
        id: 'test_1',
        name: 'Weberty Silva',
        phone: '+5562999999999',
        email: 'weberty@exemplo.com',
        role: 'Atleta',
        club: 'Clube de Teste',
        avatar: undefined
      },
      {
        id: 'test_2',
        name: 'Administrador do Sistema',
        phone: '+5562888888888',
        email: 'admin@fgc.com.br',
        role: 'Administrador',
        club: 'Federação',
        avatar: undefined
      },
      {
        id: 'test_3',
        name: 'João da Silva',
        phone: '+5562777777777',
        email: 'joao@exemplo.com',
        role: 'Atleta',
        club: 'Clube Mountain Bike',
        avatar: undefined
      },
      {
        id: 'test_4',
        name: 'Maria Oliveira',
        phone: '+5562666666666',
        email: 'maria@exemplo.com',
        role: 'Dirigente',
        club: 'Clube Ciclismo Goiânia',
        avatar: undefined
      }
    ];
    
    // Filtrar por tipo
    let filteredRecipients = exampleRecipients;
    if (type !== 'all') {
      const roleMap: {[key: string]: string} = {
        'atletas': 'Atleta',
        'dirigentes': 'Dirigente',
        'admin': 'Administrador'
      };
      
      const targetRole = roleMap[type];
      if (targetRole) {
        filteredRecipients = exampleRecipients.filter(r => r.role === targetRole);
      }
    }
    
    // Aplicar filtro de busca se fornecido
    if (search) {
      const searchLower = search.toLowerCase();
      filteredRecipients = filteredRecipients.filter(recipient =>
        recipient.name.toLowerCase().includes(searchLower) ||
        recipient.email.toLowerCase().includes(searchLower) ||
        recipient.phone.includes(search) ||
        recipient.club.toLowerCase().includes(searchLower)
      );
    }
    
    console.log(`✅ Encontrados ${filteredRecipients.length} destinatários`);
    
    // Resposta
    return NextResponse.json({
      recipients: filteredRecipients,
      totalCount: filteredRecipients.length,
      debug: {
        searchTerm: search,
        typeFilter: type,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro na API de teste:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      recipients: []
    }, { status: 500 });
  }
}
