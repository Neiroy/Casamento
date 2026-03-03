import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

/** GET - Lista todos os pagamentos (admin) */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const pagamentos = await prisma.pagamento.findMany({
      where: { status: 'confirmado' },
      include: { presente: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(pagamentos);
  } catch (error) {
    console.error('Erro ao listar pagamentos:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar pagamentos' },
      { status: 500 }
    );
  }
}
