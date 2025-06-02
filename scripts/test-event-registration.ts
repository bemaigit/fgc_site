/**
 * Script para testar a inscrição em um evento com notificação via WhatsApp
 * 
 * Este script:
 * 1. Busca eventos disponíveis no banco de dados
 * 2. Cria ou atualiza um atleta com o número de telefone especificado
 * 3. Realiza uma inscrição em um evento via API
 * 4. Monitora o envio da notificação WhatsApp
 */

import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';

// CONFIGURAÇÕES DO TESTE
const NOME_ATLETA = 'Beto Foto';
const EMAIL_ATLETA = 'betofoto1@gmail.com';
const TELEFONE_WHATSAPP = '5562994242329'; // Formato: 5562999999999 (edite este valor para o número que deseja testar)

const prisma = new PrismaClient();

async function main() {
  console.log('🧪 INICIANDO TESTE DE INSCRIÇÃO EM EVENTO COM NOTIFICAÇÃO WHATSAPP');
  console.log('=================================================================');
  console.log(`Testando com número: ${TELEFONE_WHATSAPP}`);
  console.log('=================================================================\n');

  try {
    // 1. Configurar informações básicas
    console.log('1. Preparando ambiente de teste...');
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    console.log(`URL base: ${baseUrl}`);
    
    // Pulando verificação de conexão com WhatsApp devido a possíveis problemas de autenticação
    console.log('⚠️ Pulando verificação de conexão com WhatsApp e prosseguindo com o teste...');
    console.log('✅ Ambiente configurado');
    
    // 2. Buscar eventos disponíveis para inscrição
    console.log('\n2. Buscando eventos disponíveis para inscrição...');
    
    const eventos = await prisma.event.findMany({
      where: {
        published: true,
        registrationEnd: {
          gte: new Date()
        }
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        location: true,
        published: true,
        registrationEnd: true
      }
    });
    
    if (eventos.length === 0) {
      console.error('❌ Nenhum evento disponível para inscrição encontrado.');
      console.log('\nCriando um evento de teste para o propósito do teste...');
      
      // Criar um evento de teste - usando SQL direto
      const novoEventoId = uuidv4();
      await prisma.$executeRaw`
        INSERT INTO "Event" (
          id, 
          title, 
          description, 
          "startDate", 
          "endDate", 
          "registrationStart", 
          "registrationEnd", 
          location, 
          city, 
          state, 
          published, 
          "createdAt", 
          "updatedAt"
        ) VALUES (
          ${novoEventoId}, 
          'Evento Teste para Notificação WhatsApp', 
          'Este evento foi criado automaticamente para testar o sistema de notificações.', 
          ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)}, 
          ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000)}, 
          ${new Date()}, 
          ${new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)}, 
          'Local de Teste', 
          'Goiânia', 
          'GO', 
          true, 
          ${new Date()}, 
          ${new Date()}
        )
      `;
      
      // Buscar o evento criado
      const novoEvento = await prisma.event.findUnique({
        where: {
          id: novoEventoId
        },
        select: {
          id: true,
          title: true,
          startDate: true,
          location: true,
          published: true,
          registrationEnd: true
        }
      });
      
      console.log(`✅ Evento de teste criado com ID: ${novoEvento?.id}`);
      if (novoEvento) {
        eventos.push(novoEvento);
      }
    }
    
    // Mostrar eventos disponíveis
    console.log(`\nEventos disponíveis para inscrição (${eventos.length}):`);
    eventos.forEach((evento, index) => {
      console.log(`[${index + 1}] ${evento.title} (ID: ${evento.id})`);
      console.log(`    Local: ${evento.location || 'Não definido'}`);
      console.log(`    Data: ${evento.startDate ? new Date(evento.startDate).toLocaleDateString('pt-BR') : 'Não definida'}`);
      console.log(`    Inscrições até: ${evento.registrationEnd ? new Date(evento.registrationEnd).toLocaleDateString('pt-BR') : 'Não definida'}`);
      console.log('');
    });
    
    // Selecionar o primeiro evento para o teste
    const eventoEscolhido = eventos[0];
    console.log(`Evento escolhido para o teste: ${eventoEscolhido.title} (ID: ${eventoEscolhido.id})`);
    
    // 3. Preparar usuário e atleta para o teste
    console.log('\n3. Preparando usuário e atleta para o teste...');
    
    // Verificar se já existe um usuário com o email especificado
    let usuario = await prisma.user.findFirst({
      where: {
        email: EMAIL_ATLETA
      }
    });
    
    // Se não existir, criar um novo
    if (!usuario) {
      console.log(`Criando novo usuário com email ${EMAIL_ATLETA}...`);
      const novoUsuarioId = uuidv4();
      
      // Usar SQL direto para evitar problemas com o modelo Prisma
      await prisma.$executeRaw`
        INSERT INTO "User" (
          id, 
          name, 
          email, 
          "emailVerified", 
          role, 
          "createdAt", 
          "updatedAt"
        ) VALUES (
          ${novoUsuarioId}, 
          ${NOME_ATLETA}, 
          ${EMAIL_ATLETA}, 
          ${new Date()}, 
          'USER', 
          ${new Date()}, 
          ${new Date()}
        )
      `;
      
      usuario = await prisma.user.findUnique({
        where: { id: novoUsuarioId }
      });
      
      console.log(`✅ Usuário criado com ID: ${usuario?.id}`);
    } else {
      console.log(`✅ Usuário existente encontrado com ID: ${usuario.id}`);
    }
    
    // Verificar se existe um atleta para este usuário
    if (!usuario) {
      console.error('Não foi possível criar ou encontrar o usuário!');
      process.exit(1);
    }
    
    let atleta = await prisma.athlete.findFirst({
      where: {
        userId: usuario.id
      }
    });
    
    if (!atleta) {
      console.log(`Criando perfil de atleta para o usuário ${usuario.name}...`);
      try {
        // ID do novo atleta
        const novoAtletaId = uuidv4();
        
        // Usar SQL direto para evitar problemas com o modelo Prisma
        await prisma.$executeRaw`
          INSERT INTO "Athlete" (
            id, 
            "userId", 
            "fullName", 
            email, 
            phone, 
            cpf, 
            "birthDate", 
            address, 
            city, 
            state, 
            "zipCode", 
            complement, 
            neighborhood, 
            "createdAt", 
            "updatedAt"
          ) VALUES (
            ${novoAtletaId}, 
            ${usuario.id}, 
            ${NOME_ATLETA}, 
            ${EMAIL_ATLETA}, 
            ${TELEFONE_WHATSAPP}, 
            '00000000000', 
            ${new Date()}, 
            'Endereço de Teste', 
            'Goiânia', 
            'GO', 
            '74000000', 
            'Apto 123', 
            'Centro', 
            ${new Date()}, 
            ${new Date()}
          )
        `;
        
        atleta = await prisma.athlete.findUnique({
          where: { id: novoAtletaId }
        });
        
        console.log(`✅ Perfil de atleta criado com ID: ${atleta?.id}`);
      } catch (error: any) {
        console.error('Erro ao criar perfil de atleta:', error.message || error);
        process.exit(1);
      }
    } else {
      console.log(`✅ Perfil de atleta existente encontrado com ID: ${atleta.id}`);
      
      // Atualizar o número de telefone se necessário
      if (atleta.phone !== TELEFONE_WHATSAPP) {
        console.log(`Atualizando número de telefone do atleta para ${TELEFONE_WHATSAPP}...`);
        atleta = await prisma.athlete.update({
          where: { id: atleta.id },
          data: { phone: TELEFONE_WHATSAPP }
        });
        console.log('✅ Número de telefone atualizado');
      }
    }
    
    // Verificar se o atleta foi criado corretamente
    if (!atleta) {
      console.error('Não foi possível criar ou encontrar o perfil de atleta!');
      process.exit(1);
    }
    
    // 4. Verificar se o usuário já está inscrito no evento
    console.log(`\n4. Verificando se o usuário já está inscrito no evento ${eventoEscolhido.title}...`);
    
    const inscricaoExistente = await prisma.registration.findFirst({
      where: {
        userId: usuario.id,
        eventId: eventoEscolhido.id
      }
    });
    
    if (inscricaoExistente) {
      console.log(`❌ O usuário já está inscrito neste evento (ID: ${inscricaoExistente.id}).`);
      console.log('Removendo inscrição existente para possibilitar o teste...');
      
      await prisma.registration.delete({
        where: {
          id: inscricaoExistente.id
        }
      });
      
      console.log('✅ Inscrição anterior removida com sucesso');
    } else {
      console.log('✅ Usuário não está inscrito. Prosseguindo com o teste...');
    }
    
    // 5. Criar nova inscrição
    console.log('\n5. Criando nova inscrição no evento...');
    
    let registration;
    try {
      // Usar Prisma Client para criar a inscrição
      registration = await prisma.registration.create({
        data: {
          id: uuidv4(),
          status: 'PENDING',
          userId: usuario.id,
          eventId: eventoEscolhido.id,
          name: usuario.name || NOME_ATLETA,
          email: usuario.email || EMAIL_ATLETA,
          protocol: `EVE-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      });
      
      console.log(`✅ Inscrição criada com sucesso (ID: ${registration.id})`);
    } catch (error: any) {
      console.error('Erro ao criar inscrição:', error.message || error);
      process.exit(1);
    }
    
    // 6. Enviar notificação WhatsApp
    console.log('\n6. Enviando notificação WhatsApp...');
    
    try {
      // A inscrição já foi criada, podemos usar os dados diretamente
      // Verificar se temos registro completo
      if (!registration) {
        throw new Error('Inscrição não encontrada');
      }
      
      // Preparar dados para notificação
      const protocoloFormatado = registration.protocol || registration.id.substring(0, 8);
      const mensagem = `Olá ${NOME_ATLETA}! Sua inscrição no evento "${eventoEscolhido.title}" foi recebida com sucesso. Seu número de protocolo é ${protocoloFormatado}.`;
      
      console.log(`Enviando mensagem para ${TELEFONE_WHATSAPP}: ${mensagem}`);
      
      // Enviar notificação via API
      try {
        console.log(`Tentando enviar notificação para ${TELEFONE_WHATSAPP}...`);
        
        const response = await axios.post(`${baseUrl}/api/notifications/test`, {
          recipient: TELEFONE_WHATSAPP,
          channel: 'whatsapp',
          message: mensagem,
          type: 'REGISTRATION_CONFIRMED',
          priority: 'high',
          relatedId: registration.id
        });
        
        console.log('✅ Notificação WhatsApp enviada com sucesso!');
        console.log(`ID da notificação: ${response.data.notificationId || 'N/A'}`);
      } catch (notificationError: any) {
        console.error(`❌ Erro ao enviar notificação: ${notificationError.message || 'Erro desconhecido'}`);
        if (notificationError.response?.data) {
          console.error('Detalhes do erro:', notificationError.response.data);
        }
      }
    } catch (error: any) {
      console.error('Erro ao enviar notificação:', error.message || error);
      if (error.response?.data) {
        console.error('Detalhes do erro:', error.response.data);
      }
    }
    
    console.log('\n===== TESTE CONCLUÍDO =====');
    console.log(`Resumo do teste:`);
    console.log(`- Evento: ${eventoEscolhido.title}`);
    console.log(`- Usuário: ${NOME_ATLETA} (${EMAIL_ATLETA})`);
    console.log(`- Telefone: ${TELEFONE_WHATSAPP}`);
    console.log(`- ID da inscrição: ${registration ? registration.id : 'N/A'}`);
    console.log(`- Protocolo: ${registration ? registration.protocol : 'N/A'}`);
    console.log('\nVerifique se a notificação foi recebida no WhatsApp!');
  } catch (error: any) {
    console.error('Erro durante a execução do teste:', error.message || error);
    if (error.response?.data) {
      console.error('Detalhes do erro:', error.response.data);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();