import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'
import { hash } from 'bcryptjs'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Usar o await para acessar params.id corretamente
    const eventId = (await params).id
    const data = await request.json()
    const protocol = `REG-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    // Log completo dos dados recebidos para debug
    console.log('Dados recebidos do formulário:', JSON.stringify(data, null, 2))

    // Buscar evento para checar se é gratuito
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    })

    if (!event) {
      return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 })
    }

    // Verificação especial para o caso de tierId="free" (evento gratuito sem lote específico)
    let tier = null
    let isFree = event.isFree === true

    // Se não for um evento gratuito marcado como isFree e o tierId não for "free",
    // buscamos o lote específico
    if (!isFree && data.tierId !== 'free') {
      tier = await prisma.eventPricingTier.findUnique({
        where: { id: data.tierId }
      })

      if (!tier) {
        return NextResponse.json({ message: 'Lote não encontrado' }, { status: 404 })
      }

      // Verifica se o lote tem preço zero (gratuito)
      isFree = parseFloat(tier?.price?.toString() || '0') === 0
    } else {
      // Se for free, consideramos sempre como gratuito
      isFree = true
    }

    // Se for gratuito, orientamos a usar a API específica
    if (isFree) {
      return NextResponse.json({
        message: 'Evento gratuito detectado. Use a API /api/events/[id]/register/free para inscrições gratuitas',
        redirectTo: `/api/events/${eventId}/register/free`
      }, { status: 400 })
    }

    try {
      // Primeiro, verificar se o usuário já existe ou criar um novo
      let user = await prisma.user.findUnique({
        where: { email: data.email }
      });

      // Se o usuário não existir, criá-lo
      if (!user) {
        // Gerar uma senha temporária aleatória (hash)
        const tempPassword = await hash(uuidv4(), 10);
        
        user = await prisma.user.create({
          data: {
            id: uuidv4(),
            name: data.name,
            email: data.email,
            password: tempPassword // Campo obrigatório no schema
          }
        });
      }

      // Verificar se o usuário já possui uma inscrição para este evento na mesma modalidade e categoria
      const existingRegistration = await prisma.registration.findFirst({
        where: {
          eventId: eventId,
          userId: user.id,
          modalityid: data.modalityId,
          categoryid: data.categoryId,
          // Não considerar inscrições canceladas/rejeitadas
          status: {
            notIn: ['CANCELED', 'REJECTED']
          }
        }
      });

      if (existingRegistration) {
        // Verificar se a inscrição está pendente de pagamento
        if (existingRegistration.status === 'PENDING_PAYMENT') {
          // Verificar se a inscrição pendente está expirada (mais de 24 horas)
          const registrationDate = new Date(existingRegistration.createdAt);
          const now = new Date();
          const hoursElapsed = Math.abs(now.getTime() - registrationDate.getTime()) / 36e5; // Converter para horas
          
          if (hoursElapsed > 24) {
            // Se a inscrição pendente tiver mais de 24 horas, marcar como expirada e permitir nova inscrição
            await prisma.registration.update({
              where: { id: existingRegistration.id },
              data: { status: 'EXPIRED' }
            });
            
            // Prosseguir com nova inscrição
            console.log('Inscrição anterior expirada. Permitindo nova inscrição.');
          } else {
            // Verificar se a inscrição pendente já tem um cupom aplicado
            let existingDiscount = false;
            let discountInfo = null;
            
            // Se a inscrição já tem cupom, não fazemos nada
            if (existingRegistration.couponId) {
              existingDiscount = true;
            } 
            // Se não tem cupom mas o usuário está tentando aplicar um agora
            else if (data.couponCode) {
              try {
                // Verificar se o cupom existe e está válido
                const now = new Date();
                
                const coupons = await prisma.$queryRaw`
                  SELECT 
                    edc.id, edc.code, edc.discount, edc."maxUses",
                    edc."startDate", edc."endDate",
                    edc."modalityId", edc."categoryId", edc."genderId",
                    COUNT(ecu.id) as used_count
                  FROM "EventDiscountCoupon" edc
                  LEFT JOIN "EventCouponUsage" ecu ON ecu."couponId" = edc.id
                  WHERE edc."eventId" = ${eventId}
                  AND edc.code = ${data.couponCode}
                  AND edc.active = true
                  AND edc."startDate" <= ${now}
                  AND edc."endDate" >= ${now}
                  GROUP BY edc.id
                `;
                
                if ((coupons as any[]).length > 0) {
                  const coupon = (coupons as any[])[0];
                  
                  // Verificar se o cupom atingiu o limite de usos
                  if (Number(coupon.used_count) < Number(coupon.maxUses)) {
                    // Verificar se o cupom é válido para a modalidade, categoria e gênero
                    let isValid = true;
                    
                    if (coupon.modalityId && coupon.modalityId !== data.modalityId) {
                      isValid = false;
                    }
                    
                    if (coupon.categoryId && coupon.categoryId !== data.categoryId) {
                      isValid = false;
                    }
                    
                    if (coupon.genderId && coupon.genderId !== data.genderId) {
                      isValid = false;
                    }
                    
                    if (isValid) {
                      // Buscar lote para calcular desconto
                      const tier = await prisma.eventPricingTier.findFirst({
                        where: { 
                          id: existingRegistration.tierid || '',
                          eventId: existingRegistration.eventId
                        }
                      });
                      
                      if (tier) {
                        // Calcular e atualizar o desconto na inscrição existente
                        const basePrice = parseFloat(tier.price.toString());
                        const discountPercentage = Number(coupon.discount);
                        const discountAmount = (basePrice * discountPercentage) / 100;
                        
                        // Atualizar a inscrição com o cupom
                        await prisma.registration.update({
                          where: { id: existingRegistration.id },
                          data: {
                            couponId: coupon.id,
                            discountAmount: discountAmount
                          }
                        });
                        
                        // Informações de desconto para mostrar na resposta
                        discountInfo = {
                          originalPrice: basePrice,
                          price: basePrice - discountAmount,
                          discountAmount: discountAmount,
                          discountPercentage: discountPercentage,
                          couponCode: coupon.code
                        };
                      }
                    }
                  }
                }
              } catch (err) {
                console.error('Erro ao aplicar cupom à inscrição pendente:', err);
              }
            }
            
            // Se a inscrição pendente for recente, oferecer opção de continuar o processo
            return NextResponse.json({
              message: 'Você já possui uma inscrição pendente para esta modalidade e categoria.',
              existingRegistration: {
                id: existingRegistration.id,
                protocol: existingRegistration.protocol,
                status: existingRegistration.status,
                createdAt: existingRegistration.createdAt,
                ...discountInfo // Adicionar informações de desconto, se houver
              },
              continuationUrl: `/eventos/${eventId}/checkout?registration=${existingRegistration.id}`
            }, { status: 409 }); // Código 409 Conflict
          }
        } else if (existingRegistration.status === 'CONFIRMED' || existingRegistration.status === 'PAID') {
          // Se a inscrição já estiver confirmada ou paga, não permitir nova inscrição
          return NextResponse.json({
            message: 'Você já possui uma inscrição confirmada nesta modalidade e categoria para este evento.',
            existingRegistration: {
              id: existingRegistration.id,
              protocol: existingRegistration.protocol,
              status: existingRegistration.status
            }
          }, { status: 400 });
        }
      }

      // Verificar se há um código de cupom nos dados
      const couponCode = data.couponCode;
      let couponId = null;
      let discountAmount = 0;
      let couponDiscountPercentage = 0;

      // Com o usuário garantido, criar a inscrição temporária, sem incluir o cupom ainda
      const registration = await prisma.registration.create({
        data: {
          id: uuidv4(),
          protocol,
          status: 'PENDING_PAYMENT',
          eventId,
          userId: user.id, // Usar o ID real do usuário
          name: data.name,
          email: data.email,
          cpf: data.cpf,
          phone: data.phone,
          birthdate: data.birthDate ? new Date(data.birthDate) : undefined,
          modalityid: data.modalityId, 
          categoryid: data.categoryId, 
          genderid: data.genderId,     
          tierid: data.tierId,         
          addressdata: data.address ? JSON.stringify(data.address) : undefined,
          createdAt: new Date(),
          updatedAt: new Date() 
        }
      });

      // Se houver um código de cupom, verificar sua validade e calcular o desconto
      let finalPrice = tier ? parseFloat(tier.price.toString()) : 0;
      
      if (couponCode) {
        try {
          // Verificar se o cupom existe e está válido
          const now = new Date();
          
          // Consulta para encontrar o cupom válido
          const coupons = await prisma.$queryRaw`
            SELECT 
              edc.id, edc.code, edc.discount, edc."maxUses",
              edc."startDate", edc."endDate",
              edc."modalityId", edc."categoryId", edc."genderId",
              COUNT(ecu.id) as used_count
            FROM "EventDiscountCoupon" edc
            LEFT JOIN "EventCouponUsage" ecu ON ecu."couponId" = edc.id
            WHERE edc."eventId" = ${eventId}
            AND edc.code = ${couponCode}
            AND edc.active = true
            AND edc."startDate" <= ${now}
            AND edc."endDate" >= ${now}
            GROUP BY edc.id
          `;
          
          if ((coupons as any[]).length > 0) {
            const coupon = (coupons as any[])[0];
            
            // Verificar se o cupom atingiu o limite de usos
            if (Number(coupon.used_count) < Number(coupon.maxUses)) {
              // Verificar se o cupom é válido para a modalidade, categoria e gênero selecionados
              let isValid = true;
              
              if (coupon.modalityId && coupon.modalityId !== data.modalityId) {
                isValid = false;
              }
              
              if (coupon.categoryId && coupon.categoryId !== data.categoryId) {
                isValid = false;
              }
              
              if (coupon.genderId && coupon.genderId !== data.genderId) {
                isValid = false;
              }
              
              if (isValid) {
                // Guardar o ID e o desconto do cupom
                couponId = coupon.id;
                couponDiscountPercentage = Number(coupon.discount);
                discountAmount = (finalPrice * couponDiscountPercentage) / 100;
                finalPrice = finalPrice - discountAmount;
                
                // Atualizar a inscrição com os dados do cupom
                await prisma.registration.update({
                  where: { id: registration.id },
                  data: {
                    couponId: couponId,
                    discountAmount: discountAmount
                  }
                });
              }
            }
          }
        } catch (couponError) {
          console.error('Erro ao verificar cupom:', couponError);
          // Não aplica desconto se houver erro, mas continua com a inscrição
        }
      }
      
      // Retornar os dados da inscrição bem-sucedida, incluindo preço com desconto se houver
      return NextResponse.json({
        registrationId: registration.id,
        protocol: protocol,
        isPaid: false,
        price: finalPrice,
        originalPrice: tier ? parseFloat(tier.price.toString()) : 0,
        discount: discountAmount > 0 ? discountAmount : undefined,
        discountPercentage: couponDiscountPercentage > 0 ? couponDiscountPercentage : undefined,
        couponCode: couponCode || undefined,
        message: 'Inscrição temporária criada com sucesso'
      });
      
    } catch (err) {
      // Logar o erro detalhado para debug
      console.error('Erro específico ao criar inscrição temporária:', err);
      
      return NextResponse.json({
        message: 'Erro ao criar inscrição temporária',
        error: err instanceof Error ? err.message : String(err)
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Erro ao processar a inscrição:', error);
    return NextResponse.json({ 
      message: 'Erro ao processar a inscrição', 
      error: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
