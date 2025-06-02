"use server"

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  PaymentProvider,
  PaymentMethod,
  EntityType
} from "@/lib/payment/types"
import { z } from "zod"
import crypto from "crypto"

const gatewaySchema = z.object({
  name: z.string().min(3),
  provider: z.nativeEnum(PaymentProvider),
  active: z.boolean().default(true),
  priority: z.number().min(0).default(0),
  allowedMethods: z.array(z.nativeEnum(PaymentMethod)).min(1),
  entityTypes: z.array(z.nativeEnum(EntityType)).min(1),
  checkoutType: z.string().default("REDIRECT"),
  sandbox: z.boolean().default(false),
  webhook: z.object({
    retryAttempts: z.number(),
    retryInterval: z.number()
  }).optional(),
  urls: z.object({
    success: z.string().url(),
    failure: z.string().url(),
    notification: z.string()
  }).optional(),
  credentials: z.preprocess(
    (creds) => {
      // Se for um objeto, mantém como está
      if (typeof creds === 'object') return creds;
      // Se for string, tenta parsear
      try {
        return JSON.parse(String(creds));
      } catch (e) {
        return {};
      }
    },
    z.record(z.any()) // Aceita qualquer formato de credenciais
  ),
  createdBy: z.string().optional(),
  updatedBy: z.string().optional()
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    const gateways = await prisma.paymentGatewayConfig.findMany({
      orderBy: { priority: "desc" }
    })

    const formattedGateways = gateways.map((gateway: any) => ({
      ...gateway,
      allowedMethods: gateway.allowedMethods as PaymentMethod[],
      entityTypes: gateway.entityTypes as EntityType[],
      provider: gateway.provider as PaymentProvider,
      credentials: typeof gateway.credentials === 'string' 
        ? JSON.parse(gateway.credentials) 
        : gateway.credentials
    }))

    return NextResponse.json(formattedGateways)
  } catch (error) {
    console.error("Error loading gateways:", error)
    return NextResponse.json(
      { error: "Failed to load gateways" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  console.log("======= POST /api/payments/gateway =======");
  try {
    // Verificar autenticação
    console.log("POST /api/payments/gateway - Verificando autenticação");
    const session = await getServerSession(authOptions)
    console.log("POST /api/payments/gateway - Sessão:", session?.user);
    
    if (!session || session.user.role !== "SUPER_ADMIN") {
      console.log("POST /api/payments/gateway - Erro de autorização, usuário não é SUPER_ADMIN");
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Obter dados do request
    console.log("POST /api/payments/gateway - Obtendo dados do request");
    const rawData = await request.text();
    console.log("POST /api/payments/gateway - Dados brutos:", rawData);
    
    let data;
    try {
      data = JSON.parse(rawData);
      console.log("POST /api/payments/gateway - Dados parseados:", data);
    } catch (parseError) {
      console.error("POST /api/payments/gateway - Erro ao parsear JSON:", parseError);
      return NextResponse.json(
        { error: "JSON inválido", details: String(parseError) },
        { status: 400 }
      );
    }

    // Validar dados
    console.log("POST /api/payments/gateway - Validando dados com schema");
    const validationResult = gatewaySchema.safeParse(data)
    if (!validationResult.success) {
      console.error("POST /api/payments/gateway - Erro de validação:", validationResult.error)
      return NextResponse.json(
        { error: "Dados inválidos", details: validationResult.error.format() },
        { status: 400 }
      )
    }

    // Preparar dados para salvar
    console.log("POST /api/payments/gateway - Preparando dados para salvar");
    const gatewayData = validationResult.data
    
    // Normalizar credenciais com base no provider
    console.log("POST /api/payments/gateway - Provider:", gatewayData.provider);
    let credentials = gatewayData.credentials;
    console.log("POST /api/payments/gateway - Credenciais originais:", credentials);
    
    // Para o Mercado Pago, mantém a normalização original
    if (gatewayData.provider === PaymentProvider.MERCADO_PAGO) {
      console.log("POST /api/payments/gateway - Normalizando credenciais para Mercado Pago");
      credentials = {
        access_token: gatewayData.credentials.access_token || 
                     gatewayData.credentials.accessToken || 
                     gatewayData.credentials.sandbox_access_token,
        public_key: gatewayData.credentials.public_key || 
                   gatewayData.credentials.publicKey || 
                   gatewayData.credentials.sandbox_public_key
      }
      console.log("POST /api/payments/gateway - Credenciais normalizadas:", credentials);
    }
    // Para outros providers, mantém as credenciais como estão
    else {
      console.log("POST /api/payments/gateway - Usando credenciais originais para", gatewayData.provider);
    }

    // Verificar se já existe um gateway com o mesmo nome
    console.log("POST /api/payments/gateway - Verificando existência de gateway com o mesmo nome");
    const existingGateway = await prisma.paymentGatewayConfig.findFirst({
      where: { name: gatewayData.name }
    })

    if (existingGateway) {
      console.log("POST /api/payments/gateway - Gateway com mesmo nome já existe:", existingGateway.id);
      return NextResponse.json(
        { error: "Já existe um gateway com este nome" },
        { status: 400 }
      )
    }

    // Verificar se já existe gateway com as mesmas credenciais
    console.log("POST /api/payments/gateway - Verificando credenciais")
    const existingGatewayWithSameCredentials = await prisma.paymentGatewayConfig.findFirst({
      where: {
        provider: gatewayData.provider,
        active: true
      }
    })

    // Lógica de verificação de credenciais específica por provider
    if (existingGatewayWithSameCredentials) {
      console.log("POST /api/payments/gateway - Gateway com mesmo provider encontrado:", existingGatewayWithSameCredentials.id)
      
      // Se as credenciais forem um objeto e não uma string
      let existingCredentials = existingGatewayWithSameCredentials.credentials;
      
      // Se for uma string, converte para objeto
      if (typeof existingCredentials === 'string') {
        try {
          existingCredentials = JSON.parse(existingCredentials);
        } catch (e) {
          console.error("POST /api/payments/gateway - Erro ao parsear credenciais:", e);
          // Credenciais inválidas, prossegue com a criação
          existingCredentials = {};
        }
      }
      
      // Verifica se as credenciais são duplicadas apenas para Mercado Pago
      if (gatewayData.provider === PaymentProvider.MERCADO_PAGO) {
        // Cast seguro para acessar as propriedades
        const existingMpCredentials = existingCredentials as Record<string, unknown>;
        const newCredentials = credentials as Record<string, unknown>;
        
        if (
          (existingMpCredentials.access_token && newCredentials.access_token && 
          existingMpCredentials.access_token === newCredentials.access_token) ||
          (existingMpCredentials.public_key && newCredentials.public_key && 
          existingMpCredentials.public_key === newCredentials.public_key)
        ) {
          console.log("POST /api/payments/gateway - Credenciais duplicadas");
          return NextResponse.json(
            { error: "Já existe um gateway com as mesmas credenciais" },
            { status: 400 }
          )
        }
      }
    }

    // Obter a maior prioridade atual para definir a nova
    console.log("POST /api/payments/gateway - Obtendo prioridade mais alta");
    const highestPriority = await prisma.paymentGatewayConfig.findFirst({
      orderBy: { priority: 'desc' },
      select: { priority: true }
    })

    const priority = highestPriority ? highestPriority.priority + 1 : 0
    console.log("POST /api/payments/gateway - Nova prioridade:", priority);

    // Gerar um ID único para o gateway
    const gatewayId = crypto.randomUUID();
    console.log("POST /api/payments/gateway - ID gerado:", gatewayId);
    
    // Criar novo gateway
    console.log("POST /api/payments/gateway - Tentando criar gateway no banco de dados");
    try {
      const newGateway = await prisma.paymentGatewayConfig.create({
        data: {
          id: gatewayId,
          name: gatewayData.name,
          provider: gatewayData.provider,
          active: gatewayData.active,
          priority: priority,
          allowedMethods: gatewayData.allowedMethods,
          entityTypes: gatewayData.entityTypes,
          checkoutType: gatewayData.checkoutType,
          sandbox: gatewayData.sandbox,
          webhook: gatewayData.webhook,
          urls: gatewayData.urls,
          credentials: credentials,
          createdBy: session.user.id,
          updatedBy: session.user.id,
          updatedAt: new Date()
        }
      })
      console.log("POST /api/payments/gateway - Gateway criado com sucesso:", newGateway.id);

      // Retornar gateway criado
      return NextResponse.json({
        ...newGateway,
        credentials: credentials
      })
    } catch (dbError) {
      console.error("POST /api/payments/gateway - Erro ao criar gateway no banco:", dbError);
      return NextResponse.json(
        { error: "Falha ao salvar gateway no banco de dados", details: String(dbError) },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error("Erro ao criar gateway:", error)
    return NextResponse.json(
      { error: "Falha ao criar gateway de pagamento", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Obter ID do gateway a ser atualizado
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do gateway não fornecido" },
        { status: 400 }
      )
    }

    // Verificar se o gateway existe
    const existingGateway = await prisma.paymentGatewayConfig.findUnique({
      where: { id }
    })

    if (!existingGateway) {
      return NextResponse.json(
        { error: "Gateway não encontrado" },
        { status: 404 }
      )
    }

    // Obter dados do request
    const data = await request.json()
    console.log(`PUT /api/payments/gateway?id=${id} - Dados recebidos:`, data)

    // Preparar dados para atualização
    const updateData: any = {}

    // Atualizar campos básicos se fornecidos
    if (data.name !== undefined) updateData.name = data.name
    if (data.active !== undefined) updateData.active = data.active
    if (data.priority !== undefined) updateData.priority = data.priority
    if (data.allowedMethods !== undefined) updateData.allowedMethods = data.allowedMethods
    if (data.entityTypes !== undefined) updateData.entityTypes = data.entityTypes
    if (data.checkoutType !== undefined) updateData.checkoutType = data.checkoutType
    if (data.sandbox !== undefined) updateData.sandbox = data.sandbox
    if (data.webhook !== undefined) updateData.webhook = data.webhook
    if (data.urls !== undefined) updateData.urls = data.urls

    // Atualizar credenciais se fornecidas
    if (data.credentials) {
      // Obter as credenciais existentes de maneira segura
      let existingCredentials: Record<string, unknown> = {};
      
      if (existingGateway.credentials) {
        // Se for string, converter para objeto
        if (typeof existingGateway.credentials === 'string') {
          try {
            existingCredentials = JSON.parse(existingGateway.credentials);
          } catch (e) {
            console.error("Erro ao parsear credenciais existentes:", e);
          }
        } else {
          // Se já for objeto, usar diretamente com cast seguro
          existingCredentials = existingGateway.credentials as Record<string, unknown>;
        }
      }
      
      // Credenciais do payload como Record para acesso seguro
      const newCredentials = data.credentials as Record<string, unknown>;
      
      // Verificar se é PagSeguro para preservar campos específicos
      if (existingGateway.provider === "PAGSEGURO") {
        console.log("Atualizando credenciais do PagSeguro:", newCredentials);
        
        // Usar diretamente as credenciais fornecidas para PagSeguro
        updateData.credentials = {
          pagseguroEmail: newCredentials.pagseguroEmail || newCredentials.email,
          pagseguroToken: newCredentials.pagseguroToken || newCredentials.token,
          pagseguroAppId: newCredentials.pagseguroAppId || newCredentials.appId,
          pagseguroAppKey: newCredentials.pagseguroAppKey || newCredentials.appKey
        };
        
        console.log("Novas credenciais do PagSeguro:", updateData.credentials);
      } else {
        // Para outros provedores, usar o formato padrão
        const credentials: Record<string, unknown> = {
          access_token: newCredentials.access_token || 
                        newCredentials.accessToken || 
                        newCredentials.sandbox_access_token || 
                        existingCredentials.access_token,
          public_key: newCredentials.public_key || 
                      newCredentials.publicKey || 
                      newCredentials.sandbox_public_key || 
                      existingCredentials.public_key
        };
        
        updateData.credentials = credentials;
      }
    }

    // Adicionar informações de atualização
    updateData.updatedBy = session.user.id
    updateData.updatedAt = new Date()

    // Atualizar gateway
    const updatedGateway = await prisma.paymentGatewayConfig.update({
      where: { id },
      data: updateData
    })

    // Retornar gateway atualizado
    return NextResponse.json({
      ...updatedGateway,
      credentials: updateData.credentials || existingGateway.credentials
    })
  } catch (error) {
    console.error("Erro ao atualizar gateway:", error)
    return NextResponse.json(
      { error: "Falha ao atualizar gateway de pagamento", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 403 }
      )
    }

    // Obter ID do gateway a ser excluído
    const url = new URL(request.url)
    const id = url.searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "ID do gateway não fornecido" },
        { status: 400 }
      )
    }

    // Verificar se o gateway existe
    const existingGateway = await prisma.paymentGatewayConfig.findUnique({
      where: { id }
    })

    if (!existingGateway) {
      return NextResponse.json(
        { error: "Gateway não encontrado" },
        { status: 404 }
      )
    }

    // Excluir gateway
    await prisma.paymentGatewayConfig.delete({
      where: { id }
    })

    // Retornar sucesso
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir gateway:", error)
    return NextResponse.json(
      { error: "Falha ao excluir gateway de pagamento", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}
