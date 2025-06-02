import { Metadata } from "next"
import { redirect } from "next/navigation"
import { PaymentForm } from "./payment-form"
import { prisma } from "@/lib/prisma"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AlertCircle } from "lucide-react"

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // Aguardar os params conforme requerido pelo Next.js 14
  const resolvedParams = await params;
  // Primeiro verificar se o ID é um pagamento
  const payment = await prisma.payment.findUnique({
    where: { id: resolvedParams.id }
  })

  // Verificar se é um pagamento de atleta
  if (payment?.athleteId) {
    const athlete = await prisma.athlete.findUnique({
      where: { id: payment.athleteId },
      select: { fullName: true }
    })
    return {
      title: athlete ? `Pagamento da Filiação - ${athlete.fullName}` : "Pagamento da Filiação",
      description: "Escolha o método de pagamento para continuar"
    }
  }
  
  // Verificar se é um pagamento de clube
  if (payment?.clubId) {
    const club = await prisma.club.findUnique({
      where: { id: payment.clubId },
      select: { clubName: true }
    })
    return {
      title: club ? `Pagamento da Filiação - ${club.clubName}` : "Pagamento de Clube",
      description: "Escolha o método de pagamento para continuar"
    }
  }
  
  // Caso não identifique o tipo
  return {
    title: "Pagamento",
    description: "Escolha o método de pagamento para continuar"
  }
}

export default async function PaymentPage({ params }: Props) {
  // Aguardar os params conforme requerido pelo Next.js 14
  const resolvedParams = await params;
  const paymentId = resolvedParams.id;
  
  console.log("Buscando pagamento com ID:", paymentId);
  
  // Primeiro verificar se o ID é um pagamento
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId }
  })
  
  console.log("Resultado da busca de pagamento:", payment ? "Encontrado" : "Não encontrado")

  // Se não for um pagamento válido
  if (!payment) {
    console.log("Pagamento não encontrado com ID:", paymentId);
    // Verifica se o ID fornecido pode ser um ID de atleta ou clube
    const athlete = await prisma.athlete.findUnique({
      where: { id: paymentId }
    });
    
    const club = await prisma.club.findUnique({
      where: { id: paymentId }
    });
    
    if (athlete && athlete.paymentId) {
      console.log("ID fornecido é de um atleta. Redirecionando para o pagamento correto.");
      return redirect(`/filiacao/pagamento/${athlete.paymentId}`);
    }
    
    if (club && club.paymentId) {
      console.log("ID fornecido é de um clube. Redirecionando para o pagamento correto.");
      return redirect(`/filiacao/pagamento/${club.paymentId}`);
    }
    
    // Se não for nem atleta nem clube ou não tiver pagamento associado
    return (
      <div className="container py-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <h2 className="text-lg font-medium text-red-600">Pagamento não encontrado</h2>
          </div>
          <p className="mt-2 text-sm text-gray-500">
            O pagamento que você está procurando não existe ou foi removido.
          </p>
        </div>
      </div>
    )
  }

  // Variáveis para armazenar informações do pagamento
  let paymentTitle = "";
  let paymentDescription = "";
  let paymentAmount = Number(payment.amount);
  let paymentType = "";
  let paymentOwnerName = ""; 

  // Verificar que tipo de pagamento é (atleta ou clube)
  if (payment.athleteId) {
    // É um pagamento de atleta
    const athlete = await prisma.athlete.findUnique({
      where: { id: payment.athleteId },
      include: { 
        User_Athlete_userIdToUser: true,
        Club: true
      }
    })

    if (!athlete) {
      return (
        <div className="container py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-medium text-red-600">Filiação não encontrada</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              A filiação de atleta associada a este pagamento não existe ou foi removida.
            </p>
          </div>
        </div>
      )
    }

    paymentTitle = "Filiação de Atleta";
    paymentType = "ATHLETE";
    paymentOwnerName = athlete.fullName;
    
    // Buscar as modalidades de filiação selecionadas pelo atleta
    let modalityNames: string[] = [];
    
    if (athlete.modalities && athlete.modalities.length > 0) {
      try {
        const modalities = await prisma.filiationModality.findMany({
          where: { 
            id: {
              in: athlete.modalities
            }
          }
        });
        
        modalityNames = modalities.map(m => m.name);
      } catch (error) {
        console.error("Erro ao buscar modalidades de filiação:", error);
      }
    }
    
    // Buscar a categoria
    let categoryName = "Não especificada";
    if (athlete.category) {
      try {
        const category = await prisma.filiationCategory.findUnique({
          where: { id: athlete.category }
        });
        
        if (category) {
          categoryName = category.name;
        }
      } catch (error) {
        console.error("Erro ao buscar categoria de filiação:", error);
      }
    }
    
    // Obter o nome do clube
    const clubName = athlete.Club?.clubName || "Individual";
    
    // Criar descrição detalhada
    paymentDescription = `Filiação de atleta: ${athlete.fullName}\nModalidade(s): ${modalityNames.length > 0 ? modalityNames.join(', ') : 'Não especificada'}\nCategoria: ${categoryName}\nClube: ${clubName}`;
  } else if (payment.clubId) {
    // É um pagamento de clube
    const club = await prisma.club.findUnique({
      where: { id: payment.clubId }
    })

    if (!club) {
      return (
        <div className="container py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <h2 className="text-lg font-medium text-red-600">Clube não encontrado</h2>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              O clube associado a este pagamento não existe ou foi removido.
            </p>
          </div>
        </div>
      )
    }

    const paymentDataType = payment.paymentData.type as string || "";
    paymentTitle = paymentDataType.includes("RENEWAL") ? "Renovação de Clube" : "Nova Filiação de Clube";
    paymentDescription = payment.paymentData.description?.toString() || "Filiação de Clube";
    paymentType = "CLUB";
    paymentOwnerName = club.clubName;
  } else {
    // É um outro tipo de pagamento
    paymentTitle = "Pagamento";
    paymentDescription = payment.paymentData.description?.toString() || "Pagamento";
    paymentType = "OTHER";
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Finalizar Pagamento</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Resumo do pagamento */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>{paymentTitle}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Atleta</h3>
                  <p className="font-medium">{paymentOwnerName}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Descrição</h3>
                  <p className="whitespace-pre-line">{paymentDescription}</p>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Valor Total</h3>
                  <p className="text-xl font-bold text-green-600">
                    R$ {paymentAmount.toFixed(2).replace('.', ',')}
                  </p>
                </div>
                
                <Separator />
              </CardContent>
            </Card>
          </div>
          
          {/* Formulário de pagamento */}
          <div className="md:col-span-2">
            <PaymentForm 
              paymentId={payment.id}
              athleteId={payment.athleteId || undefined}
              clubId={payment.clubId || undefined}
              paymentType={paymentType}
              amount={paymentAmount}
            />
          </div>
        </div>
      </div>
    </div>
  )
}