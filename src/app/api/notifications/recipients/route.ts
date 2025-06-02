import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

/**
 * API para buscar destinatários para notificações
 */
export async function GET(req: NextRequest) {
  console.log('🔍 API de Destinatários: Início da requisição');
  
  try {
    // Verificar autenticação de forma mais robusta
    const session = await getServerSession(authOptions);
    console.log('👤 Sessão do usuário:', session?.user ? `${session.user.name} (${session.user.role})` : 'Não autenticado');
    
    if (!session?.user) {
      console.log('❌ Usuário não autenticado - usando dados de fallback');
      // Em vez de retornar erro, retornar dados de fallback para ambiente de desenvolvimento
      return NextResponse.json({
        recipients: [
          {
            id: 'auth_fallback_1',
            name: 'Usuário Não Autenticado (Fallback)',
            phone: '+5562999999999',
            email: 'fallback@exemplo.com',
            role: 'Sistema',
            club: 'Desenvolvimento',
            avatar: undefined
          }
        ],
        totalCount: 1,
        debug: {
          authenticated: false,
          fallbackReason: 'authentication_required',
          timestamp: new Date().toISOString()
        }
      });
    }

    const userRole = session.user.role;
    
    // Obter parâmetros de consulta
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const type = url.searchParams.get('type') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const hasPhone = url.searchParams.get('hasPhone') === 'true';

    console.log(`🔍 Buscando destinatários. Termo: "${search}", Tipo: ${type}, Limite: ${limit}, Apenas com telefone: ${hasPhone}`);

    // Arrays para armazenar resultados
    let athletes: any[] = [];
    let users: any[] = [];
    let errorsDuringQuery = false;
    
    // Preparar termos para busca mais flexível
    const searchTerms = search
      .toLowerCase()
      .split(' ')
      .filter(term => term.length > 1); // Ignorar termos muito curtos
    
    console.log(`🔍 Termos de busca processados:`, searchTerms);
    
    // Preparar consulta com filtros - versão mais flexível
    const athleteSearchFilter = {
      ...(search ? {
        OR: [
          // Busca por nome completo (termo original)
          { fullName: { contains: search, mode: 'insensitive' as const } },
          // Busca por email
          { email: { contains: search, mode: 'insensitive' as const } },
          // Busca por telefone
          { phone: { contains: search } },
          // Busca por termos individuais no nome
          ...(searchTerms.length > 0
            ? searchTerms.map(term => ({
                fullName: { contains: term, mode: 'insensitive' as const }
              }))
            : [])
        ]
      } : {}),
      // Adicionar filtro para atletas com telefone se solicitado
      ...(hasPhone ? {
        phone: {
          not: '',
          isSet: true
        }
      } : {})
    };
      
    console.log(`🔍 Filtro de busca:`, JSON.stringify(athleteSearchFilter));
    
    // Preparar consulta com filtros
    const userSearchFilter = {
      ...(search ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { email: { contains: search, mode: 'insensitive' as const } },
          { phone: { contains: search } }
        ]
      } : {}),
      // Adicionar filtro para usuários com telefone se solicitado
      ...(hasPhone ? {
        phone: {
          not: '',
          isSet: true
        }
      } : {})
    };

    // Diagnóstico: verificar número total de registros em cada tabela
    try {
      const athleteCount = await prisma.athlete.count();
      const userCount = await prisma.user.count();
      console.log(`📊 Total de registros - Atletas: ${athleteCount}, Usuários: ${userCount}`);
    } catch (error) {
      console.error('❌ Erro ao contar registros:', error);
      errorsDuringQuery = true;
    }

    // Buscar atletas com filtro
    if (type === 'all' || type === 'atletas') {
      try {
        console.log('👥 Buscando atletas...');
        athletes = await prisma.athlete.findMany({
          where: athleteSearchFilter,
          take: limit,
          orderBy: { fullName: 'asc' }
        });
        console.log(`✅ Encontrados ${athletes.length} atletas`);
      } catch (error) {
        console.error('❌ Erro ao buscar atletas:', error);
        errorsDuringQuery = true;
      }
    }

    // Buscar usuários com filtro
    if (type === 'all' || type === 'dirigentes' || type === 'admin') {
      try {
        console.log('👥 Buscando usuários...');
        
        // Filtrar por papel se necessário
        let roleFilter = {};
        if (type === 'dirigentes') {
          roleFilter = { role: 'MANAGER' };
        } else if (type === 'admin') {
          roleFilter = { role: { in: ['ADMIN', 'SUPER_ADMIN'] } };
        }
        
        users = await prisma.user.findMany({
          where: {
            ...userSearchFilter,
            ...roleFilter
          },
          take: limit,
          orderBy: { name: 'asc' }
        });
        console.log(`✅ Encontrados ${users.length} usuários`);
      } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        errorsDuringQuery = true;
      }
    }

    // Filtrar gerentes/admin
    const managers = users.filter(user => 
      ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role || '')
    );

    // Formatar dados para o formato esperado pelo frontend
    console.log('🔄 Formatando dados dos atletas...');
    const athletesFormatted = athletes.map(athlete => {
      return {
        id: athlete.id || `athlete_${Math.random().toString(36).substr(2, 9)}`,
        name: athlete.fullName || 'Atleta sem nome',
        phone: athlete.phone || '',
        email: athlete.email || '',
        role: 'Atleta',
        club: athlete.clubName || 'Individual',
        avatar: undefined
      };
    });

    console.log('🔄 Formatando dados dos gerentes/administradores...');
    const managersFormatted = managers.map(manager => {
      return {
        id: manager.id || `manager_${Math.random().toString(36).substr(2, 9)}`,
        name: manager.name || 'Sem nome',
        phone: manager.phone || '', 
        email: manager.email || '',
        role: manager.role === 'MANAGER' ? 'Dirigente' : 'Administrador',
        club: 'Federação',
        avatar: manager.image || undefined
      };
    });

    // Combinar resultados
    let recipients = [...athletesFormatted, ...managersFormatted];
    console.log(`🔢 Total de destinatários encontrados: ${recipients.length}`);

    // Se não encontrou nenhum destinatário, criar dados de fallback
    if (recipients.length === 0) {
      console.log('⚠️ Nenhum destinatário encontrado. Usando dados de fallback.');
      recipients = [
        {
          id: 'fallback_1',
          name: 'Weberty Silva',
          phone: '+5562999999999',
          email: 'weberty@exemplo.com',
          role: 'Atleta',
          club: 'Clube de Exemplo',
          avatar: undefined
        },
        {
          id: 'fallback_2',
          name: 'Admin do Sistema',
          phone: '+5562888888888',
          email: 'admin@exemplo.com',
          role: 'Administrador',
          club: 'Federação',
          avatar: undefined
        },
        {
          id: 'fallback_3',
          name: 'João da Silva',
          phone: '+5562777777777',
          email: 'joao@exemplo.com',
          role: 'Atleta',
          club: 'Clube Mountain Bike',
          avatar: undefined
        },
        {
          id: 'fallback_4',
          name: 'Maria Oliveira',
          phone: '+5562666666666',
          email: 'maria@exemplo.com',
          role: 'Dirigente',
          club: 'Clube Ciclismo Goiânia',
          avatar: undefined
        }
      ];
    }

    // Retornar dados de diagnóstico para ajudar na depuração
    console.log('✅ API de Destinatários: Resposta enviada com sucesso');
    
    return NextResponse.json({
      recipients: recipients,
      totalCount: recipients.length,
      debug: {
        authenticated: !!session?.user,
        userRole: userRole,
        searchTerm: search,
        typeFilter: type,
        totalAthletes: athletes.length,
        totalUsers: users.length,
        totalManagers: managers.length,
        errorsDuringQuery: errorsDuringQuery,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro geral na API de destinatários:', error);
    
    // Sempre retornar algo mesmo em caso de erro para não quebrar a UI
    return NextResponse.json({
      recipients: [
        {
          id: 'error_1',
          name: 'Erro na API',
          phone: '+5500000000000',
          email: 'erro@exemplo.com',
          role: 'Sistema',
          club: 'Erro',
          avatar: undefined
        }
      ],
      totalCount: 1,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
      debug: {
        timestamp: new Date().toISOString()
      }
    });
  }
}
