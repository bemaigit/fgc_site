import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export type Gateway = {
  id?: string;
  name: string;
  provider: string;
  active: boolean;
  allowedMethods: string[];
  entityTypes: string[];
};

export async function GET() {
  try {
    const gateways = await prisma.paymentGatewayConfig.findMany({
      select: {
        id: true,
        name: true,
        provider: true,
        active: true,
        allowedMethods: true,
        entityTypes: true
      }
    });
    return NextResponse.json(gateways);
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const gateway: Gateway = await request.json();

  try {
    // Generate ID and add required fields: credentials, audit fields, timestamps
    await prisma.paymentGatewayConfig.create({
      data: {
        id: randomUUID(),
        name: gateway.name,
        provider: gateway.provider,
        active: gateway.active,
        allowedMethods: gateway.allowedMethods,
        entityTypes: gateway.entityTypes,
        credentials: {},
        createdBy: 'system',
        updatedBy: 'system',
        updatedAt: new Date()
      }
    });
    return NextResponse.json({ message: 'Gateway created successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const { id, ...gateway }: { id: string } & Gateway = await request.json();
  try {
    // Include audit fields and timestamp
    await prisma.paymentGatewayConfig.update({
      where: { id },
      data: {
        name: gateway.name,
        provider: gateway.provider,
        active: gateway.active,
        allowedMethods: gateway.allowedMethods,
        entityTypes: gateway.entityTypes,
        updatedBy: 'system',
        updatedAt: new Date()
      }
    });
    return NextResponse.json({ message: 'Gateway updated successfully' });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
