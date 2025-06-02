import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v4 as uuidv4 } from 'uuid'
import cuid from 'cuid'

export async function GET(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    console.log('Sessão completa:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Verificar se o usuário tem permissão para criar eventos
    const userRole = session.user.role || ''
    console.log('Role do usuário (GET):', userRole);
    
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER']
    
    if (!allowedRoles.includes(userRole)) {
      console.error('Usuário não autorizado. Role:', userRole);
      return NextResponse.json(
        { error: 'Você não tem permissão para criar eventos' },
        { status: 403 }
      )
    }

    // Obtém parâmetros de filtro
    const searchParams = request.nextUrl.searchParams
    const modality = searchParams.get('modality')
    const category = searchParams.get('category')
    const gender = searchParams.get('gender')
    const isFree = searchParams.get('isFree')
    const published = searchParams.get('published')
    const status = searchParams.get('status')

    // Constrói where clause do Prisma
    const where: Prisma.EventWhereInput = {}

    if (modality && modality !== 'all') {
      // Buscar por relações muitos-para-muitos
      where.modalities = {
        some: {
          modalityId: modality
        }
      }
    }
    if (category && category !== 'all') {
      // Buscar por relações muitos-para-muitos
      where.categories = {
        some: {
          categoryId: category
        }
      }
    }
    if (gender && gender !== 'all') {
      // Buscar por relações muitos-para-muitos
      where.genders = {
        some: {
          gender: {
            code: gender
          }
        }
      }
    }
    if (isFree === 'true') {
      where.isFree = true
    } else if (isFree === 'false') {
      where.isFree = false
    }
    if (published === 'true') {
      where.published = true
    } else if (published === 'false') {
      where.published = false
    }
    if (status) {
      where.status = status.toUpperCase()
    }

    // Busca eventos com filtros
    console.log('Buscando eventos com filtros:', JSON.stringify(where))
    
    // Lista com WHERE vazio para pegar todos os eventos
    if (Object.keys(where).length === 0) {
      console.log('Buscando TODOS os eventos (where vazio)')
    }
    
    const events = await prisma.event.findMany({
      where,
      include: {
        eventModality: true,
        eventCategory: true,
        EventPricingTier: true,
        categories: {
          include: {
            category: true
          }
        },
        modalities: {
          include: {
            modality: true
          }
        },
        genders: {
          include: {
            gender: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log(`Encontrados ${events.length} eventos`)
    if (events.length === 0) {
      console.log('ALERTA: Nenhum evento encontrado')
    } else {
      console.log('IDs dos eventos encontrados:', events.map(e => e.id).join(', '))
      console.log('Primeiro evento:', JSON.stringify({
        id: events[0].id,
        title: events[0].title,
        modalidades: events[0].modalities?.length || 0,
        categorias: events[0].categories?.length || 0
      }))
    }

    return NextResponse.json({ events })
  } catch (error) {
    console.error('Error fetching events:', error)
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('\n=== DEBUG DA SESSÃO ===')
    console.log('Cookies:', request.cookies.getAll())
    
    // Validar autenticação
    const session = await getServerSession(authOptions)
    console.log('Sessão obtida:', session)
    console.log('User ID:', session?.user?.id)
    console.log('User Role:', session?.user?.role)
    console.log('User Email:', session?.user?.email)
    console.log('=====================\n')
    
    if (!session || !session.user) {
      console.error('Usuário não autenticado')
      return NextResponse.json({ error: 'Não autorizado - Faça login primeiro' }, { status: 401 })
    }
    
    // Verificar se o usuário tem permissão para criar eventos
    const userRole = session.user.role || ''
    console.log('Role do usuário:', userRole)
    
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER']
    
    if (!allowedRoles.includes(userRole)) {
      console.error('Usuário não autorizado. Role:', userRole)
      return NextResponse.json(
        { error: 'Você não tem permissão para criar eventos' },
        { status: 403 }
      )
    }
    
    // Obter e validar dados
    let requestData
    try {
      // Tentar fazer o parse do corpo da requisição
      const bodyText = await request.text();
      console.log('Corpo da requisição bruto:', bodyText);
      
      if (!bodyText || bodyText.trim() === '') {
        console.error('Corpo da requisição vazio');
        return NextResponse.json(
          { error: 'Corpo da requisição vazio' },
          { status: 400 }
        );
      }
      
      try {
        requestData = JSON.parse(bodyText);
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        return NextResponse.json(
          { error: 'JSON inválido no corpo da requisição' },
          { status: 400 }
        );
      }
      
      console.log('=== DADOS RECEBIDOS ===')
      console.log('Tipo:', typeof requestData)
      console.log('Conteúdo completo:', requestData)
      console.log('Title:', requestData?.title)
      console.log('Description:', requestData?.description)
      console.log('Modalities:', requestData?.modalities)
      console.log('Categories:', requestData?.categories)
      console.log('Genders:', requestData?.genders)
      console.log('PricingTiers:', requestData?.pricingTiers)
      console.log('========================')
    } catch (e) {
      console.error('Erro ao processar corpo da requisição:', e)
      return NextResponse.json(
        { error: 'Dados inválidos. Verifique o formato JSON.' },
        { status: 400 }
      )
    }
    
    if (!requestData || typeof requestData !== 'object') {
      console.error('Dados da requisição inválidos:', requestData)
      return NextResponse.json(
        { error: 'Dados da requisição inválidos ou mal formatados' },
        { status: 400 }
      )
    }
    
    // Extrair arrays de categorias, modalidades e gêneros
    const categories = Array.isArray(requestData.categories) ? requestData.categories : []
    const modalities = Array.isArray(requestData.modalities) ? requestData.modalities : []
    const genders = Array.isArray(requestData.genders) ? requestData.genders : []
    let pricingTiers = []
    
    // Processar pricingTiers com tratamento robusto de erros
    if (requestData.pricingTiers) {
      if (Array.isArray(requestData.pricingTiers)) {
        // Filtra lotes inválidos e garante que todos os campos necessários existam
        pricingTiers = requestData.pricingTiers
          .filter(tier => tier && typeof tier === 'object' && tier.name)
          .map(tier => {
            // Garantir que o preço seja um número
            let price = 0;
            try {
              if (typeof tier.price === 'string') {
                // Limpar string e converter para número
                price = parseFloat(tier.price.replace(/[^\d.,]/g, '').replace(',', '.'));
              } else if (typeof tier.price === 'number') {
                price = tier.price;
              }
              
              if (isNaN(price)) price = 0;
            } catch (err) {
              console.error('Erro ao processar preço:', err);
              price = 0;
            }
            
            // Processar datas
            let startDate = new Date();
            let endDate = new Date();
            endDate.setMonth(endDate.getMonth() + 1);
            
            try {
              if (tier.startDate) {
                startDate = new Date(tier.startDate);
                if (isNaN(startDate.getTime())) {
                  console.error('Data de início inválida:', tier.startDate);
                  startDate = new Date();
                }
              }
              
              if (tier.endDate) {
                endDate = new Date(tier.endDate);
                if (isNaN(endDate.getTime())) {
                  console.error('Data de término inválida:', tier.endDate);
                  endDate = new Date();
                  endDate.setMonth(endDate.getMonth() + 1);
                }
              }
            } catch (err) {
              console.error('Erro ao processar datas:', err);
            }
            
            try {
              // Garantir que sempre temos um ID válido
              const pricingTierId = cuid();
              
              return {
                id: pricingTierId,
                name: tier.name.trim(),
                description: tier.description || '',
                price: new Prisma.Decimal(tier.price.toString()),
                maxEntries: tier.maxEntries ? Number(tier.maxEntries) : null,
                startDate,
                endDate,
                active: tier.active === undefined ? true : !!tier.active,
                updatedAt: new Date()
              };
            } catch (error) {
              console.error(`Erro ao criar lote ${tier.name}:`, error);
              return null;
            }
          }).filter(Boolean) // Filtrar possíveis valores nulos
      } else {
        console.error('pricingTiers não é um array:', typeof requestData.pricingTiers);
      }
    }
    
    // Validação adicional para garantir que há pelo menos uma modalidade e gênero
    if (modalities.length === 0) {
      console.error('Nenhuma modalidade fornecida')
      return NextResponse.json(
        { error: 'É necessário selecionar pelo menos uma modalidade' },
        { status: 400 }
      )
    }
    
    if (genders.length === 0) {
      console.error('Nenhum gênero fornecido')
      return NextResponse.json(
        { error: 'É necessário selecionar pelo menos um gênero' },
        { status: 400 }
      )
    }
    
    if (categories.length === 0) {
      console.error('Nenhuma categoria fornecida')
      return NextResponse.json(
        { error: 'É necessário selecionar pelo menos uma categoria' },
        { status: 400 }
      )
    }
    
    // Remove do objeto principal para evitar conflito
    delete requestData.categories
    delete requestData.modalities
    delete requestData.genders
    delete requestData.pricingTiers
    
    console.log('Categorias para criar:', categories)
    console.log('Modalidades para criar:', modalities)
    console.log('Gêneros para criar:', genders)
    console.log('Lotes de preço para criar:', pricingTiers)
    console.log('Dados finais do evento:', JSON.stringify(requestData))

    // Cria o evento com todas as relações
    try {
      console.log('Iniciando criação do evento com transação');
      
      // Usar transação para garantir integridade
      const novoEvento = await prisma.$transaction(async (tx) => {
        console.log('Criando evento com dados básicos');
        
        // Criar o evento base primeiro
        const evento = await tx.event.create({
          data: {
            title: requestData.title,
            description: requestData.description,
            location: requestData.location,
            startDate: requestData.startDate ? new Date(requestData.startDate) : null,
            endDate: requestData.endDate ? new Date(requestData.endDate) : null,
            registrationEnd: requestData.registrationEnd ? new Date(requestData.registrationEnd) : null,
            coverImage: requestData.coverImage,
            posterImage: requestData.posterImage,
            maxParticipants: requestData.maxParticipants ? parseInt(requestData.maxParticipants.toString()) : null,
            isFree: requestData.isFree || false,
            status: requestData.status || 'DRAFT',
            published: requestData.published || false,
            organizerId: session.user.id,
            // Criar relações muitos-para-muitos
            categories: {
              create: categories.map(categoryId => ({
                id: cuid(),
                categoryId: categoryId
              }))
            },
            modalities: {
              create: modalities.map(modalityId => ({
                id: cuid(),
                modalityId: modalityId
              }))
            },
            genders: {
              create: genders.map(genderId => ({
                id: cuid(),
                genderId: genderId
              }))
            },
            // Criar lotes de preço
            EventPricingTier: {
              create: pricingTiers.length > 0 ? pricingTiers.map(tier => {
                console.log('Criando lote:', tier.name, 'com preço:', tier.price);
                
                try {
                  return {
                    id: cuid(),
                    name: tier.name.trim(),
                    description: tier.description || '',
                    price: new Prisma.Decimal(tier.price.toString()),
                    maxEntries: tier.maxEntries ? parseInt(tier.maxEntries.toString()) : null,
                    startDate: tier.startDate,
                    endDate: tier.endDate,
                    active: tier.active === undefined ? true : !!tier.active,
                    updatedAt: new Date()
                  };
                } catch (error) {
                  console.error(`Erro ao criar lote ${tier.name}:`, error);
                  return null;
                }
              }).filter(Boolean) : [] // Filtrar possíveis valores nulos
            }
          },
          include: {
            categories: true,
            modalities: true,
            genders: true,
            EventPricingTier: true
          }
        });

        console.log('Evento criado com sucesso:', evento);
        return evento;
      });

      console.log('Evento criado com sucesso:', JSON.stringify(novoEvento, null, 2));
      
      // Verificar se o evento foi realmente criado e está publicado
      const eventoVerificacao = await prisma.event.findUnique({
        where: { id: novoEvento.id },
        include: {
          categories: true,
          modalities: true,
          genders: true
        }
      });
      
      console.log('Verificação do evento após criação:', JSON.stringify(eventoVerificacao, null, 2));
      
      return NextResponse.json({ 
        message: 'Evento criado com sucesso', 
        event: novoEvento 
      }, { status: 201 })
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      return NextResponse.json({
        error: `Erro ao criar evento: ${error.message}`
      }, { status: 500 });
    }
  } catch (e) {
    console.error('Erro ao criar evento:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    console.log('Sessão completa:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Verificar se o usuário tem permissão para editar eventos
    const userRole = session.user.role || ''
    console.log('Role do usuário (PUT):', userRole);
    
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER']
    
    if (!allowedRoles.includes(userRole)) {
      console.error('Usuário não autorizado para editar. Role:', userRole);
      return NextResponse.json(
        { error: 'Você não tem permissão para editar eventos' },
        { status: 403 }
      )
    }

    // Obtém o ID do evento a ser atualizado
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do evento não fornecido' }, { status: 400 })
    }

    // Obtém dados do corpo da requisição
    let data: any;
    try {
      const requestText = await request.text();
      console.log('Texto da requisição PUT evento:', requestText);
      
      try {
        // Tenta converter o texto para JSON
        data = requestText ? JSON.parse(requestText) : null;
      } catch (parseError) {
        console.error('Erro ao fazer parse do JSON:', parseError);
        return NextResponse.json(
          { error: 'Payload inválido ou mal formatado. Não foi possível fazer o parse do JSON.' },
          { status: 400 }
        );
      }
      
      if (!data || typeof data !== 'object') {
        console.error('Payload inválido após parse:', data);
        return NextResponse.json(
          { error: 'Payload inválido ou mal formatado. JSON não resultou em um objeto.' },
          { status: 400 }
        );
      }
      
      console.log('PUT evento - dados recebidos após parse:', data);
    } catch (error) {
      console.error('Erro ao obter dados da requisição:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    console.log('PUT evento - dados recebidos para atualização:', {...data, id})

    // Validação dos campos obrigatórios
    if (!data.title || !data.description) {
      return NextResponse.json(
        { error: 'Campos obrigatórios não preenchidos (título e descrição)' },
        { status: 400 }
      )
    }
    
    // Extrai categorias, modalidades e gêneros para criar relações e garante que sejam arrays
    const categories = Array.isArray(data.categories) ? data.categories : []
    const modalities = Array.isArray(data.modalities) ? data.modalities : []
    const genders = Array.isArray(data.genders) ? data.genders : []
    
    // Validação adicional para garantir que há pelo menos uma modalidade e gênero
    if (modalities.length === 0) {
      return NextResponse.json(
        { error: 'É necessário selecionar pelo menos uma modalidade' },
        { status: 400 }
      )
    }
    
    if (genders.length === 0) {
      return NextResponse.json(
        { error: 'É necessário selecionar pelo menos um gênero' },
        { status: 400 }
      )
    }
    
    if (categories.length === 0) {
      return NextResponse.json(
        { error: 'É necessário selecionar pelo menos uma categoria' },
        { status: 400 }
      )
    }
    
    // Verifica se existem todos os IDs de gênero antes de criar o evento
    if (genders.length > 0) {
      try {
        console.log('Verificando gêneros existentes:', genders);
        
        // Verificar se o cliente Prisma está inicializado
        if (!prisma || !prisma.Gender) {
          console.error('Cliente Prisma não inicializado corretamente');
          return NextResponse.json({
            error: 'Erro interno do servidor: Cliente de banco de dados não inicializado'
          }, { status: 500 });
        }
        
        const existingGenders = await prisma.Gender.findMany({
          where: {
            id: {
              in: genders
            },
            active: true
          },
          select: {
            id: true,
            name: true
          }
        });
        
        console.log('Gêneros encontrados:', existingGenders);
        
        const existingGenderIds = existingGenders.map(g => g.id);
        const invalidGenders = genders.filter(id => !existingGenderIds.includes(id));
        
        if (invalidGenders.length > 0) {
          console.error('Tentativa de usar gêneros inválidos:', invalidGenders);
          return NextResponse.json({
            error: `Gêneros inválidos: ${invalidGenders.join(', ')}`
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Erro ao verificar gêneros:', error);
        return NextResponse.json({
          error: `Erro ao verificar gêneros: ${error.message}`
        }, { status: 500 });
      }
    }
    
    // Verifica se existem todos os IDs de modalidade antes de criar o evento
    if (modalities.length > 0) {
      try {
        console.log('Verificando modalidades existentes:', modalities);
        
        // Verificar se o cliente Prisma está inicializado
        if (!prisma || !prisma.eventModality) {
          console.error('Cliente Prisma não inicializado corretamente');
          return NextResponse.json({
            error: 'Erro interno do servidor: Cliente de banco de dados não inicializado'
          }, { status: 500 });
        }
        
        const existingModalities = await prisma.eventModality.findMany({
          where: {
            id: {
              in: modalities
            },
            active: true
          },
          select: {
            id: true,
            name: true
          }
        });
        
        console.log('Modalidades encontradas:', existingModalities);
        
        const existingModalityIds = existingModalities.map(m => m.id);
        const invalidModalities = modalities.filter(id => !existingModalityIds.includes(id));
        
        if (invalidModalities.length > 0) {
          console.error('Tentativa de usar modalidades inválidas:', invalidModalities);
          return NextResponse.json({
            error: `Modalidades inválidas: ${invalidModalities.join(', ')}`
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Erro ao verificar modalidades:', error);
        return NextResponse.json({
          error: `Erro ao verificar modalidades: ${error.message}`
        }, { status: 500 });
      }
    }
    
    // Verifica se existem todos os IDs de categoria antes de criar o evento
    if (categories.length > 0) {
      try {
        console.log('Verificando categorias existentes:', categories);
        
        // Verificar se o cliente Prisma está inicializado
        if (!prisma || !prisma.eventCategory) {
          console.error('Cliente Prisma não inicializado corretamente');
          return NextResponse.json({
            error: 'Erro interno do servidor: Cliente de banco de dados não inicializado'
          }, { status: 500 });
        }
        
        const existingCategories = await prisma.eventCategory.findMany({
          where: {
            id: {
              in: categories
            },
            active: true
          },
          select: {
            id: true,
            name: true
          }
        });
        
        console.log('Categorias encontradas:', existingCategories);
        
        const existingCategoryIds = existingCategories.map(c => c.id);
        const invalidCategories = categories.filter(id => !existingCategoryIds.includes(id));
        
        if (invalidCategories.length > 0) {
          console.error('Tentativa de usar categorias inválidas:', invalidCategories);
          return NextResponse.json({
            error: `Categorias inválidas: ${invalidCategories.join(', ')}`
          }, { status: 400 });
        }
      } catch (error) {
        console.error('Erro ao verificar categorias:', error);
        return NextResponse.json({
          error: `Erro ao verificar categorias: ${error.message}`
        }, { status: 500 });
      }
    }

    // Adiciona logs detalhados para depuração
    console.log('Dados para atualização de evento:')
    console.log('- ID:', id)
    console.log('- Status:', data.status)
    console.log('- Published:', data.published)
    console.log('- Categorias:', categories)
    console.log('- Modalidades:', modalities)
    console.log('- Gêneros:', genders)
    
    // Remove do objeto principal para evitar conflito
    delete data.categories
    delete data.modalities
    delete data.genders
    
    console.log('Categorias para atualizar:', categories)
    console.log('Modalidades para atualizar:', modalities)
    console.log('Gêneros para atualizar:', genders)

    // Atualiza o evento e suas relações em uma transação
    const resultado = await prisma.$transaction(async (tx) => {
      // Primeiro limpa as relações existentes
      await tx.eventToCategory.deleteMany({
        where: { eventId: id }
      })
      
      await tx.eventToModality.deleteMany({
        where: { eventId: id }
      })
      
      await tx.eventToGender.deleteMany({
        where: { eventId: id }
      })
      
      // Exclui os lotes de preço
      console.log('Excluindo lotes de preço do evento...')
      await tx.eventPricingTier.deleteMany({
        where: {
          eventId: id
        }
      })
      
      // Preparar dados para atualização
      const updateData = {
        ...data,
        updatedAt: new Date(),
        updatedBy: session.user?.email || 'sistema',
        // Garantir que o status seja processado corretamente
        status: data.status,
        published: true, // Alterado para true por padrão
        // Cria novas relações
        categories: {
          create: categories.map((categoryId: string) => ({
            category: {
              connect: { id: categoryId }
            }
          }))
        },
        modalities: {
          create: modalities.map((modalityId: string) => ({
            modality: {
              connect: { id: modalityId }
            }
          }))
        },
        genders: {
          create: genders.map((genderId: string) => ({
            gender: {
              connect: { id: genderId }
            }
          }))
        },
      }
      
      console.log('Dados preparados para update:', JSON.stringify({
        ...updateData,
        status: updateData.status,
        published: updateData.published
      }))
      
      // Agora atualiza o evento com os dados preparados
      const eventoAtualizado = await tx.event.update({
        where: { id },
        data: updateData,
      })
      
      return eventoAtualizado
    })
    
    console.log('Evento atualizado com sucesso:', resultado.id)

    return NextResponse.json({
      success: true,
      event: resultado
    })
  } catch (error) {
    console.error('Erro ao atualizar evento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao atualizar evento' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verifica autenticação
    const session = await getServerSession(authOptions)
    console.log('Sessão completa:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }
    
    // Verificar se o usuário tem permissão para excluir eventos
    const userRole = session.user.role || ''
    console.log('Role do usuário (DELETE):', userRole);
    
    const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'ORGANIZER']
    
    if (!allowedRoles.includes(userRole)) {
      console.error('Usuário não autorizado para excluir. Role:', userRole);
      return NextResponse.json(
        { error: 'Você não tem permissão para excluir eventos' },
        { status: 403 }
      )
    }

    // Obtém ID do evento a ser excluído
    const { searchParams } = request.nextUrl
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID do evento não fornecido' }, { status: 400 })
    }

    console.log(`Solicitação para excluir evento: ${id}`)

    try {
      // Usar uma transação para excluir todas as relações primeiro
      await prisma.$transaction(async (tx) => {
        // Exclui primeiro as relações muitos-para-muitos
        console.log('Excluindo relações de categoria do evento...')
        await tx.eventToCategory.deleteMany({
          where: {
            eventId: id
          }
        })
        
        console.log('Excluindo relações de modalidade do evento...')
        await tx.eventToModality.deleteMany({
          where: {
            eventId: id
          }
        })
        
        console.log('Excluindo relações de gênero do evento...')
        await tx.eventToGender.deleteMany({
          where: {
            eventId: id
          }
        })
        
        // Exclui os lotes de preço
        console.log('Excluindo lotes de preço do evento...')
        await tx.eventPricingTier.deleteMany({
          where: {
            eventId: id
          }
        })
        
        // Finalmente exclui o evento
        console.log('Excluindo o evento principal...')
        await tx.event.delete({
          where: {
            id
          }
        })
      })
      
      console.log(`Evento ${id} excluído com sucesso`)
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Erro ao excluir evento:', error)
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Erro ao excluir evento' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro geral ao excluir evento:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
