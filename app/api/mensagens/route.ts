import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mensagemSchema, sanitizeString } from '@/lib/validations';
import { getSession } from '@/lib/auth';
import { getClientIp, checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';

/**
 * GET - Lista mensagens.
 * Público: apenas status=aprovado (ou ?status=aprovado).
 * Admin (logado): todas as mensagens (sem filtro ou com qualquer status).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const statusParam = searchParams.get('status');
    const session = await getSession();

    const where: { status?: string } = {};
    if (session) {
      if (statusParam) where.status = statusParam;
    } else {
      where.status = statusParam === 'aprovado' ? 'aprovado' : 'aprovado';
    }

    const mensagens = await prisma.mensagem.findMany({
      where: Object.keys(where).length ? where : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(mensagens);
  } catch (error) {
    console.error('Erro ao listar mensagens:', error);
    return NextResponse.json(
      { error: 'Erro ao carregar mensagens' },
      { status: 500 }
    );
  }
}

/**
 * POST - Cria nova mensagem (formulário da home).
 * Publica direto no site. Admin pode excluir depois.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { ok } = checkRateLimit(`mensagens:${ip}`, RATE_LIMITS.mensagens);
  if (!ok) {
    return NextResponse.json(
      { error: 'Muitas mensagens enviadas. Aguarde um momento.' },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = mensagemSchema.safeParse({
      nome: sanitizeString(body.nome || '', 100),
      mensagem: sanitizeString(body.mensagem || '', 1000),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados inválidos', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const mensagem = await prisma.mensagem.create({
      data: {
        nome: parsed.data.nome,
        mensagem: parsed.data.mensagem,
        status: 'aprovado',
      },
    });

    return NextResponse.json({ success: true, id: mensagem.id });
  } catch (error) {
    console.error('Erro ao criar mensagem:', error);
    return NextResponse.json(
      { error: 'Erro ao enviar mensagem' },
      { status: 500 }
    );
  }
}
