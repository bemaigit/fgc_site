import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Não autorizado" },
        { status: 401 }
      );
    }

    // Obter userId da query ou usar o ID do usuário autenticado
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId") || session.user.id;

    // Buscar atleta pelo userId
    const athlete = await prisma.athlete.findUnique({
      where: { userId: userId as string }
    });

    // Retornar resultado
    return NextResponse.json({
      found: !!athlete,
      athlete: athlete
    });
  } catch (error: any) {
    console.error("Erro ao buscar atleta por usuário:", error);
    return NextResponse.json(
      { error: "Erro ao buscar atleta: " + error.message },
      { status: 500 }
    );
  }
}
